import { query } from "@/lib/db";

export type AvailabilityRule = {
  id: string;
  day_of_week: number;
  start_time: string; // "09:00:00"
  end_time: string; // "17:00:00"
  slot_minutes: number;
  timezone: string;
  active: boolean;
};

export type CustomAvailability = {
  id: string;
  start_date: string | Date;
  end_date: string | Date;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  timezone: string;
  active: boolean;
};

type MinuteWindow = {
  startMinutes: number;
  endMinutes: number;
  slotMinutes: number;
};

export type FreeSlot = {
  start: string; // ISO string
  end: string; // ISO string
};

/** Normalizes a Postgres `date` value (returned as a Date or a string) to "YYYY-MM-DD". */
function toDateKey(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function customCovers(rule: CustomAvailability, dateKey: string): boolean {
  return toDateKey(rule.start_date) <= dateKey && dateKey <= toDateKey(rule.end_date);
}

/** Removes the portion of `base` that overlaps `cut`, returning 0-2 remaining windows. */
function subtractWindow(base: MinuteWindow, cut: { startMinutes: number; endMinutes: number }): MinuteWindow[] {
  if (cut.endMinutes <= base.startMinutes || cut.startMinutes >= base.endMinutes) {
    return [base];
  }
  const remaining: MinuteWindow[] = [];
  if (cut.startMinutes > base.startMinutes) {
    remaining.push({ ...base, endMinutes: cut.startMinutes });
  }
  if (cut.endMinutes < base.endMinutes) {
    remaining.push({ ...base, startMinutes: cut.endMinutes });
  }
  return remaining;
}

function minutesOnDate(base: Date, minutes: number): Date {
  const d = new Date(base);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

/**
 * Coalesces overlapping/duplicate windows into their union (sorted, non-overlapping).
 * Guards against multiple rows covering the same day — e.g. leftover duplicate
 * weekly rules, or two custom_availability ranges that both include a date —
 * so a date is never counted twice and slots never get generated twice.
 */
function mergeWindows(windows: MinuteWindow[]): MinuteWindow[] {
  if (windows.length <= 1) return windows;
  const sorted = [...windows].sort((a, b) => a.startMinutes - b.startMinutes);
  const merged: MinuteWindow[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.startMinutes <= last.endMinutes) {
      last.endMinutes = Math.max(last.endMinutes, cur.endMinutes);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

/**
 * Returns available slots between `fromDate` and `toDate` (inclusive).
 * For each date, any matching active custom_availability window is carved
 * out of the weekly availability_rules window for that weekday (splitting
 * it into the remaining time before/after), and the custom window is added
 * back using its own slot length — so weekly hours are only replaced for
 * the specific time range the custom window covers, not the whole day.
 * Dates fully blocked in availability_exceptions and times already taken by
 * a confirmed/completed appointment are excluded.
 */
export async function getFreeSlots(
  fromDate: Date,
  toDate: Date
): Promise<FreeSlot[]> {
  const rules = await query<AvailabilityRule>(
    "select * from availability_rules where active = true order by day_of_week"
  );
  const customRules = await query<CustomAvailability>(
    `select * from custom_availability
     where active = true and start_date <= $2 and end_date >= $1
     order by start_date`,
    [fromDate.toISOString().slice(0, 10), toDate.toISOString().slice(0, 10)]
  );
  if (rules.length === 0 && customRules.length === 0) return [];

  const exceptions = await query<{
    date: string;
    is_blocked: boolean;
    start_time: string | null;
    end_time: string | null;
  }>(
    "select date, is_blocked, start_time, end_time from availability_exceptions where date >= $1 and date <= $2",
    [fromDate.toISOString().slice(0, 10), toDate.toISOString().slice(0, 10)]
  );
  const blockedDates = new Set(
    exceptions.filter((e) => e.is_blocked).map((e) => e.date)
  );

  const existingAppointments = await query<{
    start_time: string;
    end_time: string;
  }>(
    `select start_time, end_time from appointments
     where status in ('confirmed', 'completed')
     and start_time >= $1 and start_time <= $2`,
    [fromDate.toISOString(), toDate.toISOString()]
  );

  const slots: FreeSlot[] = [];
  const cursor = new Date(fromDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);

  while (cursor <= end) {
    const dateKey = cursor.toISOString().slice(0, 10);
    const dayOfWeek = cursor.getDay();

    if (!blockedDates.has(dateKey)) {
      const weeklyForDay: MinuteWindow[] = mergeWindows(
        rules
          .filter((r) => r.day_of_week === dayOfWeek)
          .map((r) => ({
            startMinutes: timeStringToMinutes(r.start_time),
            endMinutes: timeStringToMinutes(r.end_time),
            slotMinutes: r.slot_minutes,
          }))
      );

      const customForDay: MinuteWindow[] = mergeWindows(
        customRules
          .filter((c) => customCovers(c, dateKey))
          .map((c) => ({
            startMinutes: timeStringToMinutes(c.start_time),
            endMinutes: timeStringToMinutes(c.end_time),
            slotMinutes: c.slot_minutes,
          }))
      );

      // Carve each custom window out of the weekly windows first, so weekly
      // hours before/after the custom range survive, then layer the custom
      // window itself back in with its own slot length.
      let remainingWeekly = weeklyForDay;
      for (const custom of customForDay) {
        remainingWeekly = remainingWeekly.flatMap((w) => subtractWindow(w, custom));
      }
      const todaysWindows: MinuteWindow[] = [...remainingWeekly, ...customForDay];

      for (const window of todaysWindows) {
        const slotStart = minutesOnDate(cursor, window.startMinutes);
        const dayEnd = minutesOnDate(cursor, window.endMinutes);

        const stepMs = window.slotMinutes * 60 * 1000;
        let s = new Date(slotStart);

        while (s.getTime() + stepMs <= dayEnd.getTime()) {
          const slotEnd = new Date(s.getTime() + stepMs);

          // Skip slots in the past.
          if (s.getTime() > Date.now()) {
            const overlaps = existingAppointments.some((appt) => {
              const apptStart = new Date(appt.start_time).getTime();
              const apptEnd = new Date(appt.end_time).getTime();
              return s.getTime() < apptEnd && slotEnd.getTime() > apptStart;
            });
            if (!overlaps) {
              slots.push({
                start: s.toISOString(),
                end: slotEnd.toISOString(),
              });
            }
          }
          s = slotEnd;
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}

/**
 * Checks whether a specific requested [start, end) window is fully free,
 * i.e. it falls within an active availability rule and doesn't overlap
 * an existing appointment. Used to validate a booking before creating it.
 */
export async function isSlotAvailable(
  startIso: string,
  endIso: string
): Promise<boolean> {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return false;
  }

  const slots = await getFreeSlots(start, end);
  return slots.some((slot) => {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();
    return slotStart <= start.getTime() && slotEnd >= end.getTime();
  });
}

// ── Display / calendar helpers (Asia/Karachi, no DST) ──────────────────
// These are presentation-only utilities for the availability calendar UI.
// They never affect how slots are generated or how bookings are stored.

const KARACHI_TZ = "Asia/Karachi";
const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000; // Asia/Karachi is fixed UTC+5, no DST

const ISO_WEEKDAY: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/** Returns the Asia/Karachi calendar date (and Mon=0..Sun=6 weekday) for a given instant. */
export function karachiDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KARACHI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    isoWeekday: ISO_WEEKDAY[get("weekday")] ?? 0,
  };
}

/** UTC instant corresponding to local midnight in Asia/Karachi on the given calendar date. */
export function karachiMidnightUTC(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - KARACHI_OFFSET_MS);
}

/** Minutes since local midnight (Asia/Karachi) for a given instant. */
export function karachiMinutesOfDay(date: Date): number {
  const { hour, minute } = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: KARACHI_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return Number(hour) * 60 + Number(minute);
}

/** Formats an instant as a local Asia/Karachi time, e.g. "9:00 AM". */
export function formatKarachiTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KARACHI_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

/** Returns the Monday (Asia/Karachi) of the week containing `anchor`. */
export function getWeekStart(anchor: Date = new Date()) {
  const { year, month, day, isoWeekday } = karachiDateParts(anchor);
  const anchorUTC = Date.UTC(year, month - 1, day);
  const mondayUTC = new Date(anchorUTC - isoWeekday * 86400000);
  return {
    year: mondayUTC.getUTCFullYear(),
    month: mondayUTC.getUTCMonth() + 1,
    day: mondayUTC.getUTCDate(),
  };
}

/** Parses a "HH:MM" or "HH:MM:SS" time-of-day string into minutes since midnight. */
export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

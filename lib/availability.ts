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

export type FreeSlot = {
  start: string; // ISO string
  end: string; // ISO string
};

/**
 * Returns available slots between `fromDate` and `toDate` (inclusive),
 * based on the weekly availability_rules, minus any dates fully blocked
 * in availability_exceptions, minus any time already taken by a
 * confirmed appointment.
 */
export async function getFreeSlots(
  fromDate: Date,
  toDate: Date
): Promise<FreeSlot[]> {
  const rules = await query<AvailabilityRule>(
    "select * from availability_rules where active = true order by day_of_week"
  );
  if (rules.length === 0) return [];

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
      const todaysRules = rules.filter((r) => r.day_of_week === dayOfWeek);

      for (const rule of todaysRules) {
        const [startH, startM] = rule.start_time.split(":").map(Number);
        const [endH, endM] = rule.end_time.split(":").map(Number);

        const slotStart = new Date(cursor);
        slotStart.setHours(startH, startM, 0, 0);
        const dayEnd = new Date(cursor);
        dayEnd.setHours(endH, endM, 0, 0);

        const stepMs = rule.slot_minutes * 60 * 1000;
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

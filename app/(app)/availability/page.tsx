import Link from "next/link";
import { query } from "@/lib/db";
import {
  getWeekStart,
  karachiDateParts,
  karachiMidnightUTC,
  karachiMinutesOfDay,
  formatKarachiTime,
  timeStringToMinutes,
} from "@/lib/availability";
import AddAvailabilityModal from "@/components/AddAvailabilityModal";
import AvailabilityExceptionForm from "@/components/AvailabilityExceptionForm";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// availability_rules.day_of_week convention: 0 = Sunday ... 6 = Saturday.
// Our calendar columns run Monday(0) .. Sunday(6) — this maps column index -> dow.
const COLUMN_TO_DOW = [1, 2, 3, 4, 5, 6, 0];

function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(year: number, month: number, day: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1, day) + delta * 86400000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;

  const anchor = week ? new Date(`${week}T12:00:00Z`) : new Date();
  const weekStart = getWeekStart(anchor);
  const weekStartUTC = karachiMidnightUTC(weekStart.year, weekStart.month, weekStart.day);
  const weekEndUTC = new Date(weekStartUTC.getTime() + 7 * 86400000);

  const today = karachiDateParts(new Date());
  const todayKey = ymd(today.year, today.month, today.day);

  const lastWeekDay = addDays(weekStart.year, weekStart.month, weekStart.day, 6);

  const rules = await query<any>(
    `select * from availability_rules order by day_of_week, start_time`
  );
  const exceptions = await query<any>(
    `select * from availability_exceptions where date >= current_date order by date`
  );
  const customRulesRaw = await query<any>(
    `select * from custom_availability
     where active = true and start_date <= $2 and end_date >= $1
     order by start_date`,
    [
      ymd(weekStart.year, weekStart.month, weekStart.day),
      ymd(lastWeekDay.year, lastWeekDay.month, lastWeekDay.day),
    ]
  );
  const weekAppointments = await query<any>(
    `select a.*, ct.first_name, ct.last_name
     from appointments a
     left join contacts ct on ct.id = a.contact_id
     where a.start_time >= $1 and a.start_time < $2
     order by a.start_time asc`,
    [weekStartUTC.toISOString(), weekEndUTC.toISOString()]
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const { year, month, day } = addDays(weekStart.year, weekStart.month, weekStart.day, i);
    const dateKey = ymd(year, month, day);
    return {
      columnIndex: i,
      dow: COLUMN_TO_DOW[i],
      label: DAY_LABELS[i],
      dateKey,
      dateLabel: new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      isToday: dateKey === todayKey,
    };
  });

  // Expand each custom_availability date range into the specific visible
  // calendar columns it covers this week (it's date-based, not a weekday pattern).
  function toDateKey(value: string | Date) {
    return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  }
  const customBlocks = days.flatMap((d) =>
    customRulesRaw
      .filter((c: any) => toDateKey(c.start_date) <= d.dateKey && d.dateKey <= toDateKey(c.end_date))
      .map((c: any) => ({
        id: `${c.id}-${d.dateKey}`,
        columnIndex: d.columnIndex,
        start_time: c.start_time,
        end_time: c.end_time,
      }))
  );

  const appointments = weekAppointments.map((a: any) => {
    const start = new Date(a.start_time);
    const end = new Date(a.end_time);
    const startParts = karachiDateParts(start);
    const dayStartUTC = karachiMidnightUTC(startParts.year, startParts.month, startParts.day);
    const columnIndex = Math.round((dayStartUTC.getTime() - weekStartUTC.getTime()) / 86400000);

    return {
      id: a.id,
      columnIndex,
      startMinutes: karachiMinutesOfDay(start),
      endMinutes: karachiMinutesOfDay(end),
      title: a.title,
      timeLabel: `${formatKarachiTime(start)} – ${formatKarachiTime(end)}`,
      contactName:
        a.first_name || a.last_name ? `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() : "Unknown",
      status: a.status,
    };
  });

  // Visible time range: cover all active rules + any booked appointments, padded by 1h, clamped to a full day.
  let minMinutes = 8 * 60;
  let maxMinutes = 18 * 60;
  for (const r of rules) {
    minMinutes = Math.min(minMinutes, timeStringToMinutes(r.start_time));
    maxMinutes = Math.max(maxMinutes, timeStringToMinutes(r.end_time));
  }
  for (const a of appointments) {
    minMinutes = Math.min(minMinutes, a.startMinutes);
    maxMinutes = Math.max(maxMinutes, a.endMinutes);
  }
  for (const c of customBlocks) {
    minMinutes = Math.min(minMinutes, timeStringToMinutes(c.start_time));
    maxMinutes = Math.max(maxMinutes, timeStringToMinutes(c.end_time));
  }
  const rangeStartMinutes = Math.max(0, Math.floor(minMinutes / 60) * 60 - 60);
  const rangeEndMinutes = Math.min(24 * 60, Math.ceil(maxMinutes / 60) * 60 + 60);

  const prevWeek = addDays(weekStart.year, weekStart.month, weekStart.day, -7);
  const nextWeek = addDays(weekStart.year, weekStart.month, weekStart.day, 7);
  const weekRangeLabel = `${days[0].dateLabel} – ${days[6].dateLabel}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Availability</h1>
          <p className="text-base-500 text-sm mt-1">
            The AI agent only offers times inside these windows when booking calls. All times shown in
            Asia/Karachi.
          </p>
        </div>
        <AddAvailabilityModal />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
            Weekly Calendar
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href={`/availability?week=${ymd(prevWeek.year, prevWeek.month, prevWeek.day)}`}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              ← Prev
            </Link>
            <span className="text-xs text-base-400 min-w-[110px] text-center">{weekRangeLabel}</span>
            <Link
              href={`/availability?week=${ymd(nextWeek.year, nextWeek.month, nextWeek.day)}`}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              Next →
            </Link>
            {week && (
              <Link href="/availability" className="text-xs text-accent-400 hover:text-accent-300">
                Today
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 text-xs text-base-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/30 border border-blue-500/50 inline-block" />
            Weekly availability
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-mint-500/30 border border-mint-500/50 inline-block" />
            Custom availability
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-500/30 border border-accent-500/50 inline-block" />
            Booked appointment
          </span>
        </div>

        <AvailabilityCalendar
          days={days}
          rules={rules}
          customBlocks={customBlocks}
          appointments={appointments}
          rangeStartMinutes={rangeStartMinutes}
          rangeEndMinutes={rangeEndMinutes}
        />
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
          Blocked Dates
        </h2>
        <AvailabilityExceptionForm exceptions={exceptions} />
      </div>
    </div>
  );
}
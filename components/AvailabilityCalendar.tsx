"use client";

import { useState } from "react";
import EditAvailabilityModal, { type AvailabilityRule } from "./EditAvailabilityModal";

const HOUR_HEIGHT = 56; // px per hour

type CalendarAppointment = {
  id: string;
  columnIndex: number; // 0 = Monday .. 6 = Sunday
  startMinutes: number;
  endMinutes: number;
  title: string;
  timeLabel: string;
  contactName: string;
  status: string;
};

type CalendarDay = {
  columnIndex: number;
  dow: number; // 0 = Sunday .. 6 = Saturday (availability_rules convention)
  label: string; // "Mon"
  dateLabel: string; // "Jul 21"
  isToday: boolean;
};

type CustomBlock = {
  id: string;
  columnIndex: number; // 0 = Monday .. 6 = Sunday
  start_time: string;
  end_time: string;
};

type Range = { startMinutes: number; endMinutes: number };

type DisplayBlock =
  | { kind: "weekly"; key: string; rule: AvailabilityRule; startMinutes: number; endMinutes: number }
  | { kind: "custom"; key: string; block: CustomBlock; startMinutes: number; endMinutes: number };

/** Removes the portion of `base` that overlaps `cut`, returning 0-2 remaining ranges. */
function subtractRange(base: Range, cut: Range): Range[] {
  if (cut.endMinutes <= base.startMinutes || cut.startMinutes >= base.endMinutes) {
    return [base];
  }
  const remaining: Range[] = [];
  if (cut.startMinutes > base.startMinutes) {
    remaining.push({ startMinutes: base.startMinutes, endMinutes: cut.startMinutes });
  }
  if (cut.endMinutes < base.endMinutes) {
    remaining.push({ startMinutes: cut.endMinutes, endMinutes: base.endMinutes });
  }
  return remaining;
}

/**
 * Builds the single list of blocks to render for one day: each weekly rule
 * has any overlapping custom_availability ranges carved out of it (keeping
 * the remaining portion(s) before/after), and the custom ranges are added
 * back as their own blocks — so custom availability visually overrides the
 * weekly hours it overlaps instead of stacking on top of them.
 */
function buildDayBlocks(dayRules: AvailabilityRule[], dayCustomBlocks: CustomBlock[]): DisplayBlock[] {
  const customRanges = dayCustomBlocks.map((c) => ({
    block: c,
    startMinutes: timeToMinutes(c.start_time),
    endMinutes: timeToMinutes(c.end_time),
  }));

  const weeklySegments: DisplayBlock[] = dayRules.flatMap((r) => {
    let segments: Range[] = [
      { startMinutes: timeToMinutes(r.start_time), endMinutes: timeToMinutes(r.end_time) },
    ];
    for (const custom of customRanges) {
      segments = segments.flatMap((seg) => subtractRange(seg, custom));
    }
    return segments.map((seg, i) => ({
      kind: "weekly" as const,
      key: `${r.id}-${i}`,
      rule: r,
      startMinutes: seg.startMinutes,
      endMinutes: seg.endMinutes,
    }));
  });

  const customSegments: DisplayBlock[] = customRanges.map((c) => ({
    kind: "custom" as const,
    key: c.block.id,
    block: c.block,
    startMinutes: c.startMinutes,
    endMinutes: c.endMinutes,
  }));

  return [...weeklySegments, ...customSegments];
}

function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-accent-500/10 border-accent-500/40 text-accent-500",
  completed: "bg-mint-500/15 border-mint-500/40 text-mint-400",
  no_show: "bg-coral-500/15 border-coral-500/40 text-coral-400",
  cancelled: "bg-base-800 border-base-600 text-base-500",
};

export default function AvailabilityCalendar({
  days,
  rules,
  customBlocks,
  appointments,
  rangeStartMinutes,
  rangeEndMinutes,
}: {
  days: CalendarDay[];
  rules: AvailabilityRule[];
  customBlocks: CustomBlock[];
  appointments: CalendarAppointment[];
  rangeStartMinutes: number;
  rangeEndMinutes: number;
}) {
  const [editing, setEditing] = useState<AvailabilityRule | null>(null);

  const totalMinutes = rangeEndMinutes - rangeStartMinutes;
  const bodyHeight = (totalMinutes / 60) * HOUR_HEIGHT;
  const hourMarks: number[] = [];
  for (let m = Math.ceil(rangeStartMinutes / 60) * 60; m <= rangeEndMinutes; m += 60) {
    hourMarks.push(m);
  }

  function topFor(minutes: number) {
    return ((minutes - rangeStartMinutes) / 60) * HOUR_HEIGHT;
  }

  function formatHourLabel(minutes: number) {
    const h = Math.floor(minutes / 60);
    const period = h < 12 || h === 24 ? "AM" : "PM";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display} ${period}`;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[880px]">
        {/* Header row */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-base-700">
          <div />
          {days.map((d) => (
            <div
              key={d.columnIndex}
              className={`px-2 py-3 text-center border-l border-base-700 ${
                d.isToday ? "bg-accent-500/5" : ""
              }`}
            >
              <div className="text-xs font-semibold text-white uppercase tracking-wide">
                {d.label}
              </div>
              <div className={`text-xs mt-0.5 ${d.isToday ? "text-accent-400" : "text-base-500"}`}>
                {d.dateLabel}
              </div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)]">
          {/* Time gutter */}
          <div className="relative" style={{ height: bodyHeight }}>
            {hourMarks.map((m) => (
              <div
                key={m}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-base-500"
                style={{ top: topFor(m) }}
              >
                {formatHourLabel(m)}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayRules = rules.filter((r) => r.day_of_week === day.dow);
            const dayCustomBlocks = customBlocks.filter((c) => c.columnIndex === day.columnIndex);
            const dayAppointments = appointments.filter((a) => a.columnIndex === day.columnIndex);

            return (
              <div
                key={day.columnIndex}
                className={`relative border-l border-base-700 ${day.isToday ? "bg-accent-500/5" : ""}`}
                style={{ height: bodyHeight }}
              >
                {hourMarks.map((m) => (
                  <div
                    key={m}
                    className="absolute left-0 right-0 border-t border-base-800"
                    style={{ top: topFor(m) }}
                  />
                ))}

                {buildDayBlocks(dayRules, dayCustomBlocks).map((b) => {
                  const top = topFor(b.startMinutes);
                  const height = Math.max(topFor(b.endMinutes) - topFor(b.startMinutes), 18);
                  const label = `${minutesToLabel(b.startMinutes)}–${minutesToLabel(b.endMinutes)}`;

                  if (b.kind === "custom") {
                    return (
                      <div
                        key={b.key}
                        className="absolute left-0.5 right-0.5 rounded-md border text-left px-1.5 py-0.5 text-[11px] bg-mint-500/10 border-mint-500/40 text-mint-400"
                        style={{ top, height }}
                        title="Custom availability for this date"
                      >
                        {label} · custom
                      </div>
                    );
                  }

                  return (
                    <button
                      key={b.key}
                      onClick={() => setEditing(b.rule)}
                      className={`absolute left-0.5 right-0.5 rounded-md border text-left px-1.5 py-0.5 text-[11px] transition-colors ${
                        b.rule.active
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-600 hover:bg-blue-500/20"
                          : "bg-base-800 border-base-700 text-base-500 hover:bg-base-700"
                      }`}
                      style={{ top, height }}
                      title="Click to edit this window"
                    >
                      {label}
                      {!b.rule.active && " · inactive"}
                    </button>
                  );
                })}

                {dayAppointments.map((a) => (
                  <div
                    key={a.id}
                    className={`absolute left-1 right-1 rounded-md border px-1.5 py-0.5 text-[11px] overflow-hidden shadow-sm z-10 ${
                      STATUS_STYLE[a.status] ?? STATUS_STYLE.confirmed
                    }`}
                    style={{
                      top: topFor(a.startMinutes),
                      height: Math.max(topFor(a.endMinutes) - topFor(a.startMinutes), 20),
                    }}
                    title={`${a.title} — ${a.contactName} — ${a.status}`}
                  >
                    <div className="font-semibold truncate">{a.timeLabel}</div>
                    <div className="truncate opacity-90">{a.contactName}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {editing && <EditAvailabilityModal rule={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}
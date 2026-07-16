"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Rule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  timezone: string;
};

export default function AvailabilityForm({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    day_of_week: "1",
    start_time: "09:00",
    end_time: "17:00",
    slot_minutes: "30",
    timezone: "Asia/Karachi",
  });

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_week: Number(form.day_of_week),
          start_time: form.start_time,
          end_time: form.end_time,
          slot_minutes: Number(form.slot_minutes),
          timezone: form.timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save rule.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRule(id: string) {
    await fetch(`/api/availability/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={addRule} className="grid sm:grid-cols-5 gap-3 items-end">
        <div>
          <label className="label">Day</label>
          <select
            className="input"
            value={form.day_of_week}
            onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value }))}
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Start time</label>
          <input
            type="time"
            className="input"
            value={form.start_time}
            onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">End time</label>
          <input
            type="time"
            className="input"
            value={form.end_time}
            onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Slot length (min)</label>
          <input
            type="number"
            min="5"
            step="5"
            className="input"
            value={form.slot_minutes}
            onChange={(e) => setForm((f) => ({ ...f, slot_minutes: e.target.value }))}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary h-[42px]">
          {loading ? "Adding…" : "+ Add hours"}
        </button>
      </form>

      {error && (
        <div className="text-coral-400 text-sm bg-coral-500/10 border border-coral-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {rules.length === 0 ? (
        <p className="text-sm text-base-500 italic">
          No working hours set — the AI agent won't be able to book anything yet.
        </p>
      ) : (
        <div className="space-y-2">
          {rules
            .slice()
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-base-700 px-4 py-3"
              >
                <div className="text-sm text-white">
                  <span className="font-medium">{DAYS[r.day_of_week]}</span>
                  <span className="text-base-500 ml-2">
                    {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)} · {r.slot_minutes}min slots
                  </span>
                </div>
                <button
                  onClick={() => deleteRule(r.id)}
                  className="text-xs text-base-500 hover:text-coral-400"
                >
                  Remove
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

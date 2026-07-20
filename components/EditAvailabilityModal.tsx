"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type AvailabilityRule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  timezone: string;
  active: boolean;
};

export default function EditAvailabilityModal({
  rule,
  onClose,
}: {
  rule: AvailabilityRule;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    start_time: rule.start_time.slice(0, 5),
    end_time: rule.end_time.slice(0, 5),
    slot_minutes: String(rule.slot_minutes),
    active: rule.active,
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/availability/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: form.start_time,
          end_time: form.end_time,
          slot_minutes: Number(form.slot_minutes),
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save changes.");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this availability window? This cannot be undone.")) return;
    setLoading(true);
    try {
      await fetch(`/api/availability/${rule.id}`, { method: "DELETE" });
      router.refresh();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">
            Edit {DAYS[rule.day_of_week]} hours
          </h3>
          <button onClick={onClose} className="text-base-500 hover:text-white text-lg leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
          <label className="flex items-center gap-2 text-sm text-base-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="accent-accent-500"
            />
            Active (offered by the AI agent)
          </label>

          {error && (
            <div className="text-coral-400 text-sm bg-coral-500/10 border border-coral-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="text-xs font-semibold text-coral-400 hover:text-coral-300 border border-coral-500/30 hover:border-coral-500/60 rounded-lg px-3 disabled:opacity-50"
            >
              Delete
            </button>
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Exception = {
  id: string;
  date: string;
  is_blocked: boolean;
  note: string | null;
};

export default function AvailabilityExceptionForm({ exceptions }: { exceptions: Exception[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  async function addException(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setLoading(true);
    try {
      await fetch("/api/availability/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, is_blocked: true, note: note || null }),
      });
      setDate("");
      setNote("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteException(id: string) {
    if (!confirm("Remove this blocked date?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/availability/exceptions/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={addException} className="grid sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="label">Block date</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Reason (optional)</label>
          <input
            className="input"
            placeholder="e.g. Public holiday"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-ghost h-[42px]">
          {loading ? "Adding…" : "+ Block this date"}
        </button>
      </form>

      {exceptions.length === 0 ? (
        <p className="text-sm text-base-500 italic">No blocked dates coming up.</p>
      ) : (
        <div className="space-y-2">
          {exceptions.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between rounded-xl border border-coral-500/20 bg-coral-500/5 px-4 py-3"
            >
              <div className="text-sm">
                <span className="text-white font-medium">
                  {new Date(ex.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
                <span className="text-base-500 ml-2">{ex.note ?? "Blocked"}</span>
              </div>
              <button
                onClick={() => deleteException(ex.id)}
                disabled={deletingId === ex.id}
                className="text-xs text-base-500 hover:text-coral-400 disabled:opacity-50"
              >
                {deletingId === ex.id ? "Removing…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
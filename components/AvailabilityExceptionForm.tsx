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

      {exceptions.length > 0 && (
        <div className="space-y-2">
          {exceptions.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between rounded-xl border border-base-700 px-4 py-3"
            >
              <div className="text-sm">
                <span className="text-white font-medium">
                  {new Date(ex.date).toLocaleDateString()}
                </span>
                <span className="text-base-500 ml-2">{ex.note ?? "Blocked"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

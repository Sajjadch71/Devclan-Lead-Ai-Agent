"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AddAvailabilityModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"weekly" | "custom">("weekly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [weeklyForm, setWeeklyForm] = useState({
    day_of_week: "1",
    start_time: "09:00",
    end_time: "17:00",
    slot_minutes: "30",
    timezone: "Asia/Karachi",
  });

  const [customForm, setCustomForm] = useState({
    start_date: "",
    end_date: "",
    start_time: "10:00",
    end_time: "16:00",
    slot_minutes: "30",
    timezone: "Asia/Karachi",
  });

  function closeAndReset() {
    setOpen(false);
    setError("");
    setTab("weekly");
  }

  async function handleWeeklySubmit() {
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        day_of_week: Number(weeklyForm.day_of_week),
        start_time: weeklyForm.start_time,
        end_time: weeklyForm.end_time,
        slot_minutes: Number(weeklyForm.slot_minutes),
        timezone: weeklyForm.timezone,
      }),
    });
    return res;
  }

  async function handleCustomSubmit() {
    if (!customForm.start_date || !customForm.end_date) {
      throw new Error("Start date and end date are required.");
    }
    const res = await fetch("/api/availability/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: customForm.start_date,
        end_date: customForm.end_date,
        start_time: customForm.start_time,
        end_time: customForm.end_time,
        slot_minutes: Number(customForm.slot_minutes),
        timezone: customForm.timezone,
      }),
    });
    return res;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = tab === "weekly" ? await handleWeeklySubmit() : await handleCustomSubmit();
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save availability.");
        return;
      }
      closeAndReset();
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Network error, try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Add Availability
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeAndReset}
        >
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Add availability</h3>
              <button
                onClick={closeAndReset}
                className="text-base-500 hover:text-white text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 mb-5 border-b border-base-700">
              <button
                type="button"
                onClick={() => setTab("weekly")}
                className={`text-sm font-medium px-3 py-2 -mb-px border-b-2 transition-colors ${
                  tab === "weekly"
                    ? "border-accent-500 text-accent-500"
                    : "border-transparent text-base-500 hover:text-white"
                }`}
              >
                Weekly Schedule
              </button>
              <button
                type="button"
                onClick={() => setTab("custom")}
                className={`text-sm font-medium px-3 py-2 -mb-px border-b-2 transition-colors ${
                  tab === "custom"
                    ? "border-accent-500 text-accent-500"
                    : "border-transparent text-base-500 hover:text-white"
                }`}
              >
                Custom Dates
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "weekly" ? (
                <>
                  <div>
                    <label className="label">Day</label>
                    <select
                      className="input"
                      value={weeklyForm.day_of_week}
                      onChange={(e) =>
                        setWeeklyForm((f) => ({ ...f, day_of_week: e.target.value }))
                      }
                    >
                      {DAYS.map((d, i) => (
                        <option key={i} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Start time</label>
                      <input
                        type="time"
                        className="input"
                        value={weeklyForm.start_time}
                        onChange={(e) =>
                          setWeeklyForm((f) => ({ ...f, start_time: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="label">End time</label>
                      <input
                        type="time"
                        className="input"
                        value={weeklyForm.end_time}
                        onChange={(e) =>
                          setWeeklyForm((f) => ({ ...f, end_time: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Slot duration (min)</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        className="input"
                        value={weeklyForm.slot_minutes}
                        onChange={(e) =>
                          setWeeklyForm((f) => ({ ...f, slot_minutes: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Timezone</label>
                      <input
                        className="input"
                        value={weeklyForm.timezone}
                        onChange={(e) =>
                          setWeeklyForm((f) => ({ ...f, timezone: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Start date</label>
                      <input
                        type="date"
                        className="input"
                        value={customForm.start_date}
                        onChange={(e) =>
                          setCustomForm((f) => ({ ...f, start_date: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="label">End date</label>
                      <input
                        type="date"
                        className="input"
                        value={customForm.end_date}
                        min={customForm.start_date || undefined}
                        onChange={(e) =>
                          setCustomForm((f) => ({ ...f, end_date: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Start time</label>
                      <input
                        type="time"
                        className="input"
                        value={customForm.start_time}
                        onChange={(e) =>
                          setCustomForm((f) => ({ ...f, start_time: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="label">End time</label>
                      <input
                        type="time"
                        className="input"
                        value={customForm.end_time}
                        onChange={(e) =>
                          setCustomForm((f) => ({ ...f, end_time: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Slot duration (min)</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        className="input"
                        value={customForm.slot_minutes}
                        onChange={(e) =>
                          setCustomForm((f) => ({ ...f, slot_minutes: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Timezone</label>
                      <input
                        className="input"
                        value={customForm.timezone}
                        onChange={(e) =>
                          setCustomForm((f) => ({ ...f, timezone: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="text-coral-400 text-sm bg-coral-500/10 border border-coral-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeAndReset} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
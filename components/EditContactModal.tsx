"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STAGES = ["new", "attempted", "booked", "won", "lost"];

type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  email: string | null;
  company: string | null;
  stage: string;
  tags: string[] | null;
  notes: string | null;
};

export default function EditContactModal({ contact }: { contact: Contact }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: contact.first_name ?? "",
    last_name: contact.last_name ?? "",
    phone: contact.phone ?? "",
    company: contact.company ?? "",
    email: contact.email ?? "",
    stage: contact.stage ?? "new",
    tags: (contact.tags ?? []).join(", "),
    notes: contact.notes ?? "",
  });

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          company: form.company,
          email: form.email,
          stage: form.stage,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save contact.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error, try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-accent-400 hover:text-accent-300 border border-accent-500/30 hover:border-accent-500/60 rounded-lg px-2.5 py-1 transition-colors"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Edit contact</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-base-500 hover:text-white text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First name</label>
                  <input
                    className="input"
                    value={form.first_name}
                    onChange={(e) => update("first_name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Last name</label>
                  <input
                    className="input"
                    value={form.last_name}
                    onChange={(e) => update("last_name", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Phone (with country code)</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Company</label>
                <input
                  className="input"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Stage</label>
                <select
                  className="input capitalize"
                  value={form.stage}
                  onChange={(e) => update("stage", e.target.value)}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tags (comma separated)</label>
                <input
                  className="input"
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input min-h-[80px]"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>

              {error && (
                <div className="text-coral-400 text-sm bg-coral-500/10 border border-coral-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
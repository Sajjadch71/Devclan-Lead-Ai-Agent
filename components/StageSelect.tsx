"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STAGES = ["new", "attempted", "booked", "won", "lost"];

export default function StageSelect({ id, stage }: { id: string; stage: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(next: string) {
    setLoading(true);
    try {
      await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={stage}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="badge bg-base-700 text-base-500 capitalize border-0 cursor-pointer disabled:opacity-50"
    >
      {STAGES.map((s) => (
        <option key={s} value={s} className="bg-base-800 text-white">
          {s}
        </option>
      ))}
    </select>
  );
}
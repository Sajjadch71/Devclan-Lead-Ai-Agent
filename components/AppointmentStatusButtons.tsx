"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = ["confirmed", "completed", "no_show", "cancelled"];

export default function AppointmentStatusButtons({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: string) {
    setLoading(true);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          disabled={loading || status === opt}
          onClick={() => setStatus(opt)}
          className={`text-[11px] font-medium px-2.5 py-1 rounded-full border capitalize transition-colors disabled:cursor-default ${
            status === opt
              ? "bg-accent-500/15 border-accent-500/40 text-accent-400"
              : "border-base-700 text-base-500 hover:text-white hover:border-base-600"
          }`}
        >
          {opt.replace("_", " ")}
        </button>
      ))}
    </div>
  );
}

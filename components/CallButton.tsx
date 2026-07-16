"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CallButton({
  contactId,
  optedOut,
}: {
  contactId: string;
  optedOut?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCall() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/trigger-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Call failed to start.");
        return;
      }
      setMessage("Call started — ringing now.");
      router.refresh();
    } catch {
      setMessage("Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (optedOut) {
    return <span className="text-xs text-base-500 italic">Opted out</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCall}
        disabled={loading}
        className="text-xs font-semibold text-accent-400 hover:text-accent-300 border border-accent-500/30 hover:border-accent-500/60 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
      >
        {loading ? "Calling…" : "☎ Call now"}
      </button>
      {message && <span className="text-xs text-base-500">{message}</span>}
    </div>
  );
}

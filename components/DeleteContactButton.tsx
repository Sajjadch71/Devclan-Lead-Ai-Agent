"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteContactButton({
  id,
  redirectTo,
}: {
  id: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    setLoading(true);
    try {
      await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs font-semibold text-coral-400 hover:text-coral-300 border border-coral-500/30 hover:border-coral-500/60 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
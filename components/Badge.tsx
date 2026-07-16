const STYLES: Record<string, string> = {
  new: "bg-base-700 text-base-500",
  attempted: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  booked: "bg-mint-500/15 text-mint-400 border border-mint-500/20",
  won: "bg-mint-500/15 text-mint-400 border border-mint-500/20",
  lost: "bg-coral-500/15 text-coral-400 border border-coral-500/20",
  confirmed: "bg-mint-500/15 text-mint-400 border border-mint-500/20",
  completed: "bg-accent-500/15 text-accent-400 border border-accent-500/20",
  no_show: "bg-coral-500/15 text-coral-400 border border-coral-500/20",
  cancelled: "bg-base-700 text-base-500",
  Hot: "bg-coral-500/15 text-coral-400 border border-coral-500/20",
  Warm: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  Cold: "bg-accent-500/15 text-accent-400 border border-accent-500/20",
  Booked: "bg-mint-500/15 text-mint-400 border border-mint-500/20",
  "Not Interested": "bg-coral-500/15 text-coral-400 border border-coral-500/20",
  Callback: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  Voicemail: "bg-base-700 text-base-500",
};

const TONES: Record<string, string> = {
  coral: "bg-coral-500/15 text-coral-400 border border-coral-500/20",
  mint: "bg-mint-500/15 text-mint-400 border border-mint-500/20",
  amber: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  accent: "bg-accent-500/15 text-accent-400 border border-accent-500/20",
  base: "bg-base-700 text-base-500",
};

export default function Badge({
  children,
  tone,
}: {
  children: string | null | undefined;
  tone?: "coral" | "mint" | "amber" | "accent" | "base";
}) {
  if (!children) return <span className="text-base-500 text-sm">—</span>;
  const style = tone ? TONES[tone] : STYLES[children] ?? "bg-base-700 text-base-500";
  return <span className={`badge ${style}`}>{children.replace("_", " ")}</span>;
}

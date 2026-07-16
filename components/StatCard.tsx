export default function StatCard({
  label,
  value,
  accent = "accent",
}: {
  label: string;
  value: string | number;
  accent?: "accent" | "mint" | "amber" | "coral";
}) {
  const dot: Record<string, string> = {
    accent: "bg-accent-400",
    mint: "bg-mint-400",
    amber: "bg-amber-400",
    coral: "bg-coral-400",
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${dot[accent]}`} />
        <span className="text-base-500 text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-3xl font-extrabold text-white">{value}</div>
    </div>
  );
}

export default function EmptyState({
  icon = "◇",
  title,
  subtitle,
  compact = false,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8">
        <div className="w-9 h-9 rounded-xl bg-base-800 flex items-center justify-center text-lg text-base-500 mb-3">
          {icon}
        </div>
        <div className="text-base-500 text-sm">{title}</div>
        {subtitle && <div className="text-base-600 text-xs mt-1 max-w-sm">{subtitle}</div>}
      </div>
    );
  }

  return (
    <div className="card py-16 flex flex-col items-center justify-center text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-base-800 flex items-center justify-center text-2xl text-base-500 mb-4">
        {icon}
      </div>
      <div className="text-white font-semibold">{title}</div>
      {subtitle && <div className="text-base-500 text-sm mt-1 max-w-sm">{subtitle}</div>}
    </div>
  );
}

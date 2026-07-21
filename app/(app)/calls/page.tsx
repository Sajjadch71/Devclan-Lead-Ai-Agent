import { query, queryOne } from "@/lib/db";
import Link from "next/link";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import SearchBar from "@/components/SearchBar";
import StatCard from "@/components/StatCard";

function fmtAvgDuration(seconds: string | number | null) {
  const n = Number(seconds);
  if (!n) return "—";
  const m = Math.floor(n / 60);
  const s = Math.round(n % 60);
  return `${m}m ${s}s`;
}

export const dynamic = "force-dynamic";

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; outcome?: string }>;
}) {
  const { q, outcome } = await searchParams;

  const conditions: string[] = [];
  const params: any[] = [];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(c.first_name ilike $${params.length} or c.last_name ilike $${params.length} or c.phone ilike $${params.length})`
    );
  }
  if (outcome) {
    params.push(outcome);
    conditions.push(`calls.call_outcome = $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const calls = await query<any>(
    `select calls.*, c.first_name, c.last_name, c.phone as contact_phone
     from calls
     left join contacts c on c.id = calls.contact_id
     ${where}
     order by calls.started_at desc nulls last, calls.created_at desc
     limit 200`,
    params
  );

  const outcomes = ["Booked", "Not Interested", "Callback", "Voicemail"];

  const totals = await queryOne<{
    total_calls: string;
    completed_calls: string;
    failed_calls: string;
    avg_duration_seconds: string | null;
  }>(`
    select
      count(*) as total_calls,
      count(*) filter (where status = 'ended') as completed_calls,
      count(*) filter (where status = 'error') as failed_calls,
      avg(duration_seconds) filter (where duration_seconds is not null) as avg_duration_seconds
    from calls
  `);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Calls</h1>
        <p className="text-base-500 text-sm mt-1">{calls.length} shown</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total calls" value={totals?.total_calls ?? 0} accent="accent" />
        <StatCard label="Completed" value={totals?.completed_calls ?? 0} accent="mint" />
        <StatCard label="Failed" value={totals?.failed_calls ?? 0} accent="coral" />
        <StatCard label="Avg duration" value={fmtAvgDuration(totals?.avg_duration_seconds ?? null)} accent="amber" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar placeholder="Search by contact name or phone…" />
        <div className="flex gap-2">
          <Link
            href="/calls"
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              !outcome
                ? "bg-accent-500/15 border-accent-500/40 text-accent-400"
                : "border-base-700 text-base-500 hover:text-white"
            }`}
          >
            All
          </Link>
          {outcomes.map((o) => (
            <Link
              key={o}
              href={`/calls?outcome=${encodeURIComponent(o)}`}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                outcome === o
                  ? "bg-accent-500/15 border-accent-500/40 text-accent-400"
                  : "border-base-700 text-base-500 hover:text-white"
              }`}
            >
              {o}
            </Link>
          ))}
        </div>
      </div>

      {calls.length === 0 ? (
        <EmptyState icon="☎" title="No calls yet" subtitle="Calls will appear here once you start dialing contacts." />
      ) : (
        <div className="space-y-3">
          {calls.map((c) => (
            <Link
              key={c.id}
              href={`/calls/${c.id}`}
              className="card block p-5 hover:border-accent-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">
                      {c.first_name || c.last_name
                        ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()
                        : c.contact_phone ?? "Unknown"}
                    </span>
                    <span className="text-base-500 text-xs">
                      {c.started_at ? new Date(c.started_at).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="text-sm text-base-500 line-clamp-2 max-w-2xl">
                    {c.call_summary ?? "No summary available yet."}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.interest_level && <Badge>{c.interest_level}</Badge>}
                  {c.call_outcome && <Badge>{c.call_outcome}</Badge>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

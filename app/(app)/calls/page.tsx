import { query } from "@/lib/db";
import Link from "next/link";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import SearchBar from "@/components/SearchBar";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Calls</h1>
        <p className="text-base-500 text-sm mt-1">{calls.length} shown</p>
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

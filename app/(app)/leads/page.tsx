import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const params: any[] = [];
  let where = "";
  if (status) {
    params.push(status);
    where = `where status = $${params.length}`;
  }

  const leads = await query<any>(
    `select * from leads ${where} order by created_at desc limit 200`,
    params
  );

  const totals = await queryOne<{
    total_leads: string;
    new_leads: string;
    contacted_leads: string;
    qualified_leads: string;
  }>(`
    select
      count(*) as total_leads,
      count(*) filter (where status = 'new') as new_leads,
      count(*) filter (where status = 'contacted') as contacted_leads,
      count(*) filter (where status = 'qualified') as qualified_leads
    from leads
  `);

  const statuses = ["new", "contacted", "interested", "qualified", "converted", "lost"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-base-500 text-sm mt-1">
          Apollo-sourced leads awaiting qualification, {leads.length} shown.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total leads" value={totals?.total_leads ?? 0} accent="accent" />
        <StatCard label="New" value={totals?.new_leads ?? 0} accent="base" />
        <StatCard label="Contacted" value={totals?.contacted_leads ?? 0} accent="amber" />
        <StatCard label="Qualified" value={totals?.qualified_leads ?? 0} accent="mint" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/leads"
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
            !status
              ? "bg-accent-500/15 border-accent-500/40 text-accent-400"
              : "border-base-700 text-base-500 hover:text-white"
          }`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/leads?status=${s}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${
              status === s
                ? "bg-accent-500/15 border-accent-500/40 text-accent-400"
                : "border-base-700 text-base-500 hover:text-white"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon="⚑"
          title="No leads yet"
          subtitle="Apollo-ingested leads will show up here once ingestion is running."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-base-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l: any) => (
                <tr
                  key={l.id}
                  className="border-b border-base-700/60 last:border-0 hover:bg-base-800/40"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/leads/${l.id}`}
                      className="text-white font-medium hover:text-accent-400"
                    >
                      {l.first_name || l.last_name
                        ? `${l.first_name ?? ""} ${l.last_name ?? ""}`.trim()
                        : l.email ?? l.phone ?? "—"}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-base-500">{l.company ?? "—"}</td>
                  <td className="px-5 py-3 text-base-500">{l.email ?? "—"}</td>
                  <td className="px-5 py-3 text-base-500">{l.phone ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge>{l.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-base-500">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/leads/${l.id}`}
                        className="text-xs font-semibold text-accent-400 hover:text-accent-300 border border-accent-500/30 hover:border-accent-500/60 rounded-lg px-2.5 py-1 transition-colors"
                      >
                        View
                      </Link>
                      <span
                        title="AI calling for leads isn't wired up yet — coming in a later phase."
                        className="text-xs font-semibold text-base-600 border border-base-700 rounded-lg px-2.5 py-1 cursor-not-allowed select-none"
                      >
                        ☎ Start AI Call
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
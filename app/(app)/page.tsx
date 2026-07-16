import { queryOne, query } from "@/lib/db";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const totals = await queryOne<{
    total_contacts: string;
    total_calls: string;
    total_appointments: string;
    booked_calls: string;
  }>(`
    select
      (select count(*) from contacts) as total_contacts,
      (select count(*) from calls) as total_calls,
      (select count(*) from appointments where status = 'confirmed') as total_appointments,
      (select count(*) from calls where call_outcome = 'Booked') as booked_calls
  `);

  const upcoming = await query<any>(
    `select a.*, ct.first_name, ct.last_name, ct.phone
     from appointments a
     left join contacts ct on ct.id = a.contact_id
     where a.status = 'confirmed' and a.start_time >= now()
     order by a.start_time asc
     limit 5`
  );

  const recentCalls = await query<any>(
    `select c.*, ct.first_name, ct.last_name
     from calls c
     left join contacts ct on ct.id = c.contact_id
     order by c.created_at desc
     limit 5`
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-base-500 text-sm mt-1">
          Live snapshot of your AI calling pipeline.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Contacts" value={totals?.total_contacts ?? 0} accent="accent" />
        <StatCard label="Calls made" value={totals?.total_calls ?? 0} accent="mint" />
        <StatCard label="Appointments" value={totals?.total_appointments ?? 0} accent="amber" />
        <StatCard label="Booked calls" value={totals?.booked_calls ?? 0} accent="coral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Upcoming appointments</h2>
            <Link href="/appointments" className="text-xs text-accent-400 hover:underline">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon="◷" title="No appointments booked yet" />
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-base-900 border border-base-700"
                >
                  <div>
                    <div className="text-white text-sm font-medium">
                      {a.first_name || a.phone || "Unknown lead"} {a.last_name ?? ""}
                    </div>
                    <div className="text-base-500 text-xs mt-0.5">
                      {new Date(a.start_time).toLocaleString()}
                    </div>
                  </div>
                  <Badge>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent calls</h2>
            <Link href="/calls" className="text-xs text-accent-400 hover:underline">
              View all
            </Link>
          </div>
          {recentCalls.length === 0 ? (
            <EmptyState icon="☎" title="No calls yet" />
          ) : (
            <div className="space-y-3">
              {recentCalls.map((c) => (
                <Link
                  key={c.id}
                  href={`/calls/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-base-900 border border-base-700 hover:border-accent-500/40 transition-colors"
                >
                  <div>
                    <div className="text-white text-sm font-medium">
                      {c.first_name || c.to_number || "Unknown"} {c.last_name ?? ""}
                    </div>
                    <div className="text-base-500 text-xs mt-0.5">
                      {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                    </div>
                  </div>
                  <Badge>{c.call_outcome}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

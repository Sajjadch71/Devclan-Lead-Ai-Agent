import { queryOne, query } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await queryOne<any>(`select * from leads where id = $1`, [id]);
  if (!lead) notFound();

  // Leads aren't callable yet (no promotion-to-contact step exists). If this
  // lead's phone happens to match an existing contact, surface any call
  // history for it — groundwork for the future call/appointment timeline.
  const calls = lead.phone
    ? await query<any>(
        `select calls.* from calls
         join contacts on contacts.id = calls.contact_id
         where contacts.phone = $1
         order by calls.created_at desc`,
        [lead.phone]
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/leads" className="text-sm text-base-500 hover:text-white">
          ← Leads
        </Link>
      </div>

      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {lead.first_name || lead.last_name
                ? `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim()
                : lead.email ?? lead.phone}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-base-500 flex-wrap">
              {lead.job_title && <span>{lead.job_title}</span>}
              {lead.company && <span>{lead.job_title ? "· " : ""}{lead.company}</span>}
              {lead.email && <span>· {lead.email}</span>}
              {lead.phone && <span>· {lead.phone}</span>}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge>{lead.status}</Badge>
              {lead.source && (
                <span className="text-xs text-base-500 border border-base-700 rounded-full px-2.5 py-1 capitalize">
                  {lead.source}
                </span>
              )}
            </div>
          </div>
          <span
            title="AI calling for leads isn't wired up yet — coming in a later phase."
            className="text-xs font-semibold text-base-600 border border-base-700 rounded-lg px-2.5 py-1.5 cursor-not-allowed select-none"
          >
            ☎ Start AI Call
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
            Lead information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-base-500">Name</span>
              <span className="text-white">
                {lead.first_name || lead.last_name
                  ? `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim()
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-500">Company</span>
              <span className="text-white">{lead.company ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-500">Job title</span>
              <span className="text-white">{lead.job_title ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-500">Email</span>
              <span className="text-white">{lead.email ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-500">Phone</span>
              <span className="text-white">{lead.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-500">Status</span>
              <Badge>{lead.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-base-500">Source</span>
              <span className="text-white capitalize">{lead.source ?? "—"}</span>
            </div>
            {lead.notes && (
              <div className="pt-2 border-t border-base-700">
                <span className="text-base-500 block mb-1">Notes</span>
                <p className="text-white whitespace-pre-line">{lead.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
              Activity
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-base-500">Created</span>
                <span className="text-white">{new Date(lead.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-500">Last updated</span>
                <span className="text-white">{new Date(lead.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
              Call history ({calls.length})
            </h2>
            {calls.length === 0 ? (
              <EmptyState
                icon="☎"
                title="No calls yet"
                subtitle="Shown here once this lead is promoted to a contact and called."
                compact
              />
            ) : (
              <div className="space-y-3">
                {calls.map((c) => (
                  <Link
                    key={c.id}
                    href={`/calls/${c.id}`}
                    className="block rounded-xl border border-base-700 hover:border-accent-500/40 p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white">
                        {c.started_at ? new Date(c.started_at).toLocaleString() : "Unknown time"}
                      </span>
                      {c.call_outcome && <Badge>{c.call_outcome}</Badge>}
                    </div>
                    <p className="text-sm text-base-500 line-clamp-2">
                      {c.call_summary ?? "No summary available."}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
              Appointments
            </h2>
            <EmptyState
              icon="◷"
              title="Not linked yet"
              subtitle="Appointments attach once this lead is promoted to a contact and booked."
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
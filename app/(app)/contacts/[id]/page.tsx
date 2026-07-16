import { queryOne, query } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/Badge";
import CallButton from "@/components/CallButton";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contact = await queryOne<any>(`select * from contacts where id = $1`, [id]);
  if (!contact) notFound();

  const calls = await query<any>(
    `select * from calls where contact_id = $1 order by started_at desc nulls last, created_at desc`,
    [id]
  );
  const appointments = await query<any>(
    `select * from appointments where contact_id = $1 order by start_time desc`,
    [id]
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/contacts" className="text-sm text-base-500 hover:text-white">
          ← Contacts
        </Link>
      </div>

      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {contact.first_name || contact.last_name
                ? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim()
                : contact.phone}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-base-500">
              <span>{contact.phone}</span>
              {contact.email && <span>· {contact.email}</span>}
              {contact.company && <span>· {contact.company}</span>}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge>{contact.stage}</Badge>
              {contact.opted_out && <Badge tone="coral">Opted out</Badge>}
              {contact.source && (
                <span className="text-xs text-base-500 border border-base-700 rounded-full px-2.5 py-1">
                  {contact.source}
                </span>
              )}
            </div>
          </div>
          <CallButton contactId={contact.id} optedOut={contact.opted_out} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
            Call history ({calls.length})
          </h2>
          {calls.length === 0 ? (
            <EmptyState icon="☎" title="No calls yet" subtitle="" compact />
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
            Appointments ({appointments.length})
          </h2>
          {appointments.length === 0 ? (
            <EmptyState icon="◷" title="No appointments" subtitle="" compact />
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="rounded-xl border border-base-700 p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white">
                      {new Date(a.start_time).toLocaleString()}
                    </span>
                    <Badge>{a.status}</Badge>
                  </div>
                  {a.notes && <p className="text-sm text-base-500">{a.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

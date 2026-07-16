import { queryOne } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/Badge";
import CallTranscriptView from "@/components/CallTranscriptView";

export const dynamic = "force-dynamic";

function fmtDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const call = await queryOne<any>(
    `select calls.*, c.id as contact_id, c.first_name, c.last_name, c.phone as contact_phone, c.company
     from calls
     left join contacts c on c.id = calls.contact_id
     where calls.id = $1`,
    [id]
  );
  if (!call) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/calls" className="text-sm text-base-500 hover:text-white">
          ← Calls
        </Link>
      </div>

      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              {call.contact_id ? (
                <Link href={`/contacts/${call.contact_id}`} className="hover:text-accent-400">
                  {call.first_name || call.last_name
                    ? `${call.first_name ?? ""} ${call.last_name ?? ""}`.trim()
                    : call.contact_phone}
                </Link>
              ) : (
                call.from_number ?? call.to_number ?? "Unknown"
              )}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-base-500 flex-wrap">
              <span>{call.started_at ? new Date(call.started_at).toLocaleString() : "Unknown time"}</span>
              <span>· Duration {fmtDuration(call.duration_seconds)}</span>
              <span className="capitalize">· {call.direction ?? "outbound"}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {call.call_outcome && <Badge>{call.call_outcome}</Badge>}
              {call.interest_level && <Badge>{call.interest_level}</Badge>}
              {call.user_sentiment && <Badge>{call.user_sentiment}</Badge>}
              {call.call_successful === true && <Badge tone="mint">Successful</Badge>}
              {call.call_successful === false && <Badge tone="coral">Unsuccessful</Badge>}
              {call.budget_mentioned && <Badge tone="amber">Budget mentioned</Badge>}
              {call.opted_out && <Badge tone="coral">Opted out</Badge>}
            </div>
          </div>
          {call.recording_url && (
            <audio controls src={call.recording_url} className="h-9 w-72" />
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card p-6">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
            AI summary
          </h2>
          <p className="text-base-300 text-sm leading-relaxed whitespace-pre-line">
            {call.call_summary ?? "No summary was generated for this call."}
          </p>

          {call.objections && (
            <div className="mt-5 pt-5 border-t border-base-700">
              <h3 className="text-xs font-semibold text-base-500 uppercase tracking-wide mb-2">
                Objections raised
              </h3>
              <p className="text-sm text-base-300 whitespace-pre-line">{call.objections}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-base-700">
            <h3 className="text-xs font-semibold text-base-500 uppercase tracking-wide mb-3">
              Full transcript
            </h3>
            <CallTranscriptView transcript={call.transcript} />
          </div>
        </div>

        <div className="card p-6 space-y-4 h-fit">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-base-500">From</span>
              <span className="text-white">{call.from_number ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-500">To</span>
              <span className="text-white">{call.to_number ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-500">Status</span>
              <span className="text-white capitalize">{call.status ?? "—"}</span>
            </div>
            {call.disconnection_reason && (
              <div className="flex justify-between">
                <span className="text-base-500">Ended by</span>
                <span className="text-white capitalize">
                  {String(call.disconnection_reason).replace(/_/g, " ")}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-base-500">Retell call ID</span>
              <span className="text-white text-xs break-all text-right">{call.retell_call_id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

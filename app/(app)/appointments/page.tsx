import { query } from "@/lib/db";
import Link from "next/link";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import AppointmentStatusButtons from "@/components/AppointmentStatusButtons";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const params: any[] = [];
  let where = "";
  if (status) {
    params.push(status);
    where = `where a.status = $1`;
  }

  const appointments = await query<any>(
    `select a.*, ct.first_name, ct.last_name, ct.phone, ct.company
     from appointments a
     left join contacts ct on ct.id = a.contact_id
     ${where}
     order by a.start_time asc`,
    params
  );

  const statuses = ["confirmed", "completed", "no_show", "cancelled"];
  const now = Date.now();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Appointments</h1>
        <p className="text-base-500 text-sm mt-1">{appointments.length} shown</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/appointments"
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
            href={`/appointments?status=${s}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${
              status === s
                ? "bg-accent-500/15 border-accent-500/40 text-accent-400"
                : "border-base-700 text-base-500 hover:text-white"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon="◷"
          title="No appointments yet"
          subtitle="Booked calls will show up here automatically."
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => {
            const past = new Date(a.start_time).getTime() < now;
            return (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/contacts/${a.contact_id}`}
                        className="text-white font-medium hover:text-accent-400"
                      >
                        {a.first_name || a.last_name
                          ? `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()
                          : a.phone}
                      </Link>
                      {past && a.status === "confirmed" && (
                        <span className="text-[11px] text-amber-400">past due</span>
                      )}
                    </div>
                    <p className="text-sm text-base-400">
                     {new Date(a.start_time).toLocaleString("en-PK", {
  timeZone: "Asia/Karachi",
  dateStyle: "medium",
  timeStyle: "short",
})} — {a.title}
                    </p>
                    {a.company && <p className="text-xs text-base-500 mt-0.5">{a.company}</p>}
                    {a.notes && <p className="text-xs text-base-500 mt-1">{a.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge>{a.status}</Badge>
                    <AppointmentStatusButtons id={a.id} status={a.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

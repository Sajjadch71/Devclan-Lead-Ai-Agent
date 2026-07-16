import { query } from "@/lib/db";
import Link from "next/link";
import AddContactModal from "@/components/AddContactModal";
import CallButton from "@/components/CallButton";
import SearchBar from "@/components/SearchBar";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>;
}) {
  const { q, stage } = await searchParams;

  const conditions: string[] = [];
  const params: any[] = [];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(first_name ilike $${params.length} or last_name ilike $${params.length} or phone ilike $${params.length} or company ilike $${params.length})`
    );
  }
  if (stage) {
    params.push(stage);
    conditions.push(`stage = $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const contacts = await query<any>(
    `select * from contacts ${where} order by created_at desc limit 200`,
    params
  );

  const stages = ["new", "attempted", "booked", "won", "lost"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-base-500 text-sm mt-1">{contacts.length} shown</p>
        </div>
        <AddContactModal />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar placeholder="Search name, phone, company…" />
        <div className="flex gap-2">
          <Link
            href="/contacts"
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              !stage
                ? "bg-accent-500/15 border-accent-500/40 text-accent-400"
                : "border-base-700 text-base-500 hover:text-white"
            }`}
          >
            All
          </Link>
          {stages.map((s) => (
            <Link
              key={s}
              href={`/contacts?stage=${s}`}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${
                stage === s
                  ? "bg-accent-500/15 border-accent-500/40 text-accent-400"
                  : "border-base-700 text-base-500 hover:text-white"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon="◈"
          title="No contacts yet"
          subtitle="Add your first lead to start calling."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-base-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Stage</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-base-700/60 last:border-0 hover:bg-base-800/40">
                  <td className="px-5 py-3">
                    <Link href={`/contacts/${c.id}`} className="text-white font-medium hover:text-accent-400">
                      {c.first_name || c.last_name
                        ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()
                        : "—"}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-base-500">{c.phone}</td>
                  <td className="px-5 py-3 text-base-500">{c.company ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge>{c.stage}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <CallButton contactId={c.id} optedOut={c.opted_out} />
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

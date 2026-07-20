import Link from "next/link";
import { ghlRequest } from "@/lib/ghl";
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

  const data = await ghlRequest(
    `/contacts/?locationId=${process.env.GHL_LOCATION_ID}`
  );

  let contacts = (data.contacts ?? []).map((c: any) => ({
    id: c.id,
    first_name: c.firstName,
    last_name: c.lastName,
    phone: c.phone,
    company: c.companyName,
    stage:
      c.customFields?.find(
        (f: any) => f.id === "SxiQsG0mMgxuFG1eAZ1a"
      )?.value ?? "new",
    opted_out: c.dnd ?? false,
  }));

  if (q) {
    contacts = contacts.filter((c: any) =>
      `${c.first_name} ${c.last_name} ${c.phone} ${c.company}`
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  }

  if (stage) {
    contacts = contacts.filter(
      (contact: any) =>
        contact.stage?.toLowerCase() === stage.toLowerCase()
    );
  }

  const stages = ["new", "attempted", "booked", "won", "lost"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-base-500 text-sm mt-1">
            {contacts.length} shown
          </p>
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
                <th className="px-5 py-3 font-semibold text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {contacts.map((c: any) => (
                <tr
                  key={c.id}
                  className="border-b border-base-700/60 last:border-0 hover:bg-base-800/40"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/contacts/${c.id}`}
                      className="text-white font-medium hover:text-accent-400"
                    >
                      {c.first_name || c.last_name
                        ? `${c.first_name ?? ""} ${
                            c.last_name ?? ""
                          }`.trim()
                        : "—"}
                    </Link>
                  </td>

                  <td className="px-5 py-3 text-base-500">
                    {c.phone ?? "—"}
                  </td>

                  <td className="px-5 py-3 text-base-500">
                    {c.company ?? "—"}
                  </td>

                  <td className="px-5 py-3">
                    <Badge>{c.stage}</Badge>
                  </td>

                  <td className="px-5 py-3 text-right">
                    <CallButton
                      contactId={c.id}
                      optedOut={c.opted_out}
                    />
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
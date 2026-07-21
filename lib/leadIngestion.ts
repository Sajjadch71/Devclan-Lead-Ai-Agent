import { queryOne } from "@/lib/db";
import type { RawApolloLead } from "@/lib/apollo";

export type IngestionResult = {
  fetched: number;
  inserted: number;
  skipped: number;
  errors: number;
  insertedContacts: { id: string; phone: string; name: string }[];
};

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Source-agnostic lead ingestion: normalizes raw leads, skips ones without a
 * usable phone, relies on contacts.phone's existing unique constraint for
 * dedupe (a duplicate is a routine skip here, not an error — this runs
 * unattended), and inserts the rest as source='apollo', stage='new'.
 *
 * Intentionally separate from POST /api/contacts, whose duplicate-phone
 * handling (409 shown to the user) is correct for a human adding a contact
 * by hand but wrong for an ingestion loop that should just move on.
 */
export async function ingestLeads(rawLeads: RawApolloLead[]): Promise<IngestionResult> {
  const result: IngestionResult = {
    fetched: rawLeads.length,
    inserted: 0,
    skipped: 0,
    errors: 0,
    insertedContacts: [],
  };

  for (const lead of rawLeads) {
    const phone = normalizePhone(lead.phone);
    if (!phone) {
      result.skipped++;
      continue;
    }

    try {
      const contact = await queryOne<{
        id: string;
        phone: string;
        first_name: string | null;
        last_name: string | null;
      }>(
        `insert into contacts (first_name, last_name, phone, email, company, source, stage)
         values ($1, $2, $3, $4, $5, 'apollo', 'new')
         returning id, phone, first_name, last_name`,
        [lead.first_name || null, lead.last_name || null, phone, lead.email || null, lead.company || null]
      );

      if (contact) {
        result.inserted++;
        result.insertedContacts.push({
          id: contact.id,
          phone: contact.phone,
          name: `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || contact.phone,
        });
      }
    } catch (error: any) {
      if (error.code === "23505") {
        result.skipped++;
      } else {
        console.error("LEAD INGEST ERROR:", error);
        result.errors++;
      }
    }
  }

  return result;
}
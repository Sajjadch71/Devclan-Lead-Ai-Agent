import { queryOne } from "@/lib/db";
import type { RawApolloLead } from "@/lib/apollo";

export type LeadOutcome = "created" | "updated";

export type IngestedLead = {
  id: string;
  outcome: LeadOutcome;
  email: string | null;
  phone: string | null;
  name: string;
};

export type IngestionResult = {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  leads: IngestedLead[];
};

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Prefers matching an existing lead by email; falls back to phone only when email is absent. */
async function findExistingLeadId(email: string | null, phone: string | null): Promise<string | null> {
  if (email) {
    const byEmail = await queryOne<{ id: string }>(`select id from leads where email = $1`, [email]);
    if (byEmail) return byEmail.id;
  }
  if (phone) {
    const byPhone = await queryOne<{ id: string }>(`select id from leads where phone = $1`, [phone]);
    if (byPhone) return byPhone.id;
  }
  return null;
}

function nameFor(row: { first_name: string | null; last_name: string | null; email: string | null; phone: string | null }) {
  const full = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  return full || row.email || row.phone || "Unknown";
}

/**
 * Source-agnostic ingestion into the leads pipeline table (separate from
 * contacts — see lib/schema.sql). A lead with neither email nor phone can't
 * be deduped or contacted, so it's skipped rather than inserted.
 */
export async function ingestLeads(rawLeads: RawApolloLead[]): Promise<IngestionResult> {
  const result: IngestionResult = {
    fetched: rawLeads.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    leads: [],
  };

  for (const lead of rawLeads) {
    const email = clean(lead.email);
    const phone = clean(lead.phone);

    if (!email && !phone) {
      result.skipped++;
      continue;
    }

    const firstName = clean(lead.first_name);
    const lastName = clean(lead.last_name);
    const company = clean(lead.company);
    const jobTitle = clean(lead.job_title);

    try {
      const existingId = await findExistingLeadId(email, phone);

      if (existingId) {
        const updated = await queryOne<{
          id: string;
          email: string | null;
          phone: string | null;
          first_name: string | null;
          last_name: string | null;
        }>(
          `update leads set
             first_name = coalesce($1, first_name),
             last_name = coalesce($2, last_name),
             company = coalesce($3, company),
             email = coalesce($4, email),
             phone = coalesce($5, phone),
             job_title = coalesce($6, job_title),
             updated_at = now()
           where id = $7
           returning id, email, phone, first_name, last_name`,
          [firstName, lastName, company, email, phone, jobTitle, existingId]
        );
        if (updated) {
          result.updated++;
          result.leads.push({ id: updated.id, outcome: "updated", email: updated.email, phone: updated.phone, name: nameFor(updated) });
        }
        continue;
      }

      const created = await queryOne<{
        id: string;
        email: string | null;
        phone: string | null;
        first_name: string | null;
        last_name: string | null;
      }>(
        `insert into leads (first_name, last_name, company, email, phone, job_title, source, status)
         values ($1, $2, $3, $4, $5, $6, 'apollo', 'new')
         returning id, email, phone, first_name, last_name`,
        [firstName, lastName, company, email, phone, jobTitle]
      );
      if (created) {
        result.created++;
        result.leads.push({ id: created.id, outcome: "created", email: created.email, phone: created.phone, name: nameFor(created) });
      }
    } catch (error: any) {
      if (error.code === "23505") {
        // Race with a concurrent insert on the same email/phone — routine, not an error.
        result.skipped++;
      } else {
        console.error("LEAD INGEST ERROR:", error);
        result.errors++;
      }
    }
  }

  return result;
}
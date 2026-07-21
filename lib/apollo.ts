// Apollo lead-source adapter. Kept deliberately separate from
// lib/leadIngestion.ts (which is source-agnostic) so swapping or adding
// another lead source later never touches the ingestion/dedupe logic.

export type RawApolloLead = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
};

/**
 * Fetches candidate leads from Apollo's API.
 *
 * Not implemented yet — Apollo's people-search endpoint/params depend on
 * the account's plan tier, which hasn't been confirmed. Once APOLLO_API_KEY
 * is set and the endpoint is confirmed, replace the body of this function
 * with the real fetch call; it should keep returning RawApolloLead[] so
 * nothing downstream (lib/leadIngestion.ts, the ingest route) needs to change.
 *
 * Until then, test ingestion by POSTing `{ "leads": [...] }` directly to
 * /api/leads/apollo-ingest instead of calling this function.
 */
export async function fetchApolloLeads(): Promise<RawApolloLead[]> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Apollo API not configured yet. Set APOLLO_API_KEY in .env.local and implement the real " +
        "search call in lib/apollo.ts, or test ingestion by POSTing { leads: [...] } directly to " +
        "/api/leads/apollo-ingest."
    );
  }

  throw new Error(
    "Apollo API integration not implemented yet — lib/apollo.ts needs the real people-search call."
  );
}
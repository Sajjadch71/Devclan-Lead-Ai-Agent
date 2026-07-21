import { NextRequest, NextResponse } from "next/server";
import { fetchApolloLeads, type RawApolloLead } from "@/lib/apollo";
import { ingestLeads } from "@/lib/leadIngestion";

// Phase 1: manual/testable lead ingestion. Sits behind the same session-cookie
// auth as every other dashboard API route (not added to middleware's public
// list) since this is triggered by us for now, not by an external cron yet.
//
// POST { "leads": [...] } to test with sample data without Apollo configured.
// POST with no body (or no `leads` array) to pull from fetchApolloLeads()
// once lib/apollo.ts has a real implementation.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  let leads: RawApolloLead[];
  try {
    leads = Array.isArray(body?.leads) ? body.leads : await fetchApolloLeads();
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = await ingestLeads(leads);
  return NextResponse.json(result);
}
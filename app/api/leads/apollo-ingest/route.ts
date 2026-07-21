import { NextRequest, NextResponse } from "next/server";
import { fetchApolloLeads, type RawApolloLead } from "@/lib/apollo";
import { ingestLeads } from "@/lib/leadIngestion";

// Sits behind the same session-cookie auth as every other dashboard API
// route (not added to middleware's public list) since this is triggered by
// us for now, not by an external cron yet.
//
// POST { "leads": [...] } to test with sample data without Apollo configured.
// POST with no body (or no `leads` array) to pull from fetchApolloLeads()
// once lib/apollo.ts has a real implementation.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (body?.leads !== undefined && !Array.isArray(body.leads)) {
    return NextResponse.json({ success: false, error: '"leads" must be an array.' }, { status: 400 });
  }

  let rawLeads: RawApolloLead[];
  try {
    rawLeads = Array.isArray(body?.leads) ? body.leads : await fetchApolloLeads();
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const leads = rawLeads.filter((l): l is RawApolloLead => Boolean(l) && typeof l === "object");
  const result = await ingestLeads(leads);

  return NextResponse.json({ success: true, ...result });
}
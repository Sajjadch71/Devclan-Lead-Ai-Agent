import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const lead = await queryOne<any>(`select * from leads where id = $1`, [id]);
    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Leads aren't callable yet (no promotion-to-contact step exists), but if
    // this lead's phone happens to match an existing contact, surface any
    // call history for it — groundwork for the future timeline.
    const calls = lead.phone
      ? await query(
          `select calls.* from calls
           join contacts on contacts.id = calls.contact_id
           where contacts.phone = $1
           order by calls.created_at desc`,
          [lead.phone]
        )
      : [];

    return NextResponse.json({ lead, calls });
  } catch (error: any) {
    console.error("GET /api/leads/[id] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
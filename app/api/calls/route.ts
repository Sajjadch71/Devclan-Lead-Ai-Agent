import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const outcome = req.nextUrl.searchParams.get("outcome")?.trim();
    const params: any[] = [];
    let where = "";
    if (outcome) {
      params.push(outcome);
      where = `where c.call_outcome = $${params.length}`;
    }

    const calls = await query(
      `select c.*, ct.first_name, ct.last_name, ct.phone as contact_phone, ct.company
       from calls c
       left join contacts ct on ct.id = c.contact_id
       ${where}
       order by c.created_at desc
       limit 200`,
      params
    );

    return NextResponse.json({ calls });
  } catch (error: any) {
    console.error("GET /api/calls ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

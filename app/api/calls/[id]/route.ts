import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const call = await queryOne(
      `select c.*, ct.first_name, ct.last_name, ct.phone as contact_phone, ct.company, ct.id as contact_id
       from calls c
       left join contacts ct on ct.id = c.contact_id
       where c.id = $1`,
      [id]
    );

    if (!call) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ call });
  } catch (error: any) {
    console.error("GET /api/calls/[id] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status")?.trim();
    const params: any[] = [];
    let where = "";
    if (status) {
      params.push(status);
      where = `where status = $${params.length}`;
    }

    const leads = await query(
      `select * from leads ${where} order by created_at desc limit 200`,
      params
    );

    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error("GET /api/leads ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
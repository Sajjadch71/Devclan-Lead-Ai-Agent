import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { date, is_blocked, note } = await req.json();
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }
  const exception = await queryOne(
    `insert into availability_exceptions (date, is_blocked, note)
     values ($1,$2,$3) returning *`,
    [date, is_blocked ?? true, note ?? null]
  );
  return NextResponse.json({ exception });
}

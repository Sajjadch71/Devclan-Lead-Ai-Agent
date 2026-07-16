import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET() {
  const rules = await query(
    `select * from availability_rules order by day_of_week, start_time`
  );
  const exceptions = await query(
    `select * from availability_exceptions order by date`
  );
  return NextResponse.json({ rules, exceptions });
}

export async function POST(req: NextRequest) {
  const { day_of_week, start_time, end_time, slot_minutes, timezone } = await req.json();

  if (day_of_week === undefined || !start_time || !end_time) {
    return NextResponse.json(
      { error: "day_of_week, start_time and end_time are required" },
      { status: 400 }
    );
  }

  const rule = await queryOne(
    `insert into availability_rules (day_of_week, start_time, end_time, slot_minutes, timezone)
     values ($1,$2,$3,$4,$5) returning *`,
    [day_of_week, start_time, end_time, slot_minutes ?? 30, timezone ?? "Asia/Karachi"]
  );

  return NextResponse.json({ rule });
}

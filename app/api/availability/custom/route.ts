import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { start_date, end_date, start_time, end_time, slot_minutes, timezone } = await req.json();

  if (!start_date || !end_date || !start_time || !end_time) {
    return NextResponse.json(
      { error: "start_date, end_date, start_time and end_time are required" },
      { status: 400 }
    );
  }

  if (String(end_date) < String(start_date)) {
    return NextResponse.json(
      { error: "End date must be on or after start date." },
      { status: 400 }
    );
  }

  const rule = await queryOne(
    `insert into custom_availability (start_date, end_date, start_time, end_time, slot_minutes, timezone)
     values ($1,$2,$3,$4,$5,$6) returning *`,
    [start_date, end_date, start_time, end_time, slot_minutes ?? 30, timezone ?? "Asia/Karachi"]
  );

  return NextResponse.json({ rule });
}
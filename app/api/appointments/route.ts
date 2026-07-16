import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { isSlotAvailable } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status")?.trim();
  const params: any[] = [];
  let where = "";
  if (status) {
    params.push(status);
    where = `where a.status = $${params.length}`;
  }

  const appointments = await query(
    `select a.*, ct.first_name, ct.last_name, ct.phone, ct.company
     from appointments a
     left join contacts ct on ct.id = a.contact_id
     ${where}
     order by a.start_time asc`,
    params
  );

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const { contact_id, title, start_time, end_time, notes } = await req.json();

  if (!contact_id || !start_time || !end_time) {
    return NextResponse.json(
      { error: "contact_id, start_time and end_time are required" },
      { status: 400 }
    );
  }

  const available = await isSlotAvailable(start_time, end_time);
  if (!available) {
    return NextResponse.json(
      { error: "That time is not within your available hours or overlaps an existing appointment." },
      { status: 400 }
    );
  }

  const appointment = await queryOne(
    `insert into appointments (contact_id, title, start_time, end_time, notes)
     values ($1,$2,$3,$4,$5) returning *`,
    [contact_id, title ?? "Discovery Call", start_time, end_time, notes ?? null]
  );

  await query(`update contacts set stage = 'booked', updated_at = now() where id = $1`, [
    contact_id,
  ]);

  return NextResponse.json({ appointment });
}

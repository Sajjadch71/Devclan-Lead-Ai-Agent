import { NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";

export async function GET() {
  const totals = await queryOne<{
    total_contacts: string;
    total_calls: string;
    total_appointments: string;
    booked_calls: string;
  }>(`
    select
      (select count(*) from contacts) as total_contacts,
      (select count(*) from calls) as total_calls,
      (select count(*) from appointments where status = 'confirmed') as total_appointments,
      (select count(*) from calls where call_outcome = 'Booked') as booked_calls
  `);

  const upcoming = await query(
    `select a.*, ct.first_name, ct.last_name, ct.phone
     from appointments a
     left join contacts ct on ct.id = a.contact_id
     where a.status = 'confirmed' and a.start_time >= now()
     order by a.start_time asc
     limit 5`
  );

  const recentCalls = await query(
    `select c.*, ct.first_name, ct.last_name
     from calls c
     left join contacts ct on ct.id = c.contact_id
     order by c.created_at desc
     limit 5`
  );

  return NextResponse.json({ totals, upcoming, recentCalls });
}

import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("APPOINTMENT BODY:", body);

    if (!body.contact_id || !body.start_time || !body.end_time) {
      return NextResponse.json(
        {
          error: "contact_id, start_time and end_time are required",
        },
        {
          status: 400,
        }
      );
    }

    const startTimePKT = new Date(`${body.start_time}+05:00`);
const endTimePKT = new Date(`${body.end_time}+05:00`);
    const appointment = await queryOne(
      `
      insert into appointments
      (
        contact_id,
        title,
        start_time,
        end_time,
        status
      )
      values
      (
        $1,
        $2,
        $3,
        $4,
        $5
      )
      returning *
      `,
      [
  body.contact_id,
  body.title ?? "AI Discovery Call",
  startTimePKT.toISOString(),
  endTimePKT.toISOString(),
  "confirmed",
]
    );

    await queryOne(
      `
      update contacts
      set stage = 'booked',
          updated_at = now()
      where id = $1
      returning *
      `,
      [body.contact_id]
    );

    return NextResponse.json({
      success: true,
      appointment,
    });

  } catch (error: any) {
    console.error("APPOINTMENT CREATE ERROR:", error);

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
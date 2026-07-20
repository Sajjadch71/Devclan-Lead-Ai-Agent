import { NextRequest, NextResponse } from "next/server";
import { ghlRequest } from "@/lib/ghl";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const appointment = await ghlRequest("/calendars/events", {
      method: "POST",
      body: JSON.stringify({
        calendarId: process.env.GHL_CALENDAR_ID,
        locationId: process.env.GHL_LOCATION_ID,
        contactId: body.contact_id,
        title: body.title ?? "AI Discovery Call",
        startTime: body.start_time,
        endTime: body.end_time,
        status: "confirmed",
      }),
    });

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error: any) {
    console.error("GHL APPOINTMENT ERROR:", error);

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
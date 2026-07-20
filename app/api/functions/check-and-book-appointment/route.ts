import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getFreeSlots, isSlotAvailable } from "@/lib/availability";

// This is the endpoint URL you paste into Retell's Custom Function
// ("check_and_book_appointment"). Set it to:
// https://yourapp.vercel.app/api/functions/check-and-book-appointment?key=YOUR_SECRET

function checkSecret(req: NextRequest) {
  const expected = process.env.RETELL_FUNCTION_SECRET;
  if (!expected) return true;
  return req.nextUrl.searchParams.get("key") === expected;
}

const SLOT_MINUTES = 30;

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const args = body.args ?? {};
  const call = body.call ?? {};
  const selectedTime: string | undefined = args.selected_time;
  const phone: string | undefined =
    call.direction === "inbound" ? call.from_number : call.to_number;

  // ── No time chosen yet: return real available slots ──────────────
  if (!selectedTime) {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);

    const slots = await getFreeSlots(from, to);
    const preview = slots.slice(0, 8).map((s) => s.start);

    return NextResponse.json({
      available: true,
      timezone: process.env.DEFAULT_TIMEZONE ?? "Asia/Karachi",
      slots: preview,
      message:
        preview.length > 0
          ? "Here are some real available times. Offer 2-3 of these to the lead in a natural, conversational way."
          : "No availability found in the next 14 days. Let the lead know you'll follow up by email instead.",
    });
  }

  // ── A time was chosen: validate and book it for real ─────────────
  console.log("AI SELECTED TIME:", selectedTime);
  const startTime = new Date(selectedTime);
  if (isNaN(startTime.getTime())) {
    return NextResponse.json({
      success: false,
      message: "That time format wasn't understood. Please ask the lead to pick from the offered times again.",
    });
  }
  const endTime = new Date(startTime.getTime() + SLOT_MINUTES * 60 * 1000);

  const available = await isSlotAvailable(startTime.toISOString(), endTime.toISOString());
  if (!available) {
    return NextResponse.json({
      success: false,
      message:
        "That time is not available. Apologize and offer the lead a different time from the ones you already read out.",
    });
  }

  if (!phone) {
    return NextResponse.json({
      success: false,
      message: "No phone number on this call, could not book. Ask the lead for a callback number.",
    });
  }

  const contact = await queryOne<{ id: string }>(
    `insert into contacts (phone, source)
     values ($1, 'call')
     on conflict (phone) do update set updated_at = now()
     returning id`,
    [phone]
  );

  const appointment = await queryOne<{ id: string }>(
    `insert into appointments (contact_id, title, start_time, end_time, status)
     values ($1, 'Discovery Call', $2, $3, 'confirmed')
     returning id`,
    [contact?.id ?? null, startTime.toISOString(), endTime.toISOString()]
  );

  if (contact?.id) {
    await query(`update contacts set stage = 'booked', updated_at = now() where id = $1`, [
      contact.id,
    ]);
  }

  return NextResponse.json({
    success: true,
    appointment_id: appointment?.id,
    start_time: startTime.toISOString(),
    message: `Booked for ${startTime.toLocaleString()}. Confirm this back to the lead clearly.`,
  });
}

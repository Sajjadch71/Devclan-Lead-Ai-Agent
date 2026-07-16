import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

// Retell posts here for call_started / call_ended / call_analyzed events.
// Set this exact URL (with your secret) as the Agent-Level Webhook URL
// in Retell: https://yourapp.vercel.app/api/webhooks/retell?key=YOUR_SECRET

function checkSecret(req: NextRequest) {
  const expected = process.env.RETELL_FUNCTION_SECRET;
  if (!expected) return true; // no secret configured yet — allow (set one before going live)
  return req.nextUrl.searchParams.get("key") === expected;
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.event || !body.call) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const { event, call } = body;

  // Only act once analysis is ready — call_started / call_ended are noisy.
  if (event !== "call_analyzed") {
    return NextResponse.json({ ok: true, skipped: event });
  }

  const phone: string | undefined =
    call.direction === "inbound" ? call.from_number : call.to_number;

  let contactId: string | null = null;

  if (phone) {
    const contact = await queryOne<{ id: string }>(
      `insert into contacts (phone, source)
       values ($1, 'call')
       on conflict (phone) do update set updated_at = now()
       returning id`,
      [phone]
    );
    contactId = contact?.id ?? null;
  }

  const analysis = call.call_analysis ?? {};
  const custom = analysis.custom_analysis_data ?? {};

  const optedOut = Boolean(custom.opted_out);
  if (contactId && optedOut) {
    await query(
      `update contacts set opted_out = true, updated_at = now() where id = $1`,
      [contactId]
    );
  }

  // Move the contact's pipeline stage based on the outcome.
  if (contactId && custom.call_outcome) {
    const stage =
      custom.call_outcome === "Booked"
        ? "booked"
        : custom.call_outcome === "Not Interested"
        ? "lost"
        : "attempted";
    await query(`update contacts set stage = $1, updated_at = now() where id = $2`, [
      stage,
      contactId,
    ]);
  }

  await query(
    `insert into calls (
       contact_id, retell_call_id, direction, from_number, to_number,
       status, disconnection_reason, duration_seconds, transcript,
       call_summary, call_successful, user_sentiment, interest_level,
       call_outcome, objections, budget_mentioned, opted_out,
       recording_url, raw_payload, started_at, ended_at
     ) values (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
     )
     on conflict (retell_call_id) do update set
       status = excluded.status,
       disconnection_reason = excluded.disconnection_reason,
       duration_seconds = excluded.duration_seconds,
       transcript = excluded.transcript,
       call_summary = excluded.call_summary,
       call_successful = excluded.call_successful,
       user_sentiment = excluded.user_sentiment,
       interest_level = excluded.interest_level,
       call_outcome = excluded.call_outcome,
       objections = excluded.objections,
       budget_mentioned = excluded.budget_mentioned,
       opted_out = excluded.opted_out,
       recording_url = excluded.recording_url,
       raw_payload = excluded.raw_payload,
       ended_at = excluded.ended_at`,
    [
      contactId,
      call.call_id,
      call.direction ?? "outbound",
      call.from_number ?? null,
      call.to_number ?? null,
      call.call_status ?? "ended",
      call.disconnection_reason ?? null,
      call.start_timestamp && call.end_timestamp
        ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
        : null,
      call.transcript ?? null,
      analysis.call_summary ?? null,
      typeof analysis.call_successful === "boolean" ? analysis.call_successful : null,
      analysis.user_sentiment ?? null,
      custom.interest_level ?? null,
      custom.call_outcome ?? null,
      custom.objections ?? null,
      custom.budget_mentioned ?? null,
      optedOut,
      call.recording_url ?? null,
      JSON.stringify(body),
      call.start_timestamp ? new Date(call.start_timestamp) : null,
      call.end_timestamp ? new Date(call.end_timestamp) : null,
    ]
  );

  return NextResponse.json({ ok: true });
}

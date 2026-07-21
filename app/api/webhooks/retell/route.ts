import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

// Retell posts here for call_started / call_ended / call_analyzed / call_failed
// events. Set this exact URL (with your secret) as the Agent-Level Webhook URL
// in Retell: https://yourapp.vercel.app/api/webhooks/retell?key=YOUR_SECRET

function checkSecret(req: NextRequest) {
  const expected = process.env.RETELL_FUNCTION_SECRET;
  if (!expected) return true; // no secret configured yet — allow (set one before going live)
  return req.nextUrl.searchParams.get("key") === expected;
}

function leadPhoneFor(call: any): string | undefined {
  return call.direction === "inbound" ? call.from_number : call.to_number;
}

/** Ensures a contact exists for the lead's phone number, returning its id. */
async function upsertContactForCall(call: any): Promise<string | null> {
  const phone = leadPhoneFor(call);
  if (!phone) return null;

  const contact = await queryOne<{ id: string }>(
    `insert into contacts (phone, source)
     values ($1, 'call')
     on conflict (phone) do update set updated_at = now()
     returning id`,
    [phone]
  );
  return contact?.id ?? null;
}

type CallFields = {
  contact_id: string | null;
  agent_id: string | null;
  direction: string;
  from_number: string | null;
  to_number: string | null;
  status: string | null;
  disconnection_reason: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  call_summary: string | null;
  call_successful: boolean | null;
  user_sentiment: string | null;
  interest_level: string | null;
  call_outcome: string | null;
  objections: string | null;
  budget_mentioned: string | null;
  opted_out: boolean;
  recording_url: string | null;
  raw_payload: unknown;
  started_at: Date | null;
  ended_at: Date | null;
};

/**
 * Upserts a calls row keyed on retell_call_id. A call fires several events
 * over its lifecycle (started -> ended -> analyzed, occasionally failed) that
 * each know a different subset of fields — most columns keep whatever value
 * is already stored if the incoming event doesn't have a newer one, so an
 * earlier event's data is never clobbered by a later, less-detailed one.
 */
async function upsertCall(retellCallId: string, f: CallFields) {
  return queryOne<{ id: string }>(
    `insert into calls (
       contact_id, retell_call_id, agent_id, direction, from_number, to_number,
       status, disconnection_reason, duration_seconds, transcript, call_summary,
       call_successful, user_sentiment, interest_level, call_outcome, objections,
       budget_mentioned, opted_out, recording_url, raw_payload, started_at, ended_at,
       updated_at
     ) values (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
       now()
     )
     on conflict (retell_call_id) do update set
       contact_id = coalesce(excluded.contact_id, calls.contact_id),
       agent_id = coalesce(excluded.agent_id, calls.agent_id),
       direction = coalesce(excluded.direction, calls.direction),
       from_number = coalesce(excluded.from_number, calls.from_number),
       to_number = coalesce(excluded.to_number, calls.to_number),
       status = coalesce(excluded.status, calls.status),
       disconnection_reason = coalesce(excluded.disconnection_reason, calls.disconnection_reason),
       duration_seconds = coalesce(excluded.duration_seconds, calls.duration_seconds),
       transcript = coalesce(excluded.transcript, calls.transcript),
       call_summary = coalesce(excluded.call_summary, calls.call_summary),
       call_successful = coalesce(excluded.call_successful, calls.call_successful),
       user_sentiment = coalesce(excluded.user_sentiment, calls.user_sentiment),
       interest_level = coalesce(excluded.interest_level, calls.interest_level),
       call_outcome = coalesce(excluded.call_outcome, calls.call_outcome),
       objections = coalesce(excluded.objections, calls.objections),
       budget_mentioned = coalesce(excluded.budget_mentioned, calls.budget_mentioned),
       opted_out = excluded.opted_out or calls.opted_out,
       recording_url = coalesce(excluded.recording_url, calls.recording_url),
       raw_payload = excluded.raw_payload,
       started_at = coalesce(calls.started_at, excluded.started_at),
       ended_at = coalesce(excluded.ended_at, calls.ended_at),
       updated_at = now()
     returning id`,
    [
      f.contact_id,
      retellCallId,
      f.agent_id,
      f.direction,
      f.from_number,
      f.to_number,
      f.status,
      f.disconnection_reason,
      f.duration_seconds,
      f.transcript,
      f.call_summary,
      f.call_successful,
      f.user_sentiment,
      f.interest_level,
      f.call_outcome,
      f.objections,
      f.budget_mentioned,
      f.opted_out,
      f.recording_url,
      JSON.stringify(f.raw_payload),
      f.started_at,
      f.ended_at,
    ]
  );
}

function durationFromTimestamps(call: any): number | null {
  return call.start_timestamp && call.end_timestamp
    ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
    : null;
}

async function handleCallStarted(call: any, body: unknown) {
  const contactId = await upsertContactForCall(call);
  await upsertCall(call.call_id, {
    contact_id: contactId,
    agent_id: call.agent_id ?? null,
    direction: call.direction ?? "outbound",
    from_number: call.from_number ?? null,
    to_number: call.to_number ?? null,
    status: "ongoing",
    disconnection_reason: null,
    duration_seconds: null,
    transcript: null,
    call_summary: null,
    call_successful: null,
    user_sentiment: null,
    interest_level: null,
    call_outcome: null,
    objections: null,
    budget_mentioned: null,
    opted_out: false,
    recording_url: null,
    raw_payload: body,
    started_at: call.start_timestamp ? new Date(call.start_timestamp) : new Date(),
    ended_at: null,
  });
}

async function handleCallEnded(call: any, body: unknown) {
  const contactId = await upsertContactForCall(call);
  await upsertCall(call.call_id, {
    contact_id: contactId,
    agent_id: call.agent_id ?? null,
    direction: call.direction ?? "outbound",
    from_number: call.from_number ?? null,
    to_number: call.to_number ?? null,
    status: call.call_status ?? "ended",
    disconnection_reason: call.disconnection_reason ?? null,
    duration_seconds: durationFromTimestamps(call),
    transcript: call.transcript ?? null,
    call_summary: null,
    call_successful: null,
    user_sentiment: null,
    interest_level: null,
    call_outcome: null,
    objections: null,
    budget_mentioned: null,
    opted_out: false,
    recording_url: call.recording_url ?? null,
    raw_payload: body,
    started_at: call.start_timestamp ? new Date(call.start_timestamp) : null,
    ended_at: call.end_timestamp ? new Date(call.end_timestamp) : new Date(),
  });
}

async function handleCallAnalyzed(call: any, body: unknown) {
  const contactId = await upsertContactForCall(call);

  const analysis = call.call_analysis ?? {};
  const custom = analysis.custom_analysis_data ?? {};
  const optedOut = Boolean(custom.opted_out);

  await upsertCall(call.call_id, {
    contact_id: contactId,
    agent_id: call.agent_id ?? null,
    direction: call.direction ?? "outbound",
    from_number: call.from_number ?? null,
    to_number: call.to_number ?? null,
    status: call.call_status ?? "ended",
    disconnection_reason: call.disconnection_reason ?? null,
    duration_seconds: durationFromTimestamps(call),
    transcript: call.transcript ?? null,
    call_summary: analysis.call_summary ?? null,
    call_successful: typeof analysis.call_successful === "boolean" ? analysis.call_successful : null,
    user_sentiment: analysis.user_sentiment ?? null,
    interest_level: custom.interest_level ?? null,
    call_outcome: custom.call_outcome ?? null,
    objections: custom.objections ?? null,
    budget_mentioned: custom.budget_mentioned ?? null,
    opted_out: optedOut,
    recording_url: call.recording_url ?? null,
    raw_payload: body,
    started_at: call.start_timestamp ? new Date(call.start_timestamp) : null,
    ended_at: call.end_timestamp ? new Date(call.end_timestamp) : null,
  });

  // Appointments are booked during the call via the Retell custom function
  // (/api/functions/check-and-book-appointment), which checks real
  // availability. The webhook only reflects the outcome onto the contact —
  // it must not create appointments itself.
  if (contactId) {
    if (optedOut) {
      await query(`update contacts set opted_out = true, updated_at = now() where id = $1`, [contactId]);
    }
    if (custom.call_outcome) {
      const stage =
        custom.call_outcome === "Booked"
          ? "booked"
          : custom.call_outcome === "Not Interested"
          ? "lost"
          : "attempted";
      await query(`update contacts set stage = $1, updated_at = now() where id = $2`, [stage, contactId]);
    }
  }
}

async function handleCallFailed(call: any, body: unknown) {
  const contactId = await upsertContactForCall(call);
  await upsertCall(call.call_id, {
    contact_id: contactId,
    agent_id: call.agent_id ?? null,
    direction: call.direction ?? "outbound",
    from_number: call.from_number ?? null,
    to_number: call.to_number ?? null,
    status: "error",
    disconnection_reason: call.disconnection_reason ?? "call_failed",
    duration_seconds: null,
    transcript: null,
    call_summary: null,
    call_successful: false,
    user_sentiment: null,
    interest_level: null,
    call_outcome: null,
    objections: null,
    budget_mentioned: null,
    opted_out: false,
    recording_url: null,
    raw_payload: body,
    started_at: null,
    ended_at: new Date(),
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!checkSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.event || !body?.call?.call_id) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { event, call } = body;

    switch (event) {
      case "call_started":
        await handleCallStarted(call, body);
        break;
      case "call_ended":
        await handleCallEnded(call, body);
        break;
      case "call_analyzed":
        await handleCallAnalyzed(call, body);
        break;
      case "call_failed":
        await handleCallFailed(call, body);
        break;
      default:
        return NextResponse.json({ ok: true, skipped: event });
    }

    return NextResponse.json({ ok: true, event });
  } catch (error: any) {
    console.error("RETELL WEBHOOK ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
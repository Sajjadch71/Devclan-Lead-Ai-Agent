import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { contactId } = await req.json();

  if (!contactId) {
    return NextResponse.json({ error: "contactId is required" }, { status: 400 });
  }

  const apiKey = process.env.RETELL_API_KEY;
  const fromNumber = process.env.RETELL_FROM_NUMBER;
  if (!apiKey || !fromNumber) {
    return NextResponse.json(
      { error: "RETELL_API_KEY / RETELL_FROM_NUMBER not configured" },
      { status: 500 }
    );
  }

  const contact = await queryOne<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string;
    company: string | null;
    opted_out: boolean;
  }>(`select id, first_name, last_name, phone, company, opted_out from contacts where id = $1`, [
    contactId,
  ]);

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  if (contact.opted_out) {
    return NextResponse.json(
      { error: "This contact has opted out and cannot be called." },
      { status: 400 }
    );
  }

  const retellRes = await fetch("https://api.retellai.com/v2/create-phone-call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from_number: fromNumber,
      to_number: contact.phone,
      retell_llm_dynamic_variables: {
        lead_name: contact.first_name ?? "there",
        company_name: contact.company ?? "",
      },
    }),
  });

  const data = await retellRes.json();

  if (!retellRes.ok) {
    return NextResponse.json({ error: data }, { status: retellRes.status });
  }

  return NextResponse.json({ ok: true, call: data });
}

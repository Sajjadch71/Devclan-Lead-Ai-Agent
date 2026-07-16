import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q")?.trim();
  const stage = req.nextUrl.searchParams.get("stage")?.trim();

  const conditions: string[] = [];
  const params: any[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(first_name ilike $${params.length} or last_name ilike $${params.length} or phone ilike $${params.length} or company ilike $${params.length})`
    );
  }
  if (stage) {
    params.push(stage);
    conditions.push(`stage = $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const contacts = await query(
    `select * from contacts ${where} order by created_at desc limit 200`,
    params
  );

  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const { first_name, last_name, phone, email, company, source, tags } = await req.json();

  if (!phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const contact = await queryOne(
    `insert into contacts (first_name, last_name, phone, email, company, source, tags)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (phone) do update set
       first_name = coalesce(excluded.first_name, contacts.first_name),
       last_name = coalesce(excluded.last_name, contacts.last_name),
       email = coalesce(excluded.email, contacts.email),
       company = coalesce(excluded.company, contacts.company),
       updated_at = now()
     returning *`,
    [
      first_name ?? null,
      last_name ?? null,
      phone,
      email ?? null,
      company ?? null,
      source ?? "manual",
      tags ?? [],
    ]
  );

  return NextResponse.json({ contact });
}

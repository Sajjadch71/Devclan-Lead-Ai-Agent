import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contact = await queryOne(`select * from contacts where id = $1`, [id]);
  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const calls = await query(
    `select * from calls where contact_id = $1 order by created_at desc`,
    [id]
  );
  const appointments = await query(
    `select * from appointments where contact_id = $1 order by start_time desc`,
    [id]
  );

  return NextResponse.json({ contact, calls, appointments });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowed = [
    "first_name",
    "last_name",
    "phone",
    "email",
    "company",
    "stage",
    "opted_out",
    "tags",
    "notes",
  ];
  const sets: string[] = [];
  const values: any[] = [];

  for (const key of allowed) {
    if (key in body) {
      values.push(body[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  values.push(id);
  try {
    const contact = await queryOne(
      `update contacts set ${sets.join(", ")}, updated_at = now() where id = $${values.length} returning *`,
      values
    );
    return NextResponse.json({ contact });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A contact with this phone number already exists." },
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await query(`delete from contacts where id = $1`, [id]);
  return NextResponse.json({ ok: true });
}

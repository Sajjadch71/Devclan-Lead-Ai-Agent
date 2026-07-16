import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, notes } = await req.json();

  const appointment = await queryOne(
    `update appointments set
       status = coalesce($1, status),
       notes = coalesce($2, notes)
     where id = $3
     returning *`,
    [status ?? null, notes ?? null, id]
  );

  return NextResponse.json({ appointment });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await query(`delete from appointments where id = $1`, [id]);
  return NextResponse.json({ ok: true });
}

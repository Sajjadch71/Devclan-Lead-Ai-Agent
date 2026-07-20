import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q")?.trim();
  const stage = req.nextUrl.searchParams.get("stage")?.trim();

  const params: any[] = [];
  const where: string[] = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(
      `(first_name ilike $${params.length} 
      or last_name ilike $${params.length} 
      or phone ilike $${params.length} 
      or company ilike $${params.length} 
      or email ilike $${params.length})`
    );
  }

  if (stage) {
    params.push(stage);
    where.push(`stage = $${params.length}`);
  }

  const contacts = await query(
    `select * from contacts
     ${where.length ? `where ${where.join(" and ")}` : ""}
     order by created_at desc`,
    params
  );

  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.phone || !String(body.phone).trim()) {
    return NextResponse.json(
      { error: "Phone is required." },
      { status: 400 }
    );
  }

  try {
    const tags = Array.isArray(body.tags)
      ? body.tags
      : body.tags
      ? [body.tags]
      : [];

    const contact = await queryOne(
      `insert into contacts 
      (
        first_name,
        last_name,
        phone,
        email,
        company,
        stage,
        tags,
        notes
      )
      values 
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        coalesce($6, 'new'),
        $7::text[],
        $8
      )
      returning *`,
      [
        body.first_name || null,
        body.last_name || null,
        String(body.phone).trim(),
        body.email || null,
        body.company || null,
        body.stage || null,
        tags,
        body.notes || null,
      ]
    );

    return NextResponse.json({ contact });

  } catch (error: any) {
    console.error("CONTACT CREATE ERROR:", error);

    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: "A contact with this phone number already exists."
        },
        {
          status: 409
        }
      );
    }

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}
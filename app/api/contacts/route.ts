import { NextRequest, NextResponse } from "next/server";
import { ghlRequest } from "@/lib/ghl";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q")?.trim();

  const data = await ghlRequest(
    `/contacts/?locationId=${process.env.GHL_LOCATION_ID}`
  );

  let contacts = data.contacts || [];

  if (search) {
    contacts = contacts.filter((c: any) =>
      `${c.firstName} ${c.lastName} ${c.phone} ${c.companyName}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }

  return NextResponse.json({ contacts });
}


export async function POST(req: NextRequest) {
  const body = await req.json();

  const contact = await ghlRequest(
    `/contacts/`,
    {
      method: "POST",
      body: JSON.stringify({
        locationId: process.env.GHL_LOCATION_ID,
        firstName: body.first_name,
        lastName: body.last_name,
        phone: body.phone,
        email: body.email,
        companyName: body.company,
        tags: body.tags || [],
      }),
    }
  );

  return NextResponse.json({ contact });
}
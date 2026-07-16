import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  const adminEmail = process.env.ADMIN_EMAIL;

  console.log("AUTH CHECK:", {
    email: process.env.ADMIN_EMAIL,
  });

  if (!adminEmail) {
    return NextResponse.json(
      { error: "Server is not configured yet (missing ADMIN_EMAIL)." },
      { status: 500 }
    );
  }

  if (
    typeof email !== "string" ||
    email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Invalid email." },
      { status: 401 }
    );
  }

  const token = await createSessionToken(adminEmail);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
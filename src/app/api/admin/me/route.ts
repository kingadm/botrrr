import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  return NextResponse.json({ ok: Boolean(token) });
}

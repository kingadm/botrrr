import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies();

  cookieStore.set(cookieName, "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}

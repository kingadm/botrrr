import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const key = String(body?.key ?? "");

  const master = process.env.MASTER_ADMIN_KEY ?? "";
  if (!master || key !== master) {
    return NextResponse.json({ error: "invalid_key" }, { status: 401 });
  }

  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies();

  // sessão simples (MVP)
  cookieStore.set(cookieName, "ok", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // secure: true, // ative em produção com https
  });

  return NextResponse.json({ ok: true });
}

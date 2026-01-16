import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteLicense, getLicenseDetail } from "@/lib/store";

async function requireAuth(req?: Request) {
  // ✅ opcional: permite testar via curl/PowerShell
  const master = process.env.MASTER_ADMIN_KEY;
  const headerKey = req?.headers.get("x-admin-key");
  if (master && headerKey && headerKey === master) return true;

  // ✅ Next novo: cookies() é async
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  return Boolean(token);
}

export async function GET(req: Request, context: { params: { id: string } }) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = context.params.id;

  const detail = await getLicenseDetail(id);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // frontend espera receber o LicenseDetail direto
  return NextResponse.json(detail);
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = context.params.id;

  const done = await deleteLicense(id);
  if (!done) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

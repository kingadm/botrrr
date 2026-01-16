import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteLicense, getLicenseDetail } from "@/lib/store";

async function requireAuth(req?: Request) {
  // opcional: permite header no deploy/testes
  const master = process.env.MASTER_ADMIN_KEY;
  const headerKey = req?.headers.get("x-admin-key");
  if (master && headerKey && headerKey === master) return true;

  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies(); // ✅ Next novo
  const token = cookieStore.get(cookieName)?.value;
  return Boolean(token);
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: Ctx) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const detail = await getLicenseDetail(id);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(detail);
}

export async function DELETE(req: Request, context: Ctx) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const done = await deleteLicense(id);
  if (!done) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

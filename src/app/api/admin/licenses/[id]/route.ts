import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteLicense, getLicenseDetail } from "@/lib/store";

async function requireAuth() {
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(cookieName)?.value);
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const detail = getLicenseDetail(id);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(detail);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const ok = deleteLicense(id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

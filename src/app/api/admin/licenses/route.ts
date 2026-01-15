import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createLicense, listLicenses } from "@/lib/store";

async function requireAuth() {
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(cookieName)?.value);
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(listLicenses());
}

export async function POST(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = (body?.plan === "pro" ? "pro" : "basic") as "basic" | "pro";
  const duration_days = Number(body?.duration_days ?? 30);

  const lic = createLicense({
    plan,
    duration_days: Number.isFinite(duration_days) && duration_days > 0 ? duration_days : 30,
  });

  return NextResponse.json(lic, { status: 201 });
}

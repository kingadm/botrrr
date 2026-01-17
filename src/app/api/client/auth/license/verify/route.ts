import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const key = body?.key;
    const hwid = body?.hwid;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ ok: false, reason: "missing_key" }, { status: 400, headers: CORS_HEADERS });
    }
    if (!hwid || typeof hwid !== "string") {
      return NextResponse.json({ ok: false, reason: "missing_hwid" }, { status: 400, headers: CORS_HEADERS });
    }

    const license = await prisma.license.findFirst({
      where: { key },
      select: {
        id: true,
        banned: true,
        hwid: true,
        // se você já criou as colunas no Neon:
        plan: true,
        expiresAt: true,
      },
    });

    if (!license) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404, headers: CORS_HEADERS });
    if (license.banned) return NextResponse.json({ ok: false, reason: "banned" }, { status: 403, headers: CORS_HEADERS });

    // bind HWID
    if (!license.hwid) {
      await prisma.license.update({ where: { id: license.id }, data: { hwid } });
    } else if (license.hwid !== hwid) {
      return NextResponse.json({ ok: false, reason: "hwid_mismatch" }, { status: 403, headers: CORS_HEADERS });
    }

    // expiração real
    const exp = new Date((license as any).expiresAt).getTime();
    if (!Number.isFinite(exp) || exp <= Date.now()) {
      return NextResponse.json({ ok: false, reason: "expired" }, { status: 403, headers: CORS_HEADERS });
    }

    return NextResponse.json(
      {
        ok: true,
        license_id: license.id,
        plan: (license as any).plan ?? "basic",
        expiresAt: new Date((license as any).expiresAt).toISOString(),
        device_name: "PC",
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("verify route error:", err);
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500, headers: CORS_HEADERS });
  }
}

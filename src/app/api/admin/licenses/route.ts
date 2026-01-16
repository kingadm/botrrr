import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listLicenses } from "@/lib/store";
import { prisma } from "@/lib/prisma";

function randomKey(opts?: { prefix?: string; groups?: number; groupLen?: number }) {
  const prefix = opts?.prefix ?? "VINNY";
  const groups = opts?.groups ?? 5; // VINNY-XXXX-XXXX-XXXX-XXXX
  const groupLen = opts?.groupLen ?? 4;

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O e 1/I
  const total = groups * groupLen;

  const bytes = new Uint8Array(total);
  crypto.getRandomValues(bytes);

  let raw = "";
  for (let i = 0; i < total; i++) raw += alphabet[bytes[i] % alphabet.length];

  const parts = raw.match(new RegExp(`.{1,${groupLen}}`, "g")) ?? [raw];
  return `${prefix}-${parts.join("-")}`;
}

async function requireAuth(req?: Request) {
  // ✅ Permite testar via curl/PowerShell com header
  const master = process.env.MASTER_ADMIN_KEY;
  const headerKey = req?.headers.get("x-admin-key");
  if (master && headerKey && headerKey === master) return true;

  // ✅ Compat com seu frontend (cookie)
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  return Boolean(token);
}

export async function GET(req: Request) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // frontend espera ARRAY direto
  const items = await listLicenses();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({} as any));

    const plan = (body?.plan ?? "basic") as "basic" | "pro";

    let expiresAt: Date;

    if (body?.expires_at) {
      const d = new Date(String(body.expires_at));
      expiresAt = Number.isNaN(d.getTime()) ? new Date(Date.now() + 30 * 86400000) : d;
    } else if (body?.duration_days) {
      const days = Number(body.duration_days);
      expiresAt =
        Number.isFinite(days) && days > 0
          ? new Date(Date.now() + days * 86400000)
          : new Date(Date.now() + 30 * 86400000);
    } else {
      expiresAt = new Date(Date.now() + 30 * 86400000);
    }

    const lic = await prisma.license.create({
      data: {
        key: randomKey({ prefix: plan.toUpperCase() }),
        plan,
        banned: false,
        expiresAt,
        hwid: null,
      },
    });

    return NextResponse.json({
      id: lic.id,
      key: lic.key,
      plan: (lic.plan ?? "basic") as "basic" | "pro",
      created_at: lic.createdAt.toISOString(),
      expires_at: lic.expiresAt?.toISOString() ?? expiresAt.toISOString(),
      max_devices: 1,
      is_banned: lic.banned,
      ban_reason: null,
      bound_hwid_hash: lic.hwid ?? null,
      last_seen_at: null,
    });
  } catch (e: any) {
    console.error("POST /api/admin/licenses failed:", e);
    return NextResponse.json(
      { error: "server_error", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

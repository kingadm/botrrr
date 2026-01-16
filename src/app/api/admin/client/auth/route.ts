import { NextResponse } from "next/server";
import { clientLoginByKey } from "@/lib/client_auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const key = String(body?.key ?? "");
  const hwid_hash = String(body?.hwid_hash ?? body?.hwid ?? "");
  const device_name = body?.device_name ? String(body.device_name) : null;

  const result = await clientLoginByKey({ key, hwid_hash, device_name });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    license_id: result.license_id,
    plan: result.plan,
    expiresAt: result.expiresAt,
  });
}

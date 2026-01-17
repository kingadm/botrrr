import { NextResponse } from "next/server";
import { clientLoginByKey } from "@/lib/client_auth";

export async function POST(req: Request) {
  let body: any;

  // ✅ Não engole erro de JSON
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // ✅ Normaliza e aceita variações de nome
  const key = String(body?.key ?? "").trim();
  const hwid_hash = String(body?.hwid_hash ?? body?.hwidHash ?? body?.hwid ?? "")
    .trim()
    .toLowerCase();
  const device_name = body?.device_name ? String(body.device_name).trim() : null;

  // ✅ Se estiver faltando, retorna direto
  if (!key || !hwid_hash) {
    return NextResponse.json(
      { error: "missing_fields", got: { key: Boolean(key), hwid_hash: Boolean(hwid_hash) } },
      { status: 400 }
    );
  }

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

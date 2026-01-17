import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const key = body?.key;
    const hwid = body?.hwid;

    // ✅ valida payload
    if (!key || typeof key !== "string") {
      return NextResponse.json({ ok: false, reason: "missing_key" }, { status: 400 });
    }
    if (!hwid || typeof hwid !== "string") {
      return NextResponse.json({ ok: false, reason: "missing_hwid" }, { status: 400 });
    }

    // ✅ busca a licença (somente campos que EXISTEM no seu schema)
    const license = await prisma.license.findFirst({
      where: { key },
      select: {
        id: true,
        banned: true,
        hwid: true,
      },
    });

    if (!license) {
      return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    }

    if (license.banned) {
      return NextResponse.json({ ok: false, reason: "banned" }, { status: 403 });
    }

    // ✅ HWID binding
    // 1) se ainda não tem hwid gravado: registra esse pc
    if (!license.hwid) {
      await prisma.license.update({
        where: { id: license.id },
        data: { hwid },
      });
    } else if (license.hwid !== hwid) {
      // 2) se já tem e é diferente: bloqueia
      return NextResponse.json({ ok: false, reason: "hwid_mismatch" }, { status: 403 });
    }

    // ✅ Como seu schema atual NÃO tem plan/expiresAt/device_name,
    // retornamos defaults só pro bootstrap mostrar algo.
    // Depois você adiciona esses campos no Prisma e troca aqui.
    return NextResponse.json(
      {
        ok: true,
        license_id: license.id,
        plan: "basic",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h default
        device_name: "PC",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("verify route error:", err);
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}

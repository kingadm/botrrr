import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function requireAuth(req?: Request) {
  // ✅ header (pra curl/PowerShell)
  const master = process.env.MASTER_ADMIN_KEY;
  const headerKey = req?.headers.get("x-admin-key");
  if (master && headerKey && headerKey === master) return true;

  // ✅ cookie (frontend)
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies(); // ✅ Next novo
  const token = cookieStore.get(cookieName)?.value;
  return Boolean(token);
}

function getIdFromUrl(req: Request) {
  // /api/admin/licenses/<id>/reset-devices
  const pathname = new URL(req.url).pathname;
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("licenses");
  return idx >= 0 ? parts[idx + 1] : null;
}

export async function POST(req: Request) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const id = getIdFromUrl(req);
    if (!id) {
      return NextResponse.json(
        { error: "bad_request", message: "Missing license id in URL" },
        { status: 400 }
      );
    }

    // “reset devices” no seu caso = limpar HWID/binding
    const lic = await prisma.license.update({
      where: { id },
      data: {
        hwid: null,
        // se você tiver campos extras tipo lastSeenAt, pode limpar também:
        // lastSeenAt: null,
      },
      select: {
        id: true,
        hwid: true,
      },
    });

    return NextResponse.json({
      ok: true,
      id: lic.id,
      bound_hwid_hash: lic.hwid ?? null,
    });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json(
        { error: "not_found", message: "License not found for this id" },
        { status: 404 }
      );
    }

    console.error("POST /api/admin/licenses/[id]/reset-devices failed:", e);
    return NextResponse.json(
      { error: "server_error", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

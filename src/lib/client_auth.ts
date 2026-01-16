import { prisma } from "./prisma";

export async function clientLoginByKey(params: {
  key: string;
  hwid_hash: string;
  device_name?: string | null;
}) {
  const key = params.key.trim();
  const hwid = params.hwid_hash.trim();

  if (!key || !hwid) {
    return { ok: false as const, status: 400, error: "missing_fields" as const };
  }

  const lic = await prisma.license.findUnique({
    where: { key },
  });

  if (!lic) {
    return { ok: false as const, status: 401, error: "invalid_key" as const };
  }

  if (lic.banned) {
    return { ok: false as const, status: 403, error: "banned" as const };
  }

  if (lic.expiresAt && new Date() > lic.expiresAt) {
    return { ok: false as const, status: 403, error: "expired" as const };
  }

  if (!lic.hwid) {
    await prisma.license.update({
      where: { id: lic.id },
      data: { hwid },
    });
  } else if (lic.hwid !== hwid) {
    await prisma.license.update({
      where: { id: lic.id },
      data: { banned: true },
    });

    return {
      ok: false as const,
      status: 403,
      error: "hwid_mismatch_banned" as const,
    };
  }

  return {
    ok: true as const,
    status: 200,
    license_id: lic.id,
    plan: lic.plan ?? null,
    expiresAt: lic.expiresAt ? lic.expiresAt.toISOString() : null,
  };
}

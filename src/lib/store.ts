import { prisma } from "./prisma";

function nowISO() {
  return new Date().toISOString();
}

function uid(prefix = "") {
  return prefix + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

type LogItem = {
  id: string;
  level: "info" | "warn" | "error";
  event: string;
  payload?: any;
  created_at: string;
};

const g = globalThis as any;
if (!g.__ADMIN_LOGS__) g.__ADMIN_LOGS__ = [] as LogItem[];
const logs: LogItem[] = g.__ADMIN_LOGS__;

export function addLog(level: LogItem["level"], event: string, payload?: any) {
  logs.unshift({ id: uid("log_"), level, event, payload, created_at: nowISO() });
  if (logs.length > 1000) logs.length = 1000;
}

export function listLogs(): LogItem[] {
  return logs;
}

function randomKey() {
  return "LIC-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

/**
 * ADMIN: cria licença com duração em dias (Prisma/Neon)
 */
export async function createLicense(input: { plan: "basic" | "pro"; duration_days: number }) {
  const days = Number.isFinite(input.duration_days) && input.duration_days > 0 ? input.duration_days : 30;
  const expiresAt = new Date(Date.now() + days * 86400000);

  const lic = await prisma.license.create({
    data: {
      key: randomKey(),
      plan: input.plan,
      banned: false,
      expiresAt,
      hwid: null,
    },
  });

  addLog("info", "license_created", { id: lic.id, key: lic.key, plan: lic.plan, duration_days: days });

  return {
    id: lic.id,
    key: lic.key,
    plan: (lic.plan ?? "basic") as "basic" | "pro",
    created_at: lic.createdAt.toISOString(),
    expires_at: lic.expiresAt ? lic.expiresAt.toISOString() : expiresAt.toISOString(),
    max_devices: 1,
    is_banned: lic.banned,
    ban_reason: null,
    bound_hwid_hash: lic.hwid ?? null,
    last_seen_at: null,
  };
}

/**
 * ADMIN: lista licenças (Prisma/Neon)
 */
export async function listLicenses() {
  const items = await prisma.license.findMany({
    orderBy: { createdAt: "desc" },
  });

  return items.map((l) => ({
    id: l.id,
    key: l.key,
    plan: (l.plan ?? "basic") as "basic" | "pro",
    created_at: l.createdAt.toISOString(),
    expires_at: l.expiresAt ? l.expiresAt.toISOString() : null,
    max_devices: 1,
    is_banned: l.banned,
    ban_reason: null,
    bound_hwid_hash: l.hwid ?? null,
    last_seen_at: null,
  }));
}

/**
 * ADMIN: detalhe licença (simples)
 */
export async function getLicenseDetail(id: string) {
  const lic = await prisma.license.findUnique({ where: { id } });
  if (!lic) return null;

  return {
    license: {
      id: lic.id,
      key: lic.key,
      plan: (lic.plan ?? "basic") as "basic" | "pro",
      created_at: lic.createdAt.toISOString(),
      expires_at: lic.expiresAt ? lic.expiresAt.toISOString() : null,
      max_devices: 1,
      is_banned: lic.banned,
      ban_reason: null,
      bound_hwid_hash: lic.hwid ?? null,
      last_seen_at: null,
    },
    devices: lic.hwid
      ? [
          {
            id: uid("dev_"),
            license_id: lic.id,
            hwid_hash: lic.hwid,
            device_name: null,
            created_at: lic.createdAt.toISOString(),
            last_seen_at: lic.updatedAt.toISOString(),
          },
        ]
      : [],
  };
}

export async function deleteLicense(id: string) {
  try {
    await prisma.license.delete({ where: { id } });
    addLog("warn", "license_deleted", { id });
    return true;
  } catch {
    return false;
  }
}

export async function setBan(id: string, banned: boolean) {
  const lic = await prisma.license.update({
    where: { id },
    data: { banned },
  });

  addLog("warn", banned ? "license_banned" : "license_unbanned", { id: lic.id, key: lic.key });
  return lic;
}

/**
 * ADMIN: resetar HWID (libera troca de PC)
 */
export async function resetHwid(id: string) {
  await prisma.license.update({
    where: { id },
    data: { hwid: null, banned: false },
  });

  addLog("warn", "license_hwid_reset", { id });
  return true;
}

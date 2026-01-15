import type { Device, License, LicenseDetail, LogItem } from "./types";
import { NextResponse } from "next/server";


function nowISO() {
  return new Date().toISOString();
}

function uid(prefix = "") {
  return prefix + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function randomKey() {
  return "LIC-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

type DB = {
  licenses: Record<string, License>;
  devices: Record<string, Device[]>;
  logs: LogItem[];
};

const g = globalThis as any;

if (!g.__ADMIN_DB__) {
  g.__ADMIN_DB__ = {
    licenses: {},
    devices: {},
    logs: [{ id: uid("log_"), level: "info", event: "admin_panel_boot", created_at: nowISO() }],
  } satisfies DB;
}

const db: DB = g.__ADMIN_DB__;

export function addLog(level: LogItem["level"], event: string, payload?: any) {
  db.logs.unshift({ id: uid("log_"), level, event, payload, created_at: nowISO() });
  db.logs = db.logs.slice(0, 1000);
}

export function listLogs(): LogItem[] {
  return db.logs;
}

export function listLicenses(): License[] {
  return Object.values(db.licenses).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

/**
 * ADMIN: cria licença com duração em dias
 */
export function createLicense(input: {
  plan: "basic" | "pro";
  duration_days: number;
}): License {
  const id = uid("lic_");
  const created_at = nowISO();

  const days = Number.isFinite(input.duration_days) && input.duration_days > 0 ? input.duration_days : 30;
  const expires_at = new Date(Date.now() + days * 86400000).toISOString();

  const lic: License = {
    id,
    key: randomKey(),
    plan: input.plan,
    created_at,
    expires_at,
    max_devices: 1,
    is_banned: false,
    ban_reason: null,
    bound_hwid_hash: null,
    last_seen_at: null,
  };

  db.licenses[id] = lic;
  db.devices[id] = [];
  addLog("info", "license_created", { id, key: lic.key, plan: lic.plan, duration_days: days });
  return lic;
}

export function getLicenseDetail(id: string): LicenseDetail | null {
  const lic = db.licenses[id];
  if (!lic) return null;
  return { license: lic, devices: db.devices[id] ?? [] };
}

export function deleteLicense(id: string): boolean {
  if (!db.licenses[id]) return false;
  delete db.licenses[id];
  delete db.devices[id];
  addLog("warn", "license_deleted", { id });
  return true;
}

export function setBan(id: string, banned: boolean): License | null {
  const lic = db.licenses[id];
  if (!lic) return null;
  lic.is_banned = banned;
  lic.ban_reason = banned ? (lic.ban_reason ?? "manual_ban") : null;
  addLog("warn", banned ? "license_banned" : "license_unbanned", { id, key: lic.key, reason: lic.ban_reason });
  return lic;
}

/**
 * ADMIN: resetar HWID (libera troca de PC)
 */
export function resetHwid(id: string): boolean {
  const lic = db.licenses[id];
  if (!lic) return false;

  lic.bound_hwid_hash = null;
  db.devices[id] = [];
  addLog("warn", "license_hwid_reset", { id, key: lic.key });
  return true;
}

/**
 * BOT: valida key + HWID
 * - primeiro HWID "gruda"
 * - se tentar outro HWID => ban automático
 * - se expirar => bloqueia
 */
export function clientLoginByKey(params: { key: string; hwid_hash: string; device_name?: string | null }) {
  const key = params.key.trim();
  const hwid = params.hwid_hash.trim();

  const lic = Object.values(db.licenses).find((l) => l.key === key);
  if (!lic) {
    addLog("warn", "client_login_invalid_key", { key });
    return { ok: false as const, status: 401, error: "invalid_key" as const };
  }

  if (lic.is_banned) {
    addLog("warn", "client_login_banned", { id: lic.id, key: lic.key, reason: lic.ban_reason });
    return { ok: false as const, status: 403, error: "banned" as const };
  }

  const exp = Date.parse(lic.expires_at);
  if (Number.isFinite(exp) && Date.now() > exp) {
    addLog("warn", "client_login_expired", { id: lic.id, key: lic.key, expires_at: lic.expires_at });
    return { ok: false as const, status: 403, error: "expired" as const };
  }

  // trava no primeiro HWID
  if (!lic.bound_hwid_hash) {
    lic.bound_hwid_hash = hwid;
    addLog("info", "license_bound_first_hwid", { id: lic.id, key: lic.key, hwid_hash: hwid });
  } else if (lic.bound_hwid_hash !== hwid) {
    lic.is_banned = true;
    lic.ban_reason = "hwid_mismatch";
    addLog("error", "license_auto_banned_hwid_mismatch", {
      id: lic.id,
      key: lic.key,
      expected: lic.bound_hwid_hash,
      got: hwid,
    });
    return { ok: false as const, status: 403, error: "hwid_mismatch_banned" as const };
  }

  // registra device (single device)
  const device: Device = {
    id: uid("dev_"),
    license_id: lic.id,
    hwid_hash: hwid,
    device_name: params.device_name ?? null,
    created_at: nowISO(),
    last_seen_at: nowISO(),
  };
  db.devices[lic.id] = [device];
  lic.last_seen_at = nowISO();

  addLog("info", "client_login_ok", { id: lic.id, key: lic.key });

  return { ok: true as const, status: 200, license_id: lic.id };
}

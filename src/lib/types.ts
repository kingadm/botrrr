export type License = {
  id: string;
  key: string;
  plan: "basic" | "pro";

  // Duração
  created_at: string;
  expires_at: string; // ISO

  // Segurança / binding
  max_devices: number;          // pra agora deixe 1
  is_banned: boolean;
  ban_reason?: string | null;

  // Single HWID (primeiro HWID que logar)
  bound_hwid_hash?: string | null;

  last_seen_at?: string | null;
};

export type Device = {
  id: string;
  license_id: string;
  hwid_hash: string;
  device_name?: string | null;
  last_seen_at?: string | null;
  created_at: string;
};

export type LogItem = {
  id: string;
  level: "info" | "warn" | "error";
  event: string;
  payload?: any;
  created_at: string;
};

export type LicenseDetail = {
  license: License;
  devices: Device[];
};

"use client";

import { useEffect, useState } from "react";
import type { LicenseDetail } from "@/lib/types";

export default function Page({ params }: { params: { id: string } }) {
  const [data, setData] = useState<LicenseDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const res = await fetch(`/api/admin/licenses/${params.id}`);
    if (!res.ok) {
      setErr("Não encontrado");
      return;
    }
    setData(await res.json());
  }

  async function act(path: string) {
    await fetch(path, { method: "POST" });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!data) return <p>Carregando...</p>;

  const { license, devices } = data;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>Licença</h1>

      <div style={{ border: "1px solid #ddd", padding: 12, marginTop: 12 }}>
        <div><b>Key:</b> {license.key}</div>
        <div><b>Plano:</b> {license.plan}</div>
        <div><b>Expira:</b> {new Date(license.expires_at).toLocaleString()}</div>
        <div><b>Max devices:</b> {license.max_devices}</div>
        <div><b>Status:</b> {license.is_banned ? "BANIDA" : "ATIVA"}</div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {license.is_banned ? (
            <button onClick={() => act(`/api/admin/licenses/${license.id}/unban`)}>Desbanir</button>
          ) : (
            <button onClick={() => act(`/api/admin/licenses/${license.id}/ban`)}>Banir</button>
          )}
          <button onClick={() => act(`/api/admin/licenses/${license.id}/reset-devices`)}>
            Reset HWID
          </button>
        </div>
      </div>

      <h2 style={{ marginTop: 18, fontWeight: 900 }}>Devices</h2>
      <div style={{ border: "1px solid #ddd", padding: 12, marginTop: 8 }}>
        {devices.length === 0 ? (
          <p>Nenhum device vinculado.</p>
        ) : (
          devices.map((d) => (
            <div key={d.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}>
              <div><b>HWID hash:</b> {d.hwid_hash}</div>
              <div><b>Last seen:</b> {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : "-"}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { License } from "@/lib/types";

export default function Page() {
  const [items, setItems] = useState<License[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const res = await fetch("/api/admin/licenses");
    if (!res.ok) {
      setErr("Falha ao carregar licenças");
      return;
    }
    setItems(await res.json());
  }

  async function act(path: string) {
    await fetch(path, { method: "POST" });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>Licenças</h1>
        <a href="/admin/licenses/new">+ Criar</a>
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Key</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Plano</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Expira</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Max Dev</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Status</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Ações</th>
          </tr>
        </thead>

        <tbody>
          {items.map((x) => (
            <tr key={x.id}>
              <td style={{ padding: 8 }}>
                <a href={`/admin/licenses/${x.id}`}>{x.key}</a>
              </td>
              <td style={{ padding: 8 }}>{x.plan}</td>
              <td style={{ padding: 8 }}>{new Date(x.expires_at).toLocaleString()}</td>
              <td style={{ padding: 8 }}>{x.max_devices}</td>
              <td style={{ padding: 8 }}>{x.is_banned ? "BANIDA" : "ATIVA"}</td>
              <td style={{ padding: 8, display: "flex", gap: 8 }}>
                {x.is_banned ? (
                  <button onClick={() => act(`/api/admin/licenses/${x.id}/unban`)}>Desbanir</button>
                ) : (
                  <button onClick={() => act(`/api/admin/licenses/${x.id}/ban`)}>Banir</button>
                )}
                <button onClick={() => act(`/api/admin/licenses/${x.id}/reset-devices`)}>
                  Reset HWID
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

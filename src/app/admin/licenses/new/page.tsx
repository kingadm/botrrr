"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const [plan, setPlan] = useState<"basic" | "pro">("basic");
  const [maxDevices, setMaxDevices] = useState(1);
  const [days, setDays] = useState(30);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setErr(null);
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

    const res = await fetch("/api/admin/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, max_devices: maxDevices, expires_at: expiresAt }),
    });

    if (!res.ok) {
      setErr("Falha ao criar");
      return;
    }
    router.push("/admin/licenses");
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>Criar Licença</h1>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <label>
          Plano:
          <select value={plan} onChange={(e) => setPlan(e.target.value as any)}>
            <option value="basic">basic</option>
            <option value="pro">pro</option>
          </select>
        </label>

        <label>
          Max devices:
          <input
            type="number"
            value={maxDevices}
            min={1}
            onChange={(e) => setMaxDevices(Number(e.target.value))}
          />
        </label>

        <label>
          Expira em (dias):
          <input
            type="number"
            value={days}
            min={1}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </label>

        <button onClick={create}>Criar</button>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </div>
    </div>
  );
}

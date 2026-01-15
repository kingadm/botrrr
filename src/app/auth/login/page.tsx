"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data?.error ?? "Falha no login");
        return;
      }

      router.push("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "90px auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900 }}>Admin Login</h1>
      <p style={{ opacity: 0.7 }}>Entre com a Master Key</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Master Key"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
    </div>
  );
}

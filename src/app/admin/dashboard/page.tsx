import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listLicenses, listLogs } from "@/lib/store";

async function requireAdmin() {
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies(); // ✅ Next novo
  const token = cookieStore.get(cookieName)?.value;
  return Boolean(token);
}

export default async function AdminDashboardPage() {
  const ok = await requireAdmin();
  if (!ok) redirect("/admin/login"); // ajuste a rota do seu login

  const licenses = await listLicenses();
  const logs = listLogs().slice(0, 10);

  const active = licenses.filter((l) => !l.is_banned).length;
  const banned = licenses.filter((l) => l.is_banned).length;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, minWidth: 160 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Licenças ativas</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{active}</div>
        </div>

        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, minWidth: 160 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Licenças banidas</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{banned}</div>
        </div>

        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, minWidth: 160 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Total</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{licenses.length}</div>
        </div>
      </div>

      <h2 style={{ marginTop: 28 }}>Últimos logs</h2>
      <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
        {logs.length ? (
          logs.map((l) => (
            <div
              key={l.id}
              style={{
                padding: 10,
                border: "1px solid #eee",
                borderRadius: 8,
                background: "#fafafa",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {l.created_at} • {String(l.level).toUpperCase()}
              </div>

              <div style={{ fontWeight: 600 }}>{l.event}</div>

              {l.payload ? (
                <pre style={{ marginTop: 6, fontSize: 12, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(l.payload, null, 2)}
                </pre>
              ) : null}
            </div>
          ))
        ) : (
          <div style={{ opacity: 0.7 }}>Sem logs ainda.</div>
        )}
      </div>
    </main>
  );
}

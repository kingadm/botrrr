import { listLicenses, listLogs } from "@/lib/store";

export default function Page() {
  const licenses = listLicenses();
  const logs = listLogs().slice(0, 10);

  const active = licenses.filter((l) => !l.is_banned).length;
  const banned = licenses.filter((l) => l.is_banned).length;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          Total Licenças: <b>{licenses.length}</b>
        </div>
        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          Ativas: <b>{active}</b>
        </div>
        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          Banidas: <b>{banned}</b>
        </div>
      </div>

      <h2 style={{ marginTop: 18, fontWeight: 800 }}>Últimos Logs</h2>

      <div style={{ border: "1px solid #ddd", padding: 12, marginTop: 8 }}>
        {logs.map((x) => (
          <div key={x.id} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
            <b>{x.level.toUpperCase()}</b> — {x.event}{" "}
            <span style={{ opacity: 0.6 }}>
              ({new Date(x.created_at).toLocaleString()})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

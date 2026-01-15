import { listLogs } from "@/lib/store";

export default function Page() {
  const logs = listLogs().slice(0, 200);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>Logs</h1>

      <div style={{ border: "1px solid #ddd", padding: 12, marginTop: 12 }}>
        {logs.map((x) => (
          <div key={x.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}>
            <div><b>{x.level.toUpperCase()}</b> — {x.event}</div>
            <div style={{ opacity: 0.7 }}>{new Date(x.created_at).toLocaleString()}</div>
            {x.payload ? (
              <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(x.payload, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

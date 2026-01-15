export default function Page() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>Config</h1>
      <p style={{ opacity: 0.7 }}>
        Aqui depois você edita config por licença (JSON de delay, features, etc).
      </p>

      <pre style={{ border: "1px solid #ddd", padding: 12, marginTop: 12 }}>
{`{
  "delay_mode": "random",
  "delay_random_min": 8,
  "delay_random_max": 15,
  "features": {
    "create_accounts": true,
    "withdraw": false
  }
}`}
      </pre>
    </div>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function logoutAction() {
  "use server";
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies();
  cookieStore.set(cookieName, "", { path: "/", maxAge: 0 });
  redirect("/auth/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? "admin_session";
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) redirect("/auth/login");

return (
  <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh", gap: 16, padding: 16 }}>
    <aside className="card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, marginBottom: 14, fontSize: 14, letterSpacing: 2, opacity: 0.8 }}>
        ADMIN PANEL
      </div>

      <nav style={{ display: "grid", gap: 10 }}>
        <a href="/admin/dashboard">Dashboard</a>
        <a href="/admin/licenses">Licenças</a>
        <a href="/admin/logs">Logs</a>
        <a href="/admin/config">Config</a>
      </nav>

      <form action={logoutAction} style={{ marginTop: 16 }}>
        <button type="submit" className="btn-danger">Sair</button>
      </form>
    </aside>

    <main className="card" style={{ padding: 20 }}>
      {children}
    </main>
  </div>
);

}

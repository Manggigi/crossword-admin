import { Outlet, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL("/api/admin/auth/me", request.url);
  const res = await fetch(url, {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
  });
  const data = await res.json().catch(() => ({ user: null }));
  if (!data.user) return redirect("/login");
  return null;
}

export default function AdminLayout() {
  const navigate = useNavigate();

  async function onSignOut() {
    await fetch("/api/admin/auth/sign_out", { method: "POST" });
    navigate("/login");
  }

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h1 style={{ marginRight: "auto" }}>Crossword Admin</h1>
        <button onClick={onSignOut}>Sign out</button>
      </header>
      <main style={{ marginTop: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}

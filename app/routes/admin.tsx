import { Outlet, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { Button } from "~/components/ui/button";

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
    <div className="p-4">
      <header className="flex items-center gap-3">
        <h1 className="mr-auto text-lg font-semibold">Crossword Admin</h1>
        <a href="/admin/daily/puzzles" className="text-sm text-gray-600 hover:underline">
          Daily Puzzles
        </a>
        <Button variant="outline" onClick={onSignOut}>
          Sign out
        </Button>
      </header>
      <main className="mt-4">
        <Outlet />
      </main>
    </div>
  );
}

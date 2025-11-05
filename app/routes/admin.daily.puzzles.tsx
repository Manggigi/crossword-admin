import type { LoaderFunctionArgs } from "react-router";
import { json, useLoaderData } from "react-router";

type Puzzle = { id: number; title: string; date: string; status: string; iconUrl: string | null };

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL("/api/puzzles/daily?limit=50", request.url);
  const res = await fetch(url);
  if (!res.ok) throw new Response("Failed to load puzzles", { status: 500 });
  const data = (await res.json()) as { puzzles: Puzzle[] };
  return json(data);
}

export default function AdminDailyPuzzlesPage() {
  const data = useLoaderData() as { puzzles: Puzzle[] };
  return (
    <div>
      <h2>Daily Puzzles</h2>
      <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Date</th>
            <th style={{ textAlign: "left", padding: 8 }}>Title</th>
            <th style={{ textAlign: "left", padding: 8 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.puzzles.map((p) => (
            <tr key={p.id}>
              <td style={{ padding: 8 }}>{p.date}</td>
              <td style={{ padding: 8 }}>{p.title}</td>
              <td style={{ padding: 8 }}>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}




import { useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useState } from "react";

type Puzzle = { id: number; title: string; date: string; description?: string | null; difficulty?: string | null };

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id as string;
  const res = await fetch(new URL(`/api/puzzles/${id}`, request.url));
  if (!res.ok) throw new Response("Not found", { status: 404 });
  const data = (await res.json()) as { puzzle: Puzzle };
  return data.puzzle;
}

export default function AdminPuzzleEdit() {
  const puzzle = useLoaderData() as Puzzle;
  const navigate = useNavigate();
  const [title, setTitle] = useState(puzzle.title);
  const [date, setDate] = useState(puzzle.date);
  const [description, setDescription] = useState(puzzle.description ?? "");
  const [difficulty, setDifficulty] = useState(puzzle.difficulty ?? "");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/puzzles/${puzzle.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, description, difficulty }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update");
      return;
    }
    navigate("/admin/daily/puzzles");
  }

  return (
    <div>
      <h2>Edit Puzzle</h2>
      <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <input value={date} onChange={(e) => setDate(e.target.value)} />
        <input value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
        <button type="submit">Save</button>
      </form>
    </div>
  );
}



import { useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type Puzzle = {
  id: number;
  title: string;
  date: string;
  description?: string | null;
  difficulty?: string | null;
};

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
      const data = (await res.json().catch(() => ({}))) as any;
      setError((data as any).error || "Failed to update");
      return;
    }
    navigate("/admin/daily/puzzles");
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Edit Puzzle</h2>
      <form onSubmit={onSubmit} className="mt-3 grid gap-2">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Difficulty</Label>
          <Input
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <textarea
            className="min-h-24 w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}

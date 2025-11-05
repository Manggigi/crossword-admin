import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function AdminPuzzleNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/puzzles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, description, difficulty }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as any;
      setError((data as any).error || "Failed to create");
      return;
    }
    navigate("/admin/daily/puzzles");
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">New Puzzle</h2>
      <form onSubmit={onSubmit} className="mt-3 grid gap-2">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input
            placeholder="YYYY-MM-DD"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Difficulty</Label>
          <Input
            placeholder="eg: easy"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <textarea
            className="min-h-24 w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-800"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}

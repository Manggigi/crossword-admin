import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "~/components/ui/table";

type Puzzle = {
  id: number;
  title: string;
  date: string;
  status: string;
  iconUrl: string | null;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL("/api/puzzles/daily?limit=50", request.url);
  const res = await fetch(url);
  if (!res.ok) throw new Response("Failed to load puzzles", { status: 500 });
  const data = (await res.json()) as { puzzles: Puzzle[] };
  return data;
}

export default function AdminDailyPuzzlesPage() {
  const data = useLoaderData() as { puzzles: Puzzle[] };
  return (
    <div>
      <div className="flex items-center">
        <h2 className="text-lg font-semibold">Daily Puzzles</h2>
        <a
          href="/admin/puzzles/new"
          className="ml-auto text-sm text-blue-600 hover:underline"
        >
          + New Puzzle
        </a>
      </div>
      <Table className="mt-3">
        <THead>
          <TR>
            <TH>Date</TH>
            <TH>Title</TH>
            <TH>Status</TH>
            <TH>Actions</TH>
          </TR>
        </THead>
        <TBody>
          {data.puzzles.map((p) => (
            <TR key={p.id}>
              <TD>{p.date}</TD>
              <TD>{p.title}</TD>
              <TD>{p.status}</TD>
              <TD className="space-x-2">
                <a
                  href={`/admin/puzzles/${p.id}/edit`}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </a>
                {p.status !== "published" ? (
                  <Button
                    className="h-8 px-3"
                    onClick={async () => {
                      await fetch(`/api/puzzles/${p.id}/publish`, {
                        method: "POST",
                      });
                      location.reload();
                    }}
                  >
                    Publish
                  </Button>
                ) : null}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

import { Hono } from "hono";
import { openapi } from "../../openapi";
import { z } from "zod";

const router = new Hono<{ Bindings: Env }>();

openapi.openapi(
  {
    method: "get",
    path: "/api/v1/puzzles/{id}/hints",
    request: {
      params: z.object({ id: z.string() }),
      query: z.object({ difficulty: z.string().optional() }),
    },
    responses: { 200: { description: "Hints list" } },
  },
  async (c) => {
    const id = c.req.param("id");
    const difficulty =
      new URL(c.req.url).searchParams.get("difficulty") || "easy";
    // Stub deterministic hints for now
    const hints = [
      {
        id: 1,
        content: `Hint for puzzle ${id} (${difficulty}) #1`,
        difficulty,
      },
      {
        id: 2,
        content: `Hint for puzzle ${id} (${difficulty}) #2`,
        difficulty,
      },
    ];
    c.header("Cache-Control", "public, max-age=30");
    return c.json({ hints });
  }
);

export default router;

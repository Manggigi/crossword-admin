import { Hono } from "hono";
import { getDb } from "../../db/client";
import { collections } from "../../db/schema";
import { openapi } from "../../openapi";
import { z } from "zod";
import { Collection } from "../../schemas/v1";
import { eq } from "drizzle-orm";

const router = new Hono<{ Bindings: Env }>();

openapi.openapi({
  method: "get",
  path: "/api/v1/collections/{id}",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Collection", content: { "application/json": { schema: Collection } } },
    404: { description: "Not found" },
  },
}, async (c) => {
  const id = Number(c.req.param("id"));
  const db = getDb(c.env);
  const rows = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  const col = rows[0];
  if (!col) return c.json({ error: "Not found" }, 404);
  c.header("Cache-Control", "public, max-age=60");
  return c.json(col);
});

export default router;



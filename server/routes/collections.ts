import { z } from "zod";
import { openapi } from "../openapi";
import { getDb } from "../db/client";
import { collections } from "../db/schema";
import { eq } from "drizzle-orm";

const Collection = z.object({ id: z.number(), name: z.string(), slug: z.string(), groupId: z.number().nullable() });

openapi.openapi({
  method: "get",
  path: "/api/collections/{id}",
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
  return c.json(col);
});



import { Hono } from "hono";
import { getDb } from "../../db/client";
import { groups, collections } from "../../db/schema";
import { openapi } from "../../openapi";
import { z } from "zod";
import { Group, Collection } from "../../schemas/v1";
import { eq } from "drizzle-orm";

const router = new Hono<{ Bindings: Env }>();

openapi.openapi({
  method: "get",
  path: "/api/v1/groups",
  request: {},
  responses: {
    200: {
      description: "List groups",
      content: { "application/json": { schema: z.object({ groups: z.array(Group) }) } },
    },
  },
}, async (c) => {
  const db = getDb(c.env);
  const rows = await db.select().from(groups);
  c.header("Cache-Control", "public, max-age=60");
  return c.json({ groups: rows });
});

openapi.openapi({
  method: "get",
  path: "/api/v1/groups/{id}/collections",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "List collections by group",
      content: { "application/json": { schema: z.object({ collections: z.array(Collection) }) } },
    },
  },
}, async (c) => {
  const id = Number(c.req.param("id"));
  const db = getDb(c.env);
  const rows = await db.select().from(collections).where(eq(collections.groupId, id));
  c.header("Cache-Control", "public, max-age=60");
  return c.json({ collections: rows });
});

export default router;



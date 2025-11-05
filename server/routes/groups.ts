import { z } from "zod";
import { openapi } from "../openapi";
import { getDb } from "../db/client";
import { groups, collections } from "../db/schema";
import { eq } from "drizzle-orm";

const Group = z.object({ id: z.number(), name: z.string(), slug: z.string() });
const GroupList = z.object({ groups: z.array(Group) });
const Collection = z.object({ id: z.number(), name: z.string(), slug: z.string(), groupId: z.number().nullable() });
const CollectionList = z.object({ collections: z.array(Collection) });

openapi.openapi({
  method: "get",
  path: "/api/groups",
  request: {},
  responses: {
    200: {
      description: "List groups",
      content: {
        "application/json": {
          schema: GroupList,
        },
      },
    },
  },
}, async (c) => {
  const db = getDb(c.env);
  const rows = await db.select().from(groups);
  return c.json({ groups: rows });
});

openapi.openapi({
  method: "get",
  path: "/api/groups/{id}/collections",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "List collections by group",
      content: { "application/json": { schema: CollectionList } },
    },
  },
}, async (c) => {
  const id = Number(c.req.param("id"));
  const db = getDb(c.env);
  const rows = await db.select().from(collections).where(eq(collections.groupId, id));
  return c.json({ collections: rows });
});



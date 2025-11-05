import { OpenAPIHono } from "@hono/zod-openapi";

export const openapi = new OpenAPIHono<{ Bindings: Env }>();

openapi.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Crossword Admin API",
    version: "0.1.0",
  },
});










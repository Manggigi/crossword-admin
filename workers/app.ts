import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import adminAuth from "../server/routes/adminAuth";
import playerAuth from "../server/routes/playerAuth";
import { openapi } from "../server/openapi";
import docs from "../server/routes/docs";
import puzzles from "../server/routes/puzzles";

const app = new Hono();

// API routes
app.route("/api/admin/auth", adminAuth);
app.route("/api/players/auth", playerAuth);
app.route("/", openapi);
app.route("/", docs);
app.route("/api/puzzles", puzzles);

app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;

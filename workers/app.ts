import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import adminAuth from "../server/routes/adminAuth";
import playerAuth from "../server/routes/playerAuth";
import { openapi } from "../server/openapi";
import docs from "../server/routes/docs";
import puzzles from "../server/routes/puzzles";
// Import OpenAPI-registered routes so they self-register on load
import "../server/routes/groups";
import "../server/routes/collections";
import "../server/routes/puzzlesAdmin";
import { Hono } from "hono";
import { corsForPublicApi } from "../server/middleware/cors";
import v1 from "../server/routes/v1/index";

const app = new Hono();

// API routes
app.route("/api/admin/auth", adminAuth);
app.route("/api/players/auth", playerAuth);
app.route("/", openapi);
app.route("/api-docs", docs);
app.route("/api/puzzles", puzzles);

// Public API v1: CORS middleware + versioned router
const apiV1 = new Hono();
apiV1.use("*", corsForPublicApi());
apiV1.route("/", v1);
app.route("/api/v1", apiV1);

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

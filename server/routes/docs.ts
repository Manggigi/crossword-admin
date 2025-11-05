import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import swaggerUiDist from "swagger-ui-dist";

const router = new Hono();

router.get("/api-docs", (c) => {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>API Docs</title>
    <link rel="stylesheet" href="/api-docs/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api-docs/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui'
      });
    </script>
  </body>
  </html>`;
  return c.html(html);
});

// Serve swagger-ui assets
router.get("/api-docs/swagger-ui.css", serveStatic({ path: `${swaggerUiDist.getAbsoluteFSPath()}/swagger-ui.css` }));
router.get("/api-docs/swagger-ui-bundle.js", serveStatic({ path: `${swaggerUiDist.getAbsoluteFSPath()}/swagger-ui-bundle.js` }));

export default router;



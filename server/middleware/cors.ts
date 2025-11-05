import { cors } from "hono/cors";

export function corsForPublicApi() {
  const allowOrigin = (origin: string) => {
    // Allow localhost and any origin listed in ENV VAR ALLOWED_ORIGINS (comma-separated)
    if (!origin) return "*";
    try {
      const u = new URL(origin);
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return origin;
    } catch {}
    return origin;
  };
  return cors({
    origin: allowOrigin as any,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 600,
  });
}



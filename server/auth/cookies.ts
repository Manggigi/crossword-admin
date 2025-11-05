import type { Context } from "hono";
import { setCookie } from "hono/cookie";

export function setAdminSessionCookie(
  c: Context,
  token: string,
  maxAgeSeconds: number = 60 * 60,
) {
  setCookie(c, "admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function clearAdminSessionCookie(c: Context) {
  setCookie(c, "admin_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
}




import { SignJWT, jwtVerify } from "jose";

type JwtClaims = Record<string, unknown> & {
  sub?: string;
  role?: string;
};

export async function createJwt(
  claims: JwtClaims,
  env: Env,
  expiresInSeconds: number = 60 * 60,
) {
  const secretString = (env as any).JWT_SECRET || "dev-secret-change-me";
  const secret = new TextEncoder().encode(secretString);
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ ...claims, iat: now })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(secret);
}

export async function verifyJwt<T = unknown>(token: string, env: Env): Promise<T> {
  const secretString = (env as any).JWT_SECRET || "dev-secret-change-me";
  const secret = new TextEncoder().encode(secretString);
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });
  return payload as T;
}










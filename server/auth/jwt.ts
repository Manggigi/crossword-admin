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
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ ...claims, iat: now })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(secret);
}

export async function verifyJwt<T = unknown>(token: string, env: Env): Promise<T> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });
  return payload as T;
}



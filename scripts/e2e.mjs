// Simple E2E script that hits the local dev server.
// Usage:
//   ADMIN_SESSION=... BASE_URL=http://localhost:5173 node scripts/e2e.mjs

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const TOKEN = process.env.ADMIN_SESSION || "REPLACE_WITH_YOUR_COOKIE";

function log(step, ok, extra = "") {
  const mark = ok ? "✅" : "❌";
  console.log(`${mark} ${step}${extra ? " " + extra : ""}`);
}

async function waitForServer(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE_URL}/openapi.json`);
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  let passed = 0;
  let failed = 0;

  const up = await waitForServer();
  if (!up) {
    console.error("Dev server not reachable at", BASE_URL);
    process.exit(1);
  }

  // 1) auth/me
  try {
    const res = await fetch(`${BASE_URL}/api/admin/auth/me`, {
      headers: { Cookie: `admin_session=${TOKEN}` },
    });
    const data = await res.json();
    const ok = res.ok && data && data.user && data.user.id;
    log("GET /api/admin/auth/me", ok);
    ok ? passed++ : failed++;
    if (!ok) throw new Error(JSON.stringify(data));
  } catch (e) {
    log("GET /api/admin/auth/me", false, String(e));
  }

  // 2) create puzzle
  let createdId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/puzzles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `admin_session=${TOKEN}`,
      },
      body: JSON.stringify({
        title: "E2E Created",
        date: "2025-11-05",
        description: "e2e",
        difficulty: "easy",
      }),
    });
    const data = await res.json().catch(() => ({}));
    const ok = res.ok && data && data.id;
    createdId = ok ? data.id : null;
    log("POST /api/puzzles", ok, createdId ? `id=${createdId}` : "");
    ok ? passed++ : failed++;
  } catch (e) {
    log("POST /api/puzzles", false, String(e));
  }

  // 3) update puzzle
  if (createdId) {
    try {
      const res = await fetch(`${BASE_URL}/api/puzzles/${createdId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `admin_session=${TOKEN}`,
        },
        body: JSON.stringify({ title: "E2E Updated", difficulty: "medium" }),
      });
      const ok = res.ok;
      log("PUT /api/puzzles/{id}", ok);
      ok ? passed++ : failed++;
    } catch (e) {
      log("PUT /api/puzzles/{id}", false, String(e));
    }
  }

  // 4) publish puzzle
  if (createdId) {
    try {
      const res = await fetch(`${BASE_URL}/api/puzzles/${createdId}/publish`, {
        method: "POST",
        headers: { Cookie: `admin_session=${TOKEN}` },
      });
      const ok = res.ok;
      log("POST /api/puzzles/{id}/publish", ok);
      ok ? passed++ : failed++;
    } catch (e) {
      log("POST /api/puzzles/{id}/publish", false, String(e));
    }
  }

  // 5) daily list
  try {
    const res = await fetch(`${BASE_URL}/api/puzzles/daily`);
    const data = await res.json();
    const ok = res.ok && data && Array.isArray(data.puzzles);
    log("GET /api/puzzles/daily", ok, ok ? `count=${data.puzzles.length}` : "");
    ok ? passed++ : failed++;
  } catch (e) {
    log("GET /api/puzzles/daily", false, String(e));
  }

  console.log(`\nPassed: ${passed}, Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
}

main();

// Public API v1 E2E
// Usage: BASE_URL=http://localhost:5173 node scripts/e2e_v1.mjs

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

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
  const up = await waitForServer();
  if (!up) {
    console.error("Dev server not reachable at", BASE_URL);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;
  let firstPuzzleId = null;
  let token = null;
  let sessionId = null;

  // 1) lists
  try {
    const res = await fetch(`${BASE_URL}/api/v1/puzzles/daily`);
    const data = await res.json();
    const ok =
      res.ok && Array.isArray(data.puzzles) && data.puzzles.length >= 0;
    firstPuzzleId = data.puzzles[0]?.id ?? null;
    log(
      "GET /api/v1/puzzles/daily",
      ok,
      firstPuzzleId ? `first=${firstPuzzleId}` : ""
    );
    ok ? passed++ : failed++;
  } catch (e) {
    log("GET /api/v1/puzzles/daily", false, String(e));
  }

  // 2) show
  if (firstPuzzleId) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/puzzles/${firstPuzzleId}`);
      const data = await res.json();
      const ok =
        res.ok && data && data.puzzle && data.puzzle.id === firstPuzzleId;
      log("GET /api/v1/puzzles/{id}", ok);
      ok ? passed++ : failed++;
    } catch (e) {
      log("GET /api/v1/puzzles/{id}", false, String(e));
    }
  }

  // 3) guest sign up
  try {
    const res = await fetch(`${BASE_URL}/api/v1/players/guest/sign_up`, {
      method: "POST",
    });
    const data = await res.json();
    const ok = res.ok && data && data.access_token;
    token = data.access_token;
    log("POST /api/v1/players/guest/sign_up", ok);
    ok ? passed++ : failed++;
  } catch (e) {
    log("POST /api/v1/players/guest/sign_up", false, String(e));
  }

  // 4) create session
  if (token && firstPuzzleId) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/puzzles/${firstPuzzleId}/game_sessions`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      const ok = res.ok && data && data.id;
      sessionId = data.id;
      log(
        "POST /api/v1/puzzles/{id}/game_sessions",
        ok,
        sessionId ? `id=${sessionId}` : ""
      );
      ok ? passed++ : failed++;
    } catch (e) {
      log("POST /api/v1/puzzles/{id}/game_sessions", false, String(e));
    }
  }

  // 5) add session hint
  if (sessionId) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/game_sessions/${sessionId}/session_hints`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: { example: true } }),
        }
      );
      const data = await res.json();
      const ok = res.ok && data && data.id;
      log("POST /api/v1/game_sessions/{id}/session_hints", ok);
      ok ? passed++ : failed++;
    } catch (e) {
      log("POST /api/v1/game_sessions/{id}/session_hints", false, String(e));
    }
  }

  // 6) hints stub
  if (firstPuzzleId) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/puzzles/${firstPuzzleId}/hints?difficulty=easy`
      );
      const data = await res.json();
      const ok =
        res.ok && data && Array.isArray(data.hints) && data.hints.length >= 1;
      log("GET /api/v1/puzzles/{id}/hints", ok);
      ok ? passed++ : failed++;
    } catch (e) {
      log("GET /api/v1/puzzles/{id}/hints", false, String(e));
    }
  }

  // 7) share
  if (firstPuzzleId) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/puzzles/${firstPuzzleId}/shares`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: "twitter" }),
        }
      );
      const data = await res.json();
      const ok = res.ok && data && data.id;
      log("POST /api/v1/puzzles/{id}/shares", ok);
      ok ? passed++ : failed++;
    } catch (e) {
      log("POST /api/v1/puzzles/{id}/shares", false, String(e));
    }
  }

  // 8) groups + collections
  try {
    const res = await fetch(`${BASE_URL}/api/v1/groups`);
    const data = await res.json();
    const ok = res.ok && data && Array.isArray(data.groups);
    log(
      "GET /api/v1/groups",
      ok,
      ok && data.groups[0] ? `first=${data.groups[0].id}` : ""
    );
    ok ? passed++ : failed++;
  } catch (e) {
    log("GET /api/v1/groups", false, String(e));
  }

  console.log(`\nPassed: ${passed}, Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
}

main();

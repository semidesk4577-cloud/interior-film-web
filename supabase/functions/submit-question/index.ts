import { createClient } from "npm:@supabase/supabase-js@2";

const RELEASE = "HOMEFILM-SITEVERIFY-DIAG-20261106-R2";

const allowedOrigins = new Set(["https://homefilm.co.kr", "https://www.homefilm.co.kr"]);
const allowedHosts = new Set(["homefilm.co.kr", "www.homefilm.co.kr"]);
const cors = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Vary": "Origin", "Cache-Control": "no-store", "X-Homefilm-Release": RELEASE,
});
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type TurnstileVerdict = { success?: boolean; hostname?: string; "error-codes"?: string[] };

async function verifyTurnstile(secret: string, token: string): Promise<{ok: boolean; status: number; error?: string}> {
  // A Turnstile token is single-use: retry only transient transport/HTTP errors,
  // never a completed verification response (even when success=false).
  for (let attempt = 1; attempt <= 2; attempt++) {
    let response: Response;
    try {
      response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(12000),
      });
    } catch (error) {
      console.error("[submit-question] turnstile transport", { attempt, errorType: error instanceof Error ? error.name : "unknown" });
      if (attempt === 1) { await wait(350); continue; }
      return { ok: false, status: 503, error: "CF_NETWORK" };
    }
    if (!response.ok) {
      // Read Cloudflare's error response, not just its HTTP status.
      // Only return recognized diagnostic codes; never return raw HTML, keys or tokens.
      let codes: string[] = [];
      let responseKind = "non-json";
      try {
        const rawError = (await response.text()).slice(0, 4096);
        const parsed = JSON.parse(rawError);
        responseKind = "json";
        if (Array.isArray(parsed?.["error-codes"])) {
          codes = parsed["error-codes"].filter(
            (c: unknown) => typeof c === "string" && /^[a-z0-9-]{1,60}$/.test(c)
          ).slice(0, 5);
        }
      } catch { /* Some 400 responses are not JSON. */ }
      console.error("[submit-question] turnstile HTTP", {
        attempt, status: response.status, responseKind, codes
      });
      if (attempt === 1 && (response.status === 429 || response.status >= 500)) {
        await wait(350);
        continue;
      }
      const known = ["missing-input-secret", "invalid-input-secret", "missing-input-response",
        "invalid-input-response", "bad-request", "timeout-or-duplicate", "internal-error"];
      const reason = codes.find((c) => known.includes(c));
      return { ok: false, status: 503,
        error: `CF_HTTP_${response.status}${reason ? ":" + reason : ""}` };
    }
    let verdict: TurnstileVerdict;
    try { verdict = await response.json(); }
    catch { console.error("[submit-question] turnstile invalid JSON"); return { ok: false, status: 503, error: "CF_BAD_RESPONSE" }; }
    if (verdict.success !== true) {
      // Error codes are Cloudflare's documented codes; never log token or secret.
      console.warn("[submit-question] turnstile rejected", { codes: Array.isArray(verdict["error-codes"]) ? verdict["error-codes"] : [] });
      return { ok: false, status: 403, error: "Verification failed" };
    }
    if (!verdict.hostname || !allowedHosts.has(verdict.hostname)) {
      console.warn("[submit-question] turnstile hostname mismatch");
      return { ok: false, status: 403, error: "Verification failed" };
    }
    return { ok: true, status: 200 };
  }
  return { ok: false, status: 503, error: "Verification unavailable: CF_UNKNOWN" };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  if (!allowedOrigins.has(origin)) return new Response("Forbidden", { status: 403 });
  const headers = cors(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method === "GET") return new Response(JSON.stringify({ release: RELEASE, status: "ready" }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
  const reply = (error: string, status: number) => new Response(JSON.stringify({ error, release: RELEASE }), { status, headers: { ...headers, "Content-Type": "application/json" } });
  if (req.method !== "POST") return reply("Method not allowed", 405);
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 10000) return reply("Payload too large", 413);
    let data: Record<string, unknown>;
    try { data = JSON.parse(raw); } catch { return reply("Invalid JSON", 400); }
    if (!data || typeof data !== "object" || Array.isArray(data)) return reply("Invalid request", 400);
    const valid = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;
    if (!valid(data.author, 30) || !valid(data.title, 100) || !valid(data.body, 2000) || !valid(data.turnstile_token, 4096)) return reply("Invalid fields", 400);
    const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");
    if (!secret || !url || !serviceKey) {
      console.error("[submit-question] missing server configuration", { turnstile: !!secret, url: !!url, serviceRole: !!serviceKey });
      return reply("SERVER_CONFIG", 503);
    }
    const verification = await verifyTurnstile(secret, String(data.turnstile_token));
    if (!verification.ok) return reply(verification.error || "CF_VERIFY_FAILED", verification.status);
    const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await db.from("film_questions").insert({
      author: String(data.author).trim(), title: String(data.title).trim(), body: String(data.body).trim(),
      published: false, answer: null,
    });
    if (error) { console.error("[submit-question] database insert", { code: error.code }); return reply("Save failed", 500); }
    return new Response(JSON.stringify({ success: true, release: RELEASE }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[submit-question] unexpected error", { type: error instanceof Error ? error.name : "unknown" });
    return reply("Submission failed", 500);
  }
});

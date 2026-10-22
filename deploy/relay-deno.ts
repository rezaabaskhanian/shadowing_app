// رله‌ی خروجی LingoFlow روی Deno Deploy (جایگزین deploy/relay-worker.js).
//
// چرا: IPهای خروجی Cloudflare Workers را OpenRouter و Groq می‌بندند (403
// «Access denied by security policy» / «Forbidden»، حتی برای مسیرهای عمومی).
// Deno Deploy از IPهای دیگری خارج می‌شود. پروتکل با Worker یکی است: بک‌اند
// (AI_RELAY_URL + AI_RELAY_KEY) مسیر و بدنه را همان‌طور می‌فرستد، میزبان اصلی
// در هدر X-Relay-Host است و کلید مشترک در X-Relay-Key.
//
// راه‌اندازی: dash.deno.com → New Playground (یا New Project) → این کد را بچسبان →
// Settings → Environment Variables → RELAY_KEY (همان AI_RELAY_KEY سرور) → Save/Deploy.
// بعد در .env سرور: AI_RELAY_URL=https://<نام‌پروژه>.deno.dev

// فقط همین میزبان‌ها رله می‌شوند تا پراکسیِ باز نباشد.
const ALLOWED_HOSTS = new Set([
  "openrouter.ai",
  "generativelanguage.googleapis.com",
  "api.anthropic.com",
  "api.elevenlabs.io",
  "api.groq.com",
  "api.deepseek.com",
  "api.openai.com",
  "ipinfo.io",
  "api.telegram.org", // ربات اعلان‌های ادمین (adminbotservice)
]);

Deno.serve(async (request: Request) => {
  const key = Deno.env.get("RELAY_KEY");
  if (!key || request.headers.get("X-Relay-Key") !== key) {
    return new Response("forbidden", { status: 403 });
  }
  const host = request.headers.get("X-Relay-Host") ?? "";
  if (!ALLOWED_HOSTS.has(host)) {
    return new Response("host not allowed", { status: 400 });
  }

  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, "https://" + host);

  const headers = new Headers(request.headers);
  headers.delete("X-Relay-Key");
  headers.delete("X-Relay-Host");
  headers.delete("Host");
  for (const h of [...headers.keys()]) {
    if (
      h.startsWith("cf-") || h.startsWith("x-forwarded-") || h === "x-real-ip" ||
      h === "forwarded" || h === "via"
    ) headers.delete(h);
  }

  return await fetch(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "follow",
  });
});

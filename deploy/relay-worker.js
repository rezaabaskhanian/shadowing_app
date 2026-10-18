// رله‌ی خروجی LingoFlow روی Cloudflare Workers.
// بک‌اند (AI_RELAY_URL) هر درخواستِ هوش مصنوعی را با همان مسیر به این Worker می‌فرستد
// و میزبان اصلی را در هدر X-Relay-Host می‌گذارد؛ این Worker آن را به https://<host> می‌رساند.
//
// راه‌اندازی: Workers & Pages > Create Worker > این کد را بچسبان > Deploy.
// بعد Settings > Variables and Secrets > Secret به اسم RELAY_KEY (همان AI_RELAY_KEY در .env سرور).

// فقط همین میزبان‌ها رله می‌شوند تا Worker پراکسیِ باز نباشد.
const ALLOWED_HOSTS = new Set([
  "openrouter.ai",
  "generativelanguage.googleapis.com",
  "api.anthropic.com",
  "api.elevenlabs.io",
  "api.groq.com",
  "api.deepseek.com",
  "api.openai.com",
  "ipinfo.io",
]);

export default {
  async fetch(request, env) {
    if (!env.RELAY_KEY || request.headers.get("X-Relay-Key") !== env.RELAY_KEY) {
      return new Response("forbidden", { status: 403 });
    }
    const host = request.headers.get("X-Relay-Host") || "";
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
      if (h.startsWith("cf-") || h === "x-forwarded-for" || h === "x-real-ip") headers.delete(h);
    }

    return fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "follow",
    });
  },
};

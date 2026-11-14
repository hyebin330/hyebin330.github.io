import { getStore } from "@netlify/blobs";

const allowedOrigins = new Set([
  "https://hyebin330.github.io",
  "https://hyebin330-mis-guestbook.netlify.app",
  "http://localhost:8888",
]);

function responseHeaders(origin) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  });
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: responseHeaders(origin) });
}

function cleanText(value) {
  return value.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

export default async function guestbook(request) {
  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse({ error: "origin_not_allowed" }, 403, null);
  }

  if (request.method === "OPTIONS") {
    const headers = responseHeaders(origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
    headers.set("Access-Control-Max-Age", "600");
    return new Response(null, { status: 204, headers });
  }

  if (request.method === "GET") {
    try {
      const store = getStore("mis-guestbook", { region: "ap-southeast-1" });
      const { blobs } = await store.list({ prefix: "entry/" });
      const latest = blobs
        .sort((a, b) => b.key.localeCompare(a.key))
        .slice(0, 50);
      const entries = await Promise.all(latest.map(async ({ key }) => store.get(key, { type: "json" })));
      return jsonResponse({ entries: entries.filter(Boolean) }, 200, origin);
    } catch {
      return jsonResponse({ error: "guestbook_unavailable" }, 503, origin);
    }
  }

  if (request.method === "POST") {
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 8192) return jsonResponse({ error: "request_too_large" }, 413, origin);

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: "invalid_json" }, 400, origin);
    }

    // Quietly accept bot submissions that fill the hidden honeypot field.
    if (typeof payload.website === "string" && payload.website.trim()) {
      return jsonResponse({ ok: true }, 202, origin);
    }
    if (typeof payload.name !== "string" || typeof payload.message !== "string") {
      return jsonResponse({ error: "invalid_entry" }, 400, origin);
    }

    const name = cleanText(payload.name);
    const message = cleanText(payload.message);
    if (Array.from(name).length < 1 || Array.from(name).length > 24) {
      return jsonResponse({ error: "invalid_name" }, 400, origin);
    }
    if (Array.from(message).length < 1 || Array.from(message).length > 500) {
      return jsonResponse({ error: "invalid_message" }, 400, origin);
    }

    const entry = {
      id: crypto.randomUUID(),
      name,
      message,
      createdAt: new Date().toISOString(),
    };
    const key = `entry/${Date.now().toString().padStart(13, "0")}-${entry.id}`;

    try {
      const store = getStore("mis-guestbook", { region: "ap-southeast-1" });
      await store.set(key, JSON.stringify(entry), { onlyIfNew: true });
      return jsonResponse({ entry }, 201, origin);
    } catch {
      return jsonResponse({ error: "guestbook_unavailable" }, 503, origin);
    }
  }

  return jsonResponse({ error: "method_not_allowed" }, 405, origin);
}

export const config = {
  path: "/api/guestbook",
  rateLimit: {
    action: "rate_limit",
    aggregateBy: "ip",
    windowSize: 60,
    windowLimit: 30,
  },
};

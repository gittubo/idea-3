// Posting server for the agent-team dashboard.
// Publishes to Instagram, TikTok, X, LinkedIn and Facebook through the Postiz public API.
// The API key stays on this server and is never sent to the browser.
//
//   POSTIZ_API_KEY=... node agent-team/server.mjs
//
// Env: POSTIZ_API_KEY (required to publish), POSTIZ_API_URL (default https://api.postiz.com),
//      PORT (default 8787), HOST (default 127.0.0.1 — keep it local; anyone who can reach
//      this server can post to your accounts).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.POSTIZ_API_KEY || "";
const API_URL = (process.env.POSTIZ_API_URL || "https://api.postiz.com").replace(/\/$/, "");
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const MAX_UPLOAD = 200 * 1024 * 1024;

// Postiz integration identifiers for the five networks we support.
export const PLATFORMS = {
  instagram: "instagram", "instagram-standalone": "instagram",
  tiktok: "tiktok",
  x: "x",
  linkedin: "linkedin", "linkedin-page": "linkedin",
  facebook: "facebook",
};

// Per-network rules checked before anything is sent.
export const RULES = {
  instagram: { needsMedia: true, maxLength: 2200 },
  tiktok: { needsMedia: true, maxLength: 2200 },
  x: { needsMedia: false, maxLength: 280 },
  linkedin: { needsMedia: false, maxLength: 3000 },
  facebook: { needsMedia: false, maxLength: 63206 },
};

// Default provider settings. TikTok must be DIRECT_POST: "UPLOAD" only drops the video in the
// TikTok inbox while Postiz still reports success.
export function defaultSettings(platform) {
  switch (platform) {
    case "instagram": return { post_type: "post" };
    case "tiktok": return {
      privacy_level: "PUBLIC_TO_EVERYONE",
      duet: false, stitch: false, comment: true,
      autoAddMusic: "no",
      brand_content_toggle: false, brand_organic_toggle: false,
      content_posting_method: "DIRECT_POST",
    };
    case "x": return { who_can_reply_post: "everyone" };
    default: return undefined;
  }
}

// Checks a publish request against the channels it targets. Returns a list of problems.
export function validate({ content, media, channels }) {
  const problems = [];
  if (!channels.length) problems.push("Pick at least one account to post to.");
  if (!content.trim() && !media.length) problems.push("Write something or attach media.");
  for (const ch of channels) {
    const r = RULES[ch.platform];
    if (r.needsMedia && !media.length) problems.push(`${ch.name} (${ch.platform}) needs a photo or video.`);
    if (content.length > r.maxLength) problems.push(`${ch.name} (${ch.platform}) allows ${r.maxLength} characters; this post has ${content.length}.`);
  }
  return problems;
}

// Builds the Postiz create-post body. No `when` means publish now.
export function buildPost({ content, media, channels, when }) {
  const date = when ? new Date(when) : new Date();
  if (Number.isNaN(date.getTime())) throw Object.assign(new Error("The schedule time is not a valid date."), { status: 400 });
  const image = media.map((m) => ({ id: m.id, path: m.path }));
  return {
    type: "schedule",
    date: date.toISOString(),
    shortLink: false,
    tags: [],
    posts: channels.map((ch) => {
      const settings = defaultSettings(ch.platform);
      return {
        integration: { id: ch.id },
        value: [{ content, image }],
        ...(settings ? { settings } : {}),
      };
    }),
  };
}

async function postiz(path, init = {}) {
  const json = init.body && !(init.body instanceof FormData);
  const res = await fetch(API_URL + path, {
    ...init,
    headers: { Authorization: API_KEY, ...(json ? { "Content-Type": "application/json" } : {}) },
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || JSON.stringify(data);
    const err = new Error(`Postiz said ${res.status}: ${msg}`.slice(0, 600));
    err.status = res.status === 401 || res.status === 403 ? 401 : 502;
    throw err;
  }
  return data;
}

export function toChannels(list) {
  return (Array.isArray(list) ? list : list?.integrations || [])
    .filter((i) => PLATFORMS[i.identifier] && !i.disabled)
    .map((i) => ({ id: i.id, name: i.name, platform: PLATFORMS[i.identifier], picture: i.picture || null }));
}

const listChannels = async () => toChannels(await postiz("/public/v1/integrations"));

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error("File is too large (200 MB max)."), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

function requireKey() {
  if (!API_KEY) throw Object.assign(new Error("POSTIZ_API_KEY is not set on the server. Add it and restart."), { status: 503 });
}

const routes = {
  "GET /": async (_req, res) => send(res, 200, await readFile(join(here, "index.html")), "text/html; charset=utf-8"),

  "GET /api/status": async (_req, res) => send(res, 200, { configured: Boolean(API_KEY) }),

  "GET /api/channels": async (_req, res) => { requireKey(); send(res, 200, { channels: await listChannels() }); },

  "POST /api/upload": async (req, res, url) => {
    requireKey();
    const filename = (url.searchParams.get("filename") || "upload").replace(/[^\w.\-]/g, "_");
    const buf = await readBody(req, MAX_UPLOAD);
    if (!buf.length) throw Object.assign(new Error("The file is empty."), { status: 400 });
    const form = new FormData();
    form.append("file", new Blob([buf], { type: req.headers["content-type"] || "application/octet-stream" }), filename);
    const out = await postiz("/public/v1/upload", { method: "POST", body: form });
    send(res, 200, { id: out.id || filename, path: out.path, name: filename });
  },

  "POST /api/publish": async (req, res) => {
    requireKey();
    let body;
    try { body = JSON.parse((await readBody(req, 1024 * 1024)).toString("utf8")); }
    catch { throw Object.assign(new Error("Request body must be JSON."), { status: 400 }); }
    const content = String(body.content || "");
    const media = Array.isArray(body.media) ? body.media.filter((m) => m && typeof m.path === "string") : [];
    const wanted = new Set(Array.isArray(body.channelIds) ? body.channelIds : []);
    const channels = (await listChannels()).filter((c) => wanted.has(c.id));
    if (channels.length !== wanted.size) throw Object.assign(new Error("One of the selected accounts is no longer connected in Postiz."), { status: 400 });
    const problems = validate({ content, media, channels });
    if (problems.length) return send(res, 400, { error: problems.join(" "), problems });
    const post = buildPost({ content, media, channels, when: body.when || null });
    const result = await postiz("/public/v1/posts", { method: "POST", body: JSON.stringify(post) });
    send(res, 200, { ok: true, scheduledFor: post.date, channels: channels.map((c) => c.name), result });
  },
};

export const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname === "/index.html" ? "/" : url.pathname;
  const handler = routes[`${req.method} ${path}`];
  if (!handler) return send(res, 404, { error: "Not found" });
  try { await handler(req, res, url); }
  catch (e) { if (!res.headersSent) send(res, e.status || 500, { error: e.message }); }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => {
    console.log(`Agent team dashboard: http://${HOST}:${PORT}`);
    if (!API_KEY) console.log("POSTIZ_API_KEY is not set: the dashboard runs, publishing is disabled.");
  });
}

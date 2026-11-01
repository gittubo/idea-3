// Run: node --test agent-team/server.test.mjs
// Starts server.mjs against a fake Postiz API and checks what it sends.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildPost, validate, toChannels } from "./server.mjs";

const integrations = [
  { id: "ig1", name: "Shop IG", identifier: "instagram" },
  { id: "tt1", name: "Shop TikTok", identifier: "tiktok" },
  { id: "x1", name: "Shop X", identifier: "x" },
  { id: "li1", name: "Shop LinkedIn", identifier: "linkedin-page" },
  { id: "fb1", name: "Shop FB", identifier: "facebook" },
  { id: "rd1", name: "Reddit", identifier: "reddit" },
  { id: "x2", name: "Old X", identifier: "x", disabled: true },
];

test("toChannels keeps only the five enabled networks", () => {
  assert.deepEqual(toChannels(integrations).map((c) => [c.id, c.platform]),
    [["ig1", "instagram"], ["tt1", "tiktok"], ["x1", "x"], ["li1", "linkedin"], ["fb1", "facebook"]]);
});

test("validate requires media for Instagram and TikTok and enforces X length", () => {
  const ch = toChannels(integrations);
  const p = validate({ content: "a".repeat(300), media: [], channels: ch });
  assert.ok(p.some((m) => m.includes("Shop IG") && m.includes("photo or video")));
  assert.ok(p.some((m) => m.includes("Shop TikTok") && m.includes("photo or video")));
  assert.ok(p.some((m) => m.includes("Shop X") && m.includes("280")));
  assert.equal(validate({ content: "hi", media: [], channels: ch.filter((c) => ["x", "linkedin", "facebook"].includes(c.platform)) }).length, 0);
});

test("buildPost uses DIRECT_POST for TikTok and per-network settings", () => {
  const ch = toChannels(integrations);
  const body = buildPost({ content: "hello", media: [{ id: "m1", path: "https://cdn/x.mp4" }], channels: ch, when: "2026-12-01T10:00:00Z" });
  assert.equal(body.type, "schedule");
  assert.equal(body.date, "2026-12-01T10:00:00.000Z");
  const by = Object.fromEntries(body.posts.map((p) => [p.integration.id, p]));
  assert.equal(by.tt1.settings.content_posting_method, "DIRECT_POST");
  assert.equal(by.ig1.settings.post_type, "post");
  assert.equal(by.x1.settings.who_can_reply_post, "everyone");
  assert.equal(by.li1.settings, undefined);
  assert.deepEqual(by.fb1.value, [{ content: "hello", image: [{ id: "m1", path: "https://cdn/x.mp4" }] }]);
});

// ---- end to end against a fake Postiz ----
let fake, app, base;
const seen = [];
const PORT = 18787;

before(async () => {
  fake = createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      seen.push({ method: req.method, url: req.url, auth: req.headers.authorization, type: req.headers["content-type"], body });
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/public/v1/integrations") return res.end(JSON.stringify(integrations));
      if (req.url === "/public/v1/upload") return res.end(JSON.stringify({ id: "up1", path: "https://uploads.postiz.test/up1.jpg" }));
      if (req.url === "/public/v1/posts") return res.end(JSON.stringify([{ postId: "p1" }]));
      res.statusCode = 404; res.end("{}");
    });
  });
  await new Promise((r) => fake.listen(0, "127.0.0.1", r));
  const env = { ...process.env, POSTIZ_API_KEY: "test-key", POSTIZ_API_URL: `http://127.0.0.1:${fake.address().port}`, PORT: String(PORT) };
  app = spawn(process.execPath, [fileURLToPath(new URL("./server.mjs", import.meta.url))], { env, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((r) => app.stdout.once("data", r));
  base = `http://127.0.0.1:${PORT}`;
});

after(() => { app?.kill(); fake?.close(); });

test("GET / serves the dashboard and /api/channels lists accounts", async () => {
  assert.match(await (await fetch(base + "/")).text(), /Agent Team/);
  const { channels } = await (await fetch(base + "/api/channels")).json();
  assert.equal(channels.length, 5);
  assert.equal(seen.at(-1).auth, "test-key");
});

test("upload then publish sends the uploaded path to every selected network", async () => {
  const up = await (await fetch(base + "/api/upload?filename=pic.jpg", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: Buffer.from([1, 2, 3]) })).json();
  assert.equal(up.path, "https://uploads.postiz.test/up1.jpg");
  const upReq = seen.find((s) => s.url === "/public/v1/upload");
  assert.match(upReq.type, /multipart\/form-data/);
  assert.ok(upReq.body.includes(Buffer.from('filename="pic.jpg"')));

  const r = await fetch(base + "/api/publish", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "New serum is here", media: [up], channelIds: ["ig1", "tt1", "x1", "li1", "fb1"] }) });
  assert.equal(r.status, 200);
  const sent = JSON.parse(seen.findLast((s) => s.url === "/public/v1/posts").body);
  assert.equal(sent.posts.length, 5);
  assert.ok(sent.posts.every((p) => p.value[0].image[0].path === up.path));
  assert.ok(Math.abs(new Date(sent.date) - Date.now()) < 60_000, "no schedule time means now");
});

test("publish is refused before reaching Postiz when Instagram has no media", async () => {
  const count = () => seen.filter((s) => s.url === "/public/v1/posts").length;
  const n = count();
  const r = await fetch(base + "/api/publish", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "text only", media: [], channelIds: ["ig1"] }) });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /photo or video/);
  assert.equal(count(), n);
});

test("unknown account ids are refused", async () => {
  const r = await fetch(base + "/api/publish", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "hi", channelIds: ["nope"] }) });
  assert.equal(r.status, 400);
});

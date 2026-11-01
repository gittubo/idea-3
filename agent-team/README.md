# Agent team dashboard

An animated control room for an AI social media agent team, with a **Publish** panel that posts
for real to Instagram, TikTok, X, LinkedIn and Facebook.

The agent activity on the dashboard (feed, terminal, counters, approval queue) is a simulation.
The Publish panel is real: what you send there goes out on your accounts.

## How posting works

The page talks to `server.mjs`, a small Node server with no dependencies. The server sends posts
through [Postiz](https://postiz.com), which holds the connections to each network. One Postiz API
key covers all five networks, so you don't have to set up developer apps with Meta, TikTok, X and
LinkedIn yourself. Your key stays on the server and never reaches the browser.

## Set up (once)

1. Create a Postiz account at https://postiz.com (or self-host it from https://github.com/gitroomhq/postiz-app).
2. In Postiz, connect your accounts: Instagram (a Business or Creator account linked to a Facebook
   Page), TikTok, X, LinkedIn (profile or company page) and a Facebook Page.
3. In Postiz settings, copy your public API key.

## Run

Needs Node 18 or newer.

```bash
POSTIZ_API_KEY=your_key_here node agent-team/server.mjs
```

Then open http://127.0.0.1:8787. The Publish panel shows your connected accounts.

If you self-host Postiz, also set `POSTIZ_API_URL` to your instance's backend URL.
`PORT` changes the port (default 8787).

The server listens on 127.0.0.1 only. Anyone who can reach it can post to your accounts, so don't
expose it to the internet without adding a login in front of it.

## Posting rules the panel checks

| Network | Needs a photo or video | Text limit |
|---|---|---|
| Instagram | Yes | 2,200 |
| TikTok | Yes (video or photos) | 2,200 |
| X | No | 280 |
| LinkedIn | No | 3,000 |
| Facebook | No | 63,206 |

TikTok posts go out with `DIRECT_POST`, so they publish straight to the profile instead of landing
in the TikTok inbox as drafts. They're public, with comments on and duet and stitch off; change
`defaultSettings` in `server.mjs` to adjust.

Leave **When** empty to post now, or pick a time to schedule it. Scheduled posts appear in your
Postiz calendar, where you can edit or delete them.

## Test

```bash
node --test agent-team/server.test.mjs
```

The tests run the server against a fake Postiz, so they never post anything.

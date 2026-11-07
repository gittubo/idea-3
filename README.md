# Tubo

A wordless museum on the web. Visitors walk a dark exhibition hall, step up to a painting, and explore it themselves: zooming and moving through its depth layers, or pressing play to be guided to what it hides. An ambient soundscape can be turned on or off at any time.

The plan and the story sheets for each painting are in [`PLAN.md`](PLAN.md).

## Run it

```bash
npm ci
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
```

Node 20 or newer.

## Deploy to Vercel

Live: **https://tubo-ten.vercel.app** (Vercel project `tubo`).

`.vercelignore` keeps the full-size source paintings, the pipeline and local previews out of the upload.

The repository is ready for Vercel. `vercel.json` sets the Astro build, the `dist/` output, and cache headers.

**From the Vercel dashboard (no token needed):**

1. In Vercel, choose **Add New → Project** and import this GitHub repository.
2. Vercel detects Astro. Leave the build settings as they are; they come from `vercel.json`.
3. Choose **Deploy**.

Vercel deploys the repository's production branch. If the museum lives on a feature branch, either merge it into the production branch or set the production branch under **Project Settings → Git**. Every other branch gets its own preview URL automatically.

**From the command line:**

```bash
npx vercel@latest login
npx vercel@latest --prod
```

## How it is built

| Part | Where |
|---|---|
| Hall: room, lighting, floor reflections, walking | `src/scripts/hall.ts` |
| Free exploration and the guided view | `src/scripts/explorer.ts` |
| Depth renderer (paintings as 3D layers, pixels untouched) | `src/scripts/depth-scene.ts` |
| Controller: input, transitions, links per painting | `src/scripts/museum.ts` |
| Soundscape (synthesised in the browser, no audio files) | `src/scripts/sound.ts` |
| The six paintings: placement, light, guide stops | `src/pieces/collection.ts` |
| Depth and layer pipeline | `pipeline/` (`depth.py`, `make_layers.py`, one `.json` per painting) |
| Source paintings and depth maps | `art/` |

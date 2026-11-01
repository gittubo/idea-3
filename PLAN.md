# TUBO: Website Plan

Status: **v3. Planning complete.** Ready for Phase 1.

---

## 1. Decisions locked

| # | Decision | Answer |
|---|---|---|
| Name | Museum name | **Tubo** |
| D1 | The pieces | **Original artworks we generate ourselves**, using Leonardo da Vinci's work as the visual reference |
| D2 | Camera method | **3D depth camera.** It moves through the original pixels and never redraws them. |
| D3 | Layout | **A corridor you walk along by scrolling** |
| D4 | Text | **A few words, only where truly needed** (full list in Section 6) |
| D5 | Sound | **Ambient soundscapes**, which visitors can turn on or off at any time |
| D6 | Free-look mode | **Yes** |
| D7 | Extra pages (about, contact, shop) | **None** |

---

## 2. The rule everything follows

**The camera tells the story.** Pieces have no captions, descriptions, quotes or voice. Visitors understand each piece only through where the camera goes, how long it stays and what it reveals. The few words that appear are labels, never explanation.

---

## 3. The visitor's journey

```
Threshold  →  Corridor · Room I  →  archway  →  Corridor · Room II  →  …
                    │
                    └─ select a piece → camera journey → free-look → back to the wall
```

The Grand Hall is merged into the corridor. The museum is **one continuous corridor**, and an archway separates each room. That is simpler, never lets anyone get lost and always feels like walking.

### 3.1 Threshold
- The visitor arrives to a black screen with film grain. The Tubo mark glows softly and its lens pulses slowly.
- Clicking, tapping or scrolling opens the lens like an iris. The camera passes through it and the corridor fades up from darkness.
- The first time, a small animated scroll icon appears (an icon, not a word) and fades once the visitor moves.

### 3.2 The corridor
- **How it works:** scrolling down moves the camera sideways along a gallery wall. It is drawn in real 3D perspective, with the floor, the ceiling's edge and a soft floor reflection.
- **Light:** each piece hangs in its own pool of light and the space between pieces falls into darkness, so walking feels like moving from one discovery to the next.
- **Rooms:** each room has its own light temperature. Room I is warm candlelight; Room II is cool moonlight. Walking through an archway shifts the colour of the light and the soundscape crossfades to the next room.
- **Wall layout:** pieces are spaced about one screen-width apart. As a piece reaches the centre, its light brightens and the cursor becomes the lens.
- **On phones:** the same sideways walk, driven by a vertical swipe. Portrait-shaped paintings fill the phone screen well.

### 3.3 A piece: the camera journey
1. **Approach.** The camera moves up to the frame until the painting fills the screen.
2. **Establish.** It pauses on the full painting.
3. **Search.** Scrolling drives the depth camera through the painting's layers, drifting, hesitating and passing clues.
4. **Discovery.** The camera holds on the hidden detail. The scroll becomes "heavier" so the visitor stays longer.
5. **Return.** It pulls back to the full painting, which now reads differently.
6. **Free-look.** The scroll lock releases. The visitor can drag a gold lens (about 2.5× magnification) anywhere over the full-resolution painting. A single frame-corner icon takes them back to the wall.

Scrolling backward always rewinds the camera. A thin gold line at the screen edge shows progress, with a small mark at each camera stop.

---

## 4. How the 3D depth camera works

The painting's visible pixels never change. The camera moves through them in real 3D.

1. **Generate the painting** at high resolution (Section 5).
2. **Split it into depth layers.** Usually 3–5 layers, such as the background landscape, middle ground, figure, hands and foreground objects. Each layer is cut out from the original painting.
3. **Fill in what is hidden behind each layer.** When the camera moves, it sees slightly around objects. Those hidden areas are painted in once, in the same style. Since the artwork is ours, this adds to the painting without altering anything visible.
4. **Make a depth map** for each layer so surfaces have gentle relief (a cheek curves, a rock juts out) rather than looking like flat cardboard cut-outs.
5. **Place the layers in a WebGL scene** (Three.js) with a real perspective camera.
6. **Camera path:** the camera stops for each piece (Section 7) are stored as positions in the scene. Scrolling moves the camera smoothly between them.
7. **Finish:** light film grain, a soft vignette and gentle out-of-focus blur on layers far from the camera's focus, so it feels like a lens rather than a zoom.

Why this beats AI video here: it is faithful to the painting, smooth in both directions, sharp at any frame, and much smaller to download (one image set per piece instead of hundreds of video frames).

---

## 5. Making the art (Leonardo as a visual reference)

**Visual references from Leonardo's work** (style only, never copies of compositions):

- *Sfumato*: soft smoky edges and no hard outlines.
- *Chiaroscuro*: figures emerging from deep shadow.
- Atmospheric blue distance: rocky landscapes that fade into haze.
- Pyramidal figure groups, expressive hands and pointing gestures, enigmatic half-smiles and sidelong glances.
- Notebook drawings: red and black chalk, sepia ink, anatomical and mechanical studies, swirling water and storm studies, and mirror-writing as texture (illegible, decorative only).
- Surfaces: aged varnish, fine crackle, warm umber grounds.

**Production per piece:**

1. Generate the painting at the highest available resolution, then upscale it to at least 4000 px on the long edge.
2. Check the style against the references, the clarity of the hidden detail, and hands and faces.
3. Split the painting into layers, fill the hidden areas behind them, then make the depth maps (Section 4).
4. Write the camera path and tune it in the browser.
5. Compress the files to AVIF or WebP. Target about 3–6 MB per piece, loaded as the visitor walks toward it.

Each piece also gets a **private story sheet** (never shown on the site): one line of meaning, the hidden detail, and the camera stops.

---

## 6. Every word that appears on the site

| Where | Text | Why it is needed |
|---|---|---|
| Threshold and a small corner mark | **TUBO** (wordmark) | The museum's name |
| Archways | **I**, **II** (Roman numerals carved into the stone) | So visitors know where they are |
| Small wall plaque, shown only after the Return | **Piece title** (no description) | Identifies the work |
| Browser tab | "Tubo", or "Tubo · Piece title" | Tabs and bookmarks |
| Shown only if the browser can't run the site | One short line asking the visitor to update their browser | Basic courtesy |

Everything else is an icon: sound on/off, back to the wall, the scroll hint and the lens. Screen-reader labels and search-engine information exist but are never visible.

---

## 7. Draft pieces: 6 pieces across 2 rooms (to review)

Each piece has a hidden detail the camera finds. The story is never written on the site; the descriptions below are only for us.

### Room I: Oil (warm candlelight)

**1. The Kept Letter**
- *The painting:* a young woman in a three-quarter portrait with folded hands, a faint smile, and a rocky blue landscape behind her.
- *Camera stops:* her eyes looking off to one side → following that look to a winding road in the distance → a tiny rider leaving → back to her hands → **a folded letter with a broken seal, hidden under her sleeve.**
- *Meaning:* the smile hides a goodbye.

**2. The Apprentice**
- *The painting:* a dim workshop. An old master stands at an easel and a boy stands in the shadows.
- *Camera stops:* the master's unfinished painting → his hand trembling over the palette → his clouded eye → the boy's hand, stained with the same paint → **the newest, finest strokes on the canvas are the boy's.**
- *Meaning:* the hand is being passed on.

**3. The Wings**
- *The painting:* a hill at dawn. A man stands beside a wood-and-canvas flying machine while villagers watch from below.
- *Camera stops:* the machine's joints → a crowd laughing → one child not laughing, looking up → the man's arm in a splint → **a broken first wing lying half-buried in the grass behind him.**
- *Meaning:* he has fallen before and is trying again.

### Room II: Codex (cool moonlight, drawings on paper)

**4. Study of a Hand**
- *The painting:* a red-chalk notebook page of anatomical studies of an adult hand, surrounded by mirror-writing.
- *Camera stops:* tendons → measurement lines → the margins → **a tiny, tender sketch of a child's hand holding a finger.**
- *Meaning:* all this science began with a loss.

**5. The Deluge**
- *The painting:* a sepia storm study of spiralling water, collapsing hills and wind.
- *Camera stops:* following the spirals inward through the chaos → a broken tree → **a small boat with one lit lamp and a family inside.**
- *Meaning:* hope survives inside the storm.

**6. The Reflection**
- *The painting:* a sepia-ink optics page with a large cross-section of a human eye, rays of light drawn converging through the lens, small diagrams of mirrors and a darkened pinhole room, and mirror-writing.
- *Camera stops:* the light rays → following them inward through the lens diagram → the pinhole room with its upside-down image → the large drawn eye → into its pupil → **reflected in the pupil, a tiny, carefully drawn woman standing in a doorway, the only face on the page.**
- *Meaning:* every study of seeing is really about who we choose to look at.
- It is the last piece in the museum, ending on looking itself, which echoes the Tubo lens.

---

## 8. Sound

- **One ambient soundscape per room:**
  - Room I: low warm room tone, a faint crackle of candles, distant rain.
  - Room II: cool air, quiet paper rustle, a far-off bell.
- **Inside a piece:** the room sound dims, and a low tone rises during the Search and resolves at the Discovery.
- **Off by default.** Browsers block sound until the visitor interacts, so the visitor turns it on. The sound icon stays in a corner at all times and the choice is remembered.
- **Sources:** generated or royalty-free licensed audio, never voice. Sound fades up and down, never cuts.

---

## 9. Final decisions

| # | Question | Answer |
|---|---|---|
| Q1 | Number of pieces at launch | **6 across 2 rooms** |
| Q2 | Piece title plaque | **Yes.** It appears after the Return and shows the title only, small, in Gilt colour. |
| Q3 | Piece ideas | **Pieces 1–5 kept. "The Empty Chair" replaced by "The Reflection".** |
| Q4 | Brand kit | **Redone as Tubo:** `brand/tubo-brandkit-v1.png` |

---

## 10. Technology

| Part | Choice |
|---|---|
| Site framework | Astro (static) |
| 3D | Three.js (corridor and depth camera) |
| Scrolling and motion | GSAP ScrollTrigger + Lenis |
| Sound | Web Audio API (crossfades, per-room soundscapes) |
| Hosting | Vercel or Netlify, with media on a CDN |
| Targets | First screen in under 2 s, 60 fps on mid-range phones, a simplified fade-only version for people who turn off motion in their device settings, and a fallback for weak devices (pan and zoom without 3D) |

---

## 11. Build phases

| Phase | What gets built | Done when |
|---|---|---|
| **0. Finish planning** | ✅ Done | |
| **1. One piece, end to end** | ✅ Done: "The Kept Letter" with the depth camera, plaque and lens | Approved |
| **2. Corridor** | ✅ Done: 3D wall walk with Room I ("The Apprentice" and "The Wings" hang on the wall; their camera journeys come in Phase 5), lamp pools, snapping, enter and leave transitions, an address per piece (`#the-kept-letter`) | Walking and entering a piece feel continuous |
| **3. Threshold and rooms** | Iris entrance, archways, room light shifts, wordless navigation | A first-time visitor finds their way without help |
| **4. Sound and atmosphere** | Soundscapes, the on/off toggle, grain, lens cursor, loading state (a lens slowly coming into focus) | |
| **5. Remaining pieces** | Pieces 2–6 through the production steps in Section 5 | All pass the quality check |
| **6. Polish and launch** | Speed, real-phone testing, accessibility, search information, domain | Launch |

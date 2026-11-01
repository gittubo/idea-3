# OCULA: Website Plan

Status: **draft for discussion.** Nothing gets built until the open decisions at the bottom are settled.

---

## 1. The rule everything follows

**The camera tells the story. Nothing on screen is written to explain a piece.**

- No captions, descriptions, wall-label text, quotes, voice-over or narration.
- The visitor understands a piece only through where the camera goes, how long it stays and what it reveals.
- Navigation is wordless too: it works through space, light, motion, icons and sound.
- Text that is never seen is still needed: screen-reader labels, page titles and search metadata. These keep the site accessible and findable without showing visitors any words.

---

## 2. The visitor's journey

```
Threshold  →  Grand Hall  →  Room  →  Piece (the camera journey)  →  back to Room / next Piece
```

### 2.1 Threshold (arrival)
- The visitor arrives to a black screen, a faint grain and the frame-and-lens logo glowing softly.
- The lens in the logo pulses slowly. Clicking, tapping or scrolling makes it open like an iris, and the visitor passes through it into the museum.
- There is no "Enter" button text. The pulsing lens is the invitation.

### 2.2 Grand Hall (overview)
- A dark space with each room shown as a lit doorway or a single representative frame.
- Each room has its own light temperature (warm candle, cold moonlight, oxblood dusk), so rooms can be told apart without names.
- Format options (decision D3):
  - **A. Corridor walk (recommended).** Scrolling moves the visitor sideways along a lit wall with depth and parallax. It feels like walking, works well on phones and loads fast.
  - **B. Walkable 3D gallery.** The visitor moves freely in 3D. It is the most immersive option but heavy, hard to control on phones and easy to get lost in.
  - **C. Constellation.** Frames float in darkness and the visitor drifts between them. It is more abstract and less like a museum.

### 2.3 Room
- Pieces hang on the wall in sequence, each with its own pool of light.
- Hovering over a piece (or centring it on a phone) makes its light brighten slightly and turns the cursor into the lens.
- Selecting a piece starts the camera journey.

### 2.4 Piece: the camera journey (the core of the site)
1. **Approach.** The camera pushes toward the frame on the wall. The frame edges slide past the screen until the painting fills it.
2. **Establish.** The full painting is held still for a moment so the visitor sees it the way it hangs on the wall.
3. **Search.** Scrolling drives the camera through the painting, drifting, hesitating and changing direction as if looking for something. It passes clues: a glance, a hand, an object in shadow.
4. **Discovery.** The camera finds the hidden detail and holds on it. The scroll gets "heavier" here so the visitor stays longer.
5. **Return.** The camera pulls back to the full painting. The same image now reads differently because the visitor knows what is in it.
6. **Release.** The frame returns to the wall and the visitor is back in the room, facing the next piece.

Interaction details:
- Scrolling backward rewinds the camera, so the visitor controls time.
- A thin gold line at the edge shows progress, with small marks for each "stop" in the search.
- Optional free-look mode after Return (decision D6): the visitor drags a lens over the full-resolution painting to explore it themselves.

### 2.5 Wordless navigation
| Need | Wordless solution |
|---|---|
| Enter the museum | The pulsing lens in the logo |
| Go back | A frame-corner icon in the top left, or scrolling back past the start |
| Change room | Doorways of light at the ends of the corridor |
| Progress in a piece | The gold line with stop marks |
| Sound on or off | A small sound-wave icon |
| Know where you are | The room's light colour and a dot map of rooms |

---

## 3. Making each piece (content pipeline)

For every piece:

1. **Source image.** A high-resolution file, at least 4000 px on the long edge, with clear rights to use it (decision D1).
2. **Story beat sheet (internal only, never shown).** One sentence on what the piece is about, then 4–6 camera stops: where the camera looks, in what order and why. This is the script the camera follows.
3. **Camera paths.** Two versions, because phones are portrait and computers are landscape: a wide path for computers and a tall, vertical path for phones.
4. **Generate the camera movement** (decision D2):
   - **AI image-to-video.** A video model moves only the camera through the still image. It looks cinematic, but the model redraws pixels and can change faces, hands and brushwork. Every clip has to be checked against the original painting.
   - **2.5D depth camera.** An AI depth map splits the painting into layers, and the site moves a real camera through those layers in the browser. The painting's pixels stay exactly as they are, the motion is fully controllable and files are smaller. The motion is less free-flowing than AI video.
   - **Recommendation:** try both on one piece in Phase 1 and decide by eye.
5. **Generate in segments.** One short clip per camera stop, joined together. Long single AI clips drift and distort.
6. **Quality check.** Make sure nothing in the painting moves or changes, the camera feels like it is searching, and the Discovery shot lands.
7. **Prepare for scroll playback.** Export each clip as an image sequence (or as video where every frame is a keyframe) so scrolling stays smooth in every browser, including iPhone Safari. Target size: about 10–20 MB per piece, loaded only when the visitor approaches it.

---

## 4. Look, feel and sound

- **Visual identity:** from the brand kit in `brand/ocula-brandkit-v1.png`. That means Gallery Black, Gallery Ivory, Gilt and Oxblood, film grain and chiaroscuro light.
  - The "Look closer." tagline and the type specimen are left out of the site because of the no-text rule. Whether the OCULA wordmark itself appears is decision D4.
- **Motion:** slow and weighted, with smooth scrolling and nothing snappy. The camera eases like a person who is looking carefully.
- **Cursor:** a small gold ring (the lens) that grows over pieces.
- **Sound (decision D5):** room tone, faint footsteps when moving along the corridor, a low tone that rises during Search and resolves at Discovery. Off by default and turned on with an icon. There is never voice.

---

## 5. Technology

| Part | Choice | Why |
|---|---|---|
| Site framework | Astro (static) | Fast, simple and cheap to host. Each piece is a page with its own address that can be shared. |
| Scroll and motion | GSAP ScrollTrigger + Lenis | Industry standard for scroll-driven animation |
| Camera playback | Canvas image sequences, or WebGL for the 2.5D option | Smooth backward and forward scrubbing on all devices |
| 3D (only if option B is chosen) | Three.js | |
| Hosting | Vercel or Netlify, with media on a CDN | |
| Performance targets | First screen in under 2 s, 60 fps scrolling, and a lighter version for slow connections and reduced-motion settings | |

---

## 6. Build phases

| Phase | What gets built | Done when |
|---|---|---|
| **0. Decide** | Settle D1–D8 below and pick the launch pieces | Every open decision is answered |
| **1. One piece, end to end** | One painting fully produced (both camera methods) and playing by scroll on computer and phone | You watch it and say "yes, this is it." This is the riskiest step, so it comes first. |
| **2. Room and corridor** | Walking along the wall, light pools, approach and release transitions | Moving from piece to piece feels continuous |
| **3. Threshold and Grand Hall** | Iris entrance, the hall of rooms, wordless navigation, room map | A first-time visitor finds their way with no words |
| **4. Atmosphere** | Sound, grain, cursor, free-look mode, loading states (a lens slowly focusing instead of a spinner) | |
| **5. Content production** | Every remaining piece through the pipeline in Section 3 | All pieces pass the quality check |
| **6. Polish and launch** | Speed, phone testing, accessibility, search metadata, domain | Launch |

---

## 7. Open decisions

| # | Decision | Options |
|---|---|---|
| D1 | What are the pieces? | Your own artwork / public-domain old masters / commissioned. How many at launch? (Suggest 5–8 across 2 rooms.) |
| D2 | Camera method | AI video / 2.5D depth camera / test both (recommended) |
| D3 | Grand Hall format | Corridor walk (recommended) / 3D gallery / constellation |
| D4 | How strict is "no text"? | No storytelling text but the logo is allowed / absolutely zero visible letters, with the logo mark only |
| D5 | Sound | Yes, off by default (recommended) / yes, on after entering / none |
| D6 | Free-look mode after each piece | Yes / no |
| D7 | Pages beyond the museum (about, contact, shop) | None / a hidden minimal page. These would need text. |
| D8 | Name and domain | Keep OCULA / your own name |

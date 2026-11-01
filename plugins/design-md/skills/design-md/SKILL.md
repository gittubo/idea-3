---
name: design-md
description: A library of 84 ready-made DESIGN.md design systems (colours, type, spacing, components, layout rules) taken from well-known sites such as Apple, Linear, Stripe, Vercel, Notion, Airbnb, Tesla and Spotify. Use when the user asks for UI "in the style of", "like", or "inspired by" a named site or brand, wants a design system or DESIGN.md for a project, or wants help choosing a visual direction for a page.
---

# DESIGN.md library

Each file in `styles/` is a plain-text design system: tokens (colours, typography, radii, spacing), component rules and layout guidance for one site's visual language.

## Styles available

1win, airbnb, airtable, aljazeera, apple, binance, bmw-m, bmw, bugatti, cal, claude, clay, clickhouse, cohere, coinbase, composio, cursor, dell-1996, dji, elevenlabs, expo, ferrari, figma, framer, hashicorp, hp, ibm, intercom, jobright, kraken, lamborghini, linear.app, lovable, mastercard, mercury, meta, minimax, mintlify, miro, mistral.ai, mongodb, mydealz, nerdwallet, nike, nintendo-2001, notion, nvidia, ollama, opencode.ai, oracle, oura, pinterest, playstation, posthog, raycast, renault, replicate, resend, revolut, runwayml, sanity, sap, sentry, shopify, slack, spacex, spotify, starbucks, stripe, supabase, superhuman, tesla, theverge, together.ai, uber, vercel, vodafone, voltagent, warp, webflow, wired, wise, x.ai, zapier

## How to use

1. **Pick the style.**
   - The user named a site: use `styles/<name>.md` (e.g. `styles/apple.md`, `styles/linear.app.md`).
   - The user described a mood ("dark and minimal", "playful", "editorial"): read `INDEX.md`, which has one line per style, and suggest two or three that fit before committing.
2. **Read the whole style file** before writing any UI. Follow its tokens and rules exactly; don't approximate colours or fonts from memory.
3. **Apply it to the project.**
   - Building UI now: implement directly from the file's tokens (CSS variables, Tailwind theme, etc.).
   - The user wants the project to keep the style: copy the file to the project root as `DESIGN.md`, so later sessions follow it too.
4. **Keep it the user's own.** These describe the look and feel of real brands. Use them as a design language, and don't copy logos, brand names, trademarks or product imagery into the user's work, or present the result as that company's site.

## Source

Vendored from VoltAgent/awesome-design-md (MIT). See `SOURCE.md` and `LICENSE`.

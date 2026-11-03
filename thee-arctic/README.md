# THEE ARCTIC: storefront

A full fashion storefront for THEE ARCTIC: Women, Curve, Men, Kids, Sports and Beauty, plus New In, Sale, Collections, Rewards, Gift Cards, Lookbook and a Help Centre.

Built with Astro as a static site. The bag, wishlist and recently viewed items are kept in the shopper's browser until a commerce backend is connected.

## Run it

```bash
cd thee-arctic
npm ci
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
```

Node 20 or newer.

## What's in it

| Area | Where |
| --- | --- |
| Home: logo intro, Season 01 film (16:9 on desktop, 9:16 on phones), departments, categories, "Step into your best style". Spotlight carousel, popular picks, sale banner, collections, new arrivals, reviews and #THEEARCTIC grid appear automatically once products / content exist | `src/pages/index.astro`, `src/scripts/home.ts` |
| Department pages (`/women`, `/curve`, `/men`, `/kids`, `/sports`, `/beauty`) | `src/pages/[dept]/index.astro` |
| Category pages (`/men/hoodies`, `/women/dresses` …) | `src/pages/[dept]/[category].astro` |
| Filters (size, colour, price, sale, new), sort, load more | `src/components/Listing.astro` + `src/scripts/store.ts` |
| Product page: gallery, colour and size pickers, size guide, add to bag, wishlist, Klarna/Afterpay line, reviews, complete the look, you may also like, recently viewed, sticky add-to-bag on mobile | `src/pages/products/[slug].astro` |
| Mega menu, mobile menu, search overlay, bag drawer with free-shipping meter, toast | `src/components/Header.astro`, `src/layouts/Base.astro` |
| Sale, New In, Collections, Wishlist, Bag, Search, Account, Rewards, Gift Cards, Help, About, Lookbook, 404 | `src/pages/` |

## Adding your own content

- **Products:** `src/data/products.ts`, one row per piece (slug, name, department, category, number of photos, collections). Photos are in `public/products/<slug>/` as WebP: `1.webp`, `2.webp` (front/back) and `card.webp`. Price, sizes and colours are empty until supplied, so pieces show "Price coming soon".
- **Shop the look:** `src/data/looks.ts` links each outfit photo in `public/looks/` to the products worn in it. Used on the home page, the Lookbook and product pages.
- **Product photos:** put them in `public/products/<product-slug>/1.jpg, 2.jpg …` and list them in the product's `images` array. No artwork is drawn in their place: images come only from your photos.
- **Landing page / hero:** `src/data/site.ts` points at `public/media/landing-16x9.mp4` and `landing-9x16.mp4` (compressed, no audio).
- **Logo:** `src/components/Logo.astro` (instructions inside). The favicon is `public/favicon.svg`.
- **Customer photos (#THEEARCTIC grid):** `community` in `src/data/site.ts`.
- **Testimonials:** `testimonials` in `src/data/site.ts`. Empty, so the section is hidden until real reviews are added.

## Campaign

`src/components/Campaign.astro` is the cinematic campaign. It plays by itself: the eyewear film first, then each campaign photo for 6 seconds with a slow push-in, crossfading and looping. It has letterbox bars, scene progress bars and a pause button, and it only plays while on screen. It's the last section on the home page (just above the footer) and also has its own page at `/campaign`. To add or reorder scenes, edit the `scenes` list at the top of the component. A scene can be a video (`kind: 'video'`) or a photo (`kind: 'photo'`). Photos are in `public/campaign/`.

## Currency

Prices are stored in USD (`price` in `src/data/products.ts`). Each shopper sees them in their own currency: it's detected from their time zone or browser region, and they can change it in the header, footer or mobile menu. Rates come from a free public feed (open.er-api.com) and are cached for 12 hours. If the feed can't be reached, prices stay in USD. The logic is in `src/scripts/currency.ts`.

This changes what shoppers **see**. Charging in local currency is done by the payment provider (Shopify Markets or Stripe multi-currency) once checkout is connected.

## Shops and edits

`src/data/shops.ts` defines the category bar (Clothing, Dresses, Shoes, Accessories, Formal Shop…) and the Trend Report edits (Leather, Tailoring, Satin & Silk, Denim) as rules over the catalog. New products appear in them automatically. Shoes and accessories are unisex, so they're listed under both Women and Men (`alsoIn` in `products.ts`).

## Not connected yet

These parts have their UI in place but need a service behind them before the store can take orders:

- **Checkout and payments**: Shopify (Storefront API / Buy Button) or Stripe.
- **Customer accounts, order tracking**: Shopify customer accounts.
- **Product reviews**: the product page shows a reviews block with sample text. Connect Judge.me, Okendo or Yotpo before launch.
- **Newsletter and contact form**: Klaviyo, Mailchimp or Shopify Email.
- **Search** runs in the browser over `/search-index.json`, which is fine for a few thousand products.

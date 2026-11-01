# THEE ARCTIC: storefront

A full fashion storefront for THEE ARCTIC: Women, Curve, Men, Kids, Sports and Beauty, plus New In, Sale, Collections, Rewards, Gift Cards, Lookbook and a Help Centre.

Built with Astro as a static site (about 400 pages). The bag, wishlist and recently viewed items are kept in the shopper's browser until a commerce backend is connected.

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
| Home: logo intro, hero slider with snowfall, departments, spotlight carousel, category circles, popular picks, sale countdown, editorial strip, new arrivals, "Step into your best style", reviews, #THEEARCTIC grid | `src/pages/index.astro`, `src/scripts/home.ts` |
| Department pages (`/women`, `/curve`, `/men`, `/kids`, `/sports`, `/beauty`) | `src/pages/[dept]/index.astro` |
| Category pages (`/men/hoodies`, `/women/dresses` …) | `src/pages/[dept]/[category].astro` |
| Filters (size, colour, price, sale, new), sort, load more | `src/components/Listing.astro` + `src/scripts/store.ts` |
| Product page: gallery, colour and size pickers, size guide, add to bag, wishlist, Klarna/Afterpay line, reviews, complete the look, you may also like, recently viewed, sticky add-to-bag on mobile | `src/pages/products/[slug].astro` |
| Mega menu, mobile menu, search overlay, bag drawer with free-shipping meter, toast | `src/components/Header.astro`, `src/layouts/Base.astro` |
| Sale, New In, Collections, Wishlist, Bag, Search, Account, Rewards, Gift Cards, Help, About, Lookbook, 404 | `src/pages/` |

## Adding your own content

- **Products:** `src/data/catalog.ts`. The catalog is generated placeholder data. Replace `products` with your real line sheet (same fields), or connect Shopify and map its products to the same shape.
- **Product photos:** put them in `public/products/<product-slug>/1.jpg, 2.jpg …` and list them in the product's `images` array. Cards and product pages switch from the placeholder art to the photos automatically.
- **Landing page / hero:** `src/data/site.ts`. Each hero slide takes a `video` or `image` path (files go in `public/media/`), a headline, text and button.
- **Logo:** `src/components/Logo.astro` (instructions inside). The favicon is `public/favicon.svg`.
- **Customer photos (#THEEARCTIC grid):** `community` in `src/data/site.ts`.
- **Testimonials:** `testimonials` in `src/data/site.ts`. These are placeholders; replace them with real customer quotes before launch.

## Not connected yet

These parts have their UI in place but need a service behind them before the store can take orders:

- **Checkout and payments**: Shopify (Storefront API / Buy Button) or Stripe.
- **Customer accounts, order tracking**: Shopify customer accounts.
- **Product reviews**: the product page shows sample reviews and generated ratings. Connect Judge.me, Okendo or Yotpo.
- **Newsletter and contact form**: Klaviyo, Mailchimp or Shopify Email.
- **Search** runs in the browser over `/search-index.json`, which is fine for a few thousand products.

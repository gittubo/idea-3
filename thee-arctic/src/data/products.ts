// THEE ARCTIC Season 01 line. Names and photos supplied by the brand.
// Prices and sizes are temporary placeholders (see placeholderPrice); colours and descriptions stay empty until supplied.
import type { Product } from './catalog';

type Row = [slug: string, name: string, dept: string, category: string, garment: Product['garment'], views: number, collections?: string[]];

const rows: Row[] = [
  ['amara-63-wrap-mini-denim-skirt', 'Amara 63 Wrap Mini Denim Skirt', 'women', 'bottoms', 'skirt', 2],
  ['amara-63-wrapped-mini-denim-skirt', 'Amara 63 Wrapped Mini Denim Skirt', 'women', 'bottoms', 'skirt', 2],
  ['architectural-long-sleeve-jersey-top', 'Architectural Long-Sleeve Jersey Top', 'women', 'tops', 'top', 2],
  ['architectural-zip-shirt', 'Architectural Zip Shirt', 'women', 'tops', 'shirt', 2],
  ['aria-65-wrap-leather-mini-skirt', 'Aria 65 Wrap Leather Mini Skirt', 'women', 'bottoms', 'skirt', 2],
  ['astra-71-sculpted-tailored-mini-short', 'Astra 71 Sculpted Tailored Mini Short', 'women', 'bottoms', 'shorts', 2],
  ['asymmetric-jersey-tunic', 'Asymmetric Jersey Tunic', 'women', 'tops', 'top', 2],
  ['asymmetric-knit-tunic', 'Asymmetric Knit Tunic', 'women', 'tops', 'top', 2],
  ['asymmetric-leather-skirt-trouser', 'Asymmetric Leather Skirt-Trouser', 'women', 'bottoms', 'pants', 2],
  ['asymmetric-mini-skirt', 'Asymmetric Mini Skirt', 'women', 'bottoms', 'skirt', 2],
  ['asymmetric-paneled-bomber', 'Asymmetric Paneled Bomber', 'women', 'outerwear', 'jacket', 2],
  ['atelier-tailored-suit', 'Atelier Tailored Suit', 'men', 'matching-sets', 'set', 1],
  ['beanie', 'Beanie', 'men', 'accessories', 'cap', 1],
  ['belt', 'Belt', 'men', 'accessories', 'bag', 1],
  ['bomber-jacket', 'Bomber Jacket', 'men', 'outerwear', 'jacket', 1],
  ['boots', 'Boots', 'men', 'shoes', 'shoe', 1],
  ['double-layer-zip-hood', 'Double-Layer Zip Hood', 'women', 'tops', 'hoodie', 2],
  ['elara-66-wrap-cropped-cashmere-cardigan', 'Elara 66 Wrap Cropped Cashmere Cardigan', 'women', 'tops', 'top', 2],
  ['emerald-satin-draped-skirt', 'Emerald Satin Draped Skirt', 'women', 'bottoms', 'skirt', 2],
  ['espresso-wide-leg-trousers', 'Espresso Wide-Leg Trousers', 'women', 'bottoms', 'pants', 2],
  ['expedition-inspired-parka', 'Expedition Inspired Parka', 'men', 'outerwear', 'jacket', 1],
  ['flagship-overcoat', 'Flagship Overcoat', 'men', 'outerwear', 'jacket', 1],
  ['flagship-sneaker', 'Flagship Sneaker', 'men', 'shoes', 'shoe', 1],
  ['flight-cargo-pant-01', 'Flight Cargo Pant 01', 'men', 'pants', 'pants', 1],
  ['flight-jacket', 'Flight Jacket', 'men', 'outerwear', 'jacket', 1],
  ['flight-jacket-002', 'Flight Jacket 002', 'men', 'outerwear', 'jacket', 1],
  ['fluid-wide-leg-trouser', 'Fluid Wide-Leg Trouser', 'men', 'pants', 'pants', 2],
  ['glacier-hoodie', 'Glacier Hoodie', 'men', 'hoodies', 'hoodie', 1],
  ['glacier-sculpt-trousers', 'Glacier Sculpt Trousers', 'men', 'pants', 'pants', 1],
  ['high-top-boot', 'High-Top Boot', 'men', 'shoes', 'shoe', 1],
  ['knit-sweater', 'Knit Sweater', 'men', 'hoodies', 'top', 1],
  ['leather-corset-top', 'Leather Corset Top', 'women', 'tops', 'top', 2],
  ['leather-wrap-skirt', 'Leather Wrap Skirt', 'women', 'bottoms', 'skirt', 2],
  ['long-knit-skirt', 'Long Knit Skirt', 'women', 'bottoms', 'skirt', 2],
  ['long-sleeve-bodysuit', 'Long-Sleeve Bodysuit', 'women', 'tops', 'top', 2],
  ['long-sleeve-polo', 'Long-Sleeve Polo', 'men', 'shirts', 'shirt', 2],
  ['low-back-satin-top', 'Low-Back Satin Top', 'women', 'tops', 'top', 2],
  ['luxury-mini-denim-skirt', 'Luxury Mini Denim Skirt', 'women', 'bottoms', 'skirt', 2],
  ['lyra-69-sculpted-suede-cropped-jacket', 'Lyra 69 Sculpted Suede Cropped Jacket', 'women', 'outerwear', 'jacket', 2],
  ['modular-tailored-jacket', 'Modular Tailored Jacket', 'men', 'outerwear', 'jacket', 2],
  ['sculpted-tailored-jumpsuit', 'Sculpted Tailored Jumpsuit', 'women', 'jumpsuits', 'jumpsuit', 2],
  ['sculpted-tailored-vest', 'Sculpted Tailored Vest', 'men', 'outerwear', 'jacket', 2],
  ['sculpted-utility-blouson', 'Sculpted Utility Blouson', 'women', 'outerwear', 'jacket', 2],
  ['sculpted-zip-cardigan', 'Sculpted Zip Cardigan', 'men', 'hoodies', 'top', 2],
  ['shell-jacket', 'Shell Jacket', 'men', 'outerwear', 'jacket', 1],
  ['shirt', 'Shirt', 'men', 'shirts', 'shirt', 1],
  ['signature-gloves', 'Signature Gloves', 'men', 'accessories', 'bag', 1],
  ['signature-overshirt', 'Signature Overshirt', 'men', 'shirts', 'shirt', 1],
  ['silk-halter-top', 'Silk Halter Top', 'women', 'tops', 'top', 2],
  ['silk-merino-bodysuit', 'Silk-Merino Bodysuit', 'women', 'tops', 'top', 2],
  ['sling-bag', 'Sling Bag', 'men', 'accessories', 'bag', 1],
  ['snapback', 'Snapback', 'men', 'accessories', 'cap', 1],
  ['strata-system-jacket', 'Strata System Jacket', 'men', 'outerwear', 'jacket', 1],
  ['tailored-blazer-dress', 'Tailored Blazer Dress', 'women', 'dresses', 'dress', 2],
  ['trouser', 'Trouser', 'men', 'pants', 'pants', 1],
  ['utility-vest', 'Utility Vest', 'men', 'outerwear', 'jacket', 1],
  ['varsity-jacket', 'Varsity Jacket', 'men', 'outerwear', 'jacket', 1],
  ['vectoris-leather-jacket', 'Vectoris Leather Jacket', 'women', 'outerwear', 'jacket', 2],
  ['vera-62-cropped-tailored-blazer', 'Vera 62 Cropped Tailored Blazer', 'women', 'outerwear', 'jacket', 2],
  ['vera-62-pleated-mini-skirt', 'Vera 62 Pleated Mini Skirt', 'women', 'bottoms', 'skirt', 2],
  ['vera-68-sculpted-silk-back-satin-camisole', 'Véra 68 Sculpted Silk-Back Satin Camisole', 'women', 'tops', 'top', 2],
  ['watch', 'Watch', 'men', 'accessories', 'bag', 1],
  ['wrap-culotte', 'Wrap Culotte', 'women', 'bottoms', 'pants', 2],
  ['low-rise-flared-leggings-trouser', 'Low-Rise Flared Leggings Trouser', 'women', 'bottoms', 'pants', 2],
  // Batch 2: Collections 6, Dresses, Pieces That Go Together
  ['cape-top', 'Cape Top', 'women', 'tops', 'top', 2],
  ['contour-denim-jacket', 'Contour Denim Jacket', 'men', 'outerwear', 'jacket', 1],
  ['cropped-burgundy-leather-jacket', 'Cropped Burgundy Leather Jacket', 'women', 'outerwear', 'jacket', 2],
  ['cryo-shell', 'Cryo Shell', 'men', 'outerwear', 'jacket', 1],
  ['curved-panel-leather-bomber', 'Curved Panel Leather Bomber', 'men', 'outerwear', 'jacket', 2],
  ['denim-pant', 'Denim Pant', 'men', 'jeans', 'pants', 1],
  ['double-layer-knit-polo', 'Double-Layer Knit Polo', 'men', 'shirts', 'shirt', 2],
  ['sculpted-cropped-coat', 'Sculpted Cropped Coat', 'women', 'outerwear', 'jacket', 2],
  ['sculpted-drape-jacket', 'Sculpted Drape Jacket', 'women', 'outerwear', 'jacket', 2],
  ['sculpted-field-jacket', 'Sculpted Field Jacket', 'men', 'outerwear', 'jacket', 2],
  ['sculpted-hooded-sweatshirt', 'Sculpted Hooded Sweatshirt', 'men', 'hoodies', 'hoodie', 2],
  ['sculpted-knit-vest', 'Sculpted Knit Vest', 'women', 'tops', 'top', 2],
  ['sculpted-leather-shirt-jacket', 'Sculpted Leather Shirt Jacket', 'men', 'outerwear', 'jacket', 2],
  ['sculpted-long-line-knit-coat', 'Sculpted Long Line Knit Coat', 'women', 'outerwear', 'jacket', 2],
  ['sculpted-pleated-short', 'Sculpted Pleated Short', 'women', 'bottoms', 'shorts', 2],
  ['asymmetric-tailored-dress', 'Asymmetric Tailored Dress', 'women', 'dresses', 'dress', 2],
  ['bias-cut-midi-dress', 'Bias-Cut Midi Dress', 'women', 'dresses', 'dress', 2],
  ['burgundy-leather-dress', 'Burgundy Leather Dress', 'women', 'dresses', 'dress', 2],
  ['champagne-draped-halter-dress', 'Champagne Draped Halter Dress', 'women', 'dresses', 'dress', 2],
  ['copper-satin-gown', 'Copper Satin Gown', 'women', 'dresses', 'dress', 2],
  ['dusty-rose-satin-slip-dress', 'Dusty Rose Satin Slip Dress', 'women', 'dresses', 'dress', 2],
  ['emerald-off-shoulder-knit-dress', 'Emerald Off-Shoulder Knit Dress', 'women', 'dresses', 'dress', 2],
  ['ivory-sculpted-strapless-gown', 'Ivory Sculpted Strapless Gown', 'women', 'dresses', 'dress', 2],
  ['midnight-satin-gown', 'Midnight Satin Gown', 'women', 'dresses', 'dress', 2],
  ['off-shoulder-leather-midi-dress', 'Off-Shoulder Leather Midi Dress', 'women', 'dresses', 'dress', 2],
  ['satin-mini-dress', 'Satin Mini Dress', 'women', 'dresses', 'dress', 2],
  ['selene-64-sculpted-open-back-knit-dress', 'Selene 64 Sculpted Open-Back Knit Dress', 'women', 'dresses', 'dress', 2],
  ['silk-backed-satin-corset-gown', 'Silk-Backed Satin Corset Gown', 'women', 'dresses', 'dress', 2],
  ['amelia-two-piece-set', 'Amélia Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['amelie-two-piece-set', 'Amélie Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['ariane-two-piece-set', 'Ariane Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['astra-sleeveless-top-and-high-waisted-fluid-trouser', 'Astra Sleeveless Top and High-Waisted Fluid Trouser', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['aveline-draped-top-and-high-waisted-leather-midi-skirt', 'Aveline Draped Top and High-Waisted Leather Midi Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['aven-03-leather-corset-top-and-wide-leg-trouser', 'Aven 03 Leather Corset Top and Wide-Leg Trouser', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['calista-draped-palazzo-two-piece-set', 'Calista Draped Palazzo Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['clementine-two-piece-set', 'Clémentine Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['celia-open-back-top-and-fluid-asymmetric-maxi-skirt', 'Célia Open-Back Top and Fluid Asymmetric Maxi Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['elara-draped-top-and-high-waisted-mini-skirt', 'Elara Draped Top and High-Waisted Mini Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['eleonore-two-piece-set', 'Eléonore Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['isabelle-two-piece-set', 'Isabelle Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['isadora-bandeau-top-and-tailored-flared-trouser', 'Isadora Bandeau Top and Tailored Flared Trouser', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['isolde-two-piece', 'Isolde Two-Piece', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['lucienne-plum-cape-top-and-asymmetric-skirt-set', 'Lucienne Plum Cape Top and Asymmetric Skirt Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['lucienne-two-piece-taupe-suit', 'Lucienne Two-Piece Taupe Suit', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['leona-knit-top-and-high-waisted-mini-skirt', 'Léona Knit Top and High-Waisted Mini Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['marielle-two-piece-set', 'Mariélle Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['maera-asymmetric-top-and-tailored-wide-leg-trouser', 'Maéra Asymmetric Top and Tailored Wide-Leg Trouser', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['mirelle-bustier-top-and-flowing-asymmetric-trouser', 'Mirelle Bustier Top and Flowing Asymmetric Trouser', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['elan-asymmetric-two-piece', 'Élan Asymmetric Two-Piece', 'women', 'matching-sets', 'set', 1, ['pieces-that-go-together']],
  ['elisea-draped-camisole-and-architectural-flared-midi-skirt', 'Éliséa Draped Camisole and Architectural Flared Midi Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['elodie-two-piece-set', 'Élodie Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['nova-blazer-top-fluid-mini-skirt', 'Nova Blazer Top + Fluid Mini Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['noemie-two-piece-set', 'Noémie Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['orielle-keyhole-top-and-pleated-maxi-skirt', 'Orielle Keyhole Top and Pleated Maxi Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['rosalie-two-piece-set', 'Rosalie Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['savina-sculpted-peplum-top-and-high-waisted-tapered-trouser', 'Savina Sculpted Peplum Top and High-Waisted Tapered Trouser', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['seraphina-two-piece-couture-set', 'Seraphina Two-Piece Couture Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['seren-satin-top-and-asymmetric-maxi-skirt', 'Seren Satin Top and Asymmetric Maxi Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['solara-halter-bustier-and-fluid-wide-leg-trouser', 'Solara Halter Bustier and Fluid Wide-Leg Trouser', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['sera-silk-halter-and-asymmetric-midi-skirt', 'Séra Silk Halter and Asymmetric Midi Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['valentine-two-piece-set', 'Valentine Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['valora-one-shoulder-top-and-draped-midi-skirt', 'Valora One-Shoulder Top and Draped Midi Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['violette-two-piece-set', 'Violette Two-Piece Set', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['velia-wrap-top-and-fluid-midi-skirt', 'Vélia Wrap Top and Fluid Midi Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['vera-off-shoulder-top-and-asymmetric-mini-skirt', 'Véra Off-Shoulder Top and Asymmetric Mini Skirt', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  ['verona-two-piece', 'Vérona Two-Piece', 'women', 'matching-sets', 'set', 2, ['pieces-that-go-together']],
  // Batch 3
  ['arctic-zip-boots', 'Arctic Zip Boots', 'men', 'shoes', 'shoe', 1],
];

// TEMPORARY placeholder prices (USD) until the real price list arrives.
// Each piece gets a stable price inside a range that suits its type; replace with real prices when supplied.
const RANGES: [RegExp, number, number][] = [
  [/watch/i, 180, 320], [/gown|couture/i, 190, 340], [/suit/i, 220, 380], [/leather/i, 150, 320],
  [/parka|overcoat|coat/i, 180, 360], [/boot|sneaker/i, 120, 260], [/bag/i, 85, 160],
  [/glove/i, 55, 95], [/belt/i, 45, 85], [/beanie|snapback|cap/i, 35, 55],
];
const BY_CATEGORY: Record<string, [number, number]> = {
  tops: [45, 95], shirts: [55, 110], tees: [35, 65], hoodies: [65, 140], bottoms: [55, 120], pants: [65, 135],
  jeans: [70, 140], shorts: [45, 85], dresses: [85, 220], 'matching-sets': [110, 240], jumpsuits: [95, 180],
  outerwear: [140, 300], shoes: [120, 260], accessories: [40, 120],
};
function placeholderPrice(slug: string, name: string, category: string): number {
  let h = 2166136261;
  for (const ch of slug) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const [lo, hi] = RANGES.find(([re]) => re.test(name))?.slice(1) as [number, number] ?? BY_CATEGORY[category] ?? [50, 120];
  return Math.round((lo + (h % 1000) / 1000 * (hi - lo)) / 5) * 5;
}

// TEMPORARY placeholder sale: about 1 in 6 pieces marked down 20–50%. Remove or replace with real markdowns.
function placeholderSale(slug: string, price: number): number | undefined {
  let h = 5381;
  for (const ch of slug) h = (Math.imul(h, 33) ^ ch.charCodeAt(0)) >>> 0;
  if (h % 6 !== 0) return undefined;
  const off = [0.2, 0.25, 0.3, 0.4, 0.5][(h >>> 3) % 5];
  return Math.round((price * (1 - off)) / 5) * 5;
}

export const lineup: Product[] = rows.map(([slug, name, dept, category, garment, views, collections = []]) => ({
  slug, name, dept, category, garment,
  price: placeholderPrice(slug, name, category),
  salePrice: placeholderSale(slug, placeholderPrice(slug, name, category)),
  colors: [],
  // Temporary: every piece offers S–XXL until the real size runs are supplied
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  isNew: true,
  bestseller: false,
  rating: 0,
  reviews: 0,
  collections,
  description: '',
  details: [],
  images: Array.from({ length: views }, (_, i) => `/products/${slug}/${i + 1}.webp`),
  card: `/products/${slug}/card.webp`,
  // Shoes and accessories are unisex: list them under Women as well as Men
  alsoIn: dept === 'men' && (category === 'shoes' || category === 'accessories') ? ['women'] : [],
}));

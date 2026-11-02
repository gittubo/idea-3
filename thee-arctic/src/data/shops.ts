// Cross-department shops (Fashion Nova-style category bar) and trend edits.
// Each shop is a rule over the catalog, so new products fall into place automatically.
import { products, type Product } from './catalog';

export interface Shop { slug: string; name: string; blurb: string; match: (p: Product) => boolean; trend?: boolean }

const has = (re: RegExp) => (p: Product) => re.test(p.name);
const cat = (...c: string[]) => (p: Product) => c.includes(p.category);

export const shops: Shop[] = [
  { slug: 'clothing', name: 'Clothing', blurb: 'Every piece of clothing, across the line.', match: (p) => !['shoes', 'accessories'].includes(p.category) },
  { slug: 'dresses', name: 'Dresses', blurb: 'Gowns, slips, minis and midis.', match: cat('dresses') },
  { slug: 'matching-sets', name: 'Matching Sets', blurb: 'Two-piece sets made to be worn together.', match: cat('matching-sets') },
  { slug: 'tops', name: 'Tops', blurb: 'Bodysuits, camisoles, shirts and knits.', match: cat('tops', 'shirts', 'tees', 'hoodies') },
  { slug: 'bottoms', name: 'Bottoms', blurb: 'Skirts, trousers, shorts and denim.', match: cat('bottoms', 'pants', 'shorts', 'jeans') },
  { slug: 'jackets', name: 'Jackets & Coats', blurb: 'Outerwear, from bombers to overcoats.', match: cat('outerwear') },
  { slug: 'knitwear', name: 'Knitwear', blurb: 'Knits, cardigans and sweaters.', match: has(/knit|sweater|cardigan/i) },
  { slug: 'shoes', name: 'Shoes', blurb: 'Boots and sneakers.', match: cat('shoes') },
  { slug: 'accessories', name: 'Accessories', blurb: 'Bags, caps, gloves, belts and watches.', match: cat('accessories') },
  { slug: 'formal', name: 'Formal Shop', blurb: 'Gowns, suits and tailoring for the occasion.', match: has(/gown|suit|blazer|tailored dress|couture/i) },
  // Trend report edits
  { slug: 'leather', name: 'Leather', blurb: 'Leather, from corset tops to bombers.', match: has(/leather/i), trend: true },
  { slug: 'tailoring', name: 'Tailoring', blurb: 'Blazers, suits and sharp trousers.', match: has(/tailored|suit|blazer|trouser/i), trend: true },
  { slug: 'satin-silk', name: 'Satin & Silk', blurb: 'Fluid satin and silk pieces.', match: has(/satin|silk/i), trend: true },
  { slug: 'denim', name: 'Denim', blurb: 'Denim skirts, jackets and jeans.', match: has(/denim/i), trend: true },
];

export const inShop = (s: Shop) => products.filter(s.match);
export const shopCover = (s: Shop) => { const p = inShop(s)[0]; return p?.card ?? p?.images[0]; };
export const getShop = (slug: string) => shops.find((s) => s.slug === slug);
/** Category-bar order */
export const catbar = ['clothing', 'dresses', 'matching-sets', 'tops', 'bottoms', 'jackets', 'knitwear', 'shoes', 'accessories', 'formal'];

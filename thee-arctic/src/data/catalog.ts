// THEE ARCTIC catalog.
// Departments and categories mirror a full fashion store (Women, Curve, Men, Kids, Sports, Beauty).
// Products are generated placeholders until the real line sheet arrives: replace `products`
// with real entries (same shape) and drop photos in /public/products/<slug>/1.jpg, 2.jpg …
import type { Garment } from './garments';

export interface Category { slug: string; name: string; garment: Garment[] }
export interface Department {
  slug: string;
  name: string;          // "Men"
  title: string;         // "THEE ARCTIC MEN"
  tagline: string;
  blurb: string;
  tint: string;          // hero tint
  categories: Category[];
}
export interface Color { name: string; hex: string }
export interface Product {
  slug: string;
  name: string;
  dept: string;
  category: string;
  garment: Garment;
  price: number;
  salePrice?: number;
  colors: Color[];
  sizes: string[];
  isNew: boolean;
  bestseller: boolean;
  rating: number;
  reviews: number;
  collections: string[];
  description: string;
  details: string[];
  /** Real photos, e.g. ['/products/<slug>/1.jpg']. Empty = placeholder art. */
  images: string[];
}

export const departments: Department[] = [
  {
    slug: 'women', name: 'Women', title: 'THEE ARCTIC WOMEN', tint: '#e9eef5',
    tagline: 'Cold looks. Hot fits.',
    blurb: 'Dresses, sets, denim and outerwear cut sharp for every season.',
    categories: [
      { slug: 'dresses', name: 'Dresses', garment: ['dress'] },
      { slug: 'tops', name: 'Tops', garment: ['top', 'tee', 'shirt'] },
      { slug: 'matching-sets', name: 'Matching Sets', garment: ['set'] },
      { slug: 'jeans', name: 'Jeans', garment: ['pants'] },
      { slug: 'bottoms', name: 'Pants & Skirts', garment: ['pants', 'skirt', 'shorts'] },
      { slug: 'jumpsuits', name: 'Jumpsuits & Rompers', garment: ['jumpsuit'] },
      { slug: 'outerwear', name: 'Jackets & Coats', garment: ['jacket'] },
      { slug: 'swim', name: 'Swimwear', garment: ['swim'] },
      { slug: 'shoes', name: 'Shoes', garment: ['shoe'] },
      { slug: 'accessories', name: 'Accessories', garment: ['bag', 'cap'] },
    ],
  },
  {
    slug: 'curve', name: 'Curve', title: 'THEE ARCTIC CURVE', tint: '#efe9f3',
    tagline: 'Made for every curve.',
    blurb: 'The full Arctic line in sizes 1X–4X, fitted on real curves.',
    categories: [
      { slug: 'dresses', name: 'Dresses', garment: ['dress'] },
      { slug: 'tops', name: 'Tops', garment: ['top', 'tee'] },
      { slug: 'matching-sets', name: 'Matching Sets', garment: ['set'] },
      { slug: 'jeans', name: 'Jeans', garment: ['pants'] },
      { slug: 'outerwear', name: 'Jackets & Coats', garment: ['jacket'] },
      { slug: 'swim', name: 'Swimwear', garment: ['swim'] },
    ],
  },
  {
    slug: 'men', name: 'Men', title: 'THEE ARCTIC MEN', tint: '#e6ebef',
    tagline: 'Built for the cold. Worn everywhere.',
    blurb: 'Heavyweight hoodies, denim, outerwear and essentials.',
    categories: [
      { slug: 'hoodies', name: 'Hoodies & Sweatshirts', garment: ['hoodie'] },
      { slug: 'tees', name: 'T-Shirts', garment: ['tee'] },
      { slug: 'shirts', name: 'Shirts', garment: ['shirt'] },
      { slug: 'jeans', name: 'Jeans', garment: ['pants'] },
      { slug: 'pants', name: 'Pants & Joggers', garment: ['pants'] },
      { slug: 'shorts', name: 'Shorts', garment: ['shorts'] },
      { slug: 'outerwear', name: 'Jackets & Coats', garment: ['jacket'] },
      { slug: 'matching-sets', name: 'Matching Sets', garment: ['set'] },
      { slug: 'shoes', name: 'Shoes', garment: ['shoe'] },
      { slug: 'accessories', name: 'Accessories', garment: ['cap', 'bag'] },
    ],
  },
  {
    slug: 'kids', name: 'Kids', title: 'THEE ARCTIC KIDS', tint: '#e8f2f0',
    tagline: 'Little legends, big fits.',
    blurb: 'Girls, boys and Mini Me sets that match the grown-ups.',
    categories: [
      { slug: 'girls', name: 'Girls', garment: ['dress', 'top', 'set'] },
      { slug: 'boys', name: 'Boys', garment: ['hoodie', 'tee', 'pants'] },
      { slug: 'mini-me', name: 'Mini Me', garment: ['set'] },
      { slug: 'outerwear', name: 'Outerwear', garment: ['jacket'] },
      { slug: 'shoes', name: 'Shoes', garment: ['shoe'] },
    ],
  },
  {
    slug: 'sports', name: 'Sports', title: 'THEE ARCTIC SPORTS', tint: '#e4eef6',
    tagline: 'Train in the cold. Peak in the heat.',
    blurb: 'Performance sets, leggings and layers that move with you.',
    categories: [
      { slug: 'leggings', name: 'Leggings', garment: ['leggings'] },
      { slug: 'sports-bras', name: 'Sports Bras', garment: ['bra'] },
      { slug: 'sets', name: 'Active Sets', garment: ['set'] },
      { slug: 'tops', name: 'Training Tops', garment: ['tee', 'top'] },
      { slug: 'shorts', name: 'Shorts', garment: ['shorts'] },
      { slug: 'joggers', name: 'Joggers', garment: ['pants'] },
      { slug: 'layers', name: 'Jackets & Layers', garment: ['jacket', 'hoodie'] },
    ],
  },
  {
    slug: 'beauty', name: 'Beauty', title: 'THEE ARCTIC BEAUTY', tint: '#f3ecea',
    tagline: 'Glow below zero.',
    blurb: 'Skincare, makeup and fragrance with a frost-clean finish.',
    categories: [
      { slug: 'makeup', name: 'Makeup', garment: ['compact', 'bottle'] },
      { slug: 'skincare', name: 'Skincare', garment: ['bottle'] },
      { slug: 'fragrance', name: 'Fragrance', garment: ['bottle'] },
      { slug: 'hair', name: 'Hair & Body', garment: ['bottle'] },
    ],
  },
];

export interface Collection { slug: string; name: string; blurb: string }
export const collections: Collection[] = [
  { slug: 'arctic-essentials', name: 'Arctic Essentials', blurb: 'The everyday staples. Clean, heavy, forever.' },
  { slug: 'polar-night', name: 'Polar Night', blurb: 'An all-black capsule for after dark.' },
  { slug: 'whiteout', name: 'Whiteout', blurb: 'Tonal whites and ice greys, head to toe.' },
  { slug: 'expedition', name: 'Expedition', blurb: 'Technical outerwear built for real weather.' },
];

export const palette: Color[] = [
  { name: 'Black', hex: '#15171a' },
  { name: 'Snow', hex: '#f1f2f0' },
  { name: 'Ice Grey', hex: '#c9cfd4' },
  { name: 'Glacier', hex: '#8ec3e6' },
  { name: 'Navy', hex: '#1d2b44' },
  { name: 'Slate', hex: '#5d6873' },
  { name: 'Sand', hex: '#d8c6a8' },
  { name: 'Mocha', hex: '#6b4f3f' },
  { name: 'Olive', hex: '#5d6646' },
  { name: 'Blush', hex: '#e7b9b8' },
  { name: 'Lilac', hex: '#b9a8d6' },
  { name: 'Cherry', hex: '#a3202c' },
  { name: 'Denim', hex: '#4b6a8f' },
  { name: 'Aurora', hex: '#3fb49a' },
];

const sizeSets: Record<string, string[]> = {
  default: ['XS', 'S', 'M', 'L', 'XL'],
  curve: ['1X', '2X', '3X', '4X'],
  men: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
  kids: ['2T', '4', '6', '8', '10', '12'],
  jeans: ['24', '26', '28', '30', '32', '34'],
  shoe: ['6', '7', '8', '9', '10', '11'],
  one: ['One Size'],
};

const names: Record<Garment, [string[], string[]]> = {
  tee: [['Heavyweight', 'Boxy', 'Frost', 'Tundra', 'Oversized', 'Graphic', 'Core'], ['Tee', 'T-Shirt', 'Crew Tee']],
  top: [['Glacier', 'Frost', 'Snowdrift', 'Icicle', 'Crystal', 'Polar'], ['Corset Top', 'Cami', 'Crop Top', 'Bodysuit', 'Tube Top']],
  hoodie: [['Polar', 'Arctic', 'Heavyweight', 'Tundra', 'Blizzard', 'Avalanche'], ['Hoodie', 'Zip-Up Hoodie', 'Pullover']],
  jacket: [['Expedition', 'Puffer', 'Glacier', 'Storm', 'Summit', 'Iceberg'], ['Jacket', 'Puffer Jacket', 'Bomber', 'Trench Coat', 'Shell']],
  shirt: [['Ink Linen', 'Frost Poplin', 'Boxy', 'Cuban', 'Oxford'], ['Shirt', 'Button-Up', 'Overshirt']],
  pants: [['Baggy', 'Wide Leg', 'Straight', 'Cargo', 'Flare', 'Relaxed'], ['Jeans', 'Cargo Pants', 'Trousers', 'Joggers']],
  leggings: [['Sculpt', 'Second Skin', 'Contour', 'Flex', 'Peak'], ['Leggings', 'Flare Leggings', 'Bike Shorts']],
  shorts: [['Mesh', 'Cargo', 'Denim', 'Fleece', 'Runner'], ['Shorts', 'Jorts', 'Sweatshorts']],
  skirt: [['Frost', 'Pleated', 'Satin', 'Denim'], ['Mini Skirt', 'Midi Skirt', 'Maxi Skirt']],
  dress: [['Midnight', 'Snow Queen', 'Aurora', 'Frostbite', 'Crystal', 'Northern'], ['Maxi Dress', 'Mini Dress', 'Midi Dress', 'Bodycon Dress', 'Slip Dress']],
  jumpsuit: [['Glacier', 'Night Shift', 'Polar', 'Frost'], ['Jumpsuit', 'Romper', 'Catsuit']],
  set: [['Midnight Cami', 'Unbroken Stripe', 'Fleece Lounge', 'Tundra Knit', 'Ice Tech', 'Frost'], ['Set', '2-Piece Set', 'Track Set']],
  swim: [['Iceberg', 'Lagoon', 'Floe', 'Riviera', 'Polar'], ['Bikini', 'Bikini Set', 'One-Piece']],
  bra: [['Sculpt', 'Airlift', 'Crossback', 'Peak'], ['Sports Bra', 'Bralette']],
  shoe: [['Glacier', 'Tundra', 'Snowline', 'Arctic Runner', 'Drift'], ['Sneakers', 'Boots', 'Platform Sneakers', 'Slides']],
  bag: [['Polar', 'Frost', 'Ice', 'Expedition'], ['Shoulder Bag', 'Tote', 'Crossbody', 'Mini Bag']],
  cap: [['Arctic', 'Logo', 'Frost', 'Washed'], ['Cap', 'Trucker Hat', 'Beanie']],
  bottle: [['Frost Glow', 'Ice Water', 'Glacier Dew', 'Snowmelt', 'Polar Bloom'], ['Serum', 'Moisturiser', 'Eau de Parfum', 'Body Oil', 'Lip Oil', 'Shampoo']],
  compact: [['Aurora', 'Frostbite', 'Ice Queen', 'Midnight'], ['Eyeshadow Palette', 'Highlighter', 'Blush Duo']],
};

const descriptions: Partial<Record<Garment, string>> = {
  hoodie: 'Heavyweight brushed fleece with a double-layer hood and dropped shoulders for that relaxed, boxy fall.',
  jacket: 'Weather-ready outer shell with a warm lining, storm cuffs and a fit made to layer over anything.',
  dress: 'Body-skimming fit in a soft stretch fabric that moves with you from day to night.',
  set: 'A head-to-toe matching set. Wear it together or break it up across your wardrobe.',
  pants: 'Relaxed through the leg with a clean waistband and a drape that stacks just right.',
  bottle: 'A clean, frost-cool formula made to layer into your daily routine.',
};

// Deterministic pseudo-random so every build produces the same catalog.
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function sizesFor(dept: string, cat: string, g: Garment): string[] {
  if (['bag', 'cap', 'bottle', 'compact'].includes(g)) return sizeSets.one;
  if (g === 'shoe') return sizeSets.shoe;
  if (dept === 'kids') return sizeSets.kids;
  if (dept === 'curve') return sizeSets.curve;
  if (cat === 'jeans') return sizeSets.jeans;
  if (dept === 'men') return sizeSets.men;
  return sizeSets.default;
}

function generate(): Product[] {
  const out: Product[] = [];
  const used = new Set<string>();
  const rand = rng(20261101);
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
  const perCat = 8;
  for (const d of departments) {
    for (const c of d.categories) {
      for (let i = 0; i < perCat; i++) {
        const g = c.garment[i % c.garment.length];
        const [adj, noun] = names[g];
        let name = `${pick(adj)} ${pick(noun)}`;
        if (c.slug === 'mini-me') name = `Mini Me ${name}`;
        else if (d.slug === 'kids') name = `Kids ${name}`;
        let slug = slugify(name);
        let n = 2;
        while (used.has(slug)) slug = `${slugify(name)}-${n++}`;
        used.add(slug);

        const colorCount = 1 + Math.floor(rand() * 4);
        const colors: Color[] = [];
        while (colors.length < colorCount) {
          const col = pick(palette);
          if (!colors.includes(col)) colors.push(col);
        }
        const base = d.slug === 'kids' ? 14 : d.slug === 'beauty' ? 12 : 20;
        const span = g === 'jacket' ? 90 : g === 'shoe' ? 70 : 45;
        const price = Math.round(base + rand() * span) - 0.01;
        const sale = rand() < 0.26;
        const salePrice = sale ? Math.round(price * (0.5 + rand() * 0.25)) - 0.01 : undefined;
        const coll: string[] = [];
        if (colors.some((x) => x.name === 'Black')) coll.push('polar-night');
        if (colors.some((x) => x.name === 'Snow' || x.name === 'Ice Grey')) coll.push('whiteout');
        if (['hoodie', 'tee', 'pants', 'leggings'].includes(g) && rand() < 0.6) coll.push('arctic-essentials');
        if (g === 'jacket' || (g === 'shoe' && rand() < 0.4)) coll.push('expedition');
        const beauty = g === 'bottle' || g === 'compact';

        out.push({
          slug, name, dept: d.slug, category: c.slug, garment: g,
          price, salePrice, colors,
          sizes: sizesFor(d.slug, c.slug, g),
          isNew: rand() < 0.3,
          bestseller: rand() < 0.18,
          rating: Math.round((3.8 + rand() * 1.2) * 10) / 10,
          reviews: Math.floor(rand() * 900) + 4,
          collections: coll,
          description: descriptions[g] ?? 'A THEE ARCTIC staple with a sharp silhouette and a soft hand-feel, made to be worn on repeat.',
          details: beauty
            ? ['Cruelty-free and vegan', 'Dermatologist tested', 'Free from parabens and sulfates', 'Made in the USA']
            : [
                d.slug === 'kids' ? 'Relaxed fit with room to grow' : 'Model is 5\'9" and wears a size S',
                rand() < 0.5 ? '100% Cotton' : '95% Polyester, 5% Spandex',
                'Machine wash cold, hang dry',
                'Imported',
              ],
          images: [],
        });
      }
    }
  }
  return out;
}

export const products: Product[] = generate();

export const bySlug = new Map(products.map((p) => [p.slug, p]));
export const getDept = (slug: string) => departments.find((d) => d.slug === slug);
export const inDept = (d: string) => products.filter((p) => p.dept === d);
export const inCategory = (d: string, c: string) => products.filter((p) => p.dept === d && p.category === c);
export const inCollection = (c: string) => products.filter((p) => p.collections.includes(c));
export const onSale = () => products.filter((p) => p.salePrice);
export const newIn = () => products.filter((p) => p.isNew);
export const bestsellers = () => products.filter((p) => p.bestseller);
export const money = (n: number) => `$${n.toFixed(2)}`;
export const discount = (p: Product) => (p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0);
export const productUrl = (p: Product) => `/products/${p.slug}`;

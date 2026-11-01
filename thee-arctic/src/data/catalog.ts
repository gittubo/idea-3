// THEE ARCTIC catalog.
// Departments and categories mirror a full fashion store (Women, Curve, Men, Kids, Sports, Beauty).
import type { Garment } from './garments';
import { lineup } from './products';

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
  /** Undefined until the brand sets a price: the product shows "Price coming soon" and can't be added to the bag. */
  price?: number;
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
  /** 3:4 card image for listings; falls back to images[0]. */
  card?: string;
}

export const departments: Department[] = [
  {
    slug: 'women', name: 'Women', title: 'THEE ARCTIC WOMEN', tint: '#f2efea',
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
    slug: 'curve', name: 'Curve', title: 'THEE ARCTIC CURVE', tint: '#f2efea',
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
    slug: 'men', name: 'Men', title: 'THEE ARCTIC MEN', tint: '#f2efea',
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
    slug: 'kids', name: 'Kids', title: 'THEE ARCTIC KIDS', tint: '#f2efea',
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
    slug: 'sports', name: 'Sports', title: 'THEE ARCTIC SPORTS', tint: '#f2efea',
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
    slug: 'beauty', name: 'Beauty', title: 'THEE ARCTIC BEAUTY', tint: '#f2efea',
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

export interface Collection { slug: string; name: string; blurb: string; cover: string }
export const collections: Collection[] = [
  { slug: 'pieces-that-go-together', name: 'Pieces That Go Together', blurb: 'Two-piece sets made to be worn together.', cover: '/products/isabelle-two-piece-set/card.webp' },
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

// Products live in ./products.ts (one row per piece, photos in /public/products/<slug>/).
export const products: Product[] = lineup;

export const bySlug = new Map(products.map((p) => [p.slug, p]));
export const getDept = (slug: string) => departments.find((d) => d.slug === slug);
export const inDept = (d: string) => products.filter((p) => p.dept === d);
export const inCategory = (d: string, c: string) => products.filter((p) => p.dept === d && p.category === c);
export const inCollection = (c: string) => products.filter((p) => p.collections.includes(c));
export const onSale = () => products.filter((p) => p.salePrice);
export const newIn = () => products.filter((p) => p.isNew);
export const bestsellers = () => products.filter((p) => p.bestseller);
export const money = (n: number) => `$${n.toFixed(2)}`;
export const discount = (p: Product) => (p.salePrice && p.price ? Math.round((1 - p.salePrice / p.price) * 100) : 0);
/** Price the shopper pays, or undefined when not yet priced. */
export const priceOf = (p: Product) => p.salePrice ?? p.price;
export const canBuy = (p: Product) => priceOf(p) !== undefined && p.sizes.length > 0;
export const productUrl = (p: Product) => `/products/${p.slug}`;

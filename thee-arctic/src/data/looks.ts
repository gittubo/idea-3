// "Pieces that go together": on-model outfit photos supplied by the brand.
// `items` lists the catalog products visible in each photo. Only confident matches are linked;
// pieces worn in a photo that aren't in the catalog yet are left out.
import { bySlug, type Product } from './catalog';

export interface Look { id: string; image: string; dept: 'women' | 'men'; items: string[] }

export const looks: Look[] = [
  { id: 'look-01', image: '/looks/look-01.webp', dept: 'women', items: ['long-sleeve-bodysuit', 'flight-cargo-pant-01', 'signature-gloves'] },
  { id: 'look-02', image: '/looks/look-02.webp', dept: 'men', items: ['flight-cargo-pant-01', 'signature-gloves'] },
  { id: 'look-03', image: '/looks/look-03.webp', dept: 'men', items: [] },
  { id: 'look-04', image: '/looks/look-04.webp', dept: 'men', items: ['fluid-wide-leg-trouser'] },
  { id: 'look-05', image: '/looks/look-05.webp', dept: 'men', items: ['utility-vest', 'trouser'] },
  { id: 'look-06', image: '/looks/look-06.webp', dept: 'men', items: ['glacier-hoodie', 'denim-pant', 'flagship-sneaker'] },
  { id: 'look-07', image: '/looks/look-07.webp', dept: 'men', items: ['signature-overshirt', 'trouser'] },
  { id: 'look-08', image: '/looks/look-08.webp', dept: 'women', items: ['silk-halter-top', 'asymmetric-mini-skirt'] },
  { id: 'look-09', image: '/looks/look-09.webp', dept: 'women', items: ['amara-63-wrapped-mini-denim-skirt'] },
];

export const lookItems = (l: Look): Product[] => l.items.map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
export const looksWith = (slug: string) => looks.filter((l) => l.items.includes(slug));

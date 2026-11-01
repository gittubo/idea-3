// Compact product index fetched by the search overlay, search page and "recently viewed".
import type { APIRoute } from 'astro';
import { products, getDept } from '../data/catalog';

export const GET: APIRoute = () => {
  const rows = products.map((p) => {
    const d = getDept(p.dept)!;
    return {
      s: p.slug,
      n: p.name,
      d: d.name,
      c: d.categories.find((c) => c.slug === p.category)!.name,
      p: p.price,
      sp: p.salePrice,
      g: p.garment,
      h: p.colors[0].hex,
      cn: p.colors[0].name,
      i: p.images[0],
    };
  });
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
};

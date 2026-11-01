// Placeholder silhouettes shown until real product photography is added.
// Shared by the server-rendered cards and the client-rendered cart, so both look the same.

export type Garment =
  | 'tee' | 'top' | 'hoodie' | 'jacket' | 'shirt' | 'pants' | 'leggings' | 'shorts' | 'dress'
  | 'jumpsuit' | 'set' | 'swim' | 'bra' | 'shoe' | 'bag' | 'cap' | 'bottle' | 'compact' | 'skirt';

// Each garment is a list of [path, tone, stroke?]. Tone: 0 base colour, 1 darker detail, 2 lighter detail.
type Part = [string, 0 | 1 | 2, boolean?];

const shapes: Record<Garment, Part[]> = {
  tee: [
    ['M70 38 L86 30 Q100 42 114 30 L130 38 L168 70 L150 92 L138 82 L138 222 L62 222 L62 82 L50 92 L32 70 Z', 0],
    ['M86 30 Q100 42 114 30 L111 28 Q100 38 89 28 Z', 1],
  ],
  top: [
    ['M76 34 L80 34 L86 66 Q100 74 114 66 L120 34 L124 34 L130 76 L140 176 L60 176 L70 76 Z', 0],
    ['M60 176 L140 176 L141 184 L59 184 Z', 1],
  ],
  hoodie: [
    ['M66 52 Q70 20 100 16 Q130 20 134 52 L162 64 L184 196 L162 200 L146 102 L146 228 L54 228 L54 102 L38 200 L16 196 L38 64 Z', 0],
    ['M80 52 Q84 30 100 28 Q116 30 120 52 Q100 62 80 52 Z', 1],
    ['M72 160 L128 160 L134 196 L66 196 Z', 1],
    ['M94 58 L95 92 M106 58 L105 92', 2, true],
  ],
  jacket: [
    ['M70 34 L88 26 L100 40 L112 26 L130 34 L162 58 L184 198 L162 202 L148 100 L148 230 L52 230 L52 100 L38 202 L16 198 L38 58 Z', 0],
    ['M88 26 L100 40 L112 26 L118 30 L100 54 L82 30 Z', 1],
    ['M99 54 L101 54 L101 230 L99 230 Z', 1],
    ['M64 150 L84 150 L84 156 L64 156 Z M116 150 L136 150 L136 156 L116 156 Z', 1],
  ],
  shirt: [
    ['M70 34 L88 28 L100 44 L112 28 L130 34 L164 60 L180 180 L160 184 L146 98 L146 226 L54 226 L54 98 L40 184 L20 180 L36 60 Z', 0],
    ['M88 28 L100 44 L112 28 L114 36 L100 52 L86 36 Z', 2],
    ['M99 52 L101 52 L101 226 L99 226 Z', 1],
  ],
  pants: [
    ['M62 22 L138 22 L150 236 L112 236 L100 84 L88 236 L50 236 Z', 0],
    ['M62 22 L138 22 L139 34 L61 34 Z', 1],
    ['M99 34 L101 34 L101 70 L99 70 Z', 1],
  ],
  leggings: [
    ['M68 24 L132 24 L136 236 L110 236 L100 92 L90 236 L64 236 Z', 0],
    ['M68 24 L132 24 L133 44 L67 44 Z', 1],
  ],
  shorts: [
    ['M56 62 L144 62 L158 172 L108 178 L100 108 L92 178 L42 172 Z', 0],
    ['M56 62 L144 62 L145 76 L55 76 Z', 1],
  ],
  skirt: [
    ['M70 52 L130 52 L162 210 Q100 222 38 210 Z', 0],
    ['M70 52 L130 52 L132 66 L68 66 Z', 1],
  ],
  dress: [
    ['M78 22 L88 22 Q100 40 112 22 L122 22 L126 72 Q118 92 130 102 L168 236 L32 236 L70 102 Q82 92 74 72 Z', 0],
    ['M70 102 Q100 112 130 102 L131 108 Q100 118 69 108 Z', 1],
  ],
  jumpsuit: [
    ['M74 22 L84 22 Q100 44 116 22 L126 22 L130 108 L150 236 L112 236 L100 134 L88 236 L50 236 L70 108 Z', 0],
    ['M70 104 L130 104 L131 114 L69 114 Z', 1],
  ],
  set: [
    ['M70 22 L86 16 Q100 26 114 16 L130 22 L160 46 L146 62 L136 56 L136 96 L64 96 L64 56 L54 62 L40 46 Z', 0],
    ['M68 106 L132 106 L142 238 L110 238 L100 140 L90 238 L58 238 Z', 0],
    ['M68 106 L132 106 L133 116 L67 116 Z', 1],
  ],
  swim: [
    ['M56 72 L96 72 L80 38 Z M104 72 L144 72 L120 38 Z', 0],
    ['M78 38 L82 38 L72 14 L70 14 Z M118 38 L122 38 L130 14 L128 14 Z M96 66 L104 66 L104 70 L96 70 Z', 1],
    ['M58 132 L142 132 L124 168 L100 182 L76 168 Z', 0],
  ],
  bra: [
    ['M54 76 Q100 60 146 76 L152 140 L48 140 Z', 0],
    ['M62 76 L74 30 L82 30 L76 70 Z M138 76 L126 30 L118 30 L124 70 Z', 0],
    ['M48 128 L152 128 L152 140 L48 140 Z', 1],
  ],
  shoe: [
    ['M24 176 L28 122 Q56 118 78 96 L112 102 Q132 132 172 146 Q182 160 178 176 Z', 0],
    ['M22 176 L180 176 L180 192 L22 192 Z', 2],
    ['M84 106 L96 112 M88 118 L102 124 M92 130 L108 136', 1, true],
  ],
  bag: [
    ['M48 104 L152 104 L164 222 L36 222 Z', 0],
    ['M70 104 Q70 52 100 52 Q130 52 130 104 L122 104 Q122 62 100 62 Q78 62 78 104 Z', 1],
    ['M48 104 L152 104 L153 116 L47 116 Z', 1],
  ],
  cap: [
    ['M44 140 Q44 70 100 66 Q156 70 156 140 Z', 0],
    ['M120 132 Q170 128 188 146 Q160 156 120 148 Z', 1],
    ['M96 62 L104 62 L104 70 L96 70 Z', 1],
  ],
  bottle: [
    ['M86 36 L114 36 L114 70 L130 86 L130 226 L70 226 L70 86 L86 70 Z', 0],
    ['M84 18 L116 18 L116 40 L84 40 Z', 1],
    ['M78 132 L122 132 L122 180 L78 180 Z', 2],
  ],
  compact: [
    ['M40 80 Q40 64 56 64 L144 64 Q160 64 160 80 L160 196 Q160 212 144 212 L56 212 Q40 212 40 196 Z', 0],
    ['M58 84 L142 84 L142 192 L58 192 Z', 1],
    ['M72 100 L96 100 L96 124 L72 124 Z M104 100 L128 100 L128 124 L104 124 Z M72 132 L96 132 L96 156 L72 156 Z M104 132 L128 132 L128 156 L104 156 Z', 2],
  ],
};

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/** Inline SVG markup for a garment in the given colour. */
export function garmentSvg(type: Garment, hex: string): string {
  const tones = [hex, shade(hex, -0.3), shade(hex, 0.35)];
  const paths = (shapes[type] ?? shapes.tee)
    .map(([d, t, stroke]) =>
      stroke
        ? `<path d="${d}" fill="none" stroke="${tones[t]}" stroke-width="3" stroke-linecap="round"/>`
        : `<path d="${d}" fill="${tones[t]}"/>`,
    )
    .join('');
  return `<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="garment"><ellipse cx="100" cy="244" rx="70" ry="4" fill="rgba(10,20,30,.08)"/>${paths}</svg>`;
}

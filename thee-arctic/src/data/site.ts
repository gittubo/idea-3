// Landing page content. Swap these for the real campaign assets when they arrive.
// Media paths are relative to /public, e.g. '/media/hero.mp4'.

export interface HeroSlide {
  eyebrow: string;
  title: string;          // use \n for a line break
  text: string;
  cta: string;
  href: string;
  /** Background: a video or image path. Empty = the animated ice gradient. */
  video?: string;
  image?: string;
  tone: 'dark' | 'light';
  gradient: string;
}

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: 'Drop 01 · Out now',
    title: 'Stay\nCold.',
    text: 'The new Arctic drop. Heavyweight fleece, technical outerwear and denim built for the season.',
    cta: 'Shop the drop', href: '/new-in', tone: 'light',
    gradient: 'radial-gradient(120% 90% at 70% 10%, #2c5c86 0%, #0d2236 55%, #050b12 100%)',
  },
  {
    eyebrow: 'Arctic Sale',
    title: 'Up to\n60% off.',
    text: 'Hundreds of styles marked down across Women, Men, Kids and Sports. While stock lasts.',
    cta: 'Shop the sale', href: '/sale', tone: 'dark',
    gradient: 'radial-gradient(120% 90% at 30% 0%, #ffffff 0%, #dbe9f4 50%, #a9c6dd 100%)',
  },
  {
    eyebrow: 'THEE ARCTIC SPORTS',
    title: 'Train\nIn The Cold.',
    text: 'Sculpt leggings, airlift bras and training layers that move with you.',
    cta: 'Shop Sports', href: '/sports', tone: 'light',
    gradient: 'radial-gradient(120% 90% at 80% 20%, #3fb49a 0%, #145a63 45%, #071a22 100%)',
  },
];

export interface Testimonial { quote: string; name: string; item: string; rating: number }
// Placeholder quotes: replace with real customer reviews (or connect a reviews app) before launch.
export const testimonials: Testimonial[] = [
  { quote: 'The hoodie is heavy in the best way. Washed it ten times and it still looks new.', name: 'Jordan M.', item: 'Polar Hoodie', rating: 5 },
  { quote: 'Finally jeans that fit my curves without gaping at the waist. Ordering another colour.', name: 'Aaliyah R.', item: 'Wide Leg Jeans', rating: 5 },
  { quote: 'Bought the Mini Me set for me and my daughter. We get stopped every time we wear them.', name: 'Tasha K.', item: 'Mini Me Fleece Set', rating: 5 },
  { quote: 'The puffer actually keeps me warm in Chicago winters. Fit is true to size.', name: 'Marcus D.', item: 'Expedition Puffer', rating: 4 },
  { quote: 'Sculpt leggings are squat-proof and the waistband doesn\'t roll. Obsessed.', name: 'Priya S.', item: 'Sculpt Leggings', rating: 5 },
  { quote: 'Shipping was fast and the return was painless when I needed a size up.', name: 'Chris L.', item: 'Boxy Tee', rating: 5 },
];

export interface CommunityPost { handle: string; image?: string; gradient: string }
// Customer / creator photos for the #THEEARCTIC grid. Add `image` paths when you have them.
export const community: CommunityPost[] = [
  { handle: '@arctic.jay', gradient: 'linear-gradient(160deg,#2b3540,#0b0f14)' },
  { handle: '@kaylasfits', gradient: 'linear-gradient(160deg,#e7d4e7,#9b7fb4)' },
  { handle: '@northboundmarco', gradient: 'linear-gradient(160deg,#c8dceb,#47708f)' },
  { handle: '@iceyyy.b', gradient: 'linear-gradient(160deg,#f3f5f7,#b8c6d1)' },
  { handle: '@tundra.tee', gradient: 'linear-gradient(160deg,#cfe8df,#3f8a7a)' },
  { handle: '@frostedlex', gradient: 'linear-gradient(160deg,#f1dcd6,#b77b6f)' },
];

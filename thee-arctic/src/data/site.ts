// Landing page content. Media files live in /public/media.

export const hero = {
  /** Landscape video for desktop and tablets in landscape. */
  wide: { video: '/media/landing-16x9.mp4', poster: '/media/landing-16x9.jpg' },
  /** Portrait video for phones. */
  tall: { video: '/media/landing-9x16.mp4', poster: '/media/landing-9x16.jpg' },
  label: 'Season 01',
  cta: { text: 'Shop Season 01', href: '/new-in' },
};

export interface Testimonial { quote: string; name: string; item: string; rating: number }
/** Real customer reviews only. The section stays hidden while this is empty. */
export const testimonials: Testimonial[] = [];

export interface CommunityPost { handle: string; image: string; href?: string }
/** Customer / creator photos for the #THEEARCTIC grid. Hidden while empty. */
export const community: CommunityPost[] = [];

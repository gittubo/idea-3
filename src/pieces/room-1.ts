import type { HallItem } from '../scripts/hall';

export interface RoomEntry extends HallItem {
  /** Folder holding the painting's depth layers (see pipeline/). */
  base: string;
  /** Invisible description for screen readers. */
  alt: string;
}

/**
 * Room I · Oil. Monumental panels standing around the hall.
 * Story sheets (internal, never shown) live in PLAN.md section 7.
 */
export const room1: RoomEntry[] = [
  {
    slug: 'the-apprentice', title: 'The Apprentice', base: 'pieces/apprentice', image: 'pieces/apprentice/wall.webp',
    aspect: 3312 / 2480, height: 3.1, place: { x: -6.7, z: -6.1, yaw: 34 },
    alt: 'Oil painting of a dim workshop: an old bearded master paints a Madonna at an easel while a boy grinds pigment in the shadows.',
  },
  {
    slug: 'the-kept-letter', title: 'The Kept Letter', base: 'pieces/kept-letter', image: 'pieces/kept-letter/wall.webp',
    aspect: 2480 / 3312, height: 4.3, place: { x: 0, z: -8.6, yaw: 0 },
    alt: 'Oil painting of a young woman in an oxblood velvet gown and a sheer veil, seated in a stone loggia with her hands folded on a parapet. Through the open loggia, a blue mountain landscape with a winding road.',
  },
  {
    slug: 'the-wings', title: 'The Wings', base: 'pieces/wings', image: 'pieces/wings/wall.webp',
    aspect: 3504 / 2336, height: 2.9, place: { x: 6.7, z: -6.1, yaw: -34 },
    alt: 'Oil painting of a man with a splinted arm beside a wood-and-canvas flying machine on a hilltop at dawn, watched by villagers.',
  },
];

import type { WallItem } from '../scripts/corridor';
import type { Piece } from './types';
import { keptLetter } from './kept-letter';

export interface RoomEntry extends WallItem {
  /** The camera journey. Paintings without one hang on the wall only, for now. */
  piece?: Piece;
}

/** Room I · Oil (warm candlelight). Order is the order on the wall. */
export const room1: RoomEntry[] = [
  { slug: keptLetter.slug, title: keptLetter.title, image: 'pieces/kept-letter/wall.webp', aspect: 2480 / 3312, height: 1.35, piece: keptLetter },
  { slug: 'the-apprentice', title: 'The Apprentice', image: 'pieces/apprentice/wall.webp', aspect: 3312 / 2480, height: 1.15 },
  { slug: 'the-wings', title: 'The Wings', image: 'pieces/wings/wall.webp', aspect: 3504 / 2336, height: 1.05 },
];

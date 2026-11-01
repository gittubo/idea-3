import type { Piece, Stop } from './types';

const home: Omit<Stop, 'travel' | 'hold'> = { u: 0.5, v: 0.5, h: 1.18, w: 1.12 };

/**
 * Story sheet (internal, never shown): the smile hides a goodbye.
 * Her eyes → follow her gaze into the landscape → a rider leaving on the road
 * → back across the velvet to her hands → the letter with the broken seal.
 */
export const keptLetter: Piece = {
  slug: 'the-kept-letter',
  title: 'The Kept Letter',
  alt: 'Oil painting of a young woman in an oxblood velvet gown and a sheer veil, seated in a stone loggia with her hands folded on a parapet. Through the open loggia, a blue mountain landscape with a winding road.',
  base: 'pieces/kept-letter',
  approach: 1.4,
  release: 1.4,
  stops: [
    { ...home, travel: 0, hold: 0.6 },
    // drifting in, not yet sure where to look
    { u: 0.45, v: 0.34, h: 0.62, travel: 1.0, hold: 0 },
    // her eyes, turned away
    { u: 0.41, v: 0.235, h: 0.24, pos: [-0.02, 0.01, -0.08], travel: 0.9, hold: 0.7, mark: true },
    // follow the gaze sideways, past the column into the open air
    { u: 0.63, v: 0.27, h: 0.4, w: 0.36, pos: [0.16, 0.03, -0.02], travel: 1.2, hold: 0 },
    { u: 0.78, v: 0.3, h: 0.32, pos: [0.22, 0.04, -0.05], travel: 0.9, hold: 0.2 },
    // down the road…
    { u: 0.85, v: 0.43, h: 0.19, pos: [0.25, 0.0, -0.1], travel: 0.9, hold: 0 },
    // …a rider, leaving
    { u: 0.865, v: 0.484, h: 0.12, pos: [0.27, -0.02, -0.16], travel: 0.9, hold: 0.8, mark: true },
    // back, searching across the velvet
    { u: 0.62, v: 0.62, h: 0.52, pos: [0.06, -0.05, 0], travel: 1.3, hold: 0 },
    { u: 0.38, v: 0.8, h: 0.3, pos: [-0.04, -0.12, -0.1], travel: 1.0, hold: 0.25 },
    // hesitation at the hands
    { u: 0.29, v: 0.84, h: 0.2, pos: [-0.08, -0.14, -0.18], travel: 0.8, hold: 0 },
    // the letter
    { u: 0.2, v: 0.868, h: 0.115, pos: [-0.1, -0.15, -0.3], travel: 1.5, hold: 1.8, mark: true, focus: 0.7 },
    // and back: the same painting, read differently
    { ...home, travel: 1.7, hold: 0 },
  ],
};

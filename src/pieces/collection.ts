import type { HallItem } from '../scripts/hall';
import type { GuideStop } from '../scripts/explorer';

export interface Painting extends HallItem {
  /** Folder holding the painting's depth layers (see pipeline/). */
  base: string;
  /** Invisible description for screen readers. */
  alt: string;
  /** The optional guided view, ending on the hidden detail (u, v from the top-left; h = share of height in view). */
  guide: GuideStop[];
}

/**
 * One gallery corridor. Room I (oils, warm light) hangs on the left wall, Room II
 * (drawings, cooler light) on the right, and one of each on the end wall.
 * Story sheets live in PLAN.md section 7.
 */
export const collection: Painting[] = [
  // ---- Room I · Oil ----------------------------------------------------------------
  {
    slug: 'the-apprentice', title: 'The Apprentice', base: 'pieces/apprentice', image: 'pieces/apprentice/wall.webp',
    aspect: 3312 / 2480, height: 1.75, place: { x: -3.5, z: 4.5, yaw: 90 }, light: 'warm',
    alt: 'Oil painting of a dim workshop: an old bearded master paints a Madonna at an easel while a boy grinds pigment in the shadows.',
    guide: [
      { u: 0.531, v: 0.242, h: 0.32, hold: 2 },     // the finest face in the room
      { u: 0.417, v: 0.363, h: 0.2, hold: 1.6 },    // his hand, hesitating
      { u: 0.308, v: 0.19, h: 0.14, hold: 2.2 },    // his clouded eye
      { u: 0.833, v: 0.774, h: 0.2, hold: 1.8 },    // the boy's rose-stained fingers
      { u: 0.872, v: 0.432, h: 0.12, hold: 3.5 },   // the brush behind his ear
    ],
  },
  {
    slug: 'the-wings', title: 'The Wings', base: 'pieces/wings', image: 'pieces/wings/wall.webp',
    aspect: 3504 / 2336, height: 1.6, place: { x: -3.5, z: -4.5, yaw: 90 }, light: 'warm',
    alt: 'Oil painting of a man with a splinted arm beside a wood-and-canvas flying machine on a hilltop at dawn, watched by villagers.',
    guide: [
      { u: 0.49, v: 0.565, h: 0.4, hold: 1.6 },     // the machine
      { u: 0.873, v: 0.514, h: 0.25, hold: 2 },     // the crowd, laughing
      { u: 0.656, v: 0.42, h: 0.22, hold: 2 },      // his arm in a splint
      { u: 0.879, v: 0.676, h: 0.16, hold: 2.2 },   // one girl, not laughing, holding a feather
      { u: 0.217, v: 0.805, h: 0.16, hold: 3.5 },   // the broken first wing in the grass
    ],
  },
  {
    slug: 'the-kept-letter', title: 'The Kept Letter', base: 'pieces/kept-letter', image: 'pieces/kept-letter/wall.webp',
    aspect: 2480 / 3312, height: 2.25, place: { x: -1.45, z: -13, yaw: 0 }, light: 'warm',
    alt: 'Oil painting of a young woman in an oxblood velvet gown and a sheer veil, seated in a stone loggia with her hands folded on a parapet. Through the open loggia, a blue mountain landscape with a winding road.',
    guide: [
      { u: 0.41, v: 0.235, h: 0.24, hold: 2.2 },    // her eyes, turned away
      { u: 0.66, v: 0.28, h: 0.4, hold: 1 },        // where she is looking
      { u: 0.865, v: 0.484, h: 0.12, hold: 2.4 },   // a rider, leaving
      { u: 0.38, v: 0.8, h: 0.3, hold: 1.2 },       // her hands
      { u: 0.2, v: 0.868, h: 0.115, hold: 3.5 },    // the letter with the broken seal
    ],
  },
  // ---- Room II · Codex -------------------------------------------------------------
  {
    slug: 'the-reflection', title: 'The Reflection', base: 'pieces/reflection', image: 'pieces/reflection/wall.webp',
    aspect: 2480 / 3312, height: 2.1, place: { x: 1.45, z: -13, yaw: 0 }, light: 'cool',
    alt: 'Ink drawing of optics studies: a cross-section of an eye with rays of light, mirrors, a pinhole room, and a large drawn eye.',
    guide: [
      { u: 0.56, v: 0.2, h: 0.3, hold: 1.8 },       // light entering the eye
      { u: 0.63, v: 0.48, h: 0.22, hold: 1.8 },     // the pinhole room
      { u: 0.57, v: 0.73, h: 0.28, hold: 1.6 },     // the eye
      { u: 0.57, v: 0.732, h: 0.06, hold: 3.5 },    // who it is looking at
    ],
  },
  {
    slug: 'the-deluge', title: 'The Deluge', base: 'pieces/deluge', image: 'pieces/deluge/wall.webp',
    aspect: 3312 / 2480, height: 1.75, place: { x: 3.5, z: 4.5, yaw: -90 }, light: 'cool',
    alt: 'Ink and wash drawing of a great storm: spiralling water and wind, collapsing hills and a bent tree.',
    guide: [
      { u: 0.16, v: 0.45, h: 0.4, hold: 1.6 },      // the tree, breaking
      { u: 0.78, v: 0.54, h: 0.35, hold: 1.4 },     // the hills, falling
      { u: 0.51, v: 0.43, h: 0.3, hold: 1.6 },      // into the spiral
      { u: 0.51, v: 0.47, h: 0.07, hold: 3.5 },     // a family, and one lamp
    ],
  },
  {
    slug: 'study-of-a-hand', title: 'Study of a Hand', base: 'pieces/hand', image: 'pieces/hand/wall.webp',
    aspect: 2480 / 3312, height: 2.0, place: { x: 3.5, z: -4.5, yaw: -90 }, light: 'cool',
    alt: 'Red chalk drawing of anatomical studies of an adult hand, its tendons and bones, surrounded by notes.',
    guide: [
      { u: 0.476, v: 0.32, h: 0.45, hold: 1.8 },    // tendons
      { u: 0.83, v: 0.25, h: 0.3, hold: 1.4 },      // bones
      { u: 0.2, v: 0.75, h: 0.3, hold: 1.4 },       // a grip
      { u: 0.905, v: 0.875, h: 0.1, hold: 3.5 },    // a child's hand, holding on
    ],
  },
];

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
    aspect: 3312 / 2480, height: 1.75, place: { x: -3.5, z: 4.6, yaw: 90 }, light: 'warm',
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
    aspect: 3312 / 2480, height: 1.75, place: { x: 3.5, z: 4.6, yaw: -90 }, light: 'cool',
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
  // ---- Room I · Oil, more of the left wall ------------------------------------------
  {
    slug: 'the-lute-player', title: 'The Lute Player', base: 'pieces/lute', image: 'pieces/lute/wall.webp',
    aspect: 2480 / 3312, height: 2.0, place: { x: -3.5, z: 9.4, yaw: 90 }, light: 'warm',
    alt: 'Oil painting of a young man in a green doublet playing a lute, glancing toward a half-open door, an open music book before him.',
    guide: [
      { u: 0.486, v: 0.2, h: 0.25, hold: 2 },       // his eyes, turned to the door
      { u: 0.13, v: 0.31, h: 0.35, hold: 1.6 },     // the door, and its light
      { u: 0.8, v: 0.47, h: 0.25, hold: 1.6 },      // his hands, mid-song
      { u: 0.19, v: 0.69, h: 0.3, hold: 1.4 },      // the music
      { u: 0.275, v: 0.695, h: 0.1, hold: 3.5 },    // a dried rose, kept between the pages
    ],
  },
  {
    slug: 'the-cartographer', title: 'The Cartographer', base: 'pieces/cartographer', image: 'pieces/cartographer/wall.webp',
    aspect: 3312 / 2480, height: 1.75, place: { x: -3.5, z: 0, yaw: 90 }, light: 'warm',
    alt: 'Oil painting of an old bearded cartographer measuring a sea chart by candlelight, a globe and instruments around him, a harbour at dusk through the window.',
    guide: [
      { u: 0.445, v: 0.35, h: 0.3, hold: 1.8 },     // the old man
      { u: 0.39, v: 0.58, h: 0.25, hold: 1.6 },     // his dividers
      { u: 0.85, v: 0.23, h: 0.3, hold: 1.8 },      // the harbour, the ships
      { u: 0.64, v: 0.8, h: 0.3, hold: 1.4 },       // the open sea
      { u: 0.763, v: 0.7, h: 0.07, hold: 3.5 },     // one island, one house, smoke from its chimney
    ],
  },
  {
    slug: 'the-vigil', title: 'The Vigil', base: 'pieces/vigil', image: 'pieces/vigil/wall.webp',
    aspect: 3504 / 2336, height: 1.55, place: { x: -3.5, z: -9.3, yaw: 90 }, light: 'warm',
    alt: 'Oil painting of a young mother keeping watch at night beside her sleeping child, a candle burned low on the table.',
    guide: [
      { u: 0.48, v: 0.22, h: 0.25, hold: 2 },       // the mother
      { u: 0.18, v: 0.45, h: 0.25, hold: 2 },       // the sleeping child
      { u: 0.38, v: 0.49, h: 0.2, hold: 1.6 },      // her hand on his
      { u: 0.07, v: 0.53, h: 0.18, hold: 2 },       // the candle, nearly gone
      { u: 0.87, v: 0.42, h: 0.3, hold: 3.5 },      // dawn, through the shutter
    ],
  },
  // ---- Room II · Codex, more of the right wall -------------------------------------
  {
    slug: 'the-flying-machine', title: 'The Flying Machine', base: 'pieces/flying', image: 'pieces/flying/wall.webp',
    aspect: 2480 / 3312, height: 2.0, place: { x: 3.5, z: 9.4, yaw: -90 }, light: 'cool',
    alt: 'Ink design for a mechanical bat-like wing with ribs, cords, gears and a crank, surrounded by smaller diagrams and notes.',
    guide: [
      { u: 0.44, v: 0.48, h: 0.5, hold: 1.8 },      // the wing
      { u: 0.19, v: 0.6, h: 0.25, hold: 1.6 },      // the crank and gears
      { u: 0.69, v: 0.09, h: 0.2, hold: 1.4 },      // a wheel
      { u: 0.44, v: 0.28, h: 0.12, hold: 3.5 },     // a sparrow, showing how it is done
    ],
  },
  {
    slug: 'study-of-horses', title: 'Study of Horses', base: 'pieces/horses', image: 'pieces/horses/wall.webp',
    aspect: 3312 / 2480, height: 1.75, place: { x: 3.5, z: 0, yaw: -90 }, light: 'cool',
    alt: 'Red chalk sheet of studies of war horses: a rearing horse, heads, legs and a gallop.',
    guide: [
      { u: 0.555, v: 0.19, h: 0.3, hold: 1.8 },     // the war horse
      { u: 0.84, v: 0.21, h: 0.25, hold: 1.4 },     // galloping
      { u: 0.77, v: 0.5, h: 0.35, hold: 1.4 },      // legs, measured
      { u: 0.156, v: 0.83, h: 0.22, hold: 3.5 },    // a foal asleep against its mother
    ],
  },
  {
    slug: 'study-of-faces', title: 'Study of Faces', base: 'pieces/faces', image: 'pieces/faces/wall.webp',
    aspect: 2480 / 3312, height: 2.0, place: { x: 3.5, z: -9.3, yaw: -90 }, light: 'cool',
    alt: 'Ink sheet crowded with caricature heads of old men and women, laughing and sneering, all turned to the centre.',
    guide: [
      { u: 0.5, v: 0.8, h: 0.4, hold: 1.6 },        // laughter
      { u: 0.3, v: 0.37, h: 0.18, hold: 1.6 },      // mockery
      { u: 0.5, v: 0.3, h: 0.5, hold: 1.4 },        // all turned to the middle
      { u: 0.5, v: 0.38, h: 0.12, hold: 3.5 },      // the one face that is not laughing
    ],
  },
];

/** A camera stop inside a painting. u, v are image coordinates (0–1, from top-left). */
export interface Stop {
  u: number;
  v: number;
  /** Fraction of the painting's height that must be visible. */
  h: number;
  /** Fraction of the painting's width that must be visible (for wide or phone screens). */
  w?: number;
  /** Camera offset from the home position, in scene units (creates parallax). */
  pos?: [number, number, number];
  /** Scroll distance (in screen heights) to travel here from the previous stop. */
  travel: number;
  /** Scroll distance (in screen heights) to linger here. */
  hold: number;
  /** Show a tick on the progress line. */
  mark?: boolean;
  /** 0–1: how strongly the surroundings darken, used for the discovery. */
  focus?: number;
}

export interface Piece {
  slug: string;
  title: string;
  /** Invisible description for screen readers. */
  alt: string;
  base: string;
  approach: number;
  release: number;
  stops: Stop[];
}

/**
 * The flight, ported from the About room of shajith23/sketch-portfolio.
 *
 * Every number here is the reference's, kept rather than re-tuned — the layout
 * *is* these numbers. What changes is only what flies past you: drumstick pods
 * and leaflets instead of clouds, a moringa seed instead of the paper aeroplane.
 *
 * The mechanic: the camera never moves. The world travels towards it on scroll,
 * with momentum and friction, so a flick coasts. Each milestone fades in as it
 * approaches, holds while it is in front of you, and fades as it passes through.
 */

/** One repeat of sky. Milestones sit one chunk apart. */
export const CHUNK_LENGTH = 40;
export const CHUNK_WIDTH = 20;
export const CHUNK_HEIGHT = 12;

/** World Z where a milestone begins to appear, is fully legible, and is gone. */
export const FADE_IN_START = -50;
export const FADE_IN_END = -25;
export const FADE_OUT_START = -8;
export const FADE_OUT_END = -2;

/** The first milestone sits here; each later one is a chunk further back. */
export const FIRST_MILESTONE_Z = -15;

/*
 * The reference's scroll feel — wheel delta into velocity, friction bleeding it
 * away — is not reproduced here as numbers because the gesture is not stolen.
 * Travel follows the page's own scroll through the section's track, eased, and
 * that easing is what supplies the coast those constants used to provide.
 */

/** Banking and pitching, as a fraction of the way through the current chunk. */
export const BANK_AMPLITUDE = 0.12;
export const PITCH_AMPLITUDE = 0.05;
/** Flight effect eases in over this many units so the start is not a lurch. */
export const FLIGHT_EASE_UNITS = 5.0;
export const FLIGHT_START_AT = 0.5;

/** Paper cream, from the reference's sky. It matches this site's own cream. */
export const SKY_COLOR = "#fdf8e2";
/**
 * The reference fogs from 15 to 50, against a bright blue backdrop with big
 * white clouds. Here the sky *is* the fog colour, so anything past ~35 units
 * dissolved into the cream completely and the sky read as empty. Pushed out so
 * foliage keeps its colour through the band where it is actually on screen.
 */
export const FOG_NEAR = 22;
export const FOG_FAR = 95;

export type MilestoneDatum = {
  id: string;
  year: string;
  title: string;
  body: string | null;
  source: string | null;
  sourceUrl: string | null;
};

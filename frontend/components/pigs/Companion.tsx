/**
 * The truffle — spec §9.4. The puffle role, filled by exactly one creature: it's
 * what a pig is actually hunting, and a menagerie of pets alongside it would
 * dilute the joke rather than extend it.
 *
 * Drawn in a local 60×60 box and placed by `companionTransform`, which puts it
 * on the animal's *left* — the tail comes off the right hip and they collide
 * there at every fatness tier.
 *
 * Its colours are the real varieties, so the variety picker doubles as the
 * on/off control in the customiser.
 */
import type { ReactNode } from "react";
import { TRUFFLE_VARIETIES } from "@/lib/pig";

/**
 * Places the companion beside the animal, feet on the same ground line.
 *
 * It sits to the animal's left, since the tail comes off the right hip. The
 * position is offset from the body but clamped to the frame edge: a round
 * animal leaves no clear space beside it, so the companion is allowed to stand
 * slightly in front rather than shrinking to fit — a smaller companion reads as
 * further away, not as a smaller creature.
 */
export function companionTransform(w: number): string {
  const k = 0.85;
  const half = 16; // the truffle's half-extent in local space, nubs included
  const cx = Math.max(3 + half * k, 65 - w - 16);
  return `translate(${cx - 30 * k} ${118 - 47 * k}) scale(${k})`;
}

/** The approved lump: medium bumpiness, 11 bumps. Fixed rather than generated
 *  so every truffle in the app is the same object, only recoloured. */
const TRUFFLE_LUMP =
  "M30.01 15.02 C31.19 14.88 32.20 18.18 33.66 18.57 C35.13 18.95 37.73 16.72 38.79 17.34 " +
  "C39.85 17.97 39.05 21.16 40.03 22.32 C41.02 23.48 44.19 23.16 44.70 24.30 C45.22 25.43 43.06 27.65 43.10 29.13 " +
  "C43.14 30.60 45.22 31.98 44.94 33.16 C44.66 34.34 41.83 34.78 41.41 36.22 C40.99 37.66 43.18 40.86 42.43 41.79 " +
  "C41.69 42.72 38.23 40.97 36.92 41.79 C35.62 42.62 35.76 46.54 34.61 46.74 C33.45 46.95 31.50 43.12 29.99 43.02 " +
  "C28.48 42.92 26.65 46.40 25.55 46.11 C24.45 45.82 24.64 42.06 23.39 41.27 C22.13 40.49 18.83 42.21 18.00 41.38 " +
  "C17.18 40.55 18.92 37.65 18.43 36.27 C17.95 34.90 15.16 34.30 15.08 33.13 C15.00 31.96 17.81 30.69 17.95 29.26 " +
  "C18.09 27.83 15.59 25.72 15.93 24.56 C16.28 23.41 19.13 23.53 20.01 22.33 C20.90 21.13 20.15 17.85 21.25 17.37 " +
  "C22.35 16.88 25.14 19.79 26.60 19.40 C28.06 19.01 28.84 15.15 30.01 15.02 Z";

/** Pentagonal warts — the thing that makes it a truffle and not a potato. */
const TRUFFLE_FACETS = [
  "44.3,31.0 40.9,35.7 35.4,33.9 35.4,28.1 40.9,26.3",
  "38.9,42.2 33.2,42.4 31.1,37.0 35.6,33.5 40.4,36.6",
  "26.8,44.9 23.0,40.6 26.0,35.7 31.6,36.9 32.1,42.7",
  "17.1,37.2 18.1,31.5 23.9,30.8 26.4,36.0 22.2,39.9",
  "17.1,24.8 22.2,22.1 26.4,26.0 23.9,31.2 18.1,30.5",
  "26.8,17.1 32.1,19.3 31.6,25.1 26.0,26.3 23.0,21.4",
  "38.9,19.8 40.4,25.4 35.6,28.5 31.1,25.0 33.2,19.6",
  "34.5,31.0 31.4,35.3 26.4,33.6 26.4,28.4 31.4,26.7",
];

function Truffle({ variety, uid }: { variety: string; uid: string }) {
  const t = TRUFFLE_VARIETIES[variety] ?? TRUFFLE_VARIETIES.burgundy;
  const clip = `tc-${uid}`;
  const grad = `tg-${uid}`;
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <path d={TRUFFLE_LUMP} />
        </clipPath>
        <radialGradient id={grad} cx="34%" cy="26%" r="80%">
          <stop offset="0%" stopColor={t.fill} />
          <stop offset="70%" stopColor={t.fill} />
          <stop offset="100%" stopColor={t.dark} />
        </radialGradient>
      </defs>
      {/* feet */}
      <path d="M24 42 q0 5 -4 5 q-4 0 -4 -4" fill="none" stroke={t.dark} strokeWidth="3.6" strokeLinecap="round" />
      <path d="M36 42 q0 5 4 5 q4 0 4 -4" fill="none" stroke={t.dark} strokeWidth="3.6" strokeLinecap="round" />
      <path d={TRUFFLE_LUMP} fill={`url(#${grad})`} stroke={t.line} strokeWidth="2.1" strokeLinejoin="round" />
      <g clipPath={`url(#${clip})`}>
        {TRUFFLE_FACETS.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke={t.dark} strokeWidth="1.3" opacity="0.55" />
        ))}
      </g>
      {/* open, blushing face */}
      <ellipse cx="19.5" cy="34.6" rx="3.4" ry="2.2" fill={t.blush} opacity="0.72" />
      <ellipse cx="40.5" cy="34.6" rx="3.4" ry="2.2" fill={t.blush} opacity="0.72" />
      <ellipse cx="24.8" cy="29.8" rx="3" ry="3.6" fill={t.line} />
      <ellipse cx="35.2" cy="29.8" rx="3" ry="3.6" fill={t.line} />
      <circle cx="25.9" cy="28.4" r="1.15" fill="#fff" />
      <circle cx="36.3" cy="28.4" r="1.15" fill="#fff" />
      <path
        d="M25.4 35.4 q4.6 -1 9.2 0 q-1.2 6.2 -4.6 6.2 q-3.4 0 -4.6 -6.2 Z"
        fill="#8A2F3A"
        stroke={t.line}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M27.6 39.5 q2.4 2.8 4.8 0 q-2.4 1.4 -4.8 0 Z" fill="#F09098" />
    </>
  );
}

export function companion(kind: string, uid: string, truffleVariety: string): ReactNode {
  switch (kind) {
    case "truffle":
      return <Truffle variety={truffleVariety} uid={uid} />;

    default:
      return null;
  }
}

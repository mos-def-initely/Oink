/**
 * Companions — spec §9.4. The puffle role: a second creature that stands beside
 * the animal rather than a prop it has to hold, since the pig has no hand to
 * hold anything with.
 *
 * Drawn in a local 60×60 box and placed by `companionTransform`, which puts the
 * companion on the animal's *left* — the tail comes off the right hip, and a
 * companion there collides with it at every fatness tier.
 *
 * The truffle leads the list because it's what a pig would actually be hunting,
 * and it's the only companion with its own colour set: real truffles already
 * come in varieties, which is a better colour story than arbitrary tints.
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
  const half = 24; // widest companion's half-extent in local space
  const cx = Math.max(3 + half * k, 65 - w - 16);
  return `translate(${cx - 30 * k} ${118 - 47 * k}) scale(${k})`;
}

const EYE = "#43262F";

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
  const OL = "#6B4A34";
  const s = { stroke: OL, strokeWidth: 1.9, strokeLinejoin: "round" as const };

  switch (kind) {
    case "truffle":
      return <Truffle variety={truffleVariety} uid={uid} />;

    case "piglet":
      return (
        <>
          <g {...s}>
            <path d="M20 26 Q17 15 26 20 Z" fill="#EFAAB8" />
            <path d="M40 26 Q43 15 34 20 Z" fill="#EFAAB8" />
            <ellipse cx="30" cy="34" rx="15" ry="13" fill="#F5BCC8" />
            <ellipse cx="30" cy="38" rx="6.4" ry="4.6" fill="#EFAAB8" />
          </g>
          <circle cx="24" cy="30" r="2.1" fill={EYE} />
          <circle cx="36" cy="30" r="2.1" fill={EYE} />
          <circle cx="28" cy="38" r="1.1" fill="#8A5460" />
          <circle cx="32" cy="38" r="1.1" fill="#8A5460" />
        </>
      );

    case "duckling":
      return (
        <>
          <g {...s}>
            <ellipse cx="30" cy="36" rx="14" ry="12" fill="#E6D389" />
            <circle cx="30" cy="21" r="9" fill="#E6D389" />
            <path d="M38 21 l8 3 -8 3 Z" fill="#CFA51F" />
            <path d="M18 34 q-6 4 0 8 Z" fill="#CFA51F" />
          </g>
          <circle cx="32" cy="19" r="1.9" fill={EYE} />
        </>
      );

    case "parrot":
      return (
        <>
          <g {...s}>
            <path d="M18 40 q-9 8 -2 12 q7 0 10 -8 Z" fill="#2F8FD8" />
            <ellipse cx="30" cy="34" rx="13" ry="14" fill="#A9503C" />
            <circle cx="30" cy="20" r="9" fill="#A9503C" />
            <path d="M38 19 q7 2 3 8 q-4 1 -6 -3 Z" fill="#CFA51F" />
            <path d="M22 30 q6 10 0 16 q-6 -6 0 -16 Z" fill="#E6D389" />
          </g>
          <circle cx="32" cy="18" r="1.9" fill={EYE} />
        </>
      );

    case "cat":
      return (
        <>
          <g {...s}>
            <path d="M20 24 L17 13 L27 19 Z" fill="#8A8078" />
            <path d="M40 24 L43 13 L33 19 Z" fill="#8A8078" />
            <path d="M44 42 q10 -2 8 -12" fill="none" stroke={OL} strokeWidth="3" />
            <ellipse cx="30" cy="34" rx="14" ry="13" fill="#9A9088" />
          </g>
          <circle cx="24" cy="31" r="2.1" fill={EYE} />
          <circle cx="36" cy="31" r="2.1" fill={EYE} />
          <path d="M27 38 q3 3 6 0" fill="none" stroke={EYE} strokeWidth="1.5" />
        </>
      );

    case "fox":
      return (
        <>
          <g {...s}>
            <path d="M19 24 L16 12 L27 19 Z" fill="#C4693A" />
            <path d="M41 24 L44 12 L33 19 Z" fill="#C4693A" />
            <path d="M43 40 q13 2 10 -10 q-7 -2 -10 6 Z" fill="#FFFDF6" />
            <ellipse cx="30" cy="34" rx="14" ry="13" fill="#D67A44" />
            <path d="M30 34 q-9 2 -8 9 q8 4 16 0 q1 -7 -8 -9 Z" fill="#FFFDF6" />
          </g>
          <circle cx="24" cy="30" r="2.1" fill={EYE} />
          <circle cx="36" cy="30" r="2.1" fill={EYE} />
          <ellipse cx="30" cy="40" rx="2.4" ry="1.8" fill={EYE} />
        </>
      );

    case "hedgehog":
      return (
        <>
          <g {...s}>
            <path d="M14 40 q2 -22 20 -22 q16 0 18 22 Z" fill="#6B4A34" />
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`M${16 + i * 7} 30 l4 -9 3 9 Z`} fill="#8A6248" />
            ))}
            <ellipse cx="24" cy="40" rx="13" ry="9" fill="#D8B48E" />
          </g>
          <circle cx="20" cy="38" r="1.9" fill={EYE} />
          <circle cx="29" cy="38" r="1.9" fill={EYE} />
          <ellipse cx="12" cy="41" rx="2.6" ry="2" fill={EYE} />
        </>
      );

    case "bunny":
      return (
        <>
          <g {...s}>
            <ellipse cx="24" cy="16" rx="4" ry="12" fill="#FFFDF6" />
            <ellipse cx="36" cy="16" rx="4" ry="12" fill="#FFFDF6" />
            <ellipse cx="30" cy="38" rx="14" ry="12" fill="#FFFDF6" />
          </g>
          <ellipse cx="24" cy="16" rx="2" ry="8" fill="#F5BCC8" />
          <ellipse cx="36" cy="16" rx="2" ry="8" fill="#F5BCC8" />
          <circle cx="25" cy="35" r="2.1" fill={EYE} />
          <circle cx="35" cy="35" r="2.1" fill={EYE} />
          <ellipse cx="30" cy="39" rx="2.2" ry="1.6" fill="#F08FA6" stroke={OL} strokeWidth="1.2" />
        </>
      );

    case "frog":
      return (
        <>
          <g {...s}>
            <circle cx="22" cy="24" r="7" fill="#6FBF5E" />
            <circle cx="38" cy="24" r="7" fill="#6FBF5E" />
            <ellipse cx="30" cy="38" rx="16" ry="12" fill="#7ECB6B" />
          </g>
          <circle cx="22" cy="24" r="2.4" fill={EYE} />
          <circle cx="38" cy="24" r="2.4" fill={EYE} />
          <path d="M20 40 q10 7 20 0" fill="none" stroke={EYE} strokeWidth="1.8" strokeLinecap="round" />
        </>
      );

    case "mouse":
      return (
        <>
          <g {...s}>
            <circle cx="19" cy="24" r="8" fill="#C8A8B4" />
            <circle cx="41" cy="24" r="8" fill="#C8A8B4" />
            <path d="M44 42 q12 0 10 -10" fill="none" stroke={OL} strokeWidth="2.6" />
            <ellipse cx="30" cy="36" rx="13" ry="12" fill="#BFA2AE" />
          </g>
          <circle cx="25" cy="34" r="2" fill={EYE} />
          <circle cx="35" cy="34" r="2" fill={EYE} />
          <ellipse cx="30" cy="41" rx="2.4" ry="1.8" fill="#F08FA6" stroke={OL} strokeWidth="1.2" />
        </>
      );

    case "tortoise":
      return (
        <>
          <g {...s}>
            <ellipse cx="42" cy="38" rx="9" ry="8" fill="#8FBF7E" />
            <path d="M12 44 q0 -18 17 -18 q17 0 17 18 Z" fill="#7E9C4E" />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${18 + i * 7} 44 v-12`} stroke={OL} strokeWidth="1.5" />
            ))}
            <path d="M14 38 q15 -5 30 0" fill="none" stroke={OL} strokeWidth="1.5" />
          </g>
          <circle cx="45" cy="36" r="1.9" fill={EYE} />
        </>
      );

    case "snail":
      return (
        <>
          <g {...s}>
            <path d="M12 46 q-2 -8 8 -8 h22 q6 0 6 6 Z" fill="#D8B48E" />
            <path d="M16 34 v-8 M22 34 v-8" stroke={OL} strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="34" cy="30" r="14" fill="#CFA51F" />
            <path
              d="M34 30 m0 -9 a9 9 0 1 1 -6 15 a6 6 0 1 0 6 -11"
              fill="none"
              stroke={OL}
              strokeWidth="1.8"
            />
          </g>
          <circle cx="16" cy="25" r="1.7" fill={EYE} />
          <circle cx="22" cy="25" r="1.7" fill={EYE} />
        </>
      );

    default:
      return null;
  }
}

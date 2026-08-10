"use client";

/**
 * Price-tier pigs — spec §9.2.
 *
 * These appear as small as 22px next to a budget label, so they have to be
 * told apart by **silhouette**, not by the colour of a shirt. An earlier set
 * differed only in what the pig was wearing and every tier below posh blended
 * into the others.
 *
 * Three ladders run in parallel, all readable at pin size:
 *
 *   tier   headwear (height = price)   accessory        clothing value
 *   $      bare head                   straw in mouth   pale tan sack
 *   $$     baseball cap                —                lemon tee
 *   $$$    short-brim trilby           bow tie          plum shirt
 *   $$$$   tall top hat                monocle + cigar  eggplant tailcoat
 *
 * Headwear height is the primary cue — nothing, low, medium, tall — and it
 * survives even when the pig is 22px wide and the clothing is three pixels of
 * colour. Clothing value ramps light-to-dark underneath as a second signal.
 *
 * Same construction and shading as the avatar (see PigAvatar.tsx) so the whole
 * family reads as one hand.
 */
import { useId } from "react";
import { BUDGET_LABELS, Budget } from "@/lib/pig";

const OUTLINE = "#8A5460";
const EYE = "#43262F";
const STROKE = 2.1;

const LIGHT = "#FCD8DF";
const MID = "#F5BCC8";
const DARK = "#E3A2B0";
const EAR = "#EFAAB8";
const SNOUT = "#EDA0B0";
const NOSTRIL = "#8A5460";

const INK = "#4D303F";
const PLUM = "#914E56";
const GOLD = "#CFA51F";
const LEMON = "#E6D389";
const TAN = "#C9A76E";

export function PricePig({ budget, size = 34 }: { budget: Budget; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const grad = `pp-${uid}`;
  const blur = `pb-${uid}`;
  const bodyClip = `pc-${uid}`;
  const headClip = `ph-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 120 130" role="img" aria-label={BUDGET_LABELS[budget]}>
      <defs>
        <radialGradient id={grad} cx="34%" cy="24%" r="82%">
          <stop offset="0%" stopColor={LIGHT} />
          <stop offset="52%" stopColor={MID} />
          <stop offset="100%" stopColor={DARK} />
        </radialGradient>
        <filter id={blur} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <clipPath id={bodyClip}>
          <ellipse cx="60" cy="84" rx="30" ry="27" />
        </clipPath>
        <clipPath id={headClip}>
          <ellipse cx="60" cy="46" rx="26" ry="23" />
        </clipPath>
      </defs>

      {/* tail, clear of the right arm */}
      <path d="M92 88 q12 -3 10 -14" fill="none" stroke={OUTLINE} strokeWidth={STROKE + 0.4} strokeLinecap="round" />
      <ellipse cx="60" cy="120" rx="25" ry="5" fill={DARK} opacity="0.26" filter={`url(#${blur})`} />

      <g stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round">
        <rect x="43" y="102" width="14" height="18" rx="6.5" fill={SNOUT} />
        <rect x="63" y="102" width="14" height="18" rx="6.5" fill={SNOUT} />
        <ellipse cx="60" cy="84" rx="30" ry="27" fill={`url(#${grad})`} />
      </g>

      {/* clothing sits inside the body outline */}
      <g clipPath={`url(#${bodyClip})`}>
        <Outfit budget={budget} />
        <ellipse cx="75" cy="106" rx="33" ry="20" fill={DARK} opacity="0.42" filter={`url(#${blur})`} />
        <ellipse cx="44" cy="68" rx="18" ry="12" fill="#fff" opacity="0.26" filter={`url(#${blur})`} />
        <ellipse cx="60" cy="62" rx="25" ry="11" fill={DARK} opacity="0.5" filter={`url(#${blur})`} />
      </g>

      <g stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round">
        <rect x="27" y="76" width="12" height="22" rx="6" fill={EAR} />
        <rect x="81" y="76" width="12" height="22" rx="6" fill={EAR} />
        <path d="M37 38 Q33 15 52 26 Z" fill={EAR} />
        <path d="M83 38 Q87 15 68 26 Z" fill={EAR} />
        <ellipse cx="60" cy="46" rx="26" ry="23" fill={`url(#${grad})`} />
      </g>

      <g clipPath={`url(#${headClip})`}>
        <ellipse cx="74" cy="64" rx="25" ry="17" fill={DARK} opacity="0.45" filter={`url(#${blur})`} />
        <ellipse cx="48" cy="34" rx="15" ry="10" fill="#fff" opacity="0.3" filter={`url(#${blur})`} />
      </g>

      <ellipse cx="41" cy="53" rx="6" ry="3.8" fill="#F08FA6" opacity="0.45" filter={`url(#${blur})`} />
      <ellipse cx="79" cy="53" rx="6" ry="3.8" fill="#F08FA6" opacity="0.45" filter={`url(#${blur})`} />

      <ellipse cx="60" cy="51" rx="11" ry="6" fill={DARK} opacity="0.36" filter={`url(#${blur})`} />
      <ellipse cx="60" cy="55" rx="11" ry="8" fill={SNOUT} stroke={OUTLINE} strokeWidth={STROKE} />
      <ellipse cx="56.4" cy="55" rx="1.9" ry="2.7" fill={NOSTRIL} />
      <ellipse cx="63.6" cy="55" rx="1.9" ry="2.7" fill={NOSTRIL} />

      <ellipse cx="50" cy="42" rx="3.1" ry="3.8" fill={EYE} />
      <ellipse cx="70" cy="42" rx="3.1" ry="3.8" fill={EYE} />
      <circle cx="51.2" cy="40.6" r="1.2" fill="#fff" />
      <circle cx="71.2" cy="40.6" r="1.2" fill="#fff" />

      <Headwear budget={budget} />
      <Accessory budget={budget} />
    </svg>
  );
}

/** Clothing — clipped to the body, so only the value ramp shows. */
function Outfit({ budget }: { budget: Budget }) {
  switch (budget) {
    case "$":
      return (
        <>
          <path d="M60 70 q-24 2 -24 20 q0 18 24 19 q24 -1 24 -19 q0 -18 -24 -20 Z" fill={TAN} />
          {/* patch + ragged hem */}
          <path d="M44 88 l10 -2 2 10 -10 2 Z" fill="#A98A52" />
          <path d="M33 106 q27 7 54 0 l0 6 q-27 7 -54 0 Z" fill="#A98A52" />
        </>
      );
    case "$$":
      return <path d="M60 70 q-24 2 -24 20 q0 18 24 19 q24 -1 24 -19 q0 -18 -24 -20 Z" fill={LEMON} />;
    case "$$$":
      return (
        <>
          <path d="M60 70 q-24 2 -24 20 q0 18 24 19 q24 -1 24 -19 q0 -18 -24 -20 Z" fill={PLUM} />
          <path d="M50 69 L60 80 L70 69 L66 67 L60 74 L54 67 Z" fill="#FFFDF6" />
        </>
      );
    case "$$$$":
      return (
        <>
          <path d="M60 70 q-24 2 -24 20 q0 18 24 19 q24 -1 24 -19 q0 -18 -24 -20 Z" fill={INK} />
          <path d="M51 69 q9 24 18 0 Z" fill="#FFFDF6" />
        </>
      );
  }
}

/**
 * Headwear — the primary tier cue. Height climbs with price: nothing, a low
 * cap, a short-brim hat, a tall top hat. That difference survives at 22px
 * where clothing colour does not.
 */
function Headwear({ budget }: { budget: Budget }) {
  const s = { stroke: OUTLINE, strokeWidth: STROKE + 0.2, strokeLinejoin: "round" as const };
  switch (budget) {
    case "$":
      return null; // bare head — the cheapest silhouette is no silhouette
    case "$$":
      return (
        <g {...s}>
          <path d="M38 27 A22 20 0 0 1 82 27 Z" fill={GOLD} />
          <path d="M62 27 L94 30 L94 24 L62 21 Z" fill="#E0BC46" />
        </g>
      );
    case "$$$":
      return (
        <g {...s}>
          <ellipse cx="60" cy="26" rx="34" ry="5.5" fill={PLUM} />
          <path d="M43 26 q0 -18 17 -18 q17 0 17 18 Z" fill={PLUM} />
          <path d="M43 22 q17 5 34 0" fill="none" stroke="#6E3A42" strokeWidth="3" />
        </g>
      );
    case "$$$$":
      return (
        <g {...s}>
          <rect x="42" y="-8" width="36" height="26" rx="2.5" fill={INK} />
          <rect x="42" y="0" width="36" height="6" fill={PLUM} stroke="none" />
          <rect x="30" y="17" width="60" height="6" rx="3" fill={INK} />
        </g>
      );
  }
}

/** Second-order cues, so two tiers never rest on headwear alone. */
function Accessory({ budget }: { budget: Budget }) {
  switch (budget) {
    case "$":
      // straw, sticking out sideways — breaks the silhouette on its own
      return (
        <g stroke={GOLD} strokeWidth="3" strokeLinecap="round">
          <path d="M70 58 L92 50" />
          <path d="M88 51 l5 -4" strokeWidth="2.4" />
        </g>
      );
    case "$$$":
      return (
        <g stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round">
          <path d="M54 67 L60 71 L66 67 L66 61 L60 66 L54 61 Z" fill={GOLD} />
        </g>
      );
    case "$$$$":
      return (
        <g stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round">
          <circle cx="70" cy="42" r="8.5" fill="none" strokeWidth="2.4" />
          <path d="M76 49 L81 60" strokeWidth="2" strokeLinecap="round" />
          <rect x="72" y="53" width="18" height="5" rx="2.5" fill="#8A5A2B" strokeWidth="2.2" />
          <circle cx="93" cy="55.5" r="3" fill={GOLD} stroke="none" />
        </g>
      );
    default:
      return null;
  }
}

/** Pig + price label — the standard way budget appears anywhere in the app. */
export function BudgetTag({ budget, size = 28 }: { budget: Budget; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <PricePig budget={budget} size={size} />
      <span className="font-display text-sm font-bold leading-none">{budget}</span>
    </span>
  );
}

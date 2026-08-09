"use client";

/**
 * Price-tier pigs — spec §9.2. Same Vinyl Toy construction as the avatar:
 * upright, shaded, limbs joined to the torso.
 *
 *   $     peasant   — patched sack smock, bit of straw
 *   $$    casual    — plain tee
 *   $$$   smart     — collared shirt
 *   $$$$  posh      — top hat, monocle, cigar, tailcoat
 *
 * Budget is never rendered as bare `$` text; use BudgetTag so the pig and the
 * label always travel together.
 */
import { useId } from "react";
import { BUDGET_LABELS, Budget } from "@/lib/pig";

const LIGHT = "#FFC9D6";
const MID = "#FC9FB8";
const DARK = "#DE7595";
const LIMB = "#EE8CA8";
const SNOUT = "#F291AF";
const NOSTRIL = "#B05377";
const INK = "#2B1B3D";

export function PricePig({ budget, size = 34 }: { budget: Budget; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const g = `pp-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 72 100" role="img" aria-label={BUDGET_LABELS[budget]}>
      <defs>
        <radialGradient id={g} cx="34%" cy="24%" r="82%">
          <stop offset="0%" stopColor={LIGHT} />
          <stop offset="58%" stopColor={MID} />
          <stop offset="100%" stopColor={DARK} />
        </radialGradient>
      </defs>

      {/* tail on the lower back */}
      <path d="M55 74 q8 -1 7 -7" fill="none" stroke={LIMB} strokeWidth="3" strokeLinecap="round" />

      {/* legs, then arms, then torso — joints stay covered */}
      <rect x="25" y="74" width="9" height="20" rx="4.5" fill={LIMB} />
      <rect x="38" y="74" width="9" height="20" rx="4.5" fill={LIMB} />
      <ellipse cx="29.5" cy="94" rx="6" ry="3.4" fill={DARK} />
      <ellipse cx="42.5" cy="94" rx="6" ry="3.4" fill={DARK} />
      <rect x="11" y="50" width="8" height="24" rx="4" fill={LIMB} />
      <rect x="53" y="50" width="8" height="24" rx="4" fill={LIMB} />

      <Outfit budget={budget} grad={g} />

      {/* head overlaps the torso top */}
      <path d="M20 26 Q15 6 33 17 Z" fill={LIMB} />
      <path d="M52 26 Q57 6 39 17 Z" fill={LIMB} />
      <ellipse cx="36" cy="30" rx="19" ry="17.5" fill={`url(#${g})`} />
      <ellipse cx="36" cy="36" rx="8" ry="6" fill={SNOUT} />
      <ellipse cx="33.4" cy="36" rx="1.4" ry="2" fill={NOSTRIL} />
      <ellipse cx="38.6" cy="36" rx="1.4" ry="2" fill={NOSTRIL} />
      <ellipse cx="29.5" cy="26" rx="2.2" ry="2.7" fill="#3D2230" />
      <ellipse cx="42.5" cy="26" rx="2.2" ry="2.7" fill="#3D2230" />
      <circle cx="30.4" cy="25" r="0.9" fill="#fff" />
      <circle cx="43.4" cy="25" r="0.9" fill="#fff" />
      <ellipse cx="26" cy="20" rx="5.5" ry="3.6" fill="#fff" opacity="0.32" transform="rotate(-24 26 20)" />

      <Extras budget={budget} />
    </svg>
  );
}

const TORSO = "M36 44 q-19 2 -19 18 q0 16 19 17 q19 -1 19 -17 q0 -16 -19 -18 Z";
const SHIRT = "M36 50 q-16 2 -16 15 q0 13 16 14 q16 -1 16 -14 q0 -13 -16 -15 Z";

function Outfit({ budget, grad }: { budget: Budget; grad: string }) {
  switch (budget) {
    case "$":
      return (
        <>
          <path d={TORSO} fill={`url(#${grad})`} />
          <path d={SHIRT} fill="#C9A227" />
          <path d="M28 62 l6 -1 1 6 -6 1 Z" fill="#A98418" />
          <path d="M20 74 q16 5 32 0 l0 3 q-16 5 -32 0 Z" fill="#B08F1C" />
        </>
      );
    case "$$":
      return (
        <>
          <path d={TORSO} fill={`url(#${grad})`} />
          <path d={SHIRT} fill="#00B39F" />
          <path d="M30 50 q6 6 12 0" fill="none" stroke="#009C8B" strokeWidth="1.8" />
        </>
      );
    case "$$$":
      return (
        <>
          <path d={TORSO} fill={`url(#${grad})`} />
          <path d={SHIRT} fill="#8FC7F0" />
          <path d="M29 49 L36 58 L43 49 L40 47.5 L36 52 L32 47.5 Z" fill="#FFFDFB" />
          <circle cx="36" cy="65" r="1.3" fill="#5E8FB8" />
          <circle cx="36" cy="72" r="1.3" fill="#5E8FB8" />
        </>
      );
    case "$$$$":
      return (
        <>
          <path d={TORSO} fill={`url(#${grad})`} />
          <path d={SHIRT} fill="#2B1B3D" />
          <path d="M30 49 q6 16 12 0 Z" fill="#FFFDFB" />
          <path d="M31 49 L36 53 L41 49 L41 45.5 L36 49 L31 45.5 Z" fill="#FF4D6D" />
        </>
      );
  }
}

function Extras({ budget }: { budget: Budget }) {
  if (budget === "$") {
    return <path d="M44 37 L54 33" stroke="#C9A227" strokeWidth="2" strokeLinecap="round" />;
  }
  if (budget === "$$$$") {
    return (
      <g>
        <rect x="26" y="1" width="20" height="12" rx="1.6" fill={INK} />
        <rect x="26" y="4" width="20" height="3" fill="#FF4D6D" />
        <rect x="19" y="12" width="34" height="3.4" rx="1.7" fill={INK} />
        <circle cx="42.5" cy="26" r="6" fill="none" stroke={INK} strokeWidth="1.8" />
        <path d="M47 30.5 L50 37" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
        <rect x="44" y="35" width="12" height="3.4" rx="1.7" fill="#8A5A2B" />
        <circle cx="57" cy="36.7" r="1.9" fill="#FF8A00" />
      </g>
    );
  }
  return null;
}

/** Pig + price label — the standard way budget appears anywhere in the app. */
export function BudgetTag({ budget, size = 26 }: { budget: Budget; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <PricePig budget={budget} size={size} />
      <span className="font-display text-sm font-bold leading-none">{budget}</span>
    </span>
  );
}

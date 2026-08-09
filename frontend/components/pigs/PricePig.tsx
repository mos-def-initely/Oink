"use client";

/**
 * Price-tier pigs — spec §9.2. Same drawing and outline as the avatar, dressed
 * four ways. Budget is never rendered as bare `$` text; use BudgetTag so the
 * pig and its label always travel together.
 *
 *   $     peasant  — patched sack smock, straw in the mouth
 *   $$    casual   — plain tee
 *   $$$   smart    — collared shirt
 *   $$$$  posh     — top hat, monocle, cigar, bow tie
 */
import { useId } from "react";
import { BUDGET_LABELS, Budget } from "@/lib/pig";

const OUTLINE = "#7A4450";
const EYE = "#4A2B33";
const LIGHT = "#FCD8DF";
const MID = "#F5BCC8";
const DARK = "#E3A2B0";
const EAR = "#EFAAB8";
const SNOUT = "#EDA0B0";
const INK = "#4D303F";

export function PricePig({ budget, size = 34 }: { budget: Budget; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const g = `pp-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={BUDGET_LABELS[budget]}>
      <defs>
        <radialGradient id={g} cx="36%" cy="26%" r="76%">
          <stop offset="0%" stopColor={LIGHT} />
          <stop offset="64%" stopColor={MID} />
          <stop offset="100%" stopColor={DARK} />
        </radialGradient>
      </defs>

      <g stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round">
        {/* body + clothing */}
        <Outfit budget={budget} grad={g} />
        {/* head */}
        <path d="M32 40 Q28 16 49 28 Z" fill={EAR} />
        <path d="M88 40 Q92 16 71 28 Z" fill={EAR} />
        <ellipse cx="60" cy="44" rx="28" ry="25" fill={`url(#${g})`} />
        <ellipse cx="60" cy="53" rx="11.5" ry="8.4" fill={SNOUT} />
      </g>

      <path d="M82 28 a28 25 0 0 1 -5 35" fill="none" stroke={DARK} strokeWidth="6" opacity="0.35" strokeLinecap="round" />
      <ellipse cx="39" cy="52" rx="6" ry="3.8" fill="#F08FA6" opacity="0.5" />
      <ellipse cx="81" cy="52" rx="6" ry="3.8" fill="#F08FA6" opacity="0.5" />
      <ellipse cx="49" cy="40" rx="3.2" ry="3.9" fill={EYE} />
      <ellipse cx="71" cy="40" rx="3.2" ry="3.9" fill={EYE} />
      <circle cx="50.2" cy="38.6" r="1.2" fill="#fff" />
      <circle cx="72.2" cy="38.6" r="1.2" fill="#fff" />
      {/* nostrils */}
      <ellipse cx="56" cy="53" rx="2" ry="2.8" fill={OUTLINE} />
      <ellipse cx="64" cy="53" rx="2" ry="2.8" fill={OUTLINE} />

      <Extras budget={budget} />
    </svg>
  );
}

const BODY = "M60 66 q-30 2 -30 24 q0 18 30 19 q30 -1 30 -19 q0 -22 -30 -24 Z";
const SHIRT = "M60 72 q-25 2 -25 20 q0 15 25 16 q25 -1 25 -16 q0 -18 -25 -20 Z";

function Outfit({ budget, grad }: { budget: Budget; grad: string }) {
  switch (budget) {
    case "$":
      return (
        <>
          <path d={BODY} fill={`url(#${grad})`} />
          <path d={SHIRT} fill="#C9A227" />
          <path d="M48 86 l9 -2 2 9 -9 2 Z" fill="#A8871C" strokeWidth="2.4" />
          <path d="M36 104 q24 6 48 0 l0 4 q-24 6 -48 0 Z" fill="#B08F1C" />
        </>
      );
    case "$$":
      return (
        <>
          <path d={BODY} fill={`url(#${grad})`} />
          <path d={SHIRT} fill="#914E56" />
          <path d="M52 72 q8 7 16 0" fill="none" strokeWidth="2.4" />
        </>
      );
    case "$$$":
      return (
        <>
          <path d={BODY} fill={`url(#${grad})`} />
          <path d={SHIRT} fill="#E6D389" />
          <path d="M50 71 L60 83 L70 71 L66 69 L60 76 L54 69 Z" fill="#FFFDF6" />
          <circle cx="60" cy="92" r="2" fill={INK} strokeWidth="0" />
        </>
      );
    case "$$$$":
      return (
        <>
          <path d={BODY} fill={`url(#${grad})`} />
          <path d={SHIRT} fill={INK} />
          <path d="M51 71 q9 22 18 0 Z" fill="#FFFDF6" />
          <path d="M52 71 L60 76 L68 71 L68 66 L60 71 L52 66 Z" fill="#914E56" />
        </>
      );
  }
}

function Extras({ budget }: { budget: Budget }) {
  if (budget === "$") {
    return <path d="M72 55 L88 49" stroke="#C9A227" strokeWidth="3" strokeLinecap="round" />;
  }
  if (budget === "$$$$") {
    return (
      <g stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round">
        {/* top hat */}
        <rect x="42" y="0" width="34" height="19" rx="2.5" fill={INK} />
        <rect x="42" y="6" width="34" height="5" fill="#914E56" strokeWidth="0" />
        <rect x="30" y="18" width="58" height="5.5" rx="2.7" fill={INK} />
        {/* monocle */}
        <circle cx="71" cy="40" r="9" fill="none" strokeWidth="2.6" />
        <path d="M78 47 L83 58" strokeWidth="2.2" strokeLinecap="round" />
        {/* cigar */}
        <rect x="72" y="51" width="19" height="5.4" rx="2.7" fill="#8A5A2B" strokeWidth="2.6" />
        <circle cx="94" cy="53.7" r="3" fill="#CFA51F" strokeWidth="0" />
      </g>
    );
  }
  return null;
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

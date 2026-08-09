"use client";

/**
 * The user's avatar pig — spec §9.1.
 *
 * Drawn in the reference style: warm brown outline (never black), soft shaded
 * fill, blush cheeks, wide-set dot eyes with a highlight, snub snout with
 * nostrils, small upright ears, tiny trotters, curly tail.
 *
 * The avatar is deliberately **neutral**. It's an identity, not a mood — the
 * expression in the interface comes from the reaction icons instead
 * (ReactionPigs.tsx), which is where all the attitude lives.
 *
 * Two variants:
 *   variant="face"  head only, for map pins and dense lists
 *   variant="full"  whole animal, used only on the feed and the profile
 *
 * The snout and its two nostrils are drawn at every size — they're the most
 * recognisably pig feature, and dropping them at small sizes makes the avatar
 * read as a generic blob.
 */
import { useId } from "react";
import {
  PIG_BACKGROUNDS,
  PIG_COLORS,
  PigConfig,
  TIER_SHAPE,
  fatnessTier,
  normalisePig,
} from "@/lib/pig";

type Props = {
  config?: PigConfig | null;
  placesLogged?: number;
  size?: number;
  variant?: "face" | "full";
  /** Drops the circular background — used inside map pins. */
  bare?: boolean;
  className?: string;
};

const OUTLINE = "#7A4450";
const EYE = "#4A2B33";

export default function PigAvatar({
  config,
  placesLogged = 0,
  size = 44,
  variant = "face",
  bare = false,
  className = "",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const cfg = normalisePig(config);
  const p = PIG_COLORS[cfg.color];
  const bg = PIG_BACKGROUNDS[cfg.background];
  const shape = TIER_SHAPE[fatnessTier(placesLogged)];
  const grad = `pig-${uid}`;

  const gradient = (
    <defs>
      <radialGradient id={grad} cx="36%" cy="28%" r="76%">
        <stop offset="0%" stopColor={p.light} />
        <stop offset="64%" stopColor={p.mid} />
        <stop offset="100%" stopColor={p.dark} />
      </radialGradient>
    </defs>
  );

  if (variant === "face") {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Pig">
        {gradient}
        {!bare && <circle cx="60" cy="60" r="60" fill={bg} />}
        <g stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round">
          <path d="M30 44 Q26 20 47 31 Z" fill={p.ear} />
          <path d="M90 44 Q94 20 73 31 Z" fill={p.ear} />
          <ellipse cx="60" cy="62" rx="35" ry="31" fill={`url(#${grad})`} />
          <ellipse cx="60" cy="71" rx="14" ry="10.5" fill={p.snout} />
        </g>
        {/* soft shade down one side */}
        <path
          d="M83 44 a35 31 0 0 1 -6 43"
          fill="none"
          stroke={p.dark}
          strokeWidth="7"
          opacity="0.4"
          strokeLinecap="round"
        />
        <ellipse cx="34" cy="69" rx="8" ry="5" fill={p.blush} opacity="0.55" />
        <ellipse cx="86" cy="69" rx="8" ry="5" fill={p.blush} opacity="0.55" />
        <ellipse cx="46" cy="55" rx="3.8" ry="4.6" fill={EYE} />
        <ellipse cx="74" cy="55" rx="3.8" ry="4.6" fill={EYE} />
        <circle cx="47.4" cy="53.4" r="1.4" fill="#fff" />
        <circle cx="75.4" cy="53.4" r="1.4" fill="#fff" />
        {/* nostrils — always drawn */}
        <ellipse cx="55" cy="71" rx="2.3" ry="3.2" fill={p.nostril} />
        <ellipse cx="65" cy="71" rx="2.3" ry="3.2" fill={p.nostril} />
        <Hat hat={cfg.hat} cx={60} topY={24} w={35} />
      </svg>
    );
  }

  // --- full body ---------------------------------------------------------
  const w = shape.waist;
  const headRx = shape.head;
  const headRy = headRx * 0.9;

  return (
    <svg
      width={size}
      height={(size * 134) / 130}
      viewBox="0 0 130 134"
      className={className}
      role="img"
      aria-label="Pig"
    >
      {gradient}

      {/* tail on the lower back, clear of the arms */}
      <path
        d={`M ${65 + w - 1} 90 q 13 -2 11 -14`}
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      <g stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round">
        {/* Trotters first, so the body covers where they meet it. */}
        <rect x={65 - w * 0.55} y="100" width="14" height="19" rx="6.5" fill={p.snout} />
        <rect x={65 + w * 0.55 - 14} y="100" width="14" height="19" rx="6.5" fill={p.snout} />

        {/* One rounded mass for the body — the reference pigs are blobs with
            tiny legs, not figures with separate arms. Separate limbs read as
            detached at avatar sizes. */}
        <ellipse cx="65" cy="82" rx={w} ry={w * 0.9} fill={`url(#${grad})`} />

        {/* Ears behind, then the head overlapping the body so they read as one
            silhouette rather than a head balanced on a ball. */}
        <path d={`M ${65 - headRx + 3} 40 Q ${65 - headRx - 3} 14 ${65 - 9} 27 Z`} fill={p.ear} />
        <path d={`M ${65 + headRx - 3} 40 Q ${65 + headRx + 3} 14 ${65 + 9} 27 Z`} fill={p.ear} />
        <ellipse cx="65" cy="48" rx={headRx} ry={headRy} fill={`url(#${grad})`} />
        <ellipse cx="65" cy="57" rx="12" ry="8.6" fill={p.snout} />
      </g>

      {/* belly rolls — the fatness signal */}
      {Array.from({ length: shape.rolls }).map((_, i) => {
        const y = 86 + i * 13;
        const spread = w - 6 - i * 2;
        return (
          <path
            key={i}
            d={`M ${65 - spread} ${y} q ${spread} ${7 + i} ${spread * 2} 0`}
            fill="none"
            stroke={p.dark}
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.55"
          />
        );
      })}

      <path
        d={`M ${65 + headRx - 4} 32 a ${headRx} ${headRy} 0 0 1 -5 36`}
        fill="none"
        stroke={p.dark}
        strokeWidth="6"
        opacity="0.35"
        strokeLinecap="round"
      />
      <ellipse cx={65 - headRx * 0.72} cy="56" rx="6.4" ry="4" fill={p.blush} opacity="0.55" />
      <ellipse cx={65 + headRx * 0.72} cy="56" rx="6.4" ry="4" fill={p.blush} opacity="0.55" />
      <ellipse cx="54" cy="44" rx="3.2" ry="3.9" fill={EYE} />
      <ellipse cx="76" cy="44" rx="3.2" ry="3.9" fill={EYE} />
      <circle cx="55.2" cy="42.6" r="1.2" fill="#fff" />
      <circle cx="77.2" cy="42.6" r="1.2" fill="#fff" />
      {/* nostrils — always drawn */}
      <ellipse cx="61" cy="57" rx="2" ry="2.8" fill={p.nostril} />
      <ellipse cx="69" cy="57" rx="2" ry="2.8" fill={p.nostril} />

      {cfg.accessory === "scarf" && (
        <path
          d={`M ${65 - headRx + 2} ${48 + headRy - 2} q ${headRx - 2} 9 ${(headRx - 2) * 2} 0 l 0 8 q ${-(headRx - 2)} 9 ${-(headRx - 2) * 2} 0 Z`}
          fill="#CFA51F"
          stroke={OUTLINE}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      )}
      <Hat hat={cfg.hat} cx={65} topY={48 - headRy - 4} w={headRx} />
    </svg>
  );
}

function Hat({ hat, cx, topY, w }: { hat: string; cx: number; topY: number; w: number }) {
  const s = { stroke: OUTLINE, strokeWidth: 2.6, strokeLinejoin: "round" as const };
  switch (hat) {
    case "cap":
      return (
        <g {...s}>
          <path d={`M ${cx - w * 0.74} ${topY + 13} A ${w * 0.74} ${w * 0.68} 0 0 1 ${cx + w * 0.74} ${topY + 13} Z`} fill="#914E56" />
          <path d={`M ${cx + 2} ${topY + 13} L ${cx + w * 1.05} ${topY + 15} L ${cx + w * 1.05} ${topY + 10} L ${cx + 2} ${topY + 8} Z`} fill="#A9606A" />
        </g>
      );
    case "beret":
      // Tilted and sitting off to one side — flat on the crown it reads as a
      // helmet rather than a hat.
      return (
        <g {...s} transform={`rotate(-12 ${cx} ${topY + 10})`}>
          <ellipse cx={cx} cy={topY + 10} rx={w * 0.66} ry={w * 0.3} fill="#4D303F" />
          <circle cx={cx + w * 0.5} cy={topY + 4} r={w * 0.1} fill="#4D303F" />
        </g>
      );
    case "bucket":
      return (
        <g {...s}>
          <path d={`M ${cx - w * 0.6} ${topY + 13} L ${cx - w * 0.48} ${topY - 5} L ${cx + w * 0.48} ${topY - 5} L ${cx + w * 0.6} ${topY + 13} Z`} fill="#CFA51F" />
          <ellipse cx={cx} cy={topY + 14} rx={w * 0.92} ry={w * 0.17} fill="#B99118" />
        </g>
      );
    case "party":
      return (
        <g {...s}>
          <path d={`M ${cx} ${topY - 19} L ${cx + w * 0.44} ${topY + 13} L ${cx - w * 0.44} ${topY + 13} Z`} fill="#E6D389" />
          <circle cx={cx} cy={topY - 19} r={w * 0.13} fill="#914E56" />
        </g>
      );
    case "crown":
      return (
        <g {...s}>
          <path
            d={`M ${cx - w * 0.62} ${topY + 13} L ${cx - w * 0.62} ${topY - 5} L ${cx - w * 0.31} ${topY + 3}
                L ${cx} ${topY - 9} L ${cx + w * 0.31} ${topY + 3} L ${cx + w * 0.62} ${topY - 5}
                L ${cx + w * 0.62} ${topY + 13} Z`}
            fill="#CFA51F"
          />
          <circle cx={cx} cy={topY + 4} r={w * 0.09} fill="#914E56" stroke="none" />
        </g>
      );
    case "chef":
      return (
        <g {...s}>
          <rect x={cx - w * 0.5} y={topY + 5} width={w} height={w * 0.3} rx={w * 0.06} fill="#FFFDF6" />
          <ellipse cx={cx - w * 0.28} cy={topY - 1} rx={w * 0.3} ry={w * 0.26} fill="#FFFDF6" />
          <ellipse cx={cx + w * 0.28} cy={topY - 1} rx={w * 0.3} ry={w * 0.26} fill="#FFFDF6" />
          <ellipse cx={cx} cy={topY - 6} rx={w * 0.34} ry={w * 0.3} fill="#FFFDF6" />
        </g>
      );
    default:
      return null;
  }
}

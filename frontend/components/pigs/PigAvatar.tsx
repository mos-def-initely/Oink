"use client";

/**
 * The user's avatar pig — spec §9.1.
 *
 * Reference style: warm brown outline (never black), blush cheeks, wide-set dot
 * eyes with a highlight, snub snout with nostrils, small upright ears, tiny
 * trotters, curly tail.
 *
 * **Modelling, not just outline.** A flat fill inside a uniform stroke reads as
 * a die-cut sticker. Volume comes from three soft passes clipped inside each
 * form — a core shadow down the lower-right, a broad highlight on the upper
 * left, and a contact shadow where the head meets the body — all blurred, with
 * a thinner stroke so the line stops dominating. That's what makes it read as a
 * character rather than a decal.
 *
 * The avatar is deliberately **neutral**. It's an identity, not a mood; all the
 * expression lives in the reaction icons (ReactionPigs.tsx).
 *
 * Two variants:
 *   variant="face"  head only, for map pins and dense lists
 *   variant="full"  whole animal, used only on the feed and the profile
 *
 * The snout and its two nostrils are drawn at every size — the most
 * recognisably pig feature, and without them the avatar reads as a blob.
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

const OUTLINE = "#8A5460";
const EYE = "#43262F";
const STROKE = 2.1;

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
  // Every pig has a soft blush already; the accessory turns it up, so picking
  // it reads as a decision rather than a barely-there tweak.
  const rosy = cfg.accessory === "blush";
  const blushScale = rosy ? 1.4 : 1;
  const blushAlpha = rosy ? 0.82 : 0.5;

  const grad = `g-${uid}`;
  const blur = `b-${uid}`;
  const headClip = `hc-${uid}`;
  const bodyClip = `bc-${uid}`;

  const defs = (
    <defs>
      <radialGradient id={grad} cx="34%" cy="24%" r="82%">
        <stop offset="0%" stopColor={p.light} />
        <stop offset="52%" stopColor={p.mid} />
        <stop offset="100%" stopColor={p.dark} />
      </radialGradient>
      <filter id={blur} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
  );

  if (variant === "face") {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Pig">
        {defs}
        <clipPath id={headClip}>
          <ellipse cx="60" cy="62" rx="35" ry="31" />
        </clipPath>

        {!bare && <circle cx="60" cy="60" r="60" fill={bg} />}

        <g stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round">
          <path d="M30 44 Q26 20 47 31 Z" fill={p.ear} />
          <path d="M90 44 Q94 20 73 31 Z" fill={p.ear} />
          <ellipse cx="60" cy="62" rx="35" ry="31" fill={`url(#${grad})`} />
        </g>

        {/* Soft modelling, clipped inside the head */}
        <g clipPath={`url(#${headClip})`}>
          <ellipse cx="78" cy="86" rx="34" ry="26" fill={p.dark} opacity="0.5" filter={`url(#${blur})`} />
          <ellipse cx="42" cy="42" rx="22" ry="16" fill="#fff" opacity="0.34" filter={`url(#${blur})`} />
        </g>

        <ellipse cx="34" cy="69" rx={8 * blushScale} ry={5 * blushScale} fill={p.blush} opacity={blushAlpha} filter={`url(#${blur})`} />
        <ellipse cx="86" cy="69" rx={8 * blushScale} ry={5 * blushScale} fill={p.blush} opacity={blushAlpha} filter={`url(#${blur})`} />

        {/* Snout sits proud of the face — shadow above it, highlight on top */}
        <ellipse cx="60" cy="66" rx="14" ry="8" fill={p.dark} opacity="0.4" filter={`url(#${blur})`} />
        <ellipse cx="60" cy="71" rx="14" ry="10.5" fill={p.snout} stroke={OUTLINE} strokeWidth={STROKE} />
        <ellipse cx="57" cy="67" rx="7" ry="3" fill="#fff" opacity="0.28" filter={`url(#${blur})`} />

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
      {defs}
      <clipPath id={bodyClip}>
        <ellipse cx="65" cy="82" rx={w} ry={w * 0.9} />
      </clipPath>
      <clipPath id={headClip}>
        <ellipse cx="65" cy="48" rx={headRx} ry={headRy} />
      </clipPath>

      {/* Tail starts outside the right arm's outer edge, so it comes off the
          rump rather than out of the arm. */}
      <path
        d={`M ${65 + w + 5} 88 q 12 -3 10 -14`}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={STROKE + 0.4}
        strokeLinecap="round"
      />

      {/* ground shadow */}
      <ellipse cx="65" cy="122" rx={w * 0.8} ry="5" fill={p.dark} opacity="0.28" filter={`url(#${blur})`} />

      <g stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round">
        <rect x={65 - w * 0.55} y="100" width="14" height="19" rx="6.5" fill={p.snout} />
        <rect x={65 + w * 0.55 - 14} y="100" width="14" height="19" rx="6.5" fill={p.snout} />
        <ellipse cx="65" cy="82" rx={w} ry={w * 0.9} fill={`url(#${grad})`} />
      </g>

      {/* Body modelling */}
      <g clipPath={`url(#${bodyClip})`}>
        <ellipse cx={65 + w * 0.5} cy="104" rx={w * 1.1} ry={w * 0.7} fill={p.dark} opacity="0.48" filter={`url(#${blur})`} />
        <ellipse cx={65 - w * 0.4} cy="66" rx={w * 0.6} ry={w * 0.4} fill="#fff" opacity="0.3" filter={`url(#${blur})`} />
        {/* contact shadow cast by the head onto the body */}
        <ellipse cx="65" cy="62" rx={headRx * 0.95} ry="12" fill={p.dark} opacity="0.55" filter={`url(#${blur})`} />
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
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        );
      })}

      {/* Arms sit ON TOP of the body edges in the darker ear tone, which is what
          makes them read as arms in front rather than limbs beside a ball. */}
      <g stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round">
        <rect x={65 - w - 4} y="74" width="13" height="24" rx="6.5" fill={p.ear} />
        <rect x={65 + w - 9} y="74" width="13" height="24" rx="6.5" fill={p.ear} />
      </g>

      <g stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round">
        <path d={`M ${65 - headRx + 3} 40 Q ${65 - headRx - 3} 14 ${65 - 9} 27 Z`} fill={p.ear} />
        <path d={`M ${65 + headRx - 3} 40 Q ${65 + headRx + 3} 14 ${65 + 9} 27 Z`} fill={p.ear} />
        <ellipse cx="65" cy="48" rx={headRx} ry={headRy} fill={`url(#${grad})`} />
      </g>

      {/* Head modelling */}
      <g clipPath={`url(#${headClip})`}>
        <ellipse cx={65 + headRx * 0.5} cy="68" rx={headRx} ry={headRy * 0.8} fill={p.dark} opacity="0.48" filter={`url(#${blur})`} />
        <ellipse cx={65 - headRx * 0.42} cy="34" rx={headRx * 0.6} ry={headRy * 0.45} fill="#fff" opacity="0.32" filter={`url(#${blur})`} />
      </g>

      <ellipse cx={65 - headRx * 0.72} cy="56" rx={6.4 * blushScale} ry={4 * blushScale} fill={p.blush} opacity={blushAlpha} filter={`url(#${blur})`} />
      <ellipse cx={65 + headRx * 0.72} cy="56" rx={6.4 * blushScale} ry={4 * blushScale} fill={p.blush} opacity={blushAlpha} filter={`url(#${blur})`} />

      <ellipse cx="65" cy="53" rx="12" ry="6.5" fill={p.dark} opacity="0.38" filter={`url(#${blur})`} />
      <ellipse cx="65" cy="57" rx="12" ry="8.6" fill={p.snout} stroke={OUTLINE} strokeWidth={STROKE} />
      <ellipse cx="62.5" cy="54" rx="6" ry="2.4" fill="#fff" opacity="0.26" filter={`url(#${blur})`} />

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
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
      )}
      <Hat hat={cfg.hat} cx={65} topY={48 - headRy - 4} w={headRx} />
    </svg>
  );
}

function Hat({ hat, cx, topY, w }: { hat: string; cx: number; topY: number; w: number }) {
  const s = { stroke: OUTLINE, strokeWidth: STROKE + 0.2, strokeLinejoin: "round" as const };
  switch (hat) {
    case "cap":
      return (
        <g {...s}>
          <path d={`M ${cx - w * 0.74} ${topY + 13} A ${w * 0.74} ${w * 0.68} 0 0 1 ${cx + w * 0.74} ${topY + 13} Z`} fill="#914E56" />
          <path d={`M ${cx + 2} ${topY + 13} L ${cx + w * 1.05} ${topY + 15} L ${cx + w * 1.05} ${topY + 10} L ${cx + 2} ${topY + 8} Z`} fill="#A9606A" />
        </g>
      );
    case "beret":
      // Tilted and off to one side — flat on the crown it reads as a helmet.
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

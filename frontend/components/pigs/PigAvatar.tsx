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
  hidesEars,
  normalisePig,
} from "@/lib/pig";

type Props = {
  config?: PigConfig | null;
  placesLogged?: number;
  /** Last logged place; the pig drops a tier per idle fortnight from here. */
  lastLoggedAt?: string | null;
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
  lastLoggedAt = null,
  size = 44,
  variant = "face",
  bare = false,
  className = "",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const cfg = normalisePig(config);
  const p = PIG_COLORS[cfg.color];
  const bg = PIG_BACKGROUNDS[cfg.background];
  const tier = fatnessTier(placesLogged, lastLoggedAt);
  // Starved out: her modelling is kept intact and simply drained of colour,
  // so a dead pig still reads as the same animal rather than a different one.
  const dead = tier === "dead";
  const shape = TIER_SHAPE[tier];
  const drained = dead ? { filter: "grayscale(1)", opacity: 0.85 } : undefined;
  // Every pig has a soft blush already; the accessory turns it up, so picking
  // it reads as a decision rather than a barely-there tweak.
  const rosy = cfg.accessory === "blush";
  const shades = cfg.accessory === "sunglasses";
  // Cap, beret, bucket, chef and top hat sit down over the ears; a party cone
  // and a crown perch between them, so those two leave the ears showing.
  const earsHidden = hidesEars(cfg.hat);
  const blushScale = rosy ? 1.35 : 1;
  const blushAlpha = rosy ? 0.82 : 0.5;

  const grad = `g-${uid}`;
  const blur = `b-${uid}`;
  const headClip = `hc-${uid}`;
  const bodyClip = `bc-${uid}`;
  const chestGrad = `cg-${uid}`;
  const bellyGrad = `bg-${uid}`;

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
          {!earsHidden && <path d="M30 44 Q26 20 47 31 Z" fill={p.ear} />}
          {!earsHidden && <path d="M90 44 Q94 20 73 31 Z" fill={p.ear} />}
          <ellipse cx="60" cy="62" rx="35" ry="31" fill={`url(#${grad})`} />
        </g>

        {/* Soft modelling, clipped inside the head */}
        <g clipPath={`url(#${headClip})`}>
          <ellipse cx="78" cy="86" rx="34" ry="26" fill={p.dark} opacity="0.5" filter={`url(#${blur})`} />
          <ellipse cx="42" cy="42" rx="22" ry="16" fill="#fff" opacity="0.34" filter={`url(#${blur})`} />
        </g>

        <ellipse cx="34" cy="69" rx={5.4 * blushScale} ry={3.4 * blushScale} fill={p.blush} opacity={blushAlpha} filter={`url(#${blur})`} />
        <ellipse cx="86" cy="69" rx={5.4 * blushScale} ry={3.4 * blushScale} fill={p.blush} opacity={blushAlpha} filter={`url(#${blur})`} />

        {/* Snout sits proud of the face — shadow above it, highlight on top */}
        <ellipse cx="60" cy="66" rx="14" ry="8" fill={p.dark} opacity="0.4" filter={`url(#${blur})`} />
        <ellipse cx="60" cy="71" rx="14" ry="10.5" fill={p.snout} stroke={OUTLINE} strokeWidth={STROKE} />
        <ellipse cx="57" cy="67" rx="7" ry="3" fill="#fff" opacity="0.28" filter={`url(#${blur})`} />

{dead ? (
          <g stroke={EYE} strokeWidth="2.4" strokeLinecap="round">
            <line x1={46 - 4} y1={55 - 4} x2={46 + 4} y2={55 + 4} />
            <line x1={46 + 4} y1={55 - 4} x2={46 - 4} y2={55 + 4} />
            <line x1={74 - 4} y1={55 - 4} x2={74 + 4} y2={55 + 4} />
            <line x1={74 + 4} y1={55 - 4} x2={74 - 4} y2={55 + 4} />
          </g>
        ) : shades ? (
          <Shades lx={46} rx={74} cy={54} lens={10.5} />
        ) : (
          <>
            <ellipse cx="46" cy="55" rx="3.8" ry="4.6" fill={EYE} />
            <ellipse cx="74" cy="55" rx="3.8" ry="4.6" fill={EYE} />
            <circle cx="47.4" cy="53.4" r="1.4" fill="#fff" />
            <circle cx="75.4" cy="53.4" r="1.4" fill="#fff" />
          </>
        )}
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
      style={drained}
      role="img"
      aria-label={dead ? "Dead pig" : "Pig"}
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

      {/* Fat as volume rather than stripes: chest fat above, one big gut below,
          each lit from above and creased underneath so it hangs instead of
          floating. Clipped to the body so nothing escapes the silhouette. */}
      {(shape.moobs || shape.belly) && (
        <g clipPath={`url(#${bodyClip})`}>
          <defs>
            <linearGradient id={chestGrad} gradientUnits="userSpaceOnUse"
              x1="0" y1={82 - w * 0.72} x2="0" y2={82 - w * 0.12}>
              <stop offset="0%" stopColor="#fff" stopOpacity="0.26" />
              <stop offset="45%" stopColor="#fff" stopOpacity="0" />
              <stop offset="62%" stopColor={p.dark} stopOpacity="0" />
              <stop offset="100%" stopColor={p.dark} stopOpacity="0.58" />
            </linearGradient>
            <linearGradient id={bellyGrad} gradientUnits="userSpaceOnUse"
              x1="0" y1={82 - w * 0.05} x2="0" y2={82 + w * 0.95}>
              <stop offset="0%" stopColor="#fff" stopOpacity={0.22 * (shape.belly ?? 0)} />
              <stop offset="34%" stopColor="#fff" stopOpacity="0" />
              <stop offset="56%" stopColor={p.dark} stopOpacity="0" />
              <stop offset="100%" stopColor={p.dark} stopOpacity={0.5 * (shape.belly ?? 0)} />
            </linearGradient>
          </defs>

          {!!shape.moobs &&
            [-1, 1].map((side) => (
              <ellipse
                key={side}
                cx={65 + side * w * 0.42}
                cy={82 - w * 0.4}
                rx={w * 0.48 * shape.moobs!}
                ry={w * 0.26 * shape.moobs!}
                fill={`url(#${chestGrad})`}
              />
            ))}

          {!!shape.belly && (
            <ellipse
              cx="65"
              cy={82 + w * 0.34}
              rx={w * 1.02}
              ry={w * 0.56 * (0.7 + shape.belly * 0.3)}
              fill={`url(#${bellyGrad})`}
            />
          )}
        </g>
      )}

      {/* Hunky: the width sits in the chest, not the gut. Pecs and a two-column
          stack of abs, drawn in the same stroke language as the rolls. */}
      {shape.muscle && (
        <g
          clipPath={`url(#${bodyClip})`}
          fill="none"
          stroke={p.dark}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        >
          <path d={`M ${65 - w * 0.55} 72 q ${w * 0.28} 9 ${w * 0.52} 0`} />
          <path d={`M ${65 + w * 0.03} 72 q ${w * 0.28} 9 ${w * 0.52} 0`} />
          <line x1="65" y1="78" x2="65" y2="98" />
          <line x1={65 - w * 0.42} y1="85" x2={65 + w * 0.42} y2="85" />
          <line x1={65 - w * 0.38} y1="92" x2={65 + w * 0.38} y2="92" />
        </g>
      )}

      {/* Arms sit ON TOP of the body edges in the darker ear tone, which is what
          makes them read as arms in front rather than limbs beside a ball. */}
      <g stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round">
        <rect x={65 - w - 4} y="74" width="13" height="24" rx="6.5" fill={p.ear} />
        <rect x={65 + w - 9} y="74" width="13" height="24" rx="6.5" fill={p.ear} />
      </g>

      <g stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round">
        {!earsHidden && (
          <path d={`M ${65 - headRx + 3} 40 Q ${65 - headRx - 3} 14 ${65 - 9} 27 Z`} fill={p.ear} />
        )}
        {!earsHidden && (
          <path d={`M ${65 + headRx - 3} 40 Q ${65 + headRx + 3} 14 ${65 + 9} 27 Z`} fill={p.ear} />
        )}
        <ellipse cx="65" cy="48" rx={headRx} ry={headRy} fill={`url(#${grad})`} />
      </g>

      {/* Head modelling */}
      <g clipPath={`url(#${headClip})`}>
        <ellipse cx={65 + headRx * 0.5} cy="68" rx={headRx} ry={headRy * 0.8} fill={p.dark} opacity="0.48" filter={`url(#${blur})`} />
        <ellipse cx={65 - headRx * 0.42} cy="34" rx={headRx * 0.6} ry={headRy * 0.45} fill="#fff" opacity="0.32" filter={`url(#${blur})`} />
      </g>

      <ellipse cx={65 - headRx * 0.72} cy="56" rx={4.4 * blushScale} ry={2.8 * blushScale} fill={p.blush} opacity={blushAlpha} filter={`url(#${blur})`} />
      <ellipse cx={65 + headRx * 0.72} cy="56" rx={4.4 * blushScale} ry={2.8 * blushScale} fill={p.blush} opacity={blushAlpha} filter={`url(#${blur})`} />

      <ellipse cx="65" cy="53" rx="12" ry="6.5" fill={p.dark} opacity="0.38" filter={`url(#${blur})`} />
      <ellipse cx="65" cy="57" rx="12" ry="8.6" fill={p.snout} stroke={OUTLINE} strokeWidth={STROKE} />
      <ellipse cx="62.5" cy="54" rx="6" ry="2.4" fill="#fff" opacity="0.26" filter={`url(#${blur})`} />

{dead ? (
        <g stroke={EYE} strokeWidth="2.4" strokeLinecap="round">
          <line x1={54 - 3.4} y1={44 - 3.4} x2={54 + 3.4} y2={44 + 3.4} />
          <line x1={54 + 3.4} y1={44 - 3.4} x2={54 - 3.4} y2={44 + 3.4} />
          <line x1={76 - 3.4} y1={44 - 3.4} x2={76 + 3.4} y2={44 + 3.4} />
          <line x1={76 + 3.4} y1={44 - 3.4} x2={76 - 3.4} y2={44 + 3.4} />
        </g>
      ) : shades ? (
        <Shades lx={54} rx={76} cy={43.5} lens={8.6} />
      ) : (
        <>
          <ellipse cx="54" cy="44" rx="3.2" ry="3.9" fill={EYE} />
          <ellipse cx="76" cy="44" rx="3.2" ry="3.9" fill={EYE} />
          <circle cx="55.2" cy="42.6" r="1.2" fill="#fff" />
          <circle cx="77.2" cy="42.6" r="1.2" fill="#fff" />
        </>
      )}
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
      {/* A second chin is a fold, so it's drawn as the shadow one jaw casts on
          the next — never a lighter shape laid over the face, which reads as a
          panel stuck on rather than flesh. Clipped to the head so the soft edge
          can't bleed past the jawline. */}
      {shape.chin && (
        <g clipPath={`url(#${headClip})`}>
          <ellipse
            cx="65"
            cy={48 + headRy * 0.52}
            rx={headRx * 0.66}
            ry={headRy * 0.17}
            fill={p.dark}
            opacity="0.3"
            filter={`url(#${blur})`}
          />
          <ellipse
            cx="65"
            cy={48 + headRy * 0.78}
            rx={headRx * 0.5}
            ry={headRy * 0.16}
            fill="#fff"
            opacity="0.16"
            filter={`url(#${blur})`}
          />
        </g>
      )}

      <Hat hat={cfg.hat} cx={65} topY={48 - headRy - 4} w={headRx} />
    </svg>
  );
}

/** Two rounded lenses and a bridge, in her outline rather than a hard black. */
function Shades({ lx, rx, cy, lens }: { lx: number; rx: number; cy: number; lens: number }) {
  const h = lens * 0.78;
  return (
    <g stroke={OUTLINE} strokeWidth={STROKE - 0.3} strokeLinejoin="round">
      <rect x={lx - lens / 2} y={cy - h / 2} width={lens} height={h} rx={h * 0.42} fill="#43262F" />
      <rect x={rx - lens / 2} y={cy - h / 2} width={lens} height={h} rx={h * 0.42} fill="#43262F" />
      <line x1={lx + lens / 2} y1={cy} x2={rx - lens / 2} y2={cy} strokeWidth={STROKE - 0.5} />
      <line
        x1={lx - lens / 2 + 1.4}
        y1={cy - h / 2 + 1.8}
        x2={lx + lens / 2 - 2.2}
        y2={cy - h / 2 + 1.8}
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </g>
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
    case "tophat":
      // Tall crown, hard brim, and a band picked out in her gold so it doesn't
      // read as a solid black block at pin size.
      return (
        <g {...s}>
          <ellipse cx={cx} cy={topY + 13} rx={w * 0.95} ry={w * 0.17} fill="#3A2530" />
          <rect x={cx - w * 0.46} y={topY - 17} width={w * 0.92} height={w * 0.85} rx={w * 0.05} fill="#4D303F" />
          <rect x={cx - w * 0.46} y={topY + 2} width={w * 0.92} height={w * 0.16} fill="#CFA51F" stroke="none" />
        </g>
      );
    default:
      return null;
  }
}

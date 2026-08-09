"use client";

/**
 * The user's avatar pig — spec §9.1. "Vinyl Toy" finish: glossy gradient
 * shading, a specular highlight, no outlines.
 *
 * Two variants:
 *   variant="face"  head only — used on map pins and in dense lists
 *   variant="full"  upright bipedal body — profile and feed only
 *
 * Construction order matters: tail, legs, arms, torso, then head. Each limb is
 * overlapped by the piece drawn after it, so every joint is covered and nothing
 * reads as detached. The tail sits on the lower back, well clear of the arms.
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
  const fold = `fold-${uid}`;
  const clip = `torso-${uid}`;

  const gradient = (
    <defs>
      <radialGradient id={grad} cx="34%" cy="26%" r="82%">
        <stop offset="0%" stopColor={p.light} />
        <stop offset="58%" stopColor={p.mid} />
        <stop offset="100%" stopColor={p.dark} />
      </radialGradient>
    </defs>
  );

  if (variant === "face") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label="Pig">
        {gradient}
        {!bare && <circle cx="50" cy="50" r="50" fill={bg} />}
        <Ears p={p} cx={50} cy={40} rx={33} />
        <ellipse cx="50" cy="53" rx="33" ry="30" fill={`url(#${grad})`} />
        <Face p={p} cx={50} cy={53} s={1} accessory={cfg.accessory} />
        <ellipse cx="33" cy="34" rx="9" ry="6" fill="#fff" opacity="0.34" transform="rotate(-24 33 34)" />
        <Hat hat={cfg.hat} cx={50} topY={24} w={33} />
      </svg>
    );
  }

  // --- full body ---------------------------------------------------------
  const w = shape.waist;
  const top = 66;
  const bottom = 134;
  const headCy = 46;
  const headRx = shape.head;
  const headRy = shape.head * 0.92;
  const armW = 11;
  const q = (bottom - top) / 2.4;
  const q2 = (bottom - top) / 2.2;
  const torsoPath = `M 50 ${top} q ${-w} 2 ${-w} ${q} q 0 ${q2} ${w} ${q} q ${w} ${-q} ${w} ${-q2} q 0 ${-q} ${-w} ${-q} Z`;

  return (
    <svg
      width={size}
      height={(size * 165) / 100}
      viewBox="0 0 100 165"
      className={className}
      role="img"
      aria-label="Pig"
    >
      {gradient}

      {/* tail — lower back, behind the torso, nowhere near the arms */}
      <path
        d={`M ${50 + w - 2} 118 q 12 -2 11 -11 q -1 -7 -7 -6`}
        fill="none"
        stroke={p.limb}
        strokeWidth="4"
        strokeLinecap="round"
      />

      <ellipse cx="50" cy="157" rx={w + 4} ry="4.5" fill="#2B1B3D" opacity="0.13" />

      {/* legs, then arms — the torso is drawn after, covering both joints */}
      <rect x="36" y="120" width="13" height="30" rx="6.5" fill={p.limb} />
      <rect x="51" y="120" width="13" height="30" rx="6.5" fill={p.limb} />
      <ellipse cx="42.5" cy="150" rx="8.6" ry="4.8" fill={p.dark} />
      <ellipse cx="57.5" cy="150" rx="8.6" ry="4.8" fill={p.dark} />
      <rect x={50 - w - armW + 4} y="78" width={armW} height="34" rx={armW / 2} fill={p.limb} />
      <rect x={50 + w - 4} y="78" width={armW} height="34" rx={armW / 2} fill={p.limb} />

      <path d={torsoPath} fill={`url(#${grad})`} />

      {/* Belly rolls — the fatness signal (spec §9.1).
          A fold isn't a line, it's flesh overhanging flesh, so each one is built
          from three pieces: the hollow the upper roll casts on the one below,
          the crease itself, and the light catching the bulge underneath. Drawn
          with soft fills rather than outlines, to match the vinyl-toy finish. */}
      {shape.rolls > 0 && (
        <g clipPath={`url(#${clip})`}>
          <defs>
            <clipPath id={clip}>
              <path d={torsoPath} />
            </clipPath>
            {Array.from({ length: shape.rolls }).map((_, i) => {
              const crease = 96 + i * 14 + (7 + i) * 0.5;
              return (
                <linearGradient
                  key={i}
                  id={`${fold}-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1={crease}
                  x2="0"
                  y2={crease + 9}
                >
                  <stop offset="0%" stopColor={p.dark} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={p.dark} stopOpacity="0" />
                </linearGradient>
              );
            })}
          </defs>

          {Array.from({ length: shape.rolls }).map((_, i) => {
            const y = 96 + i * 14;
            // Overshoot the waist deliberately — the clip trims it to the
            // silhouette, so the fold runs edge to edge instead of stopping short.
            const spread = w + 3;
            const sag = 7 + i; // lower rolls hang deeper
            const bulge = 15; // how far the roll below swells past the crease
            return (
              <g key={i}>
                {/* The hollow under the overhang. Both curves share their end
                    points, so the shadow is thickest mid-belly and tapers to
                    nothing at the sides — a crease, not a painted band. */}
                <path
                  d={`M ${50 - spread} ${y}
                      q ${spread} ${sag} ${spread * 2} 0
                      q ${-spread} ${sag + bulge} ${-spread * 2} 0 Z`}
                  fill={`url(#${fold}-${i})`}
                />
                <path
                  d={`M ${50 - spread} ${y} q ${spread} ${sag} ${spread * 2} 0`}
                  fill="none"
                  stroke={p.dark}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.45"
                />
                {/* Light on the crown of the roll below the crease. */}
                <path
                  d={`M ${50 - spread + 7} ${y + bulge * 0.62}
                      q ${spread - 7} ${sag} ${(spread - 7) * 2} 0`}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.18"
                />
              </g>
            );
          })}
        </g>
      )}

      {cfg.accessory === "tote" && (
        <g>
          <rect x={50 + w - 2} y="100" width="17" height="20" rx="2.5" fill="#FF8A00" />
          <path d={`M ${50 + w + 2} 100 q 4.5 -9 9 0`} fill="none" stroke="#FF8A00" strokeWidth="2.4" />
        </g>
      )}

      {/* head — overlaps the torso top, so there's no floating gap */}
      <Ears p={p} cx={50} cy={headCy - 6} rx={headRx} />
      <ellipse cx="50" cy={headCy} rx={headRx} ry={headRy} fill={`url(#${grad})`} />
      {shape.chin && (
        <path
          d={`M ${50 - headRx * 0.58} ${headCy + headRy * 0.66} q ${headRx * 0.58} 8 ${headRx * 1.16} 0`}
          fill="none"
          stroke={p.dark}
          strokeWidth="2.3"
          strokeLinecap="round"
          opacity="0.5"
        />
      )}
      <Face p={p} cx={50} cy={headCy} s={headRx / 33} accessory={cfg.accessory} />
      <ellipse
        cx={50 - headRx * 0.5}
        cy={headCy - headRy * 0.55}
        rx={headRx * 0.27}
        ry={headRy * 0.19}
        fill="#fff"
        opacity="0.34"
        transform={`rotate(-24 ${50 - headRx * 0.5} ${headCy - headRy * 0.55})`}
      />
      {cfg.accessory === "scarf" && (
        <path
          d={`M ${50 - headRx + 3} ${headCy + headRy - 2} q ${headRx - 3} 9 ${(headRx - 3) * 2} 0 l 0 8 q ${-(headRx - 3)} 9 ${-(headRx - 3) * 2} 0 Z`}
          fill="#00B39F"
        />
      )}
      <Hat hat={cfg.hat} cx={50} topY={headCy - headRy - 2} w={headRx} />
    </svg>
  );
}

/* ---------- parts ---------- */

type Pal = (typeof PIG_COLORS)[string];

function Ears({ p, cx, cy, rx }: { p: Pal; cx: number; cy: number; rx: number }) {
  const off = rx - 6;
  return (
    <>
      <path d={`M ${cx - off} ${cy + 2} Q ${cx - off - 6} ${cy - 24} ${cx - off + 17} ${cy - 12} Z`} fill={p.limb} />
      <path d={`M ${cx + off} ${cy + 2} Q ${cx + off + 6} ${cy - 24} ${cx + off - 17} ${cy - 12} Z`} fill={p.limb} />
    </>
  );
}

function Face({ p, cx, cy, s, accessory }: { p: Pal; cx: number; cy: number; s: number; accessory: string }) {
  return (
    <g>
      {accessory === "blush" && (
        <>
          <ellipse cx={cx - 21 * s} cy={cy + 6 * s} rx={7 * s} ry={4.4 * s} fill="#FF6B8F" opacity="0.42" />
          <ellipse cx={cx + 21 * s} cy={cy + 6 * s} rx={7 * s} ry={4.4 * s} fill="#FF6B8F" opacity="0.42" />
        </>
      )}

      {accessory === "sunglasses" ? (
        <g>
          <rect x={cx - 22 * s} y={cy - 12 * s} width={17 * s} height={12 * s} rx={5 * s} fill="#2B1B3D" />
          <rect x={cx + 5 * s} y={cy - 12 * s} width={17 * s} height={12 * s} rx={5 * s} fill="#2B1B3D" />
          <rect x={cx - 5 * s} y={cy - 8 * s} width={10 * s} height={2.6 * s} fill="#2B1B3D" />
        </g>
      ) : (
        <>
          <ellipse cx={cx - 12 * s} cy={cy - 7 * s} rx={3.5 * s} ry={4.2 * s} fill="#3D2230" />
          <ellipse cx={cx + 12 * s} cy={cy - 7 * s} rx={3.5 * s} ry={4.2 * s} fill="#3D2230" />
          <circle cx={cx - 10.7 * s} cy={cy - 8.6 * s} r={1.4 * s} fill="#fff" />
          <circle cx={cx + 13.3 * s} cy={cy - 8.6 * s} r={1.4 * s} fill="#fff" />
        </>
      )}

      <ellipse cx={cx} cy={cy + 8 * s} rx={14 * s} ry={10.4 * s} fill={p.snout} />
      <ellipse cx={cx - 4.6 * s} cy={cy + 8 * s} rx={2.3 * s} ry={3.4 * s} fill={p.nostril} />
      <ellipse cx={cx + 4.6 * s} cy={cy + 8 * s} rx={2.3 * s} ry={3.4 * s} fill={p.nostril} />
    </g>
  );
}

function Hat({ hat, cx, topY, w }: { hat: string; cx: number; topY: number; w: number }) {
  switch (hat) {
    case "cap":
      return (
        <g>
          <path d={`M ${cx - w * 0.72} ${topY + 12} A ${w * 0.72} ${w * 0.66} 0 0 1 ${cx + w * 0.72} ${topY + 12} Z`} fill="#FF4D6D" />
          <path d={`M ${cx + 2} ${topY + 12} L ${cx + w * 1.02} ${topY + 14} L ${cx + w * 1.02} ${topY + 9} L ${cx + 2} ${topY + 7} Z`} fill="#FF7A93" />
        </g>
      );
    case "beret":
      return (
        <g>
          <ellipse cx={cx} cy={topY + 8} rx={w * 0.78} ry={w * 0.42} fill="#7B3FE4" />
          <circle cx={cx + w * 0.36} cy={topY - 2} r={w * 0.12} fill="#7B3FE4" />
        </g>
      );
    case "bucket":
      return (
        <g>
          <path d={`M ${cx - w * 0.6} ${topY + 12} L ${cx - w * 0.48} ${topY - 6} L ${cx + w * 0.48} ${topY - 6} L ${cx + w * 0.6} ${topY + 12} Z`} fill="#00B39F" />
          <ellipse cx={cx} cy={topY + 13} rx={w * 0.9} ry={w * 0.17} fill="#009C8B" />
        </g>
      );
    case "party":
      return (
        <g>
          <path d={`M ${cx} ${topY - 18} L ${cx + w * 0.42} ${topY + 12} L ${cx - w * 0.42} ${topY + 12} Z`} fill="#FF8A00" />
          <circle cx={cx} cy={topY - 18} r={w * 0.13} fill="#FF4D6D" />
        </g>
      );
    case "crown":
      return (
        <g>
          <path
            d={`M ${cx - w * 0.6} ${topY + 12} L ${cx - w * 0.6} ${topY - 6} L ${cx - w * 0.3} ${topY + 2}
                L ${cx} ${topY - 10} L ${cx + w * 0.3} ${topY + 2} L ${cx + w * 0.6} ${topY - 6}
                L ${cx + w * 0.6} ${topY + 12} Z`}
            fill="#FFC53D"
          />
          <circle cx={cx} cy={topY + 3} r={w * 0.09} fill="#FF4D6D" />
        </g>
      );
    case "chef":
      return (
        <g>
          <rect x={cx - w * 0.5} y={topY + 4} width={w} height={w * 0.3} rx={w * 0.06} fill="#FFFDFB" />
          <ellipse cx={cx - w * 0.28} cy={topY - 2} rx={w * 0.3} ry={w * 0.26} fill="#FFFDFB" />
          <ellipse cx={cx + w * 0.28} cy={topY - 2} rx={w * 0.3} ry={w * 0.26} fill="#FFFDFB" />
          <ellipse cx={cx} cy={topY - 7} rx={w * 0.34} ry={w * 0.3} fill="#FFFDFB" />
        </g>
      );
    default:
      return null;
  }
}

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
  hidesEars,
  normalisePig,
  palePalette,
} from "@/lib/pig";

type Props = {
  config?: PigConfig | null;
  placesLogged?: number;
  /** Last logged place; the pig loses a tier per idle week from here. */
  lastLoggedAt?: string | null;
  size?: number;
  variant?: "face" | "full";
  /** Drops the circular background — used inside map pins. */
  bare?: boolean;
  className?: string;
};

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
  const livePalette = PIG_COLORS[cfg.color];
  const bg = PIG_BACKGROUNDS[cfg.background];
  const tier = fatnessTier(placesLogged, lastLoggedAt);
  // A dead pig is drawn from the same parts, drained of colour with its eyes
  // X'd out — unmistakable at any size, and it still shows whose pig it is.
  const dead = tier === "dead";
  const shape = TIER_SHAPE[tier];
  // Drained rather than greyscaled — still recognisably the colour they chose.
  const p = dead ? palePalette(livePalette) : livePalette;
  const grad = `pig-${uid}`;
  const fold = `fold-${uid}`;
  const clip = `torso-${uid}`;

  const gradient = (cx: number, cy: number, r: number) => (
    <defs>
      {/* userSpaceOnUse, not objectBoundingBox: the belly lobes are separate
          shapes, and a per-shape gradient would light each one on its own and
          destroy the illusion that they're all the same lump of pig. */}
      <radialGradient id={grad} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
        <stop offset="0%" stopColor={p.light} />
        <stop offset="58%" stopColor={p.mid} />
        <stop offset="100%" stopColor={p.dark} />
      </radialGradient>
    </defs>
  );

  if (variant === "face") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
        role="img"
        aria-label={dead ? "Dead pig" : "Pig"}
      >
        {gradient(33, 34, 54)}
        {!bare && <circle cx="50" cy="50" r="50" fill={bg} />}
        {!hidesEars(cfg.hat) && <Ears p={p} cx={50} cy={40} rx={33} />}
        <ellipse cx="50" cy="53" rx="33" ry="30" fill={`url(#${grad})`} />
        <Face p={p} cx={50} cy={53} s={1} accessory={cfg.accessory} dead={dead} lean={shape.muscle} />
        <ellipse cx="33" cy="34" rx="9" ry="6" fill="#fff" opacity="0.34" transform="rotate(-24 33 34)" />
        <Hat hat={cfg.hat} cx={50} topY={18} w={33} />
      </svg>
    );
  }

  // --- full body ---------------------------------------------------------
  const w = shape.waist;
  const top = 66;
  const bottom = 128;
  const headCy = 46;
  const headRx = shape.head;
  const headRy = shape.head * 0.92;
  const armW = 11;
  // Symmetric pear: narrow at the shoulders, widest low, closed cleanly all the
  // way round. Built from mirrored cubics so neither side can corner.
  const shoulder = w * 0.66;
  const widest = top + (bottom - top) * 0.62;
  const h = bottom - top;
  const torsoPath = shape.muscle
    ? // Hunky: the width sits in the chest and the waist pulls in under it, so
      // the outline itself does most of the work before any shading is added.
      [
        `M 50 ${top}`,
        `C ${50 + w * 0.88} ${top + 1}, ${50 + w} ${top + h * 0.1}, ${50 + w} ${top + h * 0.28}`,
        `C ${50 + w} ${top + h * 0.45}, ${50 + w * 0.6} ${top + h * 0.5}, ${50 + w * 0.57} ${top + h * 0.66}`,
        `C ${50 + w * 0.55} ${bottom - 7}, ${50 + w * 0.48} ${bottom}, 50 ${bottom}`,
        `C ${50 - w * 0.48} ${bottom}, ${50 - w * 0.55} ${bottom - 7}, ${50 - w * 0.57} ${top + h * 0.66}`,
        `C ${50 - w * 0.6} ${top + h * 0.5}, ${50 - w} ${top + h * 0.45}, ${50 - w} ${top + h * 0.28}`,
        `C ${50 - w} ${top + h * 0.1}, ${50 - w * 0.88} ${top + 1}, 50 ${top}`,
        "Z",
      ].join(" ")
    : [
    `M 50 ${top}`,
    `C ${50 + shoulder} ${top}, ${50 + w} ${widest - (widest - top) * 0.45}, ${50 + w} ${widest}`,
    `C ${50 + w} ${bottom - (bottom - widest) * 0.3}, ${50 + w * 0.62} ${bottom}, 50 ${bottom}`,
    `C ${50 - w * 0.62} ${bottom}, ${50 - w} ${bottom - (bottom - widest) * 0.3}, ${50 - w} ${widest}`,
    `C ${50 - w} ${widest - (widest - top) * 0.45}, ${50 - shoulder} ${top}, 50 ${top}`,
    "Z",
      ].join(" ");

  return (
    <svg
      width={size}
      height={(size * 165) / 100}
      viewBox="0 0 100 165"
      className={className}
      role="img"
      aria-label={dead ? "Dead pig" : "Pig"}
    >
      {gradient(50 - w * 0.45, top + 6, (bottom - top) * 1.15)}

      <ellipse cx="50" cy="157" rx={w + 4} ry="4.5" fill="#2B1B3D" opacity="0.13" />

      {/* legs, then arms — the torso is drawn after, covering both joints */}
      <rect x="36" y="114" width="13" height="36" rx="6.5" fill={p.limb} />
      <rect x="51" y="114" width="13" height="36" rx="6.5" fill={p.limb} />
      <ellipse cx="42.5" cy="150" rx="8.6" ry="4.8" fill={p.dark} />
      <ellipse cx="57.5" cy="150" rx="8.6" ry="4.8" fill={p.dark} />
      {/* Arms. Anchored to how wide the torso actually is at the shoulder and
          angled outward from there — pinned to the waist width instead, they
          started outside a body that hasn't widened yet and read as detached.
          The torso is drawn after these, so the joint ends up covered. */}
      {[-1, 1].map((side) => {
        // Start the arm where the torso is already wide enough to swallow its
        // inner edge. Pinned higher — as they were — the pear hasn't flared yet
        // and the shoulder floats free of the body.
        const armTop = shape.muscle ? 80 : 86;
        const innerEdge = shape.muscle ? w * 0.86 : w - 6;
        const x = 50 + side * (innerEdge + armW / 2);
        // The wider the body, the further the arms are shoved off vertical —
        // a slim pig's hang straight down, a fat one's can't. Derived from the
        // waist so it scales with the tier rather than being set per tier.
        // Pivot is the shoulder, so a negative angle swings the hand away from
        // the body — which is what a belly does to the forearms. Hunky goes the
        // other way: the lats flare the shoulders out and the forearms come in.
        const splay = Math.max(0, (w - TIER_SHAPE.slim.waist) * 0.9);
        const angle = (shape.muscle ? 1 : -1) * side * splay;
        return (
          <g key={side} transform={`rotate(${angle} ${x} ${armTop + 3})`}>
            <rect
              x={x - armW / 2}
              y={armTop}
              width={armW}
              height="34"
              rx={armW / 2}
              fill={p.limb}
            />
            {shape.muscle && (
              <ellipse cx={x} cy={armTop + 9} rx={armW * 0.66} ry="10.5" fill={p.limb} />
            )}
          </g>
        );
      })}

      <path d={torsoPath} fill={`url(#${grad})`} />

      {/* Chest and belly.
          A roll is a horizontal cylinder of flesh: lit along its crown, falling
          into shadow underneath, deepest in the crease where the next begins.
          So these are *shading*, not shapes — ellipses carrying their own
          top-light-to-bottom-dark ramp, clipped to the torso. Filling them with
          the body's own gradient (as an earlier pass did) gave every fold the
          same flat tone as the belly behind it, which is why they read as cling
          film rather than fat. */}
      {(shape.belly || shape.moobs || shape.muscle) && (
        <g clipPath={`url(#${clip})`}>
          <defs>
            <clipPath id={clip}>
              <path d={torsoPath} />
            </clipPath>
            <linearGradient
              id={`${fold}-chest`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={top + h * 0.1}
              x2="0"
              y2={top + h * 0.34}
            >
              <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
              <stop offset="42%" stopColor="#fff" stopOpacity="0" />
              <stop offset="60%" stopColor={p.dark} stopOpacity="0" />
              <stop offset="100%" stopColor={p.dark} stopOpacity="0.62" />
            </linearGradient>
          </defs>

          {/* Moobs — chest fat sitting above the gut, each with the crease
              underneath that makes it hang rather than float. */}
          {!!shape.moobs &&
            [-1, 1].map((side) => {
              const scale = shape.moobs ?? 1;
              const cx = 50 + side * w * 0.44;
              const cy = top + h * 0.24;
              return (
                <ellipse
                  key={side}
                  cx={cx}
                  cy={cy}
                  rx={w * 0.5 * scale}
                  ry={h * 0.13 * scale}
                  fill={`url(#${fold}-chest)`}
                />
              );
            })}

          {/* The gut: one big volume with the crease under its overhang, rather
              than a stack of folds. Stripes of shading never looked like fat. */}
          {!!shape.belly && (
            <>
              <defs>
                <linearGradient
                  id={`${fold}-belly`}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1={top + h * 0.44}
                  x2="0"
                  y2={bottom + 2}
                >
                  <stop offset="0%" stopColor="#fff" stopOpacity={0.2 * shape.belly} />
                  <stop offset="34%" stopColor="#fff" stopOpacity="0" />
                  <stop offset="56%" stopColor={p.dark} stopOpacity="0" />
                  <stop offset="100%" stopColor={p.dark} stopOpacity={0.55 * shape.belly} />
                </linearGradient>
              </defs>
              <ellipse
                cx="50"
                cy={top + h * 0.74}
                rx={w * 1.02}
                ry={h * 0.3 * (0.7 + shape.belly * 0.3)}
                fill={`url(#${fold}-belly)`}
              />
            </>
          )}

          {/* Muscle definition: pecs above, a two-column stack of abs below,
              split by a centre line. Same light-over-shadow logic as the folds,
              just tighter and repeated. */}
          {shape.muscle && (
            <g>
              {[-1, 1].map((side) => (
                <ellipse
                  key={side}
                  cx={50 + side * w * 0.42}
                  cy={top + h * 0.2}
                  rx={w * 0.44}
                  ry={h * 0.12}
                  fill={`url(#${fold}-chest)`}
                />
              ))}
              {[0, 1, 2].map((row) =>
                [-1, 1].map((side) => (
                  <ellipse
                    key={`${row}-${side}`}
                    cx={50 + side * w * 0.23}
                    cy={top + h * (0.42 + row * 0.13)}
                    rx={w * 0.2}
                    ry={h * 0.055}
                    fill={`url(#${fold}-chest)`}
                    opacity="0.8"
                  />
                ))
              )}
              <rect
                x={49.3}
                y={top + h * 0.3}
                width={1.4}
                height={h * 0.32}
                rx={0.7}
                fill={p.dark}
                opacity="0.3"
              />
            </g>
          )}
        </g>
      )}

      {cfg.accessory === "tote" && (
        <g>
          <rect x={50 + w - 2} y="100" width="17" height="20" rx="2.5" fill="#FF8A00" />
          <path d={`M ${50 + w + 2} 100 q 4.5 -9 9 0`} fill="none" stroke="#FF8A00" strokeWidth="2.4" />
        </g>
      )}

      {/* head — overlaps the torso top, so there's no floating gap */}
      {!hidesEars(cfg.hat) && <Ears p={p} cx={50} cy={headCy - 6} rx={headRx} />}
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
      <Face p={p} cx={50} cy={headCy} s={headRx / 33} accessory={cfg.accessory} dead={dead} lean={shape.muscle} />
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
      <Hat hat={cfg.hat} cx={50} topY={headCy - headRy - 8} w={headRx} />
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

function Face({
  p,
  cx,
  cy,
  s,
  accessory,
  dead = false,
  lean = false,
}: {
  p: Pal;
  cx: number;
  cy: number;
  s: number;
  accessory: string;
  dead?: boolean;
  /** Hunky: brow, cheekbones and a cut jaw. */
  lean?: boolean;
}) {
  if (dead) {
    // Sunglasses and blush are beside the point on a corpse — X'd eyes and a
    // lolling tongue are the whole read, and clutter would only soften it.
    const cross = (ex: number) => (
      <g stroke="#3D2230" strokeWidth={2.6 * s} strokeLinecap="round">
        <line x1={ex - 4 * s} y1={cy - 11 * s} x2={ex + 4 * s} y2={cy - 3 * s} />
        <line x1={ex + 4 * s} y1={cy - 11 * s} x2={ex - 4 * s} y2={cy - 3 * s} />
      </g>
    );
    return (
      <g>
        {/* Hollows under the cheekbones — starvation reads in the face before
            it reads in the waist. Soft-edged and angled inward so they follow
            the bone rather than sitting on the cheek like blusher. */}
        <ellipse
          cx={cx - 19 * s}
          cy={cy + 4 * s}
          rx={8.5 * s}
          ry={5 * s}
          fill={p.nostril}
          opacity="0.26"
          transform={`rotate(-24 ${cx - 19 * s} ${cy + 4 * s})`}
        />
        <ellipse
          cx={cx + 19 * s}
          cy={cy + 4 * s}
          rx={8.5 * s}
          ry={5 * s}
          fill={p.nostril}
          opacity="0.26"
          transform={`rotate(24 ${cx + 19 * s} ${cy + 4 * s})`}
        />
        {cross(cx - 12 * s)}
        {cross(cx + 12 * s)}
        <ellipse cx={cx} cy={cy + 8 * s} rx={14 * s} ry={10.4 * s} fill={p.snout} />
        <ellipse cx={cx - 4.6 * s} cy={cy + 8 * s} rx={2.3 * s} ry={3.4 * s} fill={p.nostril} />
        <ellipse cx={cx + 4.6 * s} cy={cy + 8 * s} rx={2.3 * s} ry={3.4 * s} fill={p.nostril} />
        <path
          d={`M ${cx - 4 * s} ${cy + 17 * s} q ${4 * s} ${9 * s} ${8 * s} 0 Z`}
          fill="#E4738A"
        />
      </g>
    );
  }

  return (
    <g>
      {accessory === "blush" && (
        <>
          <ellipse cx={cx - 21 * s} cy={cy + 6 * s} rx={7 * s} ry={4.4 * s} fill="#FF6B8F" opacity="0.42" />
          <ellipse cx={cx + 21 * s} cy={cy + 6 * s} rx={7 * s} ry={4.4 * s} fill="#FF6B8F" opacity="0.42" />
        </>
      )}

      {lean && (
        <g>
          {/* Cheekbones caught by the light, hollow beneath them, and a heavy
              brow — the same three marks a portrait uses to say "chiselled". */}
          {[-1, 1].map((side) => (
            <g key={side}>
              <ellipse
                cx={cx + side * 22 * s}
                cy={cy - 3 * s}
                rx={7 * s}
                ry={4 * s}
                fill="#fff"
                opacity="0.3"
                transform={`rotate(${side * -20} ${cx + side * 22 * s} ${cy - 3 * s})`}
              />
              <ellipse
                cx={cx + side * 21 * s}
                cy={cy + 6 * s}
                rx={6 * s}
                ry={3.6 * s}
                fill={p.nostril}
                opacity="0.15"
                transform={`rotate(${side * 18} ${cx + side * 21 * s} ${cy + 6 * s})`}
              />
              <path
                d={`M ${cx + side * 6 * s} ${cy - 14 * s} q ${side * 7 * s} ${-2.4 * s} ${side * 13 * s} ${1.6 * s}`}
                fill="none"
                stroke={p.nostril}
                strokeWidth={2.4 * s}
                strokeLinecap="round"
                opacity="0.45"
              />
            </g>
          ))}
          {/* Cut jaw. */}
          <path
            d={`M ${cx - 21 * s} ${cy + 19 * s} q ${21 * s} ${9 * s} ${42 * s} 0`}
            fill="none"
            stroke={p.dark}
            strokeWidth={2 * s}
            strokeLinecap="round"
            opacity="0.22"
          />
        </g>
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
    case "tophat":
      return (
        <g>
          {/* Brim first, crown over it, so the join needs no outline — the same
              rule the body follows. */}
          <ellipse cx={cx} cy={topY + 11} rx={w * 0.92} ry={w * 0.17} fill="#2B1B3D" />
          <rect
            x={cx - w * 0.52}
            y={topY - 17}
            width={w * 1.04}
            height={w * 0.86}
            rx={w * 0.06}
            fill="#2B1B3D"
          />
          <ellipse cx={cx} cy={topY - 17} rx={w * 0.52} ry={w * 0.12} fill="#3D2A52" />
          {/* Band, sitting just above the brim. */}
          <rect x={cx - w * 0.52} y={topY + 1} width={w * 1.04} height={w * 0.2} fill="#FF4D6D" />
        </g>
      );
    case "chef":
      return (
        <g>
          {/* Toque: a narrow band, a short stem, and a puff that mushrooms out
              well past both. The puff has to be clearly wider than the band or
              it reads as a folded paper hat — which is what the first two
              attempts at this did. */}
          <rect
            x={cx - w * 0.34}
            y={topY - 14}
            width={w * 0.68}
            height={w * 0.62}
            fill="#FFFDFB"
          />
          <ellipse cx={cx - w * 0.46} cy={topY - 18} rx={w * 0.4} ry={w * 0.34} fill="#FFFDFB" />
          <ellipse cx={cx + w * 0.46} cy={topY - 18} rx={w * 0.4} ry={w * 0.34} fill="#FFFDFB" />
          <ellipse cx={cx} cy={topY - 27} rx={w * 0.46} ry={w * 0.38} fill="#FFFDFB" />
          <ellipse cx={cx} cy={topY - 17} rx={w * 0.62} ry={w * 0.34} fill="#FFFDFB" />
          {/* Creases where the puff gathers into the band. */}
          {[-1, 1].map((side) => (
            <path
              key={side}
              d={`M ${cx + side * w * 0.16} ${topY + 2} L ${cx + side * w * 0.2} ${topY - 12}`}
              stroke="#E8E0DA"
              strokeWidth={w * 0.04}
              strokeLinecap="round"
            />
          ))}
          <rect
            x={cx - w * 0.42}
            y={topY + 1}
            width={w * 0.84}
            height={w * 0.3}
            rx={w * 0.05}
            fill="#FFFDFB"
          />
          <rect x={cx - w * 0.42} y={topY + 1} width={w * 0.84} height={w * 0.055} fill="#E8E0DA" />
        </g>
      );
    default:
      return null;
  }
}

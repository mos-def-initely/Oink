"use client";

/**
 * Whatever the pig is brandishing.
 *
 * Drawn in the avatar's own language: the warm outline, flat fills from the
 * Damson palette, no gradients.
 *
 * Everything is held **in front of the body**. An object out at arm's length
 * sits against whatever is behind the avatar, where a guitar and a fishing rod
 * are the same grey smudge; brought across the torso it reads against the pig's
 * own colour and you can actually tell what it is. So each item is anchored to
 * two points:
 *
 *   gx, gy   the hand — the trotter's inner edge, tracked through the arm's
 *            splay, since the arms swing further out the fatter the pig gets
 *            and an object left at the shoulder's x drifts out of the grip
 *   ix       a point in over the belly, where upright objects stand so they're
 *            seen against the pig rather than beside it
 *
 * Tall things stay below roughly `gy - 22`: the head is drawn after this, so
 * anything higher is simply hidden behind the chin.
 */
const OUTLINE = "#8A5460";
const STROKE = 2.1;

const INK = "#4D303F";
const PLUM = "#914E56";
const GOLD = "#CFA51F";
const LEMON = "#E6D389";
const CREAM = "#FFFDF6";
const RUST = "#A9503C";
const STEEL = "#B9AFA0";
const BLADE = "#EDE7DA";
const LILAC = "#D8B5F7";

export default function Held({ item, armX }: { item: string; armX: number }) {
  const s = { stroke: OUTLINE, strokeWidth: STROKE, strokeLinejoin: "round" as const };

  // The hand. Same constants as the arm rotation in PigAvatar, so the grip
  // follows the trotter across the whole ladder.
  const splay = (Math.max(0, (armX - 20) * 0.9) * Math.PI) / 180;
  const gx = 65 + armX - 7 + 14 * Math.sin(splay);
  const gy = 77 + 14 * Math.cos(splay);
  // In over the belly — where an upright object has to stand to be seen.
  const ix = gx - 13;

  switch (item) {
    // Levelled off across the belly rather than raised: at a steeper angle the
    // point ends up under the pig's own chin.
    case "knife":
      return (
        <g {...s} transform={`rotate(-92 ${gx} ${gy})`}>
          <rect x={gx - 3.5} y={gy - 4} width="7" height="16" rx="3" fill={INK} />
          <rect x={gx - 4.5} y={gy - 9} width="9" height="5" rx="1.5" fill={STEEL} />
          <path
            d={`M ${gx - 4.5} ${gy - 9} L ${gx - 4.5} ${gy - 30} L ${gx} ${gy - 36}
                L ${gx + 4.5} ${gy - 18} L ${gx + 4.5} ${gy - 9} Z`}
            fill={BLADE}
          />
        </g>
      );

    // Neck up and out, body down across the belly — the angle a guitar actually
    // hangs at, and the only one that keeps the body on the pig.
    case "guitar":
      return (
        <g {...s} transform={`rotate(58 ${gx} ${gy})`}>
          <rect x={gx - 3} y={gy - 14} width="6" height="28" rx="2" fill={INK} />
          <rect x={gx - 5.5} y={gy - 21} width="11" height="8" rx="2" fill={INK} />
          <ellipse cx={gx} cy={gy + 22} rx="13" ry="15" fill={RUST} />
          <circle cx={gx} cy={gy + 17} r="3.6" fill={INK} stroke="none" />
          <path d={`M ${gx} ${gy + 8} v 6`} strokeWidth="1.5" />
        </g>
      );

    case "briefcase":
      return (
        <g {...s}>
          <path d={`M ${gx - 11} ${gy + 5} q 4 -9 9 -1`} fill="none" />
          <rect x={gx - 20} y={gy + 4} width="26" height="18" rx="2.5" fill={RUST} />
          <rect x={gx - 20} y={gy + 10} width="26" height="3" fill={INK} stroke="none" />
          <rect x={gx - 6} y={gy + 9} width="6" height="5" rx="1.5" fill={GOLD} strokeWidth="1.5" />
        </g>
      );

    case "pistol":
      return (
        <g {...s} transform={`rotate(-58 ${gx} ${gy})`}>
          <rect x={gx - 4} y={gy - 26} width="9" height="21" rx="2" fill={STEEL} />
          <path
            d={`M ${gx - 4.5} ${gy - 7} L ${gx + 5} ${gy - 7} L ${gx + 2.5} ${gy + 10} L ${gx - 6.5} ${gy + 10} Z`}
            fill={INK}
          />
          {/* Trigger guard — without it the whole thing reads as a spanner. */}
          <path d={`M ${gx - 4.5} ${gy - 5} q -5 5 0 8 h 5`} fill="none" />
        </g>
      );

    case "wine":
      return (
        <g {...s}>
          <path
            d={`M ${ix - 8} ${gy - 18} L ${ix + 8} ${gy - 18} L ${ix + 4.5} ${gy - 3} L ${ix - 4.5} ${gy - 3} Z`}
            fill={PLUM}
          />
          <rect x={ix - 1.4} y={gy - 3} width="3" height="12" fill={CREAM} />
          <rect x={ix - 6} y={gy + 9} width="12" height="3.5" rx="1.7" fill={CREAM} />
        </g>
      );

    case "pint":
      return (
        <g {...s}>
          <path
            d={`M ${ix - 8} ${gy - 20} L ${ix + 8} ${gy - 20} L ${ix + 6} ${gy + 9} L ${ix - 6} ${gy + 9} Z`}
            fill={LEMON}
          />
          <path
            d={`M ${ix - 8} ${gy - 20} L ${ix + 8} ${gy - 20} L ${ix + 7.5} ${gy - 13} L ${ix - 7.5} ${gy - 13} Z`}
            fill={CREAM}
          />
          <path d={`M ${ix + 8} ${gy - 14} q 8 7 0 14`} fill="none" />
        </g>
      );

    case "coffee":
      return (
        <g {...s}>
          <path
            d={`M ${ix - 7} ${gy - 13} L ${ix + 7} ${gy - 13} L ${ix + 5} ${gy + 6} L ${ix - 5} ${gy + 6} Z`}
            fill={CREAM}
          />
          <rect x={ix - 8.5} y={gy - 18} width="17" height="5.5" rx="2" fill={PLUM} />
          <path d={`M ${ix + 7} ${gy - 8} q 7 4 0 9`} fill="none" />
        </g>
      );

    case "rollingpin":
      return (
        <g {...s} transform={`rotate(-8 ${gx} ${gy})`}>
          <rect x={gx - 32} y={gy - 6} width="28" height="12" rx="6" fill={LEMON} />
          <rect x={gx - 38} y={gy - 2.5} width="8" height="5" rx="2.5" fill={CREAM} />
          <rect x={gx - 6} y={gy - 2.5} width="8" height="5" rx="2.5" fill={CREAM} />
        </g>
      );

    case "pan":
      return (
        <g {...s}>
          <rect x={gx - 18} y={gy - 3} width="20" height="6.5" rx="3.2" fill={INK} />
          <circle cx={gx - 29} cy={gy} r="12" fill={INK} />
          <circle cx={gx - 29} cy={gy} r="7" fill="#5F4050" stroke="none" />
        </g>
      );

    case "baguette":
      return (
        <g {...s} transform={`rotate(-42 ${gx} ${gy})`}>
          <rect x={gx - 6} y={gy - 24} width="12" height="36" rx="6" fill={LEMON} />
          <path
            d={`M ${gx - 3} ${gy - 16} l 6 -4 M ${gx - 3} ${gy - 7} l 6 -4 M ${gx - 3} ${gy + 2} l 6 -4`}
            fill="none"
            strokeWidth="1.6"
          />
        </g>
      );

    case "umbrella":
      return (
        <g {...s} transform={`rotate(-18 ${gx} ${gy})`}>
          <rect x={gx - 1.6} y={gy - 6} width="3.5" height="28" fill={INK} />
          {/* Kept low: a canopy at its natural height sits behind the head,
              where it reads as a dark cloud rather than an umbrella. */}
          <path
            d={`M ${gx - 18} ${gy - 2} a 18 14 0 0 1 36 0
                q -6 4 -9 0 q -3 4 -9 0 q -6 4 -9 0 q -3 4 -9 0 Z`}
            fill={PLUM}
          />
          <path
            d={`M ${gx - 9} ${gy - 2} q 2 -10 9 -14 q 7 4 9 14`}
            fill="none"
            stroke={CREAM}
            strokeWidth="1.6"
          />
          <path d={`M ${gx} ${gy + 22} q 0 6 -6 6`} fill="none" />
        </g>
      );

    // Held down in front rather than floating: anything above the shoulder
    // disappears behind the head.
    case "balloon":
      return (
        <g {...s}>
          {/* String first, so the knot lands on top of where it starts. */}
          <path d={`M ${ix} ${gy + 8} q 2 8 ${gx - ix} 6`} fill="none" strokeWidth="1.6" />
          <ellipse cx={ix} cy={gy - 7} rx="12.5" ry="14" fill={RUST} />
          <ellipse cx={ix - 4} cy={gy - 12} rx="3.5" ry="5" fill="#fff" opacity="0.3" stroke="none" />
          <path d={`M ${ix - 2.5} ${gy + 6} l 2.5 4 l 2.5 -4 Z`} fill={RUST} />
        </g>
      );

    case "bouquet":
      return (
        <g {...s} transform={`rotate(-16 ${gx} ${gy})`}>
          <rect x={gx - 4} y={gy - 14} width="5" height="22" fill="#6BA368" />
          <circle cx={ix + 6} cy={gy - 14} r="7" fill={PLUM} />
          <circle cx={ix - 3} cy={gy - 9} r="6.5" fill={LILAC} />
          <circle cx={ix + 9} cy={gy - 3} r="6" fill={LEMON} />
          <circle cx={ix} cy={gy - 20} r="5.5" fill={CREAM} />
        </g>
      );

    case "camera":
      return (
        <g {...s}>
          <rect x={ix - 13} y={gy - 13} width="26" height="18" rx="3" fill={INK} />
          <rect x={ix - 5} y={gy - 17} width="10" height="5" rx="1.5" fill={INK} />
          <circle cx={ix} cy={gy - 4} r="6" fill={STEEL} />
          <circle cx={ix + 9} cy={gy - 9} r="1.6" fill={LEMON} stroke="none" />
        </g>
      );

    case "trophy":
      return (
        <g {...s}>
          <path
            d={`M ${ix - 9} ${gy - 19} L ${ix + 9} ${gy - 19} L ${ix + 6} ${gy - 2} L ${ix - 6} ${gy - 2} Z`}
            fill={GOLD}
          />
          <path d={`M ${ix - 9} ${gy - 17} q -8 5 0 10`} fill="none" />
          <path d={`M ${ix + 9} ${gy - 17} q 8 5 0 10`} fill="none" />
          <rect x={ix - 2.5} y={gy - 2} width="5" height="8" fill={GOLD} />
          <rect x={ix - 8} y={gy + 6} width="16" height="5" rx="1.5" fill={GOLD} />
        </g>
      );

    case "torch":
      return (
        <g {...s} transform={`rotate(-26 ${gx} ${gy})`}>
          <rect x={gx - 3.5} y={gy - 6} width="8" height="22" rx="2" fill={INK} />
          <path d={`M ${gx - 8} ${gy - 6} L ${gx + 9} ${gy - 6} L ${gx + 0.5} ${gy - 26} Z`} fill={LEMON} />
          <path d={`M ${gx - 3} ${gy - 8} L ${gx + 4} ${gy - 8} L ${gx + 0.5} ${gy - 18} Z`} fill={GOLD} stroke="none" />
        </g>
      );

    case "fishingrod":
      return (
        <g {...s} transform={`rotate(-38 ${gx} ${gy})`}>
          <rect x={gx - 2} y={gy - 34} width="4.5" height="46" rx="2" fill={RUST} />
          <circle cx={gx + 0.5} cy={gy + 2} r="4.5" fill={STEEL} />
          <path d={`M ${gx} ${gy - 34} q 15 7 11 21`} fill="none" strokeWidth="1.4" />
          <path d={`M ${gx + 11} ${gy - 13} l 0 5`} strokeWidth="1.4" />
        </g>
      );

    default:
      return null;
  }
}

"use client";

/**
 * Whatever the pig is brandishing.
 *
 * Drawn in the avatar's own language: the warm outline, flat fills from the
 * Damson palette, no gradients. Everything is positioned off `hx`, the outer
 * edge of the trotter, so an object stays in the hand as the pig widens across
 * the ladder. Tall things are raised past the shoulder so they read as held up
 * rather than dropped by the pig's side.
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
  const hx = 65 + armX; // outer edge of the trotter
  const s = { stroke: OUTLINE, strokeWidth: STROKE, strokeLinejoin: "round" as const };

  switch (item) {
    case "knife": {
      // Held across the front of the body rather than out at arm's length, so
      // it reads as pointed at whoever's looking. The grip tracks the hand
      // through the arm's splay — the arms swing further out the fatter the
      // pig, and a knife left at the shoulder's x would drift out of the
      // trotter. Same constants as the arm rotation in PigAvatar.
      const splay = (Math.max(0, (armX - 20) * 0.9) * Math.PI) / 180;
      // Gripped at the inner edge of the trotter rather than its centre, so the
      // hand still reads either side of the handle instead of vanishing under
      // it, and the blade crosses the belly rather than the arm.
      const gx = 65 + armX - 7 + 14 * Math.sin(splay);
      const gy = 77 + 14 * Math.cos(splay);
      return (
        <g {...s} transform={`rotate(-50 ${gx} ${gy})`}>
          <rect x={gx - 3.5} y={gy - 4} width="7" height="16" rx="3" fill={INK} />
          <rect x={gx - 4.5} y={gy - 9} width="9" height="5" rx="1.5" fill={STEEL} />
          <path
            d={`M ${gx - 4.5} ${gy - 9} L ${gx - 4.5} ${gy - 30} L ${gx} ${gy - 36}
                L ${gx + 4.5} ${gy - 18} L ${gx + 4.5} ${gy - 9} Z`}
            fill={BLADE}
          />
        </g>
      );
    }

    case "guitar":
      return (
        <g {...s} transform={`rotate(-18 ${hx} 88)`}>
          <rect x={hx - 1} y="44" width="6" height="34" rx="2" fill={INK} />
          <rect x={hx - 3} y="38" width="10" height="8" rx="2" fill={INK} />
          <ellipse cx={hx + 2} cy="92" rx="14" ry="16" fill={RUST} />
          <circle cx={hx + 2} cy="88" r="4" fill={INK} stroke="none" />
        </g>
      );

    case "briefcase":
      return (
        <g {...s} transform={`translate(0 6)`}>
          <rect x={hx - 2} y="92" width="24" height="17" rx="2.5" fill={RUST} />
          <rect x={hx + 6} y="88" width="8" height="5" rx="2" fill="none" />
          <rect x={hx - 2} y="98" width="24" height="3" fill={INK} stroke="none" />
        </g>
      );

    case "pistol":
      return (
        <g {...s} transform={`rotate(-24 ${hx} 82)`}>
          <rect x={hx - 2} y="74" width="20" height="7" rx="2" fill={INK} />
          <path d={`M ${hx} 80 L ${hx + 7} 80 L ${hx + 5} 92 L ${hx - 2} 92 Z`} fill={INK} />
        </g>
      );

    case "wine":
      return (
        <g {...s} transform={`rotate(10 ${hx + 3} 80)`}>
          <path d={`M ${hx - 4} 60 L ${hx + 10} 60 L ${hx + 6} 74 L ${hx} 74 Z`} fill={PLUM} />
          <rect x={hx + 2} y="74" width="2.5" height="12" fill={CREAM} />
          <rect x={hx - 2} y="86" width="11" height="3" rx="1.5" fill={CREAM} />
        </g>
      );

    case "pint":
      return (
        <g {...s} transform={`rotate(8 ${hx + 4} 82)`}>
          <path d={`M ${hx - 2} 62 L ${hx + 12} 62 L ${hx + 10} 90 L ${hx} 90 Z`} fill={LEMON} />
          <path d={`M ${hx - 2} 62 L ${hx + 12} 62 L ${hx + 11.5} 69 L ${hx - 1.5} 69 Z`} fill={CREAM} />
          <path d={`M ${hx + 12} 68 q 7 6 0 13`} fill="none" />
        </g>
      );

    case "coffee":
      return (
        <g {...s}>
          <path d={`M ${hx - 1} 74 L ${hx + 12} 74 L ${hx + 10} 90 L ${hx + 1} 90 Z`} fill={CREAM} />
          <rect x={hx - 2} y="70" width="15" height="5" rx="2" fill={PLUM} />
          <path d={`M ${hx + 12} 78 q 6 4 0 8`} fill="none" />
        </g>
      );

    case "rollingpin":
      return (
        <g {...s} transform={`rotate(-32 ${hx + 4} 82)`}>
          <rect x={hx - 8} y="76" width="26" height="10" rx="5" fill={LEMON} />
          <rect x={hx - 14} y="79" width="7" height="4" rx="2" fill={CREAM} />
          <rect x={hx + 18} y="79" width="7" height="4" rx="2" fill={CREAM} />
        </g>
      );

    case "pan":
      return (
        <g {...s} transform={`rotate(-14 ${hx} 84)`}>
          <rect x={hx - 2} y="80" width="18" height="5" rx="2.5" fill={INK} />
          <path d={`M ${hx + 14} 74 h 16 a 8 8 0 0 1 -8 14 h -8 Z`} fill={INK} />
        </g>
      );

    case "baguette":
      return (
        <g {...s} transform={`rotate(-38 ${hx + 2} 82)`}>
          <rect x={hx - 6} y="66" width="11" height="34" rx="5.5" fill={LEMON} />
          <path d={`M ${hx - 3} 74 l 5 -3 M ${hx - 3} 82 l 5 -3 M ${hx - 3} 90 l 5 -3`} fill="none" strokeWidth="1.6" />
        </g>
      );

    case "umbrella":
      return (
        <g {...s} transform={`rotate(14 ${hx + 2} 82)`}>
          <rect x={hx + 1} y="52" width="3" height="38" fill={INK} />
          <path d={`M ${hx - 14} 54 a 16 13 0 0 1 32 0 Z`} fill={PLUM} />
          <path d={`M ${hx + 1} 90 q 0 6 -6 6`} fill="none" />
        </g>
      );

    case "balloon":
      return (
        <g {...s}>
          <path d={`M ${hx + 2} 78 q 6 -12 2 -22`} fill="none" strokeWidth="1.6" />
          <ellipse cx={hx + 3} cy="44" rx="12" ry="14" fill={RUST} />
          <path d={`M ${hx + 1} 57 l 2 4 l 2 -4 Z`} fill={RUST} />
        </g>
      );

    case "bouquet":
      return (
        <g {...s} transform={`rotate(12 ${hx + 2} 82)`}>
          <rect x={hx} y="66" width="4" height="24" fill="#6BA368" />
          <circle cx={hx + 2} cy="58" r="7" fill={PLUM} />
          <circle cx={hx - 6} cy="64" r="6" fill={LILAC} />
          <circle cx={hx + 10} cy="64" r="6" fill={LEMON} />
        </g>
      );

    case "camera":
      return (
        <g {...s}>
          <rect x={hx - 4} y="74" width="24" height="17" rx="3" fill={INK} />
          <rect x={hx + 2} y="70" width="9" height="5" rx="1.5" fill={INK} />
          <circle cx={hx + 8} cy="82" r="5.5" fill={STEEL} />
        </g>
      );

    case "trophy":
      return (
        <g {...s}>
          <path d={`M ${hx - 4} 62 L ${hx + 14} 62 L ${hx + 11} 78 L ${hx - 1} 78 Z`} fill={GOLD} />
          <path d={`M ${hx - 4} 64 q -7 4 0 9`} fill="none" />
          <path d={`M ${hx + 14} 64 q 7 4 0 9`} fill="none" />
          <rect x={hx + 3} y="78" width="4" height="8" fill={GOLD} />
          <rect x={hx - 2} y="86" width="14" height="5" rx="1.5" fill={GOLD} />
        </g>
      );

    case "torch":
      return (
        <g {...s} transform={`rotate(20 ${hx + 2} 80)`}>
          <rect x={hx} y="66" width="7" height="24" rx="2" fill={INK} />
          <path d={`M ${hx - 4} 66 L ${hx + 11} 66 L ${hx + 3.5} 48 Z`} fill={LEMON} />
        </g>
      );

    case "fishingrod":
      return (
        <g {...s} transform={`rotate(-30 ${hx + 2} 84)`}>
          <rect x={hx} y="40" width="4" height="50" rx="2" fill={RUST} />
          <circle cx={hx + 2} cy="76" r="4" fill={STEEL} />
          <path d={`M ${hx + 2} 40 q 14 6 10 20`} fill="none" strokeWidth="1.4" />
          <path d={`M ${hx + 12} 60 l 0 5`} strokeWidth="1.4" />
        </g>
      );

    default:
      return null;
  }
}

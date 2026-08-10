/**
 * Costumes — spec §9.3.
 *
 * Everything here is drawn in *normalised* space: a chubby-tier body (waist 30,
 * centred 65,82) and head (radius 27.5, centred 65,48). PigAvatar then scales
 * each group about the matching centre, so one set of paths fits all four
 * fatness tiers without re-drawing anything. Body-anchored parts scale by
 * w/30, head-anchored parts by headRx/27.5.
 *
 * The parts are separate because draw order is what makes a garment look worn
 * rather than stuck on:
 *
 *   under        capes and tails, behind the whole animal
 *   onBody       the garment itself, on the torso and under the arms
 *   overArms     collars and lapels, which sit over the shoulder joint
 *   behindHead   hoods, which must be behind the head but in front of the body
 *   headExtra    masks, over the face
 *   front        props, over everything
 *
 * `sleeve` recolours the arms and `cuff` bands their ends. Those two do more
 * work than any amount of detail on the torso: arms left in the coat colour are
 * what made the first attempt read as a bib rather than clothing.
 */
import type { ReactNode } from "react";

export type CostumeParts = {
  sleeve?: string;
  cuff?: string;
  under?: ReactNode;
  onBody?: ReactNode;
  overArms?: ReactNode;
  behindHead?: ReactNode;
  headExtra?: ReactNode;
  front?: ReactNode;
};

const CREAM = "#FFFDF6";
const GOLD = "#CFA51F";
const LEMON = "#E6D389";
const PLUM = "#914E56";
const RUST = "#A9503C";
const INK = "#4D303F";

/**
 * The torso garment. It tracks the body ellipse (cx 65, cy 82, r 30×27) inset by
 * about 2.5, so the coat shows as a rim rather than a bare patch — an earlier
 * version stopped well short of the bottom and read as a crop top.
 */
const TORSO =
  "M65 58 q-28.5 2 -28.5 24 q0 24 28.5 25 q28.5 -1 28.5 -25 q0 -22 -28.5 -24 Z";

export function costumeParts(costume: string, outline: string): CostumeParts {
  const s = { stroke: outline, strokeWidth: 2.1, strokeLinejoin: "round" as const };
  const thin = { stroke: outline, strokeWidth: 1.7, fill: "none" };

  const torso = (fill: string, children?: ReactNode) => (
    <>
      <path d={TORSO} fill={fill} {...s} />
      {children}
    </>
  );

  switch (costume) {
    // --- everyday ---------------------------------------------------------
    case "hoodie":
      return {
        sleeve: "#5E7F98",
        onBody: torso("#6E8FA8", <rect x="55" y="84" width="20" height="12" rx="4" fill="#5E7F98" {...s} />),
        behindHead: (
          <>
            <path d="M32 62 q0 -44 33 -44 q33 0 33 44 q-14 10 -33 10 q-19 0 -33 -10 Z" fill="#5E7F98" {...s} />
            <path d="M52 68 v13 M78 68 v13" stroke={outline} strokeWidth="2" strokeLinecap="round" />
            <circle cx="52" cy="83" r="2.4" fill={CREAM} stroke={outline} strokeWidth="1.6" />
            <circle cx="78" cy="83" r="2.4" fill={CREAM} stroke={outline} strokeWidth="1.6" />
          </>
        ),
      };

    case "puffer":
      return {
        sleeve: RUST,
        onBody: (
          <>
            {/* Genuinely wider than the body — the jacket has to change the outline. */}
            <path d="M65 60 q-31 3 -31 22 q0 19 31 20 q31 -1 31 -20 q0 -19 -31 -22 Z" fill={RUST} {...s} />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M36 ${70 + i * 10} q29 6 58 0`} {...thin} opacity="0.5" />
            ))}
          </>
        ),
        overArms: <path d="M43 66 q22 -9 44 0 q-6 9 -22 9 q-16 0 -22 -9 Z" fill="#BE6552" {...s} />,
      };

    case "dungarees":
      return {
        onBody: (
          <>
            <path d="M46 78 q19 -5 38 0 l0 22 q-19 5 -38 0 Z" fill="#5E7FA0" {...s} />
            <path d="M52 80 L56 60 M78 80 L74 60" stroke="#5E7FA0" strokeWidth="7" strokeLinecap="round" />
            <rect x="57" y="84" width="16" height="11" rx="2" fill="#4E6E8E" stroke={outline} strokeWidth="1.7" />
            <circle cx="56" cy="79" r="2" fill={GOLD} stroke={outline} strokeWidth="1.3" />
            <circle cx="74" cy="79" r="2" fill={GOLD} stroke={outline} strokeWidth="1.3" />
          </>
        ),
      };

    // --- characters -------------------------------------------------------
    case "princess":
      return {
        sleeve: "#E9C8F6",
        onBody: torso(
          "#E9C8F6",
          <>
            {/* The gown flares past the trotters, which is the whole silhouette change. */}
            <path d="M26 94 q39 10 78 0 l8 24 q-46 12 -94 0 Z" fill="#DDB0F2" {...s} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d={`M${33 + i * 13} 98 l-2 20`} stroke={outline} strokeWidth="1.4" opacity="0.45" />
            ))}
            <path d="M41 92 q24 7 48 0" stroke={GOLD} strokeWidth="4.5" fill="none" />
          </>
        ),
        overArms: (
          <>
            <circle cx="40" cy="76" r="9" fill="#E9C8F6" {...s} />
            <circle cx="90" cy="76" r="9" fill="#E9C8F6" {...s} />
            <path d="M52 63 q13 8 26 0 q-13 7 -26 0 Z" fill={CREAM} {...s} />
          </>
        ),
      };

    case "pirate":
      return {
        sleeve: "#3D3A52",
        onBody: torso(
          "#3D3A52",
          <>
            <path d="M65 62 v36" {...thin} opacity="0.6" />
            <path d="M38 88 q27 8 54 0 l0 8 q-27 8 -54 0 Z" fill={RUST} {...s} />
            <rect x="59" y="86" width="12" height="10" rx="2" fill={GOLD} stroke={outline} strokeWidth="1.6" />
            <circle cx="57" cy="74" r="2.1" fill={GOLD} />
            <circle cx="57" cy="82" r="2.1" fill={GOLD} />
          </>
        ),
        overArms: (
          <>
            <path d="M44 63 q21 11 42 0 q-7 11 -21 11 q-14 0 -21 -11 Z" fill="#2E2C40" {...s} />
            <path d="M52 62 L65 74 L78 62 q-13 -4 -26 0 Z" fill={CREAM} {...s} />
          </>
        ),
      };

    case "raver":
      return {
        sleeve: "#2B2B38",
        onBody: torso(
          "#2B2B38",
          <>
            <path d="M46 70 q19 6 38 0" stroke="#39D6A0" strokeWidth="4" fill="none" />
            <path d="M44 80 q21 6 42 0" stroke="#FF5FA8" strokeWidth="4" fill="none" />
            <path d="M46 90 q19 6 38 0" stroke={LEMON} strokeWidth="4" fill="none" />
          </>
        ),
        overArms: (
          <>
            <rect x="29" y="66" width="9" height="22" rx="4.5" fill="#39D6A0" stroke={outline} strokeWidth="1.8" transform="rotate(-22 33 77)" />
            <rect x="92" y="66" width="9" height="22" rx="4.5" fill="#FF5FA8" stroke={outline} strokeWidth="1.8" transform="rotate(22 96 77)" />
          </>
        ),
      };

    case "astronaut":
      return {
        sleeve: "#E8E4DA",
        cuff: "#B9B3A6",
        onBody: torso(
          "#E8E4DA",
          <>
            <rect x="54" y="74" width="22" height="16" rx="3" fill="#B9B3A6" stroke={outline} strokeWidth="1.8" />
            <circle cx="60" cy="79" r="2" fill="#FF5FA8" />
            <circle cx="67" cy="79" r="2" fill={LEMON} />
            <circle cx="60" cy="85" r="2" fill="#39D6A0" />
            <path d="M64 85 h9" stroke={outline} strokeWidth="1.5" />
            <path d="M41 68 q24 6 48 0" {...thin} opacity="0.5" />
          </>
        ),
        under: <path d="M89 96 q16 4 14 -14" fill="none" stroke={outline} strokeWidth="3.2" strokeLinecap="round" />,
      };

    case "superhero":
      return {
        sleeve: "#2F5FA8",
        cuff: LEMON,
        under: <path d="M40 60 q25 -8 50 0 q6 34 -8 58 q-17 -12 -34 0 q-14 -24 -8 -58 Z" fill={PLUM} {...s} />,
        onBody: torso(
          "#2F5FA8",
          <>
            <path d="M65 66 L54 78 L65 96 L76 78 Z" fill={LEMON} stroke={outline} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M60 78 l4 6 8 -12" fill="none" stroke={PLUM} strokeWidth="2.6" strokeLinecap="round" />
          </>
        ),
        headExtra: (
          // Drawn over the eyes, so the eyes are re-cut into it — a band that
          // merely sits above them reads as a hairpiece, not a mask.
          <>
            <path d="M38 37 q27 -9 54 0 q-2 13 -12 13 q-15 -6 -30 0 q-10 0 -12 -13 Z" fill={PLUM} {...s} />
            <ellipse cx="54" cy="44" rx="5.4" ry="4.4" fill={CREAM} stroke={outline} strokeWidth="1.4" />
            <ellipse cx="76" cy="44" rx="5.4" ry="4.4" fill={CREAM} stroke={outline} strokeWidth="1.4" />
            <ellipse cx="54" cy="44" rx="3" ry="3.6" fill="#43262F" />
            <ellipse cx="76" cy="44" rx="3" ry="3.6" fill="#43262F" />
            <circle cx="55.2" cy="42.7" r="1.1" fill="#fff" />
            <circle cx="77.2" cy="42.7" r="1.1" fill="#fff" />
          </>
        ),
      };

    case "ninja":
      return {
        sleeve: "#26262E",
        onBody: torso(
          "#26262E",
          <>
            <path d="M38 84 q27 8 54 0 l0 9 q-27 8 -54 0 Z" fill={RUST} {...s} />
            <path d="M60 93 l-4 14 M70 93 l4 14" stroke={RUST} strokeWidth="3.4" strokeLinecap="round" />
          </>
        ),
        overArms: <path d="M46 62 q19 10 38 0 q-8 9 -19 9 q-11 0 -19 -9 Z" fill="#1B1B22" {...s} />,
        // Hood only. A face wrap is more literally a ninja, but it covers the
        // snout, and the snout is the one feature that says this is a pig.
        behindHead: <path d="M34 56 q0 -38 31 -38 q31 0 31 38 q-15 8 -31 8 q-16 0 -31 -8 Z" fill="#26262E" {...s} />,
      };

    case "dinosaur":
      return {
        sleeve: "#5FA85E",
        under: (
          <>
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${88 + i * 3} ${96 - i * 13} l14 -5 -3 12 Z`} fill={LEMON} {...s} />
            ))}
          </>
        ),
        onBody: torso("#5FA85E"),
        behindHead: (
          <>
            <path d="M32 60 q0 -44 33 -44 q33 0 33 44 q-14 10 -33 10 q-19 0 -33 -10 Z" fill="#5FA85E" {...s} />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${44 + i * 14} ${28 - Math.abs(i - 1) * 6} l7 -12 7 12 Z`} fill={LEMON} {...s} />
            ))}
            <path d="M40 54 q25 10 50 0 q-25 4 -50 0 Z" fill={CREAM} {...s} />
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`M${46 + i * 8} 56 l3 6 3 -6 Z`} fill={CREAM} stroke={outline} strokeWidth="1.4" />
            ))}
          </>
        ),
      };

    case "wizard":
      return {
        sleeve: "#4A3E7A",
        onBody: torso(
          "#4A3E7A",
          <>
            {[0, 1, 2, 3, 4].map((i) => {
              const x = 50 + ((i * 11) % 30);
              const y = 70 + (i % 3) * 10;
              return (
                <path
                  key={i}
                  d={`M${x} ${y} l1.4 3.6 3.6-.9 -2.6 2.7 2.6 2.7 -3.6-.9 -1.4 3.6 -1.4-3.6 -3.6 .9 2.6-2.7 -2.6-2.7 3.6 .9 Z`}
                  fill={LEMON}
                />
              );
            })}
          </>
        ),
        overArms: (
          <>
            <path d="M31 74 q-8 16 2 26 q10 -4 11 -22 Z" fill="#4A3E7A" {...s} />
            <path d="M99 74 q8 16 -2 26 q-10 -4 -11 -22 Z" fill="#4A3E7A" {...s} />
            <path d="M44 63 q21 9 42 0 q-8 9 -21 9 q-13 0 -21 -9 Z" fill="#3B3163" {...s} />
          </>
        ),
      };

    case "rockstar":
      return {
        sleeve: "#2E2A31",
        onBody: torso(
          "#2E2A31",
          <>
            <path d="M65 62 v36" {...thin} opacity="0.6" />
            <path d="M52 63 L65 76 L78 63 q-13 -4 -26 0 Z" fill={CREAM} {...s} />
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={50 + i * 4} cy={68 + i * 2} r="1.5" fill="#C8C2B4" />
            ))}
          </>
        ),
        overArms: <path d="M44 63 q21 10 42 0 q-7 10 -21 10 q-14 0 -21 -10 Z" fill="#1F1C22" {...s} />,
        front: (
          <g {...s}>
            <rect x="84" y="82" width="26" height="19" rx="9" fill={RUST} transform="rotate(-18 97 91)" />
            <rect x="70" y="66" width="7" height="24" rx="2" fill="#6B4A34" transform="rotate(-18 73 78)" />
          </g>
        ),
      };

    case "chef":
      return {
        sleeve: CREAM,
        onBody: torso(
          CREAM,
          <>
            <path d="M65 64 v34" stroke={outline} strokeWidth="1.5" opacity="0.5" />
            <circle cx="59" cy="72" r="1.8" fill={outline} />
            <circle cx="59" cy="80" r="1.8" fill={outline} />
            <circle cx="71" cy="72" r="1.8" fill={outline} />
            <circle cx="71" cy="80" r="1.8" fill={outline} />
          </>
        ),
        overArms: (
          <>
            <path d="M52 62 L65 74 L78 62 q-13 -4 -26 0 Z" fill={RUST} {...s} />
            <path d="M56 90 q9 -4 18 0 l2 10 q-11 4 -22 0 Z" fill="#E2DCCB" {...s} />
          </>
        ),
      };

    case "hotdog":
      return {
        sleeve: "#F0C878",
        onBody: (
          <>
            {/* Bun halves either side — the animal is the sausage. */}
            <path d="M34 66 q-10 18 0 34 q9 4 12 -2 q-6 -15 0 -30 q-4 -6 -12 -2 Z" fill="#F0C878" {...s} />
            <path d="M96 66 q10 18 0 34 q-9 4 -12 -2 q6 -15 0 -30 q4 -6 12 -2 Z" fill="#F0C878" {...s} />
            <path d="M65 64 q-18 2 -18 18 q0 16 18 17 q18 -1 18 -17 q0 -16 -18 -18 Z" fill={RUST} {...s} />
            <path d="M52 72 q7 6 13 0 q7 6 13 0" fill="none" stroke={LEMON} strokeWidth="3.4" strokeLinecap="round" />
            <path d="M52 84 q7 6 13 0 q7 6 13 0" fill="none" stroke={LEMON} strokeWidth="3.4" strokeLinecap="round" />
          </>
        ),
      };

    default:
      return {};
  }
}

/** Face items — their own slot, so sunglasses can be worn under a hat. */
export function faceItem(face: string, outline: string): ReactNode {
  switch (face) {
    case "shades":
      return (
        <g stroke={INK} strokeWidth="2.4">
          <rect x="45" y="38" width="17" height="12" rx="4" fill={INK} />
          <rect x="68" y="38" width="17" height="12" rx="4" fill={INK} />
          <path d="M62 43 h6" />
        </g>
      );
    case "specs":
      return (
        <g stroke={INK} strokeWidth="2.2" fill="none">
          <circle cx="54" cy="44" r="8" />
          <circle cx="76" cy="44" r="8" />
          <path d="M62 44 h6" />
        </g>
      );
    case "monocle":
      return (
        <g stroke={INK} strokeWidth="2.2" fill="none">
          <circle cx="76" cy="44" r="9" />
          <path d="M82 51 l5 12" />
        </g>
      );
    case "eyepatch":
      return (
        <g stroke={INK} strokeWidth="2.2">
          <path d="M44 36 q22 -5 42 2" fill="none" />
          <rect x="46" y="38" width="17" height="13" rx="3" fill={INK} />
        </g>
      );
    case "moustache":
      return (
        <path
          d="M54 64 q6 -6 11 -1 q5 -5 11 1 q-6 6 -11 2 q-5 4 -11 -2 Z"
          fill={INK}
          stroke={outline}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
}

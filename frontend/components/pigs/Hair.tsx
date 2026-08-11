"use client";

/**
 * Hair — its own slot, drawn in normalised head space: the head is an ellipse
 * centred (65, 48) with rx 27.5 and ry 24.75, which PigAvatar scales to
 * whatever the tier's head actually is (and then a size down again — see
 * HAIR_SCALE there).
 *
 * Two passes, because one isn't enough. Everything drawn over the head reads as
 * a wig sat on the face; everything drawn behind it disappears. So the mass
 * goes behind and the crown goes in front, with the head between them.
 *
 * The trick is making those two passes read as **one** head of hair. The crown
 * is filled well past the head's own edge so its fill runs into the mass
 * behind, and only its lower edge — the hairline — is stroked. Closing and
 * outlining it instead put a line down both sides of the head and the hair came
 * apart into a cap and a separate curtain.
 *
 * The styles cover a range of textures rather than one hair type in several
 * lengths — the point of the slot is that people can find themselves in it.
 */
import type { ReactNode } from "react";
import { HAIR_COLORS } from "@/lib/pig";

export type HairParts = { back?: ReactNode; front?: ReactNode };

/** Hair over the crown and round the back, tucked behind the head. */
const CAP =
  `M65 6 Q103 6 103 46 Q103 58 100 68 Q94 50 89 42
   Q80 24 65 24 Q50 24 41 42 Q36 50 30 68 Q27 58 27 46 Q27 6 65 6 Z`;

export function hairParts(style: string, colorKey: string, outline: string): HairParts {
  const c = HAIR_COLORS[colorKey] ?? HAIR_COLORS.blonde;
  const s = { stroke: outline, strokeWidth: 2.1, strokeLinejoin: "round" as const };
  const shade = { fill: "none", stroke: c.dark, strokeWidth: 2.2, opacity: 0.65 };

  /** The crown: fill that runs into the mass behind, and a hairline on top. */
  const crown = (fill: string, edge: string, extra?: ReactNode) => (
    <g>
      <path d={fill} fill={c.mid} stroke="none" />
      <path
        d={edge}
        fill="none"
        stroke={outline}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {extra}
    </g>
  );

  // Parted in the middle and falling either side.
  const PARTED_FILL =
    "M27 56 Q27 6 65 6 Q103 6 103 56 Q88 32 73 34 Q65 41 57 34 Q42 32 27 56 Z";
  const PARTED_EDGE = "M32 50 Q44 32 57 34 Q65 41 73 34 Q86 32 98 50";

  // Swept back off the face, for the styles that are tied up.
  const SWEPT_FILL =
    "M27 54 Q27 6 65 6 Q103 6 103 54 Q92 34 78 32 Q65 29 52 32 Q38 34 27 54 Z";
  const SWEPT_EDGE = "M32 48 Q42 34 52 32 Q65 29 78 32 Q90 34 98 48";

  switch (style) {
    // Short back and sides with a side parting — the ordinary haircut, which
    // the bob below is not.
    case "short":
      return {
        back: (
          <path
            d="M65 14 Q99 14 99 44 Q99 52 97 58 Q92 46 88 40 Q80 26 65 26
               Q50 26 42 40 Q38 46 33 58 Q31 52 31 44 Q31 14 65 14 Z"
            fill={c.mid}
            {...s}
          />
        ),
        front: crown(
          "M27 54 Q27 6 65 6 Q103 6 103 52 Q92 30 76 27 Q60 23 48 33 Q37 42 27 54 Z",
          "M32 49 Q42 39 52 31 Q63 24 76 27 Q90 30 98 46",
          <path d="M58 27 Q49 34 42 44" {...shade} strokeWidth="2" />
        ),
      };

    case "long":
      return {
        back: (
          <g {...s}>
            <path
              d="M65 4 Q108 4 108 54 Q108 86 102 104 Q94 98 87 102
                 Q94 72 90 48 Q84 26 65 26 Q46 26 40 48
                 Q36 72 43 102 Q36 98 28 104 Q22 86 22 54 Q22 4 65 4 Z"
              fill={c.mid}
            />
            <path d="M90 60 Q94 84 92 100 M40 60 Q36 84 38 100" {...shade} />
          </g>
        ),
        front: crown(PARTED_FILL, PARTED_EDGE, <path d="M58 26 Q66 32 74 27" {...shade} />),
      };

    case "bob":
      return {
        back: <path d={CAP} fill={c.mid} {...s} />,
        front: crown(PARTED_FILL, PARTED_EDGE, <path d="M55 25 Q65 31 76 26" {...shade} />),
      };

    case "buzz":
      // Nothing behind: it's short enough that the head's own outline is the
      // hairline, so this one is a closed shape like any other feature.
      return {
        front: (
          <path
            d="M39 44 Q38 24 65 24 Q92 24 91 44 Q84 34 65 34 Q46 34 39 44 Z"
            fill={c.mid}
            {...s}
          />
        ),
      };

    case "mohican":
      return {
        back: <path d="M52 30 Q65 16 78 30 Q65 36 52 30 Z" fill={c.mid} {...s} />,
        front: (
          <g {...s}>
            <path
              d="M49 34 L53 8 L57 28 L61 2 L65 26 L69 0 L73 28 L77 6 L81 34 Q65 40 49 34 Z"
              fill={c.mid}
            />
            <path d="M57 28 L61 8 M65 26 L69 6 M73 28 L77 12" {...shade} strokeWidth="1.8" />
          </g>
        ),
      };

    case "afro":
      return {
        back: (
          <g {...s}>
            <circle cx="65" cy="36" r="40" fill={c.mid} />
            <path
              d="M32 20 Q42 16 46 9 M98 20 Q88 16 84 9 M28 46 Q38 44 42 38 M102 46 Q92 44 88 38"
              {...shade}
              strokeWidth="2"
            />
          </g>
        ),
        front: crown(
          "M26 54 Q24 10 65 10 Q106 10 104 54 Q88 36 65 36 Q42 36 26 54 Z",
          "M31 50 Q44 36 65 36 Q86 36 99 50",
          <path d="M46 37 Q52 31 58 36 M72 36 Q78 31 84 37" {...shade} strokeWidth="1.8" />
        ),
      };

    case "curly":
      return {
        back: (
          <g {...s}>
            <path
              d="M65 6 Q104 6 106 50 Q108 78 100 98 Q92 92 86 96
                 Q92 70 88 48 Q82 26 65 26 Q48 26 42 48
                 Q38 70 44 96 Q38 92 30 98 Q22 78 24 50 Q26 6 65 6 Z"
              fill={c.mid}
            />
            {[
              [26, 40], [24, 58], [28, 76], [34, 94],
              [104, 40], [106, 58], [102, 76], [96, 94],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="8.5" fill={c.mid} />
            ))}
          </g>
        ),
        front: (
          <g>
            <path
              d="M26 52 Q26 8 65 8 Q104 8 104 52 Q92 30 78 30 Q65 26 52 30 Q38 30 26 52 Z"
              fill={c.mid}
              stroke="none"
            />
            {[[40, 34], [52, 27], [65, 25], [78, 27], [90, 34]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="9.5" fill={c.mid} stroke="none" />
            ))}
            {/* The scalloped hairline, in one run, so it reads as one head of
                curls rather than five discs. */}
            <path
              d="M31 45 a 9.5 9.5 0 0 0 17 -3 a 9.5 9.5 0 0 0 17 -2
                 a 9.5 9.5 0 0 0 17 2 a 9.5 9.5 0 0 0 17 3"
              fill="none"
              stroke={outline}
              strokeWidth="2.1"
              strokeLinecap="round"
            />
          </g>
        ),
      };

    case "braids":
      return {
        back: (
          <g {...s}>
            <path d={CAP} fill={c.mid} />
            {[-1, 1].map((side) => (
              <path
                key={side}
                d={`M ${65 + side * 30} 44 Q ${65 + side * 39} 70 ${65 + side * 33} 98
                    Q ${65 + side * 23} 72 ${65 + side * 22} 46 Z`}
                fill={c.mid}
              />
            ))}
            <path
              d="M33 58 Q42 60 40 62 M32 72 Q41 74 39 76 M33 84 Q42 86 40 88
                 M97 58 Q88 60 90 62 M98 72 Q89 74 91 76 M97 84 Q88 86 90 88"
              {...shade}
              strokeWidth="2"
            />
          </g>
        ),
        front: crown(SWEPT_FILL, SWEPT_EDGE, <path d="M65 12 v20" {...shade} strokeWidth="2" />),
      };

    case "locs":
      return {
        back: (
          <g {...s}>
            <path d={CAP} fill={c.mid} />
            {[
              [31, 92], [40, 100], [49, 96], [81, 96], [90, 100], [99, 92],
            ].map(([x, y], i) => (
              <path
                key={i}
                d={`M ${x - 4} 44 L ${x - 4.5} ${y} q 4.5 5 9 0 L ${x + 4} 44 Z`}
                fill={c.mid}
              />
            ))}
          </g>
        ),
        front: crown(
          SWEPT_FILL,
          SWEPT_EDGE,
          <g>
            {[50, 60, 70, 80].map((x, i) => (
              <path key={i} d={`M ${x} 14 L ${x - 1} 30`} {...shade} strokeWidth="2" />
            ))}
          </g>
        ),
      };

    case "bun":
      return {
        back: (
          <g {...s}>
            <path d={CAP} fill={c.mid} />
            <circle cx="65" cy="8" r="14" fill={c.mid} />
            <path d="M57 3 Q65 12 74 4" {...shade} strokeWidth="2" />
          </g>
        ),
        front: crown(
          SWEPT_FILL,
          SWEPT_EDGE,
          <path d="M46 34 Q56 26 65 25 Q74 26 84 34" {...shade} strokeWidth="2" />
        ),
      };

    case "ponytail":
      return {
        back: (
          <g {...s}>
            <path d={CAP} fill={c.mid} />
            <path
              d="M92 38 Q114 44 114 68 Q114 88 103 100 Q99 89 93 87
                 Q103 76 101 62 Q99 48 88 46 Z"
              fill={c.mid}
            />
            <path d="M103 58 Q106 74 102 89" {...shade} strokeWidth="2" />
          </g>
        ),
        front: crown(
          SWEPT_FILL,
          SWEPT_EDGE,
          <path d="M46 34 Q58 26 72 26 Q84 27 92 36" {...shade} strokeWidth="2" />
        ),
      };

    default:
      return {};
  }
}

"use client";

/**
 * Hair — its own slot, drawn in normalised head space: the head is an ellipse
 * centred (65, 48) with rx 27.5 and ry 24.75, which PigAvatar scales to
 * whatever the tier's head actually is.
 *
 * Two passes, because one isn't enough. Everything drawn over the head reads as
 * a wig sat on the face; everything drawn behind it disappears. So the mass
 * goes behind and the hairline goes in front, and the head sits between them.
 *
 * The styles cover a range of textures rather than one hair type in several
 * lengths — the point of the slot is that people can find themselves in it.
 */
import type { ReactNode } from "react";
import { HAIR_COLORS } from "@/lib/pig";

export type HairParts = { back?: ReactNode; front?: ReactNode };

/** Hair over the crown and round the back, tucked behind the head. */
const CAP =
  `M65 8 Q100 8 100 46 Q100 58 97 68 Q92 50 88 42
   Q80 24 65 24 Q50 24 42 42 Q38 50 33 68 Q30 58 30 46 Q30 8 65 8 Z`;

/** The front edge, drawn over the head: a hairline with a slight parting. */
const HAIRLINE =
  `M37 46 Q35 19 65 19 Q95 19 93 46 Q86 32 73 34 Q65 41 57 34 Q44 32 37 46 Z`;

/** Swept back off the face — for the styles that are tied up. */
const SWEPT =
  `M36 44 Q35 20 65 20 Q95 20 94 44 Q88 34 78 32 Q65 30 52 32 Q42 34 36 44 Z`;

export function hairParts(style: string, colorKey: string, outline: string): HairParts {
  const c = HAIR_COLORS[colorKey] ?? HAIR_COLORS.blonde;
  const s = { stroke: outline, strokeWidth: 2.1, strokeLinejoin: "round" as const };
  const shade = { fill: "none", stroke: c.dark, strokeWidth: 2.2, opacity: 0.65 };

  switch (style) {
    case "long":
      return {
        back: (
          <g {...s}>
            <path
              d="M65 4 Q108 4 108 54 Q108 88 101 108 Q93 101 86 106
                 Q94 74 90 48 Q84 26 65 26 Q46 26 40 48
                 Q36 74 44 106 Q37 101 29 108 Q22 88 22 54 Q22 4 65 4 Z"
              fill={c.mid}
            />
            <path d="M90 60 Q94 86 92 104 M40 60 Q36 86 38 104" {...shade} />
          </g>
        ),
        front: (
          <g {...s}>
            <path d={HAIRLINE} fill={c.mid} />
            <path d="M58 26 Q66 32 74 27" {...shade} />
          </g>
        ),
      };

    case "short":
      return {
        back: <path d={CAP} fill={c.mid} {...s} />,
        front: (
          <g {...s}>
            <path d={HAIRLINE} fill={c.mid} />
            <path d="M55 25 Q65 31 76 26" {...shade} />
          </g>
        ),
      };

    case "buzz":
      return {
        back: undefined,
        front: (
          <g {...s}>
            <path
              d="M39 44 Q38 24 65 24 Q92 24 91 44 Q84 34 65 34 Q46 34 39 44 Z"
              fill={c.mid}
            />
          </g>
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
            <circle cx="65" cy="34" r="41" fill={c.mid} />
            <path
              d="M30 20 Q40 16 44 8 M100 20 Q90 16 86 8 M26 46 Q36 44 40 38 M104 46 Q94 44 90 38"
              {...shade}
              strokeWidth="2"
            />
          </g>
        ),
        front: (
          <g {...s}>
            <path d="M37 48 Q35 22 65 22 Q95 22 93 48 Q86 36 65 36 Q44 36 37 48 Z" fill={c.mid} />
            <path d="M46 36 Q52 30 58 35 M72 35 Q78 30 84 36" {...shade} strokeWidth="1.8" />
          </g>
        ),
      };

    case "curly":
      return {
        back: (
          <g {...s}>
            <path
              d="M65 6 Q104 6 106 50 Q108 80 100 100 Q92 94 86 98
                 Q92 70 88 48 Q82 26 65 26 Q48 26 42 48
                 Q38 70 44 98 Q38 94 30 100 Q22 80 24 50 Q26 6 65 6 Z"
              fill={c.mid}
            />
            {[
              [26, 40], [24, 58], [28, 78], [34, 96],
              [104, 40], [106, 58], [102, 78], [96, 96],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="9" fill={c.mid} />
            ))}
          </g>
        ),
        front: (
          <g {...s}>
            {[
              [42, 32], [53, 25], [65, 23], [77, 25], [88, 32],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="10" fill={c.mid} />
            ))}
            <path d="M48 30 Q54 24 60 30 M70 30 Q76 24 82 30" {...shade} strokeWidth="1.8" />
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
                d={`M ${65 + side * 30} 44 Q ${65 + side * 40} 72 ${65 + side * 34} 102
                    Q ${65 + side * 24} 74 ${65 + side * 22} 46 Z`}
                fill={c.mid}
              />
            ))}
            <path
              d="M32 58 Q42 60 40 62 M31 72 Q41 74 39 76 M32 86 Q42 88 40 90
                 M98 58 Q88 60 90 62 M99 72 Q89 74 91 76 M98 86 Q88 88 90 90"
              {...shade}
              strokeWidth="2"
            />
          </g>
        ),
        front: (
          <g {...s}>
            <path d={SWEPT} fill={c.mid} />
            <path d="M65 20 v14" {...shade} strokeWidth="2" />
          </g>
        ),
      };

    case "cornrows":
      return {
        back: <path d={CAP} fill={c.mid} {...s} />,
        front: (
          <g {...s}>
            <path
              d="M36 46 Q35 18 65 18 Q95 18 94 46 Q86 38 65 38 Q44 38 36 46 Z"
              fill={c.mid}
            />
            {/* The rows themselves, running front to back over the crown. */}
            <path
              d="M44 44 Q48 24 60 20 M52 44 Q55 24 65 19 M65 43 Q66 24 70 19
                 M78 44 Q75 24 65 19 M86 44 Q82 24 70 20"
              {...shade}
              strokeWidth="2"
            />
          </g>
        ),
      };

    case "locs":
      return {
        back: (
          <g {...s}>
            <path d={CAP} fill={c.mid} />
            {[
              [30, 96], [39, 104], [48, 100], [82, 100], [91, 104], [100, 96],
            ].map(([x, y], i) => (
              <path
                key={i}
                d={`M ${x - 4} 44 L ${x - 4.5} ${y} q 4.5 5 9 0 L ${x + 4} 44 Z`}
                fill={c.mid}
              />
            ))}
            <path
              d="M30 60 h0 M30 72 h0 M30 84 h0"
              {...shade}
            />
          </g>
        ),
        front: (
          <g {...s}>
            <path d={SWEPT} fill={c.mid} />
            {[52, 62, 72, 82].map((x, i) => (
              <path key={i} d={`M ${x} 22 L ${x - 1} 34`} {...shade} strokeWidth="2" />
            ))}
          </g>
        ),
      };

    case "bun":
      return {
        back: (
          <g {...s}>
            <path d={CAP} fill={c.mid} />
            <circle cx="65" cy="8" r="15" fill={c.mid} />
            <path d="M57 3 Q65 12 74 4" {...shade} strokeWidth="2" />
          </g>
        ),
        front: (
          <g {...s}>
            <path d={SWEPT} fill={c.mid} />
            <path d="M46 34 Q56 26 65 25 Q74 26 84 34" {...shade} strokeWidth="2" />
          </g>
        ),
      };

    case "ponytail":
      return {
        back: (
          <g {...s}>
            <path d={CAP} fill={c.mid} />
            <path
              d="M92 38 Q116 44 116 70 Q116 92 104 104 Q100 92 94 90
                 Q104 78 102 62 Q100 48 88 46 Z"
              fill={c.mid}
            />
            <path d="M104 58 Q108 76 104 92" {...shade} strokeWidth="2" />
          </g>
        ),
        front: (
          <g {...s}>
            <path d={SWEPT} fill={c.mid} />
            <path d="M46 34 Q58 26 72 26 Q84 27 92 36" {...shade} strokeWidth="2" />
          </g>
        ),
      };

    default:
      return {};
  }
}

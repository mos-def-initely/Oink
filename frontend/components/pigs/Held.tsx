"use client";

/**
 * Whatever the pig is brandishing.
 *
 * Drawn in the avatar's own language: the warm outline, flat fills from the
 * Damson palette, no gradients. Held is the last thing PigAvatar draws, so
 * nothing — costume, head or hat — crops any of it.
 *
 * Three anchors, all derived from the arm so an object stays in the grip across
 * the whole fatness ladder:
 *
 *   gx, gy   the hand: the far end of the trotter, swung out by the arm's splay
 *   ix       inboard, over the belly — for things carried across the front,
 *            where they read against the pig rather than against the map
 *   ox       outboard, past the arm — for things you'd hold at your side, which
 *            look wrong laid over your own chest
 *
 * Outboard objects are kept compact and biased downwards. The viewBox stops at
 * 130 and the widest pig's arm already reaches ~116, so there is very little
 * room out there and plenty below.
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
const BLACK = "#000000";
/** Bottle glass — the green a Jameson bottle is. */
const GLASS = "#3F5C36";
/** Cooler and lighter than STEEL, which is a warm grey: brushed aluminium. */
const SILVER = "#C6C5BF";
const SILVER_DARK = "#8D8C85";
const CASH = "#8FAE79";

export default function Held({ item, armX }: { item: string; armX: number }) {
  const s = { stroke: OUTLINE, strokeWidth: STROKE, strokeLinejoin: "round" as const };

  // The arm is a rounded 13x24 rect pivoting at (65 + armX - 2.5, 77), so the
  // hand — its far end — is 17 along from the pivot, swung out by the splay.
  // Anchoring an object anywhere shorter than that leaves it gripped by the
  // forearm.
  const splay = (Math.max(0, (armX - 20) * 0.9) * Math.PI) / 180;
  const gx = 65 + armX - 4 + 17 * Math.sin(splay);
  const gy = 77 + 17 * Math.cos(splay);
  const ix = gx - 13; // in over the belly
  const ox = gx + 9; // out past the arm

  switch (item) {
    // --- carried at the side ----------------------------------------------

    // Raised away from the body. Angled inward it ends up under the pig's own
    // chin, which is not the joke.
    case "knife":
      return (
        <g {...s} transform={`rotate(18 ${gx + 3} ${gy})`}>
          <rect x={gx - 0.5} y={gy - 4} width="7" height="16" rx="3" fill={INK} />
          <rect x={gx - 1.5} y={gy - 9} width="9" height="5" rx="1.5" fill={STEEL} />
          <path
            d={`M ${gx - 1.5} ${gy - 9} L ${gx - 1.5} ${gy - 30} L ${gx + 3} ${gy - 36}
                L ${gx + 7.5} ${gy - 18} L ${gx + 7.5} ${gy - 9} Z`}
            fill={BLADE}
          />
        </g>
      );

    case "sax": {
      const sx = gx - 16;
      /**
       * The whole instrument as one run, in the order the air goes: an S-bent
       * crook down from the mouthpiece, a long body, round the bow and back up
       * into the bell. Tenor proportions — the body is most of the instrument
       * and the bell is the small end of it, which is the difference between a
       * tenor and the stubby alto this was.
       */
      const tube = `M ${sx - 15} ${gy - 33} Q ${sx - 5} ${gy - 33} ${sx - 1} ${gy - 28}
                    Q ${sx + 2} ${gy - 25} ${sx} ${gy - 22}
                    L ${sx} ${gy + 6} Q ${sx} ${gy + 17} ${sx + 8} ${gy + 17}
                    Q ${sx + 16} ${gy + 17} ${sx + 16} ${gy + 7} L ${sx + 16} ${gy + 1}`;
      return (
        // Slung up to the top right the way it hangs off a strap, and never
        // at the mouth — it's hanging, not being played.
        //
        // The lean is doing the work. The mouthpiece sits at the top left of
        // the instrument, so turning it further swings that end outboard, and
        // the head's silhouette climbs as you go out from its centre. At 68°
        // that end clears the snout by a good margin, which is what lets the
        // instrument sit high and in over the belly rather than low and out at
        // arm's length.
        // The narrowest pig is what it's set against: no arm splay there, so
        // the whole thing hangs closest in to the head.
        <g
          transform={`translate(0 4) rotate(68 ${sx} ${gy})
                      translate(${sx} ${gy}) scale(0.92) translate(${-sx} ${-gy})`}
        >
          {/* Outline first as a fatter stroke of the same path — the run bends
              three times, and two stroked passes hold an even width where an
              outlined shape would pinch on curves that tight. */}
          <path
            d={tube}
            fill="none"
            stroke={OUTLINE}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={tube}
            fill="none"
            stroke={GOLD}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Bell. Kept small against the body — on a tenor it's the short end
              of the instrument, not the headline. */}
          <path
            d={`M ${sx + 9.5} ${gy - 10} L ${sx + 23} ${gy - 10} L ${sx + 19.5} ${gy + 3}
                L ${sx + 12.5} ${gy + 3} Z`}
            fill={GOLD}
            {...s}
          />
          <ellipse cx={sx + 16.2} cy={gy - 10} rx="6.8" ry="2.8" fill={LEMON} {...s} />

          {/* Mouthpiece, lying along the end of the crook rather than standing
              up off it. */}
          <rect
            x={sx - 25}
            y={gy - 37.5}
            width="11"
            height="9"
            rx="2.5"
            fill={INK}
            {...s}
            transform={`rotate(-6 ${sx - 19} ${gy - 33})`}
          />

          {/* Keys down the near side of the body. */}
          <g fill={INK} stroke="none">
            <circle cx={sx + 5} cy={gy - 15} r="2" />
            <circle cx={sx + 5} cy={gy - 8} r="2" />
            <circle cx={sx + 5} cy={gy - 1} r="2" />
            <circle cx={sx + 5} cy={gy + 6} r="2" />
          </g>
        </g>
      );
    }

    // A ribbed aluminium case, with a few notes caught in the seam. Drawn
    // notes-first so the lid closes over their ends: laid on top instead they
    // read as money stuck to the outside of a briefcase.
    case "briefcase":
      return (
        <g {...s}>
          <g strokeWidth="1.6">
            <rect
              x={gx + 12}
              y={gy + 1}
              width="11"
              height="7"
              rx="1"
              fill={CASH}
              transform={`rotate(20 ${gx + 17} ${gy + 4})`}
            />
            <rect
              x={gx - 9}
              y={gy + 2}
              width="10"
              height="6.5"
              rx="1"
              fill={CASH}
              transform={`rotate(-16 ${gx - 4} ${gy + 5})`}
            />
            <rect
              x={gx + 3}
              y={gy}
              width="10"
              height="6"
              rx="1"
              fill={CASH}
              transform={`rotate(7 ${gx + 8} ${gy + 3})`}
            />
          </g>

          <path d={`M ${gx - 1} ${gy + 6} q 5 -9 10 -1`} fill="none" />
          <rect x={gx - 5} y={gy + 5} width="24" height="17" rx="2.5" fill={SILVER} />
          <path
            d={`M ${gx - 5} ${gy + 9} h 24 M ${gx - 5} ${gy + 13.5} h 24 M ${gx - 5} ${gy + 18} h 24`}
            stroke={SILVER_DARK}
            strokeWidth="1.7"
            fill="none"
          />
          <rect x={gx + 4} y={gy + 10} width="6" height="5" rx="1.5" fill={SILVER_DARK} strokeWidth="1.5" />
        </g>
      );

    // Barely tilted off level, so the slide reads for its full length. A steep
    // angle foreshortens the one part that says "pistol" and leaves you looking
    // at a grip.
    case "pistol":
      return (
        <g {...s} transform={`rotate(22 ${gx} ${gy})`}>
          <rect x={gx - 4} y={gy - 17} width="30" height="13" rx="2.5" fill={SILVER} />
          <rect x={gx + 20} y={gy - 21} width="4" height="4" fill={SILVER} />
          <path d={`M ${gx - 4} ${gy - 17} l -5 -4 l 0 4 Z`} fill={SILVER} />
          <rect x={gx - 4} y={gy - 5} width="15" height="5" rx="1.5" fill={SILVER} />
          {/* Grip a shade down from the slide, or the whole thing flattens into
              one silver blob at pin size. */}
          <path
            d={`M ${gx - 4} ${gy - 4} L ${gx + 5} ${gy - 4} L ${gx + 3} ${gy + 9} L ${gx - 8} ${gy + 9} Z`}
            fill={SILVER_DARK}
          />
          <path d={`M ${gx + 5} ${gy} q 5 4 0.5 8 h -4.5`} fill="none" />
          <circle cx={gx + 23} cy={gy - 10.5} r="2.1" fill={SILVER_DARK} stroke="none" />
        </g>
      );

    // At the pig's side, bell forward and up. Small enough to read as a
    // trumpet rather than a length of pipe.
    case "trumpet":
      return (
        // Pulled inboard of `ox`: bell-first it needs 20px clear to the right,
        // and the widest pig's arm leaves nothing like that before the frame.
        // Scaled down about the hand rather than re-drawn: the anatomy was
        // right, there was just too much of it against the pig.
        <g
          transform={`rotate(-12 ${ox} ${gy}) translate(${ox} ${gy}) scale(0.74) translate(${-ox} ${-gy})`}
        >
          {/* The tubing as one run — mouthpiece, along the leadpipe, round the
              tuning slide at the far end and back. Without that return loop it
              is a cone on a stick, which is a megaphone. */}
          <path
            d={`M ${ox - 30} ${gy - 1} L ${ox + 2} ${gy - 1}
                M ${ox - 24} ${gy + 8} L ${ox + 1} ${gy + 8}
                M ${ox - 24} ${gy + 8} Q ${ox - 33} ${gy + 8} ${ox - 33} ${gy + 3.5}
                Q ${ox - 33} ${gy - 1} ${ox - 30} ${gy - 1}`}
            fill="none"
            stroke={OUTLINE}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M ${ox - 30} ${gy - 1} L ${ox + 2} ${gy - 1}
                M ${ox - 24} ${gy + 8} L ${ox + 1} ${gy + 8}
                M ${ox - 24} ${gy + 8} Q ${ox - 33} ${gy + 8} ${ox - 33} ${gy + 3.5}
                Q ${ox - 33} ${gy - 1} ${ox - 30} ${gy - 1}`}
            fill="none"
            stroke={GOLD}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Bell. */}
          <path
            d={`M ${ox + 1} ${gy - 8} L ${ox + 17} ${gy - 15} L ${ox + 17} ${gy + 13}
                L ${ox + 1} ${gy + 6} Z`}
            fill={GOLD}
            {...s}
          />
          <ellipse cx={ox + 17} cy={gy - 1} rx="3.2" ry="14" fill={LEMON} {...s} />

          {/* Three valve casings with their buttons, which is the other half of
              what says trumpet. */}
          <g {...s} strokeWidth="1.8">
            {[-21, -14, -7].map((dx) => (
              <g key={dx}>
                <rect x={ox + dx} y={gy - 13} width="5.5" height="13" rx="1.6" fill={GOLD} />
                <circle cx={ox + dx + 2.75} cy={gy - 15} r="2.4" fill={STEEL} />
              </g>
            ))}
          </g>

          {/* Mouthpiece. */}
          <path
            d={`M ${ox - 36} ${gy - 5} L ${ox - 30} ${gy - 3} L ${ox - 30} ${gy + 1}
                L ${ox - 36} ${gy + 3} Z`}
            fill={STEEL}
            {...s}
          />
        </g>
      );

    // Modelled on a Jameson bottle: green glass, square shoulders into a short
    // neck, black capsule, and a cream label banded in gold across most of the
    // body. At this size the green and the label are what carry it.
    case "whisky":
      return (
        <g {...s}>
          <path
            d={`M ${ox - 9} ${gy + 13} L ${ox - 9} ${gy - 8} Q ${ox - 9} ${gy - 14} ${ox - 3.5} ${gy - 18}
                L ${ox - 3.5} ${gy - 27} L ${ox + 3.5} ${gy - 27} L ${ox + 3.5} ${gy - 18}
                Q ${ox + 9} ${gy - 14} ${ox + 9} ${gy - 8} L ${ox + 9} ${gy + 13} Z`}
            fill={GLASS}
          />
          {/* Capsule over the cork, with the gold ring under it. */}
          <rect x={ox - 4.6} y={gy - 32} width="9.2" height="8" rx="1.5" fill={INK} />
          <rect x={ox - 4.2} y={gy - 24} width="8.4" height="2.6" fill={GOLD} stroke="none" />

          <rect x={ox - 8.4} y={gy - 5} width="16.8" height="15" rx="1.2" fill={CREAM} />
          <path
            d={`M ${ox - 8.4} ${gy - 2.4} h 16.8 M ${ox - 8.4} ${gy + 6.6} h 16.8`}
            stroke={GOLD}
            strokeWidth="2.2"
            fill="none"
          />
          <path
            d={`M ${ox - 5} ${gy + 2} h 10`}
            stroke={OUTLINE}
            strokeWidth="1.4"
            fill="none"
          />
        </g>
      );

    case "wine":
      return (
        <g {...s}>
          <path
            d={`M ${ox - 8} ${gy - 18} L ${ox + 8} ${gy - 18} L ${ox + 4.5} ${gy - 3} L ${ox - 4.5} ${gy - 3} Z`}
            fill={CREAM}
          />
          <rect x={ox - 1.4} y={gy - 3} width="3" height="12" fill={CREAM} />
          <rect x={ox - 6} y={gy + 9} width="12" height="3.5" rx="1.7" fill={CREAM} />
        </g>
      );

    case "coffee":
      return (
        <g {...s}>
          <path
            d={`M ${ox - 7} ${gy - 13} L ${ox + 7} ${gy - 13} L ${ox + 5} ${gy + 6} L ${ox - 5} ${gy + 6} Z`}
            fill={CREAM}
          />
          <rect x={ox - 8.5} y={gy - 18} width="17" height="5.5" rx="2" fill={PLUM} />
          <path d={`M ${ox - 7} ${gy - 8} q -7 4 0 9`} fill="none" />
        </g>
      );

    case "pan":
      return (
        <g {...s} transform={`rotate(58 ${gx} ${gy})`}>
          <rect x={gx - 2} y={gy - 3} width="18" height="6.5" rx="3.2" fill={INK} />
          <circle cx={gx + 24} cy={gy} r="10" fill={INK} />
          <circle cx={gx + 24} cy={gy} r="6" fill="#5F4050" stroke="none" />
        </g>
      );

    // Straight up out of the hand, with the canopy wide enough — and hung far
    // enough over — to actually keep the rain off the pig.
    case "umbrella":
      return (
        <g {...s}>
          <path
            d={`M ${gx} ${gy + 10} q 0 6 -6 6`}
            fill="none"
            stroke={OUTLINE}
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          <path
            d={`M ${gx} ${gy + 10} L ${gx} 24`}
            stroke={OUTLINE}
            strokeWidth="7.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${gx} ${gy + 10} q 0 6 -6 6`}
            fill="none"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d={`M ${gx} ${gy + 10} L ${gx} 24`}
            stroke={INK}
            strokeWidth="3.8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Centred on the pig rather than on the shaft, since it's the pig
              that's meant to stay dry. */}
          <path
            d={`M 12 26 a 53 25 0 0 1 106 0
                q -13.25 5 -21.2 0 q -7.95 5 -21.2 0 q -13.25 5 -21.2 0
                q -7.95 5 -21.2 0 q -13.25 5 -21.2 0 Z`}
            fill={PLUM}
          />
          <path
            d="M 44 26 q 6 -20 21 -24 q 15 4 21 24"
            fill="none"
            stroke={CREAM}
            strokeWidth="1.8"
          />
          <path d={`M 65 2 v -2`} stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </g>
      );

    // On the end of its string, floating clear of the pig rather than pinned to
    // its belly.
    case "balloon":
      return (
        <g {...s}>
          <path
            d={`M ${gx} ${gy + 4} Q ${gx + 17} ${gy - 22} ${gx + 10} 36`}
            fill="none"
            strokeWidth="1.6"
          />
          <ellipse cx={gx + 10} cy="20" rx="13" ry="15" fill={RUST} />
          <ellipse cx={gx + 5} cy="14" rx="3.5" ry="5" fill="#fff" opacity="0.3" stroke="none" />
          <path d={`M ${gx + 7.5} 35 l 2.5 5 l 2.5 -5 Z`} fill={RUST} />
        </g>
      );

    case "bouquet":
      return (
        <g {...s} transform={`rotate(14 ${gx} ${gy})`}>
          <rect x={gx + 1} y={gy - 14} width="5" height="22" fill="#6BA368" />
          <circle cx={ox + 1} cy={gy - 15} r="7" fill={PLUM} />
          <circle cx={ox - 7} cy={gy - 10} r="6.5" fill={LILAC} />
          <circle cx={ox + 8} cy={gy - 6} r="6" fill={LEMON} />
          <circle cx={ox - 1} cy={gy - 22} r="5.5" fill={CREAM} />
        </g>
      );

    case "trophy":
      return (
        <g {...s}>
          <path
            d={`M ${ox - 7.5} ${gy - 19} L ${ox + 7.5} ${gy - 19} L ${ox + 5} ${gy - 2} L ${ox - 5} ${gy - 2} Z`}
            fill={GOLD}
          />
          <path d={`M ${ox - 7.5} ${gy - 17} q -6 5 0 10`} fill="none" />
          <path d={`M ${ox + 7.5} ${gy - 17} q 6 5 0 10`} fill="none" />
          <rect x={ox - 2.5} y={gy - 2} width="5" height="8" fill={GOLD} />
          <rect x={ox - 7} y={gy + 6} width="14" height="5" rx="1.5" fill={GOLD} />
        </g>
      );

    // --- carried across the front -----------------------------------------

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

    case "rollingpin":
      return (
        <g {...s} transform={`rotate(-8 ${gx} ${gy})`}>
          <rect x={gx - 32} y={gy - 6} width="28" height="12" rx="6" fill={LEMON} />
          <rect x={gx - 38} y={gy - 2.5} width="8" height="5" rx="2.5" fill={CREAM} />
          <rect x={gx - 6} y={gy - 2.5} width="8" height="5" rx="2.5" fill={CREAM} />
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

    case "camera":
      return (
        <g {...s}>
          <rect x={ix - 13} y={gy - 13} width="26" height="18" rx="3" fill={INK} />
          <rect x={ix - 5} y={gy - 17} width="10" height="5" rx="1.5" fill={INK} />
          <circle cx={ix} cy={gy - 4} r="6" fill={STEEL} />
          <circle cx={ix + 9} cy={gy - 9} r="1.6" fill={LEMON} stroke="none" />
        </g>
      );

    default:
      return null;
  }
}

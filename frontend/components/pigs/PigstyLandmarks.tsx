"use client";

/**
 * The two fixed features of the pigsty, both of them decided by the group
 * rather than by anything their occupant can do directly.
 *
 * The throne goes to whoever's OG oinks — the places they were first to put on
 * the map — have collected the most oinks from everyone else. The enclosure
 * goes to whoever's have collected the most shames. Neither is a score you can
 * farm by logging more; they're the group's verdict on your taste, which is why
 * the throne's inscription calls it democratic.
 */
import PigAvatar from "@/components/pigs/PigAvatar";
import type { User } from "@/lib/types";

const GOLD = "#CFA51F";
const GOLD_LIGHT = "#E9CE63";
const GOLD_DARK = "#9A7A12";
const INK = "#4D303F";
const PLUM = "#914E56";
const BLOOD = "#8E1B12";
const TIMBER = "#8A6134";
const TIMBER_DARK = "#6A4826";

/**
 * Every pig in the sty is drawn at the same size, landmark or not — an occupant
 * rendered larger than the crowd reads as a different animal rather than the
 * same one somewhere special.
 *
 * The three sets of scenery were each laid out around a bigger pig than that,
 * so each carries the ratio it was drawn at and scales its own artwork down to
 * suit. The viewBoxes are untouched; only the box they're painted into shrinks.
 */
export const STY_PIG = 86;

export function Throne({ user }: { user: User }) {
  const k = STY_PIG / 132;
  return (
    <div className="relative" style={{ width: 210 * k, height: 258 * k }}>
      {/* The viewBox starts above the origin so the banner can sit clear of the
          crown without the whole throne having to move down for it. */}
      <svg
        width={210 * k}
        height={258 * k}
        viewBox="0 -8 210 258"
        aria-hidden
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="throne-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={GOLD_LIGHT} />
            <stop offset="55%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_DARK} />
          </linearGradient>
        </defs>

        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          {/* Back, with a crown along the top rail. It runs all the way down to
              the seat: a gap between the two read as two bits of furniture with
              a pig floating between them. */}
          <path
            d="M46 152 L46 74 L60 56 L74 74 L88 52 L105 68 L122 52 L136 74 L150 56 L164 74 L164 152 Z"
            fill="url(#throne-gold)"
          />
          <rect x="46" y="140" width="118" height="14" rx="4" fill={GOLD_DARK} />

          {/* Arms — deep enough to rest on and tall enough to be arms rather
              than a lip on the seat. */}
          <rect x="14" y="112" width="30" height="66" rx="11" fill="url(#throne-gold)" />
          <rect x="166" y="112" width="30" height="66" rx="11" fill="url(#throne-gold)" />
        </g>

        {/* Jewels down the back. */}
        <g stroke={INK} strokeWidth="2">
          <circle cx="105" cy="92" r="9" fill="#B03A45" />
          <circle cx="72" cy="102" r="6" fill="#4E7FA8" />
          <circle cx="138" cy="102" r="6" fill="#4E7FA8" />
        </g>

        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          {/* Seat and cushion — the pig stands on this, so both go down before
              it rather than over its legs. */}
          <rect x="24" y="166" width="162" height="26" rx="6" fill="url(#throne-gold)" />
          <rect x="36" y="154" width="138" height="26" rx="11" fill={PLUM} />

          {/* Legs. */}
          <rect x="40" y="190" width="22" height="42" rx="5" fill="url(#throne-gold)" />
          <rect x="148" y="190" width="22" height="42" rx="5" fill="url(#throne-gold)" />
          <rect x="30" y="228" width="150" height="13" rx="5" fill={GOLD_DARK} />
        </g>

        {/* The banner, over the top of the throne rather than under it. */}
        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <path d="M0 22 L22 -6 L188 -6 L210 22 L188 50 L22 50 Z" fill="url(#throne-gold)" />
        </g>
        <text
          x="105"
          y="18"
          textAnchor="middle"
          fill={INK}
          style={{ font: "800 11px var(--font-display, system-ui)", letterSpacing: "0.01em" }}
        >
          DEMOCRATICALLY ANOINTED
        </text>
        <text
          x="105"
          y="38"
          textAnchor="middle"
          fill={INK}
          style={{ font: "800 13px var(--font-display, system-ui)", letterSpacing: "0.05em" }}
        >
          SUPREME OINK
        </text>
      </svg>

      {/* Stood on the cushion, in front of the chair. The container's origin is
          8 above the viewBox's, so this is offset to match. */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: (8 + 48) * k }}>
        <PigAvatar
          config={user.pig_avatar_config}
          placesLogged={user.places_logged}
          lastLoggedAt={user.last_logged_at}
          size={STY_PIG}
          variant="full"
        />
      </div>
    </div>
  );
}

/**
 * One plot in the graveyard: a headstone with a pig standing in front of it.
 *
 * Dead pigs are the ones that have gone a long enough stretch without logging
 * anywhere to starve all the way down the ladder. Nothing here is permanent —
 * a single log brings them straight back to whatever they'd earned — so the
 * stone says "here lies", not "here lay".
 */
export function Grave({ user }: { user: User }) {
  const stone = hashTilt(user.id);
  const k = STY_PIG / 92;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 130 * k, height: 168 * k }}>
        <svg width={130 * k} height={168 * k} viewBox="0 0 130 168" aria-hidden className="absolute inset-0">
          <g transform={`rotate(${stone} 65 120)`}>
            <path
              d="M34 122 L34 56 a 31 31 0 0 1 62 0 L96 122 Z"
              fill="#B9B2A6"
              stroke={INK}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M42 118 L42 58 a 23 23 0 0 1 46 0 L88 118 Z"
              fill="#CBC5BA"
              stroke="none"
            />
            <text
              x="65"
              y="56"
              textAnchor="middle"
              fill="#6E6558"
              style={{ font: "800 13px var(--font-display, system-ui)", letterSpacing: "0.08em" }}
            >
              RIP
            </text>
          </g>
          {/* The mound. */}
          <ellipse cx="65" cy="132" rx="54" ry="16" fill="#7A5637" stroke={INK} strokeWidth="3" />
          <ellipse cx="65" cy="129" rx="46" ry="11" fill="#8A6340" stroke="none" />
        </svg>

        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 40 * k }}>
          <PigAvatar
            config={user.pig_avatar_config}
            placesLogged={user.places_logged}
            lastLoggedAt={user.last_logged_at}
            size={STY_PIG}
            variant="full"
          />
        </div>
      </div>
    </div>
  );
}

/** A few degrees of lean per stone, stable per user — a row of upright slabs
 *  reads as a fence, and a graveyard leans. */
function hashTilt(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((Math.abs(h) % 900) / 100 - 4.5);
}

/** The graveyard's ground: a dark plot behind however many graves there are. */
export function GraveyardGround({ width, height }: { width: number; height: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute rounded-[48px] border-[3px] border-ink"
      style={{
        width,
        height,
        background: "linear-gradient(#6E7A55, #5C6647)",
      }}
    >
      <p
        className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap font-display text-lg font-extrabold uppercase tracking-[0.14em]"
        style={{ color: "#D9D2C2" }}
      >
        The Graveyard
      </p>
    </div>
  );
}

/** A fence post: a squared timber with a chamfered top. */
function post(x: number, baseY: number, height: number, w = 13) {
  const top = baseY - height;
  return `M${x} ${baseY} L${x} ${top + 7} L${x + w / 2} ${top} L${x + w} ${top + 7} L${x + w} ${baseY} Z`;
}

export function ShameEnclosure({ user }: { user: User }) {
  // The pen, in plan: a square plot seen at a slight angle, so all four runs of
  // fence are visible rather than just the near one.
  const BL = { x: 46, y: 176 }; // back left
  const BR = { x: 214, y: 176 };
  const FL = { x: 20, y: 268 }; // front left
  const FR = { x: 240, y: 268 };
  /** A rail along one side, as a beam of the given thickness lifted by `up`. */
  const rail = (a: { x: number; y: number }, b: { x: number; y: number }, up: number, t = 9) =>
    `M${a.x} ${a.y - up} L${b.x} ${b.y - up} L${b.x} ${b.y - up + t} L${a.x} ${a.y - up + t} Z`;

  const k = STY_PIG / 104;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 260 * k, height: 300 * k }}>
        {/* Billboard, behind everything. */}
        <svg width={260 * k} height={150 * k} viewBox="0 0 260 150" aria-hidden className="absolute left-0 top-0">
          <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <rect x="58" y="96" width="12" height="52" fill={TIMBER_DARK} />
            <rect x="190" y="96" width="12" height="52" fill={TIMBER_DARK} />
            <rect x="26" y="10" width="208" height="92" rx="4" fill="#FFFDF6" />
          </g>
          {/* The inscription. Painted, running, and not by a signwriter. */}
          <text
            x="130"
            y="48"
            textAnchor="middle"
            fill={BLOOD}
            style={{ font: "700 26px var(--font-display, system-ui)", letterSpacing: "0.02em" }}
          >
            The Shame
          </text>
          <text
            x="130"
            y="80"
            textAnchor="middle"
            fill={BLOOD}
            style={{ font: "700 26px var(--font-display, system-ui)", letterSpacing: "0.02em" }}
          >
            Enclosure
          </text>
        </svg>

        {/* The pen: bare mud inside a square of fence. The grass tile runs
            everywhere else in the sty, so this reads as a patch nothing has
            come back from. Back and sides go down first, the occupant next,
            the near run last — which is what makes it an enclosure rather than
            a fence with a pig behind it. */}
        <svg width={260 * k} height={300 * k} viewBox="0 0 260 300" aria-hidden className="absolute inset-0">
          <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <path
              d={`M${BL.x} ${BL.y} L${BR.x} ${BR.y} L${FR.x} ${FR.y} L${FL.x} ${FL.y} Z`}
              fill="#7A5637"
            />
          </g>
          <path
            d={`M${BL.x + 8} ${BL.y + 6} L${BR.x - 8} ${BR.y + 6} L${FR.x - 10} ${FR.y - 8} L${FL.x + 10} ${FL.y - 8} Z`}
            fill="#8A6340"
          />
          <g fill="#6A4A2E">
            <ellipse cx="86" cy="204" rx="17" ry="6" />
            <ellipse cx="176" cy="232" rx="21" ry="7" />
            <ellipse cx="112" cy="248" rx="15" ry="5" />
            <ellipse cx="200" cy="196" rx="11" ry="4" />
            <ellipse cx="56" cy="236" rx="12" ry="4" />
          </g>
          {/* Trotter prints, going nowhere. */}
          <g fill="#5E4128" opacity="0.8">
            {[
              [96, 220], [108, 228], [154, 200], [166, 208], [204, 216],
            ].map(([x, y], i) => (
              <g key={i}>
                <ellipse cx={x} cy={y} rx="3" ry="4" />
                <ellipse cx={x + 6} cy={y + 2} rx="3" ry="4" />
              </g>
            ))}
          </g>

          {/* Back run, then the two sides. */}
          <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <path d={rail(BL, BR, 20)} fill={TIMBER} />
            <path d={rail(BL, BR, 6)} fill={TIMBER} />
            {[BL.x, 88, 130, 172, BR.x - 13].map((x) => (
              <path key={`b${x}`} d={post(x, BL.y + 4, 42)} fill={TIMBER_DARK} />
            ))}

            <path d={rail(BL, FL, 20)} fill={TIMBER} />
            <path d={rail(BL, FL, 6)} fill={TIMBER} />
            <path d={rail(BR, FR, 20)} fill={TIMBER} />
            <path d={rail(BR, FR, 6)} fill={TIMBER} />
            {[0.5].map((t) => (
              <g key={t}>
                <path
                  d={post(BL.x + (FL.x - BL.x) * t - 6, BL.y + (FL.y - BL.y) * t + 4, 42)}
                  fill={TIMBER_DARK}
                />
                <path
                  d={post(BR.x + (FR.x - BR.x) * t - 6, BR.y + (FR.y - BR.y) * t + 4, 42)}
                  fill={TIMBER_DARK}
                />
              </g>
            ))}
          </g>
        </svg>

        {/* The occupant, penned in. */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 132 * k }}>
          <div className="relative">
            <PigAvatar
              config={user.pig_avatar_config}
              placesLogged={user.places_logged}
              lastLoggedAt={user.last_logged_at}
              size={STY_PIG}
              variant="full"
            />
            {/* Placard round the neck. Drawn in the avatar's own coordinates —
                130 across, head bottom around y=71 — so the string sits on the
                shoulders and the board hangs on the chest whatever the tier. */}
            <svg
              width={STY_PIG}
              height={(STY_PIG * 134) / 130}
              viewBox="0 0 130 134"
              aria-hidden
              className="pointer-events-none absolute left-0 top-0"
            >
              <path
                d="M52 66 L65 86 L78 66"
                fill="none"
                stroke={INK}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <g transform="rotate(-5 65 93)">
                <rect
                  x="41"
                  y="83"
                  width="48"
                  height="21"
                  rx="2.5"
                  fill="#FFFDF6"
                  stroke={INK}
                  strokeWidth="2.4"
                />
                <text
                  x="65"
                  y="98"
                  textAnchor="middle"
                  fill={BLOOD}
                  style={{ font: "800 13px var(--font-display, system-ui)", letterSpacing: "0.06em" }}
                >
                  SHAME
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* The near run, drawn last so it stands in front of the pig. */}
        <svg width={260 * k} height={300 * k} viewBox="0 0 260 300" aria-hidden className="absolute inset-0">
          <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <path d={rail(FL, FR, 20)} fill={TIMBER} />
            <path d={rail(FL, FR, 6)} fill={TIMBER} />
            {[FL.x, 75, 130, 185, FR.x - 13].map((x) => (
              <path key={`f${x}`} d={post(x, FL.y + 6, 46)} fill={TIMBER_DARK} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

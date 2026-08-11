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

export function Throne({ user }: { user: User }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 210, height: 250 }}>
        <svg
          width="210"
          height="250"
          viewBox="0 0 210 250"
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
            {/* Back, with a crown along the top rail. It runs all the way down
                to the seat: a gap between the two read as two bits of
                furniture with a pig floating between them. */}
            <path
              d="M44 140 L44 34 L58 14 L72 34 L88 10 L105 28 L122 10 L138 34 L152 14 L166 34 L166 140 Z"
              fill="url(#throne-gold)"
            />
            <rect x="44" y="126" width="122" height="14" rx="4" fill={GOLD_DARK} />

            {/* Arms, then the seat over them. */}
            <rect x="26" y="112" width="20" height="42" rx="9" fill="url(#throne-gold)" />
            <rect x="164" y="112" width="20" height="42" rx="9" fill="url(#throne-gold)" />
            <rect x="34" y="140" width="142" height="24" rx="6" fill="url(#throne-gold)" />

            {/* Legs. */}
            <rect x="44" y="162" width="20" height="40" rx="5" fill="url(#throne-gold)" />
            <rect x="146" y="162" width="20" height="40" rx="5" fill="url(#throne-gold)" />
            <rect x="34" y="198" width="142" height="12" rx="5" fill={GOLD_DARK} />
          </g>

          {/* Jewels down the back. */}
          <g stroke={INK} strokeWidth="2">
            <circle cx="105" cy="50" r="9" fill="#B03A45" />
            <circle cx="72" cy="60" r="6" fill="#4E7FA8" />
            <circle cx="138" cy="60" r="6" fill="#4E7FA8" />
          </g>

          {/* Cushion, drawn after the seat so the pig has something to sit on
              and something to sit in front of. */}
          <rect
            x="46"
            y="128"
            width="118"
            height="24"
            rx="10"
            fill={PLUM}
            stroke={INK}
            strokeWidth="3"
          />
        </svg>

        {/* Sat on the cushion — the pig's feet land on it rather than in it. */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 8 }}>
          <PigAvatar
            config={user.pig_avatar_config}
            placesLogged={user.places_logged}
            lastLoggedAt={user.last_logged_at}
            size={132}
            variant="full"
          />
        </div>
      </div>

      {/* The inscription, on a plaque under the throne. */}
      <div
        className="-mt-1 rounded-md border-[3px] px-3 py-1.5 text-center"
        style={{ borderColor: INK, background: "linear-gradient(#E9CE63, #CFA51F)" }}
      >
        <p
          className="font-display text-[13px] font-extrabold uppercase leading-tight tracking-[0.06em]"
          style={{ color: INK }}
        >
          Democratically Anointed
          <br />
          Supreme Oink
        </p>
      </div>
      <p className="mt-1 font-display text-xs font-bold text-ink">{user.display_name}</p>
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
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 130, height: 168 }}>
        <svg width="130" height="168" viewBox="0 0 130 168" aria-hidden className="absolute inset-0">
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

        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 40 }}>
          <PigAvatar
            config={user.pig_avatar_config}
            placesLogged={user.places_logged}
            lastLoggedAt={user.last_logged_at}
            size={92}
            variant="full"
          />
        </div>
      </div>
      <p className="font-display text-[11px] font-bold text-ink">{user.display_name}</p>
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

export function ShameEnclosure({ user }: { user: User }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 260, height: 262 }}>
        {/* Billboard, behind everything. */}
        <svg width="260" height="150" viewBox="0 0 260 150" aria-hidden className="absolute left-0 top-0">
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
          <g fill={BLOOD}>
            <path d="M62 50 q2 14 0 22 q-4 -8 -2 -22 Z" />
            <path d="M148 52 q2 10 0 16 q-4 -6 -2 -16 Z" />
            <path d="M96 82 q2 16 0 24 q-4 -9 -2 -24 Z" />
            <path d="M170 84 q2 9 0 14 q-4 -5 -2 -14 Z" />
            <circle cx="61" cy="74" r="2.6" />
            <circle cx="95" cy="108" r="2.4" />
          </g>
        </svg>

        {/* The ground inside the pen: churned bare mud, nothing growing. The
            grass tile runs everywhere else in the sty, so the enclosure reads
            as a place nothing has come back from. */}
        <svg
          width="260"
          height="120"
          viewBox="0 0 260 120"
          aria-hidden
          className="absolute bottom-0 left-0"
        >
          <ellipse cx="130" cy="76" rx="116" ry="42" fill="#7A5637" stroke={INK} strokeWidth="3" />
          <ellipse cx="130" cy="72" rx="104" ry="34" fill="#8A6340" stroke="none" />
          <g fill="#6A4A2E">
            <ellipse cx="72" cy="66" rx="16" ry="6" />
            <ellipse cx="168" cy="88" rx="20" ry="7" />
            <ellipse cx="120" cy="96" rx="14" ry="5" />
            <ellipse cx="196" cy="62" rx="11" ry="4" />
            <ellipse cx="52" cy="90" rx="12" ry="4" />
          </g>
          {/* Trotter prints, going nowhere. */}
          <g fill="#5E4128" opacity="0.8">
            {[
              [88, 82], [100, 90], [150, 70], [162, 78], [200, 84],
            ].map(([x, y], i) => (
              <g key={i}>
                <ellipse cx={x} cy={y} rx="3" ry="4" />
                <ellipse cx={x + 6} cy={y + 2} rx="3" ry="4" />
              </g>
            ))}
          </g>
        </svg>

        {/* The occupant, penned in. */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 108 }}>
          <div className="relative">
            <PigAvatar
              config={user.pig_avatar_config}
              placesLogged={user.places_logged}
              lastLoggedAt={user.last_logged_at}
              size={96}
              variant="full"
            />
            {/* Placard round the neck, on a string over the shoulders. */}
            <svg
              width="96"
              height="99"
              viewBox="0 0 96 99"
              aria-hidden
              className="pointer-events-none absolute left-0 top-0"
            >
              <path
                d="M36 34 L47 56 L60 34"
                fill="none"
                stroke={INK}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <g transform="rotate(-6 47 66)">
                <rect
                  x="20"
                  y="53"
                  width="54"
                  height="22"
                  rx="2.5"
                  fill="#FFFDF6"
                  stroke={INK}
                  strokeWidth="2.4"
                />
                <text
                  x="47"
                  y="69"
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

        {/* The fence, drawn last so it stands in front of the pig. */}
        <svg
          width="260"
          height="96"
          viewBox="0 0 260 96"
          aria-hidden
          className="absolute bottom-0 left-0"
        >
          <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <rect x="24" y="40" width="212" height="9" rx="3" fill={TIMBER} />
            <rect x="24" y="66" width="212" height="9" rx="3" fill={TIMBER} />
            {[30, 74, 118, 162, 206].map((x) => (
              <path
                key={x}
                d={`M${x} 88 L${x} 30 L${x + 7} 22 L${x + 14} 30 L${x + 14} 88 Z`}
                fill={TIMBER_DARK}
              />
            ))}
          </g>
        </svg>
      </div>

      <p className="mt-1 font-display text-xs font-bold text-ink">{user.display_name}</p>
    </div>
  );
}

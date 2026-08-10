"use client";

/**
 * The pigsty — everyone on Oink, out on the grass (spec §6.6).
 *
 * A field larger than the screen that you drag around and zoom, rather than a
 * list. The point is being able to pull back and see the whole group standing
 * about, which a scrolling directory can't do.
 *
 * **No names in the field.** At phone width twenty-odd labels can't avoid
 * fighting the art, and the fix isn't smaller type — it's not drawing them.
 * Tap a pig and the bar underneath says who it is, which is also how you find
 * out who a penguin is in the game this borrows from.
 *
 * **Positions are stable.** Each pig's patch of grass comes from a hash of its
 * user id, not from its index in the list, so nobody moves when somebody new
 * joins. That matters: the sty is only navigable if you can learn where your
 * friends stand. Cells are claimed in id order with linear probing, so a new
 * arrival takes an empty cell rather than displacing anyone.
 *
 * Avatars are drawn full-body, so anyone with a truffle brings it along — at
 * close zoom you can see whose is which variety.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import PigAvatar from "@/components/pigs/PigAvatar";
import BottomTabBar, { TabBarSpacer } from "@/components/BottomTabBar";
import { Spinner } from "@/components/ui";
import { TIER_LABELS, fatnessTier } from "@/lib/pig";

/** How much room one pig gets. The field is sized from the crowd rather than
 *  fixed, so five pigs aren't marooned in a paddock built for thirty. */
const CELL_W = 132;
const CELL_H = 150;
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.6;

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Five petals on a circle, precomputed. Calling Math.cos at render time is a
 * hydration hazard: the spec doesn't require it to be correctly rounded, so
 * Node and the browser can disagree in the last bit and React reports a
 * mismatched attribute.
 */
const PETALS: [number, number][] = [[15.0, 10.0], [11.55, 14.76], [5.95, 12.94], [5.95, 7.06], [11.55, 5.24]];

type Spot = { user: User; x: number; y: number };
type Field = { spots: Spot[]; width: number; height: number };

/**
 * Lay the crowd out on a relaxed grid. Jitter is capped at 30% of a cell so two
 * pigs can never overlap however they're seeded — an earlier version let jitter
 * exceed the gap, which is what made them collide.
 */
function layout(users: User[]): Field {
  const n = Math.max(users.length, 1);
  const cols = Math.max(3, Math.ceil(Math.sqrt(n * 1.5)));
  const rows = Math.max(2, Math.ceil(n / cols));
  const taken = new Set<number>();
  const cells = cols * rows;
  const width = cols * CELL_W;
  const height = rows * CELL_H;

  // id order, not display order, so the list re-sorting never moves anyone.
  const ordered = [...users].sort((a, b) => a.id.localeCompare(b.id));
  const spots: Spot[] = [];

  for (const user of ordered) {
    const h = hash(user.id);
    let cell = h % cells;
    while (taken.has(cell)) cell = (cell + 1) % cells; // deterministic probe
    taken.add(cell);

    const cx = cell % cols;
    const cy = Math.floor(cell / cols);
    const jx = ((h >> 8) % 1000) / 1000 - 0.5;
    const jy = ((h >> 18) % 1000) / 1000 - 0.5;

    spots.push({
      user,
      x: ((cx + 0.5 + jx * 0.55) / cols) * width,
      y: ((cy + 0.5 + jy * 0.5) / rows) * height,
    });
  }
  return { spots, width, height };
}

/**
 * The ground, as one repeating tile rather than a few hundred positioned nodes.
 *
 * Scenery used to live inside the field, so zooming out ran past its edge and
 * left bare green. A tile repeats forever: the grass keeps going however far
 * out you pull, and it still scales with the zoom because it sits inside the
 * transformed layer rather than being painted on the viewport.
 */
const GROUND_TILE = (() => {
  // A big tile: at 180px the repeat was legible as diagonal banding once you
  // pulled back far enough to see it several times over.
  const TILE = 340;
  const cols = ["#E6D389", "#D8B5F7", "#F5BCC8", "#FFFDF6"];
  const parts: string[] = [];
  for (let i = 0; i < 84; i++) {
    const h = hash(`ground-${i}`);
    const x = ((h % 1000) / 1000) * TILE;
    const y = (((h >> 10) % 1000) / 1000) * TILE;
    if (i % 3 === 0) {
      const c = cols[h % cols.length];
      const petals = PETALS.map(
        ([px, py]) =>
          `<circle cx="${(x + px - 10).toFixed(1)}" cy="${(y + py - 10).toFixed(1)}" r="3.4" fill="${c}" stroke="#4D303F" stroke-width="1.4"/>`
      ).join("");
      parts.push(`${petals}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#CFA51F"/>`);
    } else {
      const r = ((h >> 20) % 24) - 12;
      const blade = (dx: number, lean: number) =>
        `M${(x + dx).toFixed(1)} ${(y + 5).toFixed(1)} Q${(x + dx + lean * 0.4).toFixed(1)} ${(y - 1).toFixed(1)} ${(x + dx + lean).toFixed(1)} ${(y - 4).toFixed(1)}`;
      parts.push(
        `<g transform="rotate(${r} ${x.toFixed(1)} ${y.toFixed(1)})"><path d="${blade(-4, 3)} ${blade(0, 1)} ${blade(4, -3)}" fill="none" stroke="#7FA366" stroke-width="1.6" stroke-linecap="round"/></g>`
      );
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">${parts.join("")}</svg>`;
  // encodeURIComponent the whole thing rather than escaping by hand. A raw `#`
  // starts a fragment and truncates the URI there, which is what an earlier
  // version did: the petal fills came straight from the palette with their `#`
  // intact, so every tile was cut off mid-attribute. It fails silently — the
  // element still paints, just with no image on it.
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

export default function PigstyScreen({ initialUsers }: { initialUsers: User[] | null }) {
  const [users, setUsers] = useState<User[] | null>(initialUsers);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [scale, setScale] = useState(0.7);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const framed = useRef(false);

  const viewport = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  /** Pan drag: where the field's origin sits relative to the finger. */
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  /** Pinch: the two-finger span and the field point pinned under their midpoint. */
  const pinch = useRef<{ dist: number; scale: number; fx: number; fy: number } | null>(null);
  /** Pointers we've captured. Capture is taken late — see onPointerMove. */
  const captured = useRef(new Set<number>());

  useEffect(() => {
    api.users().then(setUsers).catch(() => {});
  }, []);

  const { spots, width: fieldW, height: fieldH } = useMemo(() => layout(users ?? []), [users]);

  const q = query.trim().toLowerCase();
  const matches = (u: User) =>
    !q || u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  const hits = spots.filter((s) => matches(s.user));

  /** Frame the whole field — the wide view is the reason this page exists. */
  function fitAll(w: number, h: number) {
    const box = viewport.current?.getBoundingClientRect();
    if (!box || !w || !h) return;
    const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(box.width / w, box.height / h) * 0.9));
    setScale(s);
    setPan({ x: (box.width - w * s) / 2, y: (box.height - h * s) / 2 });
  }

  // Fit once the crowd is known. Only once — re-framing on every refresh would
  // yank the field out from under someone who had panned somewhere.
  useEffect(() => {
    if (framed.current || !users?.length) return;
    framed.current = true;
    fitAll(fieldW, fieldH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, fieldW, fieldH]);

  // Searching pans to the first match rather than filtering the field: the sty
  // should stay a place you're looking around, not collapse into a list.
  useEffect(() => {
    if (!q || hits.length === 0) return;
    const first = hits[0];
    setSelected(first.user.id);
    const box = viewport.current?.getBoundingClientRect();
    if (!box) return;
    setPan({
      x: box.width / 2 - first.x * scale,
      y: box.height / 2 - first.y * scale,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  /** Finger positions relative to the viewport, which is what pan is measured in. */
  function local(e: { clientX: number; clientY: number }) {
    const box = viewport.current?.getBoundingClientRect();
    return { x: e.clientX - (box?.left ?? 0), y: e.clientY - (box?.top ?? 0) };
  }

  function startPinch() {
    const [a, b] = [...pointers.current.values()];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    pinch.current = {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      scale,
      // The field coordinate currently under the midpoint — the point the
      // gesture holds still while the scale changes.
      fx: (mid.x - pan.x) / scale,
      fy: (mid.y - pan.y) / scale,
    };
  }

  /**
   * Capture is deliberately *not* taken on pointerdown. A captured pointer
   * retargets the following `click` to the capturing element, so grabbing it up
   * front sends every tap to the field instead of the pig that was tapped. It's
   * taken once a gesture is genuinely under way, by which point the tap is moot.
   */
  function capture(id: number) {
    if (captured.current.has(id)) return;
    viewport.current?.setPointerCapture(id);
    captured.current.add(id);
  }

  function onPointerDown(e: React.PointerEvent) {
    const p = local(e);
    pointers.current.set(e.pointerId, p);

    if (pointers.current.size === 2) {
      startPinch();
      pointers.current.forEach((_, id) => capture(id));
      drag.current = null;
      return;
    }
    drag.current = { x: p.x - pan.x, y: p.y - pan.y, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, (pinch.current.scale * dist) / pinch.current.dist)
      );
      // Keep the pinched point under the fingers, so the field zooms where
      // you're looking rather than toward a corner.
      setScale(next);
      setPan({ x: mid.x - pinch.current.fx * next, y: mid.y - pinch.current.fy * next });
      if (drag.current) drag.current.moved = true;
      return;
    }

    if (!drag.current) return;
    const next = { x: p.x - drag.current.x, y: p.y - drag.current.y };
    // Past the slop threshold this is a drag, not a tap — take the pointer then.
    if (Math.abs(next.x - pan.x) + Math.abs(next.y - pan.y) > 3) {
      drag.current.moved = true;
      capture(e.pointerId);
    }
    if (!drag.current.moved) return;
    setPan(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (captured.current.delete(e.pointerId)) {
      viewport.current?.releasePointerCapture?.(e.pointerId);
    }

    if (pointers.current.size === 1) {
      // Coming out of a pinch: re-anchor to the finger still down, or the field
      // jumps by however far apart the two fingers were.
      const [only] = [...pointers.current.values()];
      pinch.current = null;
      drag.current = { x: only.x - pan.x, y: only.y - pan.y, moved: true };
      return;
    }
    if (pointers.current.size === 0) pinch.current = null;
  }

  /** A tap only selects if it wasn't the end of a drag. */
  function pick(id: string) {
    if (drag.current?.moved) return;
    setSelected((current) => (current === id ? null : id));
  }

  const chosen = users?.find((u) => u.id === selected) ?? null;

  return (
    <>
      <header className="sticky top-0 z-[900] bg-oat/95 px-3 pb-2 pt-3 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <h1 className="wordmark text-3xl">pigsty</h1>
          <span className="micro">{users ? `${users.length} pigs` : ""}</span>
        </div>
        <label className="field mt-2 flex items-center gap-2 !py-1.5">
          <span aria-hidden className="text-ink-soft">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="find a pig…"
            className="w-full bg-transparent text-sm outline-none"
            aria-label="find a pig"
          />
          {query && (
            <button onClick={() => setQuery("")} className="micro shrink-0" aria-label="clear">
              clear
            </button>
          )}
        </label>
      </header>

      <main className="px-3">
        {!users && <Spinner label="rounding them up…" />}

        {users && (
          <>
            <div
              ref={viewport}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative h-[58vh] min-h-[320px] cursor-grab touch-none overflow-hidden rounded-card border-2 border-ink bg-grass active:cursor-grabbing"
              style={{ backgroundImage: "linear-gradient(#AECD8F, #8FB374)" }}
            >
              <div
                className="absolute left-0 top-0 origin-top-left"
                style={{
                  width: fieldW,
                  height: fieldH,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                }}
              >
                {/* Grass and flowers, tiled far beyond the pigs so pulling back
                    never reaches an edge. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{
                    left: -fieldW * 2,
                    top: -fieldH * 2,
                    width: fieldW * 5,
                    height: fieldH * 5,
                    backgroundImage: GROUND_TILE,
                    backgroundRepeat: "repeat",
                  }}
                />

                {spots.map(({ user, x, y }) => {
                  const dim = !!q && !matches(user);
                  const isChosen = user.id === selected;
                  return (
                    <button
                      key={user.id}
                      onClick={() => pick(user.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 transition-opacity"
                      style={{ left: x, top: y, opacity: dim ? 0.22 : 1, zIndex: isChosen ? 20 : 1 }}
                      aria-label={user.display_name}
                    >
                      <span
                        className="pig-bob block"
                        style={{ animationDelay: `${-(hash(user.id) % 3000) / 1000}s` }}
                      >
                        <PigAvatar
                          config={user.pig_avatar_config}
                          placesLogged={user.places_logged}
                          lastLoggedAt={user.last_logged_at}
                          size={86}
                          variant="full"
                        />
                      </span>
                      {isChosen && (
                        <span className="pointer-events-none absolute bottom-0 left-1/2 h-4 w-16 -translate-x-1/2 rounded-[50%] border-[3px] border-plum" />
                      )}
                    </button>
                  );
                })}
              </div>

              {q && hits.length === 0 && (
                <p className="absolute inset-x-0 top-1/2 text-center font-display text-sm font-bold text-ink">
                  no pig by that name
                </p>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="micro shrink-0">wide</span>
              <input
                type="range"
                min={MIN_SCALE * 100}
                max={MAX_SCALE * 100}
                value={scale * 100}
                onChange={(e) => setScale(Number(e.target.value) / 100)}
                className="h-1.5 flex-1 accent-plum"
                aria-label="zoom"
              />
              <span className="micro shrink-0">close</span>
              <button onClick={() => fitAll(fieldW, fieldH)} className="tag shrink-0 !py-0.5 text-xs">
                all
              </button>
            </div>

            {/* The bar does the job labels would have done, without covering the
                field — and it has room for the things a floating name never had. */}
            <div className="card mt-2 flex items-center gap-2.5 p-2.5">
              {chosen ? (
                <>
                  <PigAvatar
                    config={chosen.pig_avatar_config}
                    placesLogged={chosen.places_logged}
                    lastLoggedAt={chosen.last_logged_at}
                    size={38}
                    variant="face"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-bold leading-tight">
                      {chosen.display_name}
                    </p>
                    <p className="micro truncate">
                      @{chosen.username} · {chosen.places_logged}{" "}
                      {chosen.places_logged === 1 ? "place" : "places"}
                      {!!chosen.og_oinks && ` · ${chosen.og_oinks} og`} ·{" "}
                      {TIER_LABELS[fatnessTier(chosen.places_logged, chosen.last_logged_at)].toLowerCase()}
                    </p>
                  </div>
                  <Link href={`/profile/${chosen.username}`} className="btn-primary shrink-0 text-xs">
                    visit
                  </Link>
                </>
              ) : (
                <p className="micro w-full text-center">tap a pig to see who it is</p>
              )}
            </div>
          </>
        )}
      </main>

      <TabBarSpacer />
      <BottomTabBar />
    </>
  );
}

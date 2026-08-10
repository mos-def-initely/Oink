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

/** Grass tufts and flowers, seeded once so the field doesn't reshuffle. */
function scenery() {
  const items: { x: number; y: number; kind: "tuft" | "flower"; c: string; r: number }[] = [];
  const cols = ["#E6D389", "#D8B5F7", "#F5BCC8", "#FFFDF6"];
  for (let i = 0; i < 120; i++) {
    const h = hash(`scenery-${i}`);
    items.push({
      x: (h % 1000) / 1000,
      y: ((h >> 10) % 1000) / 1000,
      kind: i % 3 === 0 ? "flower" : "tuft",
      c: cols[h % cols.length],
      r: ((h >> 20) % 28) - 14,
    });
  }
  return items;
}

export default function PigstyScreen({ initialUsers }: { initialUsers: User[] | null }) {
  const [users, setUsers] = useState<User[] | null>(initialUsers);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [scale, setScale] = useState(0.7);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const framed = useRef(false);

  const viewport = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; dist: number; scale: number; moved: boolean } | null>(null);

  useEffect(() => {
    api.users().then(setUsers).catch(() => {});
  }, []);

  const { spots, width: fieldW, height: fieldH } = useMemo(() => layout(users ?? []), [users]);
  const decor = useMemo(scenery, []);

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

  function clamp(next: { x: number; y: number }, s: number) {
    const box = viewport.current?.getBoundingClientRect();
    if (!box) return next;
    // Always keep at least a third of the field on screen, so it can't be
    // dragged into the void and lost.
    const slackX = box.width * 0.66;
    const slackY = box.height * 0.66;
    return {
      x: Math.min(slackX, Math.max(box.width - fieldW * s - slackX, next.x)),
      y: Math.min(slackY, Math.max(box.height - fieldH * s - slackY, next.y)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    gesture.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
      dist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0,
      scale,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];

    if (pts.length === 2 && gesture.current.dist > 0) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (gesture.current.scale * dist) / gesture.current.dist));
      setScale(next);
      gesture.current.moved = true;
      return;
    }

    const nx = e.clientX - gesture.current.x;
    const ny = e.clientY - gesture.current.y;
    if (Math.abs(nx - pan.x) + Math.abs(ny - pan.y) > 3) gesture.current.moved = true;
    setPan(clamp({ x: nx, y: ny }, scale));
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
  }

  /** A tap only selects if it wasn't the end of a drag. */
  function pick(id: string) {
    if (gesture.current?.moved) return;
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
                {decor.map((d, i) =>
                  d.kind === "tuft" ? (
                    <svg
                      key={i}
                      viewBox="0 0 14 10"
                      className="pointer-events-none absolute h-2.5 w-3.5 opacity-80"
                      style={{ left: d.x * fieldW, top: d.y * fieldH, transform: `rotate(${d.r}deg)` }}
                    >
                      <path d="M2 10 Q3 3 5 1 M7 10 Q7 2 8 0 M12 10 Q11 3 9 1"
                        fill="none" stroke="#7FA366" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg
                      key={i}
                      viewBox="0 0 20 20"
                      className="pointer-events-none absolute h-3 w-3"
                      style={{ left: d.x * fieldW, top: d.y * fieldH }}
                    >
                      {PETALS.map(([px, py], k) => (
                        <circle key={k} cx={px} cy={py} r="3.6"
                          fill={d.c} stroke="#4D303F" strokeWidth="1.5" />
                      ))}
                      <circle cx="10" cy="10" r="2.4" fill="#CFA51F" />
                    </svg>
                  )
                )}

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

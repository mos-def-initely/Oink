"use client";

/**
 * Profile — spec §6.5. Along with the feed, this is one of only two places
 * that show the full-body pig; everywhere else uses the face.
 */
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { PlaceSummary, User } from "@/lib/types";
import {
  TIER_LABELS,
  PIG_ACCESSORIES,
  PIG_BACKGROUNDS,
  PIG_COLORS,
  PIG_HATS,
  daysUntilDecay,
  fatnessTier,
  nextTier,
  normalisePig,
} from "@/lib/pig";
import PigAvatar from "@/components/pigs/PigAvatar";
import PlaceListCard from "@/components/PlaceListCard";
import BottomTabBar, { TabBarSpacer } from "@/components/BottomTabBar";
import { EmptyState, PageHeader, Sheet, Spinner } from "@/components/ui";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [places, setPlaces] = useState<PlaceSummary[] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.user(username).then(setUser).catch((e) => setError(e.message));
    api.userPlaces(username).then(setPlaces).catch(() => setPlaces([]));
    api.me().then(setMe).catch(() => setMe(null));
  }, [username]);

  useEffect(load, [load]);

  if (error) return <EmptyState title="No such pig" body={error} />;
  if (!user) return <Spinner />;

  const isMe = me?.id === user.id;
  const tier = fatnessTier(user.places_logged, user.last_logged_at);
  const tierLabel = TIER_LABELS[tier];
  const next = nextTier(user.places_logged);
  const dead = tier === "dead";
  const decayDays = daysUntilDecay(user.places_logged, user.last_logged_at);

  return (
    <>
      <PageHeader
        title={isMe ? "You" : user.display_name}
        right={
          isMe ? (
            <button
              onClick={async () => {
                await api.logout();
                window.location.href = "/sign-in";
              }}
              className="btn bg-cream px-3 py-2 text-xs shadow-soft"
            >
              Sign out
            </button>
          ) : undefined
        }
      />

      <main className="space-y-4 px-3 pb-4">
        <section className="card flex flex-col items-center gap-2 p-4">
          <PigAvatar
            config={user.pig_avatar_config}
            placesLogged={user.places_logged}
            lastLoggedAt={user.last_logged_at}
            size={120}
            variant="full"
          />
          <h2 className="text-2xl leading-tight">{user.display_name}</h2>
          <p className="font-display text-sm text-ink-soft">@{user.username}</p>

          <div className="flex items-center gap-2 pt-1">
            <span className="tag bg-teal-pale text-teal-ink">
              {user.places_logged} {user.places_logged === 1 ? "place" : "places"}
            </span>
            <span className={`tag shadow-pop ${dead ? "bg-ink text-white" : "bg-coral text-white"}`}>
              {dead ? "Dead Pig" : `${tierLabel} pig`}
            </span>
          </div>

          {/* A dead pig needs the way out spelled out; a live one needs to know
              what it's about to lose, which the place count alone never says. */}
          {dead ? (
            <p className="text-center text-xs font-bold text-ink-soft">
              Feed to revive — log anywhere and {isMe ? "your" : "their"} pig comes straight back.
            </p>
          ) : (
            <>
              {next && (
                <p className="text-center text-xs text-ink-soft">
                  {next.needed} more {next.needed === 1 ? "place" : "places"} until you're a{" "}
                  {next.label.toLowerCase()} pig.
                </p>
              )}
              {decayDays !== null && decayDays <= 3 && (
                <p className="text-center text-xs font-bold text-tangerine">
                  {decayDays === 0
                    ? "Losing a tier today — log somewhere."
                    : `Drops a tier in ${decayDays} ${decayDays === 1 ? "day" : "days"}.`}
                </p>
              )}
            </>
          )}

          {isMe && (
            <div className="flex w-full gap-2 pt-2">
              <button onClick={() => setEditOpen(true)} className="btn-secondary flex-1 text-sm">
                Customise pig
              </button>
              <Link href="/profile/me/wishlist" className="btn-plain flex-1 text-center text-sm">
                Wishlist
              </Link>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="px-1 text-lg">
            {isMe ? "Places you've logged" : `${user.display_name}'s places`}
          </h3>
          {!places && <Spinner label="Loading…" />}
          {places?.length === 0 && (
            <EmptyState
              title="Nothing logged yet"
              body={isMe ? "Go find somewhere on Discover." : undefined}
            />
          )}
          {places?.map((p) => (
            <PlaceListCard key={p.id} place={p} />
          ))}
        </section>
      </main>

      <TabBarSpacer />
      <BottomTabBar />

      {isMe && (
        <PigCustomiser
          open={editOpen}
          onClose={() => setEditOpen(false)}
          user={user}
          onSaved={(updated) => {
            setUser(updated);
            setEditOpen(false);
          }}
        />
      )}
    </>
  );
}

function PigCustomiser({
  open,
  onClose,
  user,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
  onSaved: (u: User) => void;
}) {
  const [cfg, setCfg] = useState(normalisePig(user.pig_avatar_config));
  const [displayName, setDisplayName] = useState(user.display_name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCfg(normalisePig(user.pig_avatar_config));
      setDisplayName(user.display_name);
    }
  }, [open, user]);

  async function save() {
    setSaving(true);
    try {
      onSaved(
        await api.updateMe({
          display_name: displayName.trim() || user.display_name,
          pig_avatar_config: cfg,
        })
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Your pig">
      <div className="space-y-4 pb-4">
        <div className="flex justify-center">
          <PigAvatar
            config={cfg}
            placesLogged={user.places_logged}
            lastLoggedAt={user.last_logged_at}
            size={130}
            variant="full"
          />
        </div>

        <label className="block">
          <span className="font-display text-sm font-bold">Display name</span>
          <input className="field mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>

        <Picker
          label="Colour"
          options={Object.keys(PIG_COLORS)}
          value={cfg.color}
          onChange={(v) => setCfg({ ...cfg, color: v })}
          swatch={(v) => PIG_COLORS[v].mid}
        />
        <Picker
          label="Background"
          options={Object.keys(PIG_BACKGROUNDS)}
          value={cfg.background}
          onChange={(v) => setCfg({ ...cfg, background: v })}
          swatch={(v) => PIG_BACKGROUNDS[v]}
        />
        <Picker
          label="Hat"
          options={[...PIG_HATS]}
          value={cfg.hat}
          onChange={(v) => setCfg({ ...cfg, hat: v })}
          format={(v) => (v === "tophat" ? "Top hat" : v)}
        />
        <Picker
          label="Accessory"
          options={[...PIG_ACCESSORIES]}
          value={cfg.accessory}
          onChange={(v) => setCfg({ ...cfg, accessory: v })}
        />

        <button onClick={save} className="btn-primary w-full text-lg" disabled={saving}>
          {saving ? "Saving…" : "Save pig"}
        </button>
      </div>
    </Sheet>
  );
}

function Picker({
  label,
  options,
  value,
  onChange,
  swatch,
  format,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  swatch?: (v: string) => string;
  /** For values whose raw name doesn't read well capitalised on its own. */
  format?: (v: string) => string;
}) {
  return (
    <section>
      <p className="mb-1.5 font-display text-sm font-bold">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`tag capitalize ${value === opt ? "bg-coral text-white shadow-pop" : ""}`}
          >
            {swatch && (
              <span
                className="inline-block h-3.5 w-3.5 rounded-full"
                style={{ background: swatch(opt) }}
              />
            )}
            {format ? format(opt) : opt}
          </button>
        ))}
      </div>
    </section>
  );
}

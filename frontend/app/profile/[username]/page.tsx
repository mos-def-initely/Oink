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
  FATNESS_TIERS,
  PIG_ACCESSORIES,
  PIG_BACKGROUNDS,
  PIG_HATS,
  PIG_SPECIES,
  SPECIES_COLORS,
  SPECIES_DEFAULT_COLOR,
  SPECIES_LABELS,
  Species,
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
  const tier = fatnessTier(user.places_logged);
  const tierLabel = FATNESS_TIERS.find((t) => t.tier === tier)?.label ?? "";
  const next = nextTier(user.places_logged);

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
              className="btn bg-cream px-3 py-2 text-xs"
            >
              Sign out
            </button>
          ) : undefined
        }
      />

      <main className="space-y-4 px-3 pb-4">
        {/* Lemon is used on exactly two surfaces — here and empty states —
            where there's no photography for it to fight. */}
        <section className="flex flex-col items-center gap-2 rounded-card border-2 border-ink bg-lemon p-4">
          <PigAvatar
            config={user.pig_avatar_config}
            placesLogged={user.places_logged}
            size={120}
            variant="full"
          />
          <h2 className="text-2xl leading-tight">{user.display_name}</h2>
          <p className="micro">@{user.username}</p>

          <div className="rule-dashed my-1 w-3/5" />

          <div className="flex items-center gap-2">
            <span className="sticker bg-cream text-ink">
              {user.places_logged} {user.places_logged === 1 ? "place" : "places"}
            </span>
            <span className="sticker bg-plum text-oat">{tierLabel.toLowerCase()}</span>
          </div>

          {next && (
            <p className="micro text-center">
              {next.needed} more until {next.label.toLowerCase()}
            </p>
          )}

          {isMe && (
            <div className="flex w-full gap-2 pt-2">
              <button onClick={() => setEditOpen(true)} className="btn-primary flex-1 text-sm">
                Customise
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
    <Sheet open={open} onClose={onClose} title="Your animal">
      <div className="space-y-4 pb-4">
        <div className="flex justify-center">
          <PigAvatar config={cfg} placesLogged={user.places_logged} size={130} variant="full" />
        </div>

        <label className="block">
          <span className="font-display text-sm font-bold">Display name</span>
          <input className="field mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>

        <section>
          <p className="mb-1.5 font-display text-sm font-bold">Animal</p>
          <div className="flex gap-2">
            {PIG_SPECIES.map((sp) => (
              <button
                key={sp}
                onClick={() =>
                  // Coats are per-species, so carry the colour over only if the
                  // new animal has it; otherwise take its default.
                  setCfg({
                    ...cfg,
                    species: sp,
                    color: SPECIES_COLORS[sp as Species][cfg.color]
                      ? cfg.color
                      : SPECIES_DEFAULT_COLOR[sp as Species],
                  })
                }
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 border-ink p-2 ${
                  cfg.species === sp ? "bg-plum text-oat" : "bg-cream text-ink"
                }`}
              >
                <PigAvatar config={{ ...cfg, species: sp }} placesLogged={user.places_logged} size={46} variant="full" />
                <span className="micro" style={{ color: cfg.species === sp ? "#F4EEDC" : undefined }}>
                  {SPECIES_LABELS[sp as Species]}
                </span>
              </button>
            ))}
          </div>
          <p className="micro mt-1.5">Pig by default — boar and hog are opt-in</p>
        </section>

        <Picker
          label="Coat"
          options={Object.keys(SPECIES_COLORS[cfg.species as Species])}
          value={cfg.color}
          onChange={(v) => setCfg({ ...cfg, color: v })}
          swatch={(v) => SPECIES_COLORS[cfg.species as Species][v].mid}
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
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  swatch?: (v: string) => string;
}) {
  return (
    <section>
      <p className="mb-1.5 font-display text-sm font-bold">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`tag capitalize ${value === opt ? "bg-plum text-oat" : ""}`}
          >
            {swatch && (
              <span
                className="inline-block h-3.5 w-3.5 rounded-full"
                style={{ background: swatch(opt) }}
              />
            )}
            {opt}
          </button>
        ))}
      </div>
    </section>
  );
}

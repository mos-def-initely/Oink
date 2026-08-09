"use client";

/**
 * Add-place flow — spec §6.3, revised.
 *
 * A Google Maps link is **optional**. There are three ways to place a pin:
 *   1. search by name (keyless, via the backend's place search)
 *   2. use your current location
 *   3. drop a pin on the map
 * Pasting a Maps link is a fourth shortcut, and whenever a link or a search
 * result resolves, the pin drops automatically at that spot.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { BUDGETS, Budget } from "@/lib/pig";
import { BudgetTag } from "@/components/pigs/PricePig";
import CategoryPicker from "@/components/CategoryPicker";
import { ErrorNote, KIND_LABELS, Sheet } from "@/components/ui";
import type { Kind, PlaceCandidate } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  pickedPoint: { lat: number; lng: number } | null;
  onRequestPick: () => void;
  onPointResolved: (lat: number, lng: number) => void;
  onCreated: () => void;
};

export default function AddPlaceSheet({
  open,
  onClose,
  pickedPoint,
  onRequestPick,
  onPointResolved,
  onCreated,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("restaurant");
  const [category, setCategory] = useState<string[]>([]);
  const [budget, setBudget] = useState<Budget>("$$");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [link, setLink] = useState("");
  const [showLink, setShowLink] = useState(false);

  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // Set once a location is pinned, which also suppresses further name search.
  const [located, setLocated] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
  }, [open]);

  // A pin dropped on the map counts as locating the place.
  useEffect(() => {
    if (pickedPoint) setLocated(true);
  }, [pickedPoint]);

  // Type-ahead place search — skipped once we already have a location.
  useEffect(() => {
    if (!open || located || name.trim().length < 3) {
      setResults([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await api.searchPlaces(name.trim()));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [name, open, located]);

  function choose(c: PlaceCandidate) {
    setName(c.name);
    if (c.address) setAddress(c.address);
    if (c.city) setCity(c.city);
    if (c.area) setArea(c.area);
    setResults([]);
    setLocated(true);
    onPointResolved(c.lat, c.lng);   // drops the pin automatically
    setNote("Pin dropped — nudge it on the map if it's off.");
  }

  async function useCurrentLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("This browser won't share a location — search or drop a pin instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocated(true);
        onPointResolved(pos.coords.latitude, pos.coords.longitude);
        setNote("Using your current location.");
      },
      () => setError("Couldn't get your location — search or drop a pin instead.")
    );
  }

  async function autofillFromLink() {
    const url = link.trim();
    if (!url) return;
    setParsing(true);
    setError(null);
    setNote(null);
    try {
      const parsed = await api.parseMapsLink(url);
      if (!parsed.resolved) {
        setNote("Couldn't read that link — try searching the name instead.");
        return;
      }
      if (parsed.name) setName(parsed.name);
      if (parsed.address) setAddress(parsed.address);
      if (parsed.city) setCity(parsed.city);
      if (parsed.area) setArea(parsed.area);
      if (parsed.lat != null && parsed.lng != null) {
        setLocated(true);
        onPointResolved(parsed.lat, parsed.lng);  // drops the pin automatically
        setNote("Autofilled from the link — pin dropped, check it over.");
      } else {
        setNote("Got the name from the link, but not a location — drop a pin.");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't read that link");
    } finally {
      setParsing(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give it a name.");
      return;
    }
    if (!pickedPoint) {
      setError("Pick a location — search the name, use your current spot, or drop a pin.");
      return;
    }

    setSaving(true);
    try {
      const place = await api.createPlace({
        name: name.trim(),
        kind,
        category,
        budget,
        lat: pickedPoint.lat,
        lng: pickedPoint.lng,
        google_maps_url: link.trim() || null,
        address: address || null,
        city: city || null,
        area: area || null,
      });
      onCreated();
      router.push(`/restaurant/${place.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save that");
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add a place">
      <form onSubmit={submit} className="space-y-4 pb-4">
        {/* Name + type-ahead search */}
        <section className="space-y-2">
          <label className="block font-display text-sm font-bold">What's it called?</label>
          <input
            className="field"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setLocated(false);   // typing again means re-searching
            }}
            placeholder="Start typing to search…"
            required
          />
          {searching && <p className="text-xs text-ink-soft">Searching…</p>}
          {results.length > 0 && (
            <ul className="overflow-hidden rounded-xl bg-cream shadow-lift">
              {results.map((c, i) => (
                <li key={`${c.lat}-${c.lng}-${i}`}>
                  <button
                    type="button"
                    onClick={() => choose(c)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-apricot"
                  >
                    <span className="block text-sm font-bold">{c.name}</span>
                    {c.address && (
                      <span className="block truncate text-xs text-ink-soft">{c.address}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Location */}
        <section className="space-y-2">
          <p className="font-display text-sm font-bold">Where is it?</p>
          <div className="flex gap-2">
            <button type="button" onClick={useCurrentLocation} className="btn-secondary flex-1 text-sm">
              I'm here now
            </button>
            <button type="button" onClick={onRequestPick} className="btn-plain flex-1 text-sm">
              Drop a pin
            </button>
          </div>
          {pickedPoint ? (
            <p className="rounded-lg bg-teal-pale px-3 py-2 text-xs font-bold text-teal-ink">
              Pin dropped at {pickedPoint.lat.toFixed(4)}, {pickedPoint.lng.toFixed(4)}
            </p>
          ) : (
            <p className="text-xs text-ink-soft">
              Pick a result above, use your location, or drop a pin.
            </p>
          )}
          {note && <p className="rounded-lg bg-apricot-deep px-3 py-2 text-xs">{note}</p>}
        </section>

        {/* Optional Google Maps link */}
        <section className="space-y-2">
          {!showLink ? (
            <button
              type="button"
              onClick={() => setShowLink(true)}
              className="text-sm font-bold text-coral underline underline-offset-2"
            >
              Or paste a Google Maps link (optional)
            </button>
          ) : (
            <>
              <label className="block font-display text-sm font-bold">
                Google Maps link <span className="font-normal text-ink-soft">— optional</span>
              </label>
              <input
                className="field"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onBlur={autofillFromLink}
                placeholder="Paste a Google Maps link…"
                inputMode="url"
              />
              <button
                type="button"
                onClick={autofillFromLink}
                className="btn-plain w-full text-sm"
                disabled={parsing || !link.trim()}
              >
                {parsing ? "Reading…" : "Autofill from link"}
              </button>
            </>
          )}
        </section>

        {/* Details */}
        <section className="space-y-3">
          <div className="flex gap-2">
            {(["restaurant", "bar", "cafe"] as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setCategory([]);
                }}
                className={`btn flex-1 text-xs ${
                  kind === k ? "bg-coral text-white shadow-pop" : "bg-cream shadow-soft"
                }`}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-1.5 font-display text-sm font-bold">
              {kind === "bar" ? "What kind of bar?" : "Cuisine"}
            </p>
            <CategoryPicker kind={kind} value={category} onChange={setCategory} />
          </div>

          <div>
            <p className="mb-1.5 font-display text-sm font-bold">How pricey?</p>
            <div className="grid grid-cols-4 gap-1.5">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  className={`btn flex items-center justify-center px-1 py-2 ${
                    budget === b ? "bg-butter" : "bg-cream shadow-soft"
                  }`}
                >
                  <BudgetTag budget={b} size={30} />
                </button>
              ))}
            </div>
          </div>

          <input
            className="field"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address (optional)"
          />
          <div className="flex gap-2">
            <input
              className="field flex-1"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
            />
            <input
              className="field flex-1"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Area"
            />
          </div>
        </section>

        {error && <ErrorNote message={error} />}

        <button type="submit" className="btn-primary w-full text-lg" disabled={saving}>
          {saving ? "Saving…" : "Add it"}
        </button>
      </form>
    </Sheet>
  );
}

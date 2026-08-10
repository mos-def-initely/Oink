/**
 * Pig system — spec §9.
 *
 * Two families, both drawn in the "Vinyl Toy" style: glossy gradient shading,
 * no outlines, upright bipedal stance.
 *  - the user avatar pig (customisable; gains belly rolls as you log places)
 *  - the price-tier pig (fixed set of four)
 *
 * Anatomy rule: every limb is drawn *before* the torso so the torso covers the
 * joint, and the head overlaps the torso top. Nothing floats, and the tail sits
 * on the lower back well clear of the arms.
 */

export type FatnessTier = "dead" | "slim" | "regular" | "chubby" | "fat" | "hunky";

export const FATNESS_TIERS: { tier: FatnessTier; min: number; label: string }[] = [
  { tier: "slim", min: 0, label: "Slim" },
  { tier: "regular", min: 5, label: "Regular" },
  { tier: "chubby", min: 10, label: "Chubby" },
  { tier: "fat", min: 15, label: "Fat" },
  // The top of the ladder turns the corner: eat enough and the pig comes out
  // the other side built rather than bigger.
  { tier: "hunky", min: 20, label: "Hunky" },
];

/** Worst to best. Decay walks down this, and it bottoms out at the dead pig. */
export const TIER_ORDER: FatnessTier[] = ["dead", "slim", "regular", "chubby", "fat", "hunky"];

export const TIER_LABELS: Record<FatnessTier, string> = {
  dead: "Dead Pig",
  slim: "Slim",
  regular: "Regular",
  chubby: "Chubby",
  fat: "Fat",
  hunky: "Hunky",
};

/** How long idleness costs a tier. A fortnight, not a week — a friend
 *  group can easily go a month without eating out, and weekly decay killed a
 *  maxed-out pig in four. */
const DECAY_MS = 14 * 24 * 60 * 60 * 1000;

/** Tier from count alone, before any decay is applied. */
export function baseTier(placesLogged: number): FatnessTier {
  let current: FatnessTier = "slim";
  for (const t of FATNESS_TIERS) {
    if (placesLogged >= t.min) current = t.tier;
  }
  return current;
}

/** Whole decay periods elapsed since the last logged place. 0 if never. */
export function idlePeriods(lastLoggedAt?: string | null, now: number = Date.now()): number {
  if (!lastLoggedAt) return 0;
  const then = new Date(lastLoggedAt).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((now - then) / DECAY_MS));
}

/**
 * The pig you actually get: earned tier, minus one step for every fortnight gone
 * by without logging anywhere, floored at the dead pig.
 *
 * Someone who has never logged anything doesn't rot — they start slim and stay
 * there until they log something, which is what starts the clock.
 */
export function fatnessTier(
  placesLogged: number,
  lastLoggedAt?: string | null,
  now: number = Date.now()
): FatnessTier {
  const index = TIER_ORDER.indexOf(baseTier(placesLogged));
  const decayed = index - idlePeriods(lastLoggedAt, now);
  return TIER_ORDER[Math.max(0, decayed)];
}

/** Days until the next tier is lost, or null when there's nothing left to lose. */
export function daysUntilDecay(
  placesLogged: number,
  lastLoggedAt?: string | null,
  now: number = Date.now()
): number | null {
  if (!lastLoggedAt) return null;
  if (fatnessTier(placesLogged, lastLoggedAt, now) === "dead") return null;
  const elapsed = now - new Date(lastLoggedAt).getTime();
  if (Number.isNaN(elapsed)) return null;
  return Math.max(0, Math.ceil((DECAY_MS - (elapsed % DECAY_MS)) / (24 * 60 * 60 * 1000)));
}

export function nextTier(placesLogged: number): { label: string; needed: number } | null {
  for (const t of FATNESS_TIERS) {
    if (placesLogged < t.min) return { label: t.label, needed: t.min - placesLogged };
  }
  return null;
}

/**
 * Per-tier build. `waist` is the torso half-width, `rolls` how many belly folds
 * are drawn, `head` the head radius. Fattening adds folds and pushes the arms
 * outward rather than just stretching the silhouette sideways.
 */
export type TierShape = {
  /** Half-width of the body ellipse — the whole silhouette hangs off this. */
  waist: number;
  /** Belly folds drawn as creases. Kept for the lean tiers only. */
  rolls: number;
  head: number;
  /** Chest fat, 0-1. Sits above the gut with a crease under it. */
  moobs?: number;
  /** Gut volume, 0-1. One big overhang rather than a ladder of stripes. */
  belly?: number;
  /** A second jaw under the first. */
  chin?: boolean;
  /** Draws pecs and abs instead of fat — the top of the ladder only. */
  muscle?: boolean;
};

export const TIER_SHAPE: Record<FatnessTier, TierShape> = {
  // Gaunt, and drawn drained of colour with X'd eyes (see PigAvatar).
  dead: { waist: 17, rolls: 0, head: 22 },
  slim: { waist: 20, rolls: 0, head: 24.5 },
  regular: { waist: 25, rolls: 1, head: 26, belly: 0.5 },
  chubby: { waist: 30, rolls: 0, head: 27.5, moobs: 0.68, belly: 0.8, chin: true },
  // Fat is volume, not stripes: chest and gut both full, and a second chin.
  fat: { waist: 35, rolls: 0, head: 29, moobs: 1.1, belly: 1, chin: true },
  // Broad, but the width sits in the chest rather than the gut.
  hunky: { waist: 32, rolls: 0, head: 27, muscle: true },
};

// --- Avatar customisation (spec §9.1) -------------------------------------

export type PigPalette = {
  light: string;
  mid: string;
  dark: string;
  ear: string;
  snout: string;
  nostril: string;
  blush: string;
};

export const PIG_COLORS: Record<string, PigPalette> = {
  pink:    { light: "#FCD8DF", mid: "#F5BCC8", dark: "#E3A2B0", ear: "#EFAAB8", snout: "#EDA0B0", nostril: "#7A4450", blush: "#F08FA6" },
  rose:    { light: "#FFC9C9", mid: "#F3A3A6", dark: "#DC8489", ear: "#EC9498", snout: "#EA9195", nostril: "#7A3E44", blush: "#F0808C" },
  peach:   { light: "#FFDCC2", mid: "#F7BE99", dark: "#E0A177", ear: "#F1AE86", snout: "#EFAB82", nostril: "#8A543A", blush: "#F09A76" },
  cocoa:   { light: "#E8C4AE", mid: "#D2A183", dark: "#B58165", ear: "#C79274", snout: "#C48E70", nostril: "#6E442F", blush: "#D08A6A" },
  slate:   { light: "#DCDCE8", mid: "#BCBCD0", dark: "#9C9CB4", ear: "#ACACC2", snout: "#A8A8BE", nostril: "#4E4E66", blush: "#B79ACB" },
  butter:  { light: "#FBEBBE", mid: "#F0D68F", dark: "#D8BB6A", ear: "#E6C97E", snout: "#E4C67A", nostril: "#8A6F26", blush: "#E0B57A" },
  mint:    { light: "#D3EEDA", mid: "#AEDCBB", dark: "#8CC29C", ear: "#9DD1AC", snout: "#9ACEA9", nostril: "#4A7A56", blush: "#A8CFA0" },
  lilacpig:{ light: "#E8D6FA", mid: "#CDB0EC", dark: "#B192D6", ear: "#C0A0E2", snout: "#BD9CE0", nostril: "#5B3E84", blush: "#C994D8" },
};


export const PIG_BACKGROUNDS: Record<string, string> = {
  oat:    "#F4EEDC",
  gold:   "#F6EDC8",
  lemon:  "#E6D389",
  plum:   "#D9BAC0",
  lilac:  "#EFE2FF",
  cream:  "#FFFDF6",
};

export const PIG_HATS = ["none", "cap", "beret", "bucket", "party", "crown", "chef", "tophat"] as const;

/**
 * Hats that sit down over the ears. A party cone and a crown perch between
 * them, so those two leave the ears showing.
 */
export const EAR_COVERING_HATS = new Set(["cap", "beret", "bucket", "chef", "tophat"]);

export function hidesEars(hat: string | undefined): boolean {
  return !!hat && EAR_COVERING_HATS.has(hat);
}

// Accessories are hers: the rebuilt pig draws blush and a scarf, and offering
// options the art can't render would be a menu of no-ops.
export const PIG_ACCESSORIES = ["none", "blush", "scarf", "sunglasses"] as const;

export type PigConfig = {
  color?: string;
  hat?: string;
  accessory?: string;
  background?: string;
};

export const DEFAULT_PIG: Required<PigConfig> = {
  color: "pink",
  hat: "none",
  accessory: "none",
  background: "oat",
};

export function normalisePig(config: PigConfig | undefined | null): Required<PigConfig> {
  const c = config ?? {};
  return {
    color: c.color && PIG_COLORS[c.color] ? c.color : DEFAULT_PIG.color,
    hat: c.hat ?? DEFAULT_PIG.hat,
    accessory: c.accessory ?? DEFAULT_PIG.accessory,
    background:
      c.background && PIG_BACKGROUNDS[c.background] ? c.background : DEFAULT_PIG.background,
  };
}

// --- Price tiers (spec §9.2) ----------------------------------------------

export type Budget = "$" | "$$" | "$$$" | "$$$$";

export const BUDGETS: Budget[] = ["$", "$$", "$$$", "$$$$"];

export const BUDGET_LABELS: Record<Budget, string> = {
  $: "Peasant",
  $$: "Casual",
  $$$: "Smart",
  $$$$: "Posh",
};

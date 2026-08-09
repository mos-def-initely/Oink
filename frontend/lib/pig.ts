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

export type FatnessTier = "dead" | "slim" | "regular" | "chubby" | "fat";

export const FATNESS_TIERS: { tier: FatnessTier; min: number; label: string }[] = [
  { tier: "slim", min: 0, label: "Slim" },
  { tier: "regular", min: 5, label: "Regular" },
  { tier: "chubby", min: 15, label: "Chubby" },
  { tier: "fat", min: 30, label: "Fat" },
];

/** Worst to best. Decay walks down this, and it bottoms out at the dead pig. */
export const TIER_ORDER: FatnessTier[] = ["dead", "slim", "regular", "chubby", "fat"];

export const TIER_LABELS: Record<FatnessTier, string> = {
  dead: "Dead Pig",
  slim: "Slim",
  regular: "Regular",
  chubby: "Chubby",
  fat: "Fat",
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Tier from count alone, before any decay is applied. */
export function baseTier(placesLogged: number): FatnessTier {
  let current: FatnessTier = "slim";
  for (const t of FATNESS_TIERS) {
    if (placesLogged >= t.min) current = t.tier;
  }
  return current;
}

/** Whole weeks since the last logged place. 0 if they've never logged one. */
export function idleWeeks(lastLoggedAt?: string | null, now: number = Date.now()): number {
  if (!lastLoggedAt) return 0;
  const then = new Date(lastLoggedAt).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((now - then) / WEEK_MS));
}

/**
 * The pig you actually get: earned tier, minus one step for every week gone by
 * without logging anywhere, floored at the dead pig.
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
  const decayed = index - idleWeeks(lastLoggedAt, now);
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
  return Math.max(0, Math.ceil((WEEK_MS - (elapsed % WEEK_MS)) / (24 * 60 * 60 * 1000)));
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
export type TierShape = { waist: number; rolls: number; head: number; chin: boolean };

export const TIER_SHAPE: Record<FatnessTier, TierShape> = {
  // Gaunt: narrower than slim, and drawn greyed with X'd eyes (see PigAvatar).
  dead: { waist: 15, rolls: 0, head: 22.5, chin: false },
  slim: { waist: 20, rolls: 0, head: 24.5, chin: false },
  regular: { waist: 25, rolls: 1, head: 26, chin: false },
  chubby: { waist: 30, rolls: 2, head: 27.5, chin: true },
  fat: { waist: 35, rolls: 3, head: 29, chin: true },
};

// --- Avatar customisation (spec §9.1) -------------------------------------

export type PigPalette = {
  light: string;
  mid: string;
  dark: string;
  limb: string;
  snout: string;
  nostril: string;
};

export const PIG_COLORS: Record<string, PigPalette> = {
  pink:    { light: "#FFC9D6", mid: "#FC9FB8", dark: "#DE7595", limb: "#EE8CA8", snout: "#F291AF", nostril: "#B05377" },
  rose:    { light: "#FFB8B8", mid: "#F98E90", dark: "#D9686D", limb: "#EC7C80", snout: "#EE8084", nostril: "#A9484F" },
  peach:   { light: "#FFD6B8", mid: "#FBB183", dark: "#DE8B5C", limb: "#F09E70", snout: "#F0A276", nostril: "#A96341" },
  clay:    { light: "#EAC0A6", mid: "#D69C7C", dark: "#B67A59", limb: "#C78C6B", snout: "#CE9070", nostril: "#8A583C" },
  lilac:   { light: "#E2CCFF", mid: "#C4A3F0", dark: "#A07FD1", limb: "#B392E2", snout: "#B995E4", nostril: "#7A57A3" },
  mintpig: { light: "#BFF0D6", mid: "#93DBB4", dark: "#6BB891", limb: "#82CBA2", snout: "#8AD0A8", nostril: "#4E8B69" },
  butter:  { light: "#FFE9AE", mid: "#F7CE72", dark: "#D9AC4C", limb: "#EDBE60", snout: "#EFC163", nostril: "#A67D2E" },
  sky:     { light: "#C2E4FF", mid: "#95C7F5", dark: "#6DA3D6", limb: "#83B7E6", snout: "#8ABBE8", nostril: "#4E7BA5" },
};

/**
 * A drained version of a palette: the same hue, most of the blood gone.
 *
 * Not greyscale — a dead pig should still be recognisably the colour its owner
 * picked, so each channel is pulled most of the way toward its own luminance
 * and then lifted, which washes the colour out without discarding the hue.
 */
export function palePalette(p: PigPalette): PigPalette {
  const wash = (hex: string): string => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const drain = (c: number) =>
      Math.round(Math.max(0, Math.min(255, (c * 0.55 + lum * 0.45) * 0.96 + 15)));
    return `#${[drain(r), drain(g), drain(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  };
  return {
    light: wash(p.light),
    mid: wash(p.mid),
    dark: wash(p.dark),
    limb: wash(p.limb),
    snout: wash(p.snout),
    nostril: wash(p.nostril),
  };
}

export const PIG_BACKGROUNDS: Record<string, string> = {
  apricot: "#FFE8D6",
  coral: "#FFD3DA",
  teal: "#CFF0EB",
  butter: "#FFEFC2",
  lilac: "#E7DBFF",
  cream: "#FFF6EE",
};

export const PIG_HATS = ["none", "cap", "beret", "bucket", "party", "crown", "chef"] as const;
export const PIG_ACCESSORIES = ["none", "sunglasses", "scarf", "blush", "tote"] as const;

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
  background: "apricot",
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

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

export type FatnessTier = "slim" | "regular" | "chubby" | "round";

export const FATNESS_TIERS: { tier: FatnessTier; min: number; label: string }[] = [
  { tier: "slim", min: 0, label: "Slim" },
  { tier: "regular", min: 5, label: "Regular" },
  { tier: "chubby", min: 15, label: "Chubby" },
  { tier: "round", min: 30, label: "Round" },
];

export function fatnessTier(placesLogged: number): FatnessTier {
  let current: FatnessTier = "slim";
  for (const t of FATNESS_TIERS) {
    if (placesLogged >= t.min) current = t.tier;
  }
  return current;
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
  slim: { waist: 20, rolls: 0, head: 24.5, chin: false },
  regular: { waist: 25, rolls: 1, head: 26, chin: false },
  chubby: { waist: 30, rolls: 2, head: 27.5, chin: true },
  round: { waist: 35, rolls: 3, head: 29, chin: true },
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

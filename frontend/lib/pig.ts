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

/**
 * Avatar species. Pig is the default and nobody has to choose — but species is
 * the only avatar attribute still legible at 24px on a map pin, which is
 * exactly where telling friends apart matters.
 */
export const PIG_SPECIES = ["pig", "boar", "hog"] as const;
export type Species = (typeof PIG_SPECIES)[number];

export const SPECIES_LABELS: Record<Species, string> = {
  pig: "Pig",
  boar: "Boar",
  hog: "Hog",
};

/** Boar and hog have their own coats; the pig uses the customisable ones. */
export const SPECIES_PALETTE: Record<Exclude<Species, "pig">, PigPalette> = {
  boar: {
    light: "#9C7A5E", mid: "#7E6049", dark: "#5F4636",
    ear: "#6B513D", snout: "#54402F", nostril: "#241812", blush: "#8A6A50",
  },
  hog: {
    light: "#E8CDAE", mid: "#D3B08C", dark: "#B78F6B",
    ear: "#C39C77", snout: "#C09A76", nostril: "#6B4A34", blush: "#D0A98A",
  },
};

/** Boar and hog take a darker outline than the pig's warm pink-brown. */
export const SPECIES_OUTLINE: Record<Species, string> = {
  pig: "#8A5460",
  boar: "#3E2C22",
  hog: "#6B4A34",
};

export const PIG_HATS = ["none", "cap", "beret", "bucket", "party", "crown", "chef"] as const;
export const PIG_ACCESSORIES = ["none", "blush", "scarf"] as const;

export type PigConfig = {
  species?: string;
  color?: string;
  hat?: string;
  accessory?: string;
  background?: string;
};

export const DEFAULT_PIG: Required<PigConfig> = {
  species: "pig",
  color: "pink",
  hat: "none",
  accessory: "none",
  background: "oat",
};

export function normalisePig(config: PigConfig | undefined | null): Required<PigConfig> {
  const c = config ?? {};
  return {
    species: (PIG_SPECIES as readonly string[]).includes(c.species ?? "")
      ? (c.species as string)
      : DEFAULT_PIG.species,
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

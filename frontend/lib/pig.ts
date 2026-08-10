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
  /** Each coat carries its own line colour — one shared brown suited none of them. */
  outline: string;
};

export const PIG_COLORS: Record<string, PigPalette> = {
  pink:    { light: "#FCD8DF", mid: "#F5BCC8", dark: "#E3A2B0", ear: "#EFAAB8", snout: "#EDA0B0", nostril: "#8A5460", blush: "#F08FA6", outline: "#8A5460" },
  rose:    { light: "#FFC9C9", mid: "#F3A3A6", dark: "#DC8489", ear: "#EC9498", snout: "#EA9195", nostril: "#7A3E44", blush: "#F0808C", outline: "#8A4650" },
  peach:   { light: "#FFDCC2", mid: "#F7BE99", dark: "#E0A177", ear: "#F1AE86", snout: "#EFAB82", nostril: "#8A543A", blush: "#F09A76", outline: "#8A5A3C" },
  cocoa:   { light: "#E8C4AE", mid: "#D2A183", dark: "#B58165", ear: "#C79274", snout: "#C48E70", nostril: "#6E442F", blush: "#D08A6A", outline: "#6E4632" },
  slate:   { light: "#DCDCE8", mid: "#BCBCD0", dark: "#9C9CB4", ear: "#ACACC2", snout: "#A8A8BE", nostril: "#4E4E66", blush: "#B79ACB", outline: "#565672" },
  butter:  { light: "#FBEBBE", mid: "#F0D68F", dark: "#D8BB6A", ear: "#E6C97E", snout: "#E4C67A", nostril: "#8A6F26", blush: "#E0B57A", outline: "#8A7130" },
  mint:    { light: "#D3EEDA", mid: "#AEDCBB", dark: "#8CC29C", ear: "#9DD1AC", snout: "#9ACEA9", nostril: "#4A7A56", blush: "#A8CFA0", outline: "#4E7E5C" },
  lilacpig:{ light: "#E8D6FA", mid: "#CDB0EC", dark: "#B192D6", ear: "#C0A0E2", snout: "#BD9CE0", nostril: "#5B3E84", blush: "#C994D8", outline: "#63478C" },
};

/** Boar coats — bristly and dark; the tusks and mane carry the species read. */
export const BOAR_COLORS: Record<string, PigPalette> = {
  umber:    { light: "#9C7A5E", mid: "#7E6049", dark: "#5F4636", ear: "#6B513D", snout: "#54402F", nostril: "#241812", blush: "#8A6A50", outline: "#3E2C22" },
  charcoal: { light: "#7C7A78", mid: "#605E5D", dark: "#464544", ear: "#514F4E", snout: "#403E3D", nostril: "#1C1B1B", blush: "#6E6A68", outline: "#2A2928" },
  russet:   { light: "#B0764E", mid: "#945C3A", dark: "#75462B", ear: "#824F31", snout: "#6E3F26", nostril: "#3A1E10", blush: "#A06742", outline: "#4A2A18" },
  ginger:   { light: "#D69A63", mid: "#BC7C48", dark: "#9C6236", ear: "#A96C3D", snout: "#9A6134", nostril: "#5A3418", blush: "#C68A55", outline: "#5E3A1E" },
};

/** Hog coats — heavier, sandier, more farmyard than forest. */
export const HOG_COLORS: Record<string, PigPalette> = {
  sand:      { light: "#E8CDAE", mid: "#D3B08C", dark: "#B78F6B", ear: "#C39C77", snout: "#C09A76", nostril: "#6B4A34", blush: "#D0A98A", outline: "#6B4A34" },
  chocolate: { light: "#B08A6C", mid: "#946C50", dark: "#75513A", ear: "#835E44", snout: "#7E5940", nostril: "#3E2818", blush: "#A07A5C", outline: "#4A3122" },
  blush:     { light: "#F2D2CA", mid: "#DFB2A8", dark: "#C4948A", ear: "#D2A196", snout: "#CE9C92", nostril: "#7A4E46", blush: "#E0A398", outline: "#7A5048" },
  ash:       { light: "#DAD4CC", mid: "#BCB5AC", dark: "#9C958C", ear: "#ACA49A", snout: "#A79F95", nostril: "#4E4840", blush: "#C0A9A0", outline: "#5A544C" },
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

/** Every species is customisable — each just has its own set of coats. */
export const SPECIES_COLORS: Record<Species, Record<string, PigPalette>> = {
  pig: PIG_COLORS,
  boar: BOAR_COLORS,
  hog: HOG_COLORS,
};

export const SPECIES_DEFAULT_COLOR: Record<Species, string> = {
  pig: "pink",
  boar: "umber",
  hog: "sand",
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
  const species = ((PIG_SPECIES as readonly string[]).includes(c.species ?? "")
    ? c.species
    : DEFAULT_PIG.species) as Species;
  // Coats are per-species, so switching animal falls back to that animal's
  // default rather than leaving an unrenderable colour behind.
  const coats = SPECIES_COLORS[species];
  return {
    species,
    color: c.color && coats[c.color] ? c.color : SPECIES_DEFAULT_COLOR[species],
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

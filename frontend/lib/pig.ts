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

/**
 * One shared set of coats, available to every species. Naturalistic browns and
 * greys sit alongside the playful ones, so a mint boar and a lilac hog are as
 * possible as a pink pig — the species is the silhouette, the coat is taste.
 */
export const COAT_COLORS: Record<string, PigPalette> = {
  pink:      { light: "#FCD8DF", mid: "#F5BCC8", dark: "#E3A2B0", ear: "#EFAAB8", snout: "#EDA0B0", nostril: "#8A5460", blush: "#F08FA6", outline: "#8A5460" },
  rose:      { light: "#FFC9C9", mid: "#F3A3A6", dark: "#DC8489", ear: "#EC9498", snout: "#EA9195", nostril: "#7A3E44", blush: "#F0808C", outline: "#8A4650" },
  peach:     { light: "#FFDCC2", mid: "#F7BE99", dark: "#E0A177", ear: "#F1AE86", snout: "#EFAB82", nostril: "#8A543A", blush: "#F09A76", outline: "#8A5A3C" },
  butter:    { light: "#FBEBBE", mid: "#F0D68F", dark: "#D8BB6A", ear: "#E6C97E", snout: "#E4C67A", nostril: "#8A6F26", blush: "#E0B57A", outline: "#8A7130" },
  mint:      { light: "#D3EEDA", mid: "#AEDCBB", dark: "#8CC29C", ear: "#9DD1AC", snout: "#9ACEA9", nostril: "#4A7A56", blush: "#A8CFA0", outline: "#4E7E5C" },
  seafoam:   { light: "#CFE9EC", mid: "#A6D3D9", dark: "#82B5BD", ear: "#93C4CB", snout: "#8FC1C8", nostril: "#3E6A70", blush: "#9CC8C2", outline: "#446E76" },
  lilac:     { light: "#E8D6FA", mid: "#CDB0EC", dark: "#B192D6", ear: "#C0A0E2", snout: "#BD9CE0", nostril: "#5B3E84", blush: "#C994D8", outline: "#63478C" },
  slate:     { light: "#DCDCE8", mid: "#BCBCD0", dark: "#9C9CB4", ear: "#ACACC2", snout: "#A8A8BE", nostril: "#4E4E66", blush: "#B79ACB", outline: "#565672" },
  sand:      { light: "#E8CDAE", mid: "#D3B08C", dark: "#B78F6B", ear: "#C39C77", snout: "#C09A76", nostril: "#6B4A34", blush: "#D0A98A", outline: "#6B4A34" },
  cocoa:     { light: "#E8C4AE", mid: "#D2A183", dark: "#B58165", ear: "#C79274", snout: "#C48E70", nostril: "#6E442F", blush: "#D08A6A", outline: "#6E4632" },
  ginger:    { light: "#D69A63", mid: "#BC7C48", dark: "#9C6236", ear: "#A96C3D", snout: "#9A6134", nostril: "#5A3418", blush: "#C68A55", outline: "#5E3A1E" },
  umber:     { light: "#9C7A5E", mid: "#7E6049", dark: "#5F4636", ear: "#6B513D", snout: "#54402F", nostril: "#241812", blush: "#8A6A50", outline: "#3E2C22" },
  charcoal:  { light: "#7C7A78", mid: "#605E5D", dark: "#464544", ear: "#514F4E", snout: "#403E3D", nostril: "#1C1B1B", blush: "#6E6A68", outline: "#2A2928" },
};

/** Kept as an alias so nothing downstream has to care about the rename. */
export const PIG_COLORS = COAT_COLORS;

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

/** Every species draws from the same coats; only the starting point differs. */
export const SPECIES_COLORS: Record<Species, Record<string, PigPalette>> = {
  pig: COAT_COLORS,
  boar: COAT_COLORS,
  hog: COAT_COLORS,
};

export const SPECIES_DEFAULT_COLOR: Record<Species, string> = {
  pig: "pink",
  boar: "umber",
  hog: "sand",
};

export const PIG_HATS = [
  "none", "cap", "beret", "bucket", "party", "crown", "chef",
  "bandana", "flowers", "beanie", "pirate", "sunhat", "headphones", "viking",
  "flatcap", "wizard", "helmet",
] as const;
export const PIG_ACCESSORIES = ["none", "blush", "scarf"] as const;

/**
 * Costumes (spec §9.3). Club Penguin's memorable items were never garments, they
 * were characters — so three everyday tops sit alongside nine costumes.
 *
 * `hat` is the headwear each costume implies. Picking a costume fills an empty
 * hat slot with it but never overrides a hat already chosen: the slots stay
 * independent, and a viking helmet over a princess gown is a legitimate outcome.
 */
export const PIG_COSTUMES = [
  "none",
  "hoodie", "puffer", "dungarees",
  "princess", "pirate", "raver", "astronaut", "superhero", "ninja",
  "dinosaur", "rockstar", "chef",
] as const;
export type Costume = (typeof PIG_COSTUMES)[number];

export const COSTUME_LABELS: Record<Costume, string> = {
  none: "none", hoodie: "hoodie", puffer: "puffer", dungarees: "dungarees",
  princess: "princess", pirate: "pirate", raver: "raver", astronaut: "astronaut",
  superhero: "superhero", ninja: "ninja", dinosaur: "dinosaur",
  rockstar: "rockstar", chef: "chef",
};

/** The hat each costume suggests, applied only when the hat slot is empty. */
export const COSTUME_HAT: Partial<Record<Costume, string>> = {
  princess: "crown", pirate: "pirate", raver: "headphones", astronaut: "helmet",
  rockstar: "bandana", chef: "chef", dinosaur: "none",
};

/** Face items are their own slot so they stack with a hat. */
export const PIG_FACES = ["none", "shades", "specs", "monocle", "eyepatch", "moustache"] as const;

/**
 * Companions (spec §9.4) — the puffle role, and deliberately just the one. A
 * menagerie of pets dilutes the joke; the truffle is the thing a pig is actually
 * hunting, so it carries the slot alone. Its varieties are the real ones, which
 * means the variety picker doubles as the companion picker.
 */
export const PIG_COMPANIONS = ["none", "truffle"] as const;
export type Companion = (typeof PIG_COMPANIONS)[number];

export type TrufflePalette = {
  fill: string;
  dark: string;
  line: string;
  blush: string;
  /** The pentagonal warts. Separate from `dark` because on a pale coat the two
   *  are nearly the same value, and the warts turn to noise instead of reading
   *  as structure — they need a tone that stays dark whatever the fill is. */
  facet: string;
};

/** The four real ones. A white alba really is a different-looking object from a
 *  black périgord, so these carry more variety than four tints would. */
const REAL_TRUFFLES: Record<string, TrufflePalette> = {
  burgundy:  { fill: "#7E5B44", dark: "#5A3F2E", line: "#3A281E", blush: "#D4808C", facet: "#5A3F2E" },
  perigord:  { fill: "#4A3A30", dark: "#2B2019", line: "#191210", blush: "#B06A78", facet: "#2B2019" },
  alba:      { fill: "#E4D3AE", dark: "#C4AE83", line: "#7E6A48", blush: "#E08A94", facet: "#A08A5E" },
  summer:    { fill: "#9C7A4E", dark: "#75563A", line: "#4A3527", blush: "#D4808C", facet: "#75563A" },
};

/**
 * The coats double as truffle colours. Deriving them rather than hand-picking a
 * second palette means the two sets can't drift apart, and it makes the useful
 * case free: a truffle that matches your animal.
 */
const COAT_TRUFFLES: Record<string, TrufflePalette> = Object.fromEntries(
  Object.entries(COAT_COLORS).map(([name, c]) => [
    name,
    { fill: c.mid, dark: c.dark, line: c.outline, blush: c.blush, facet: c.outline },
  ])
);

/** Real varieties first, then the playful ones — naturalistic reads as the
 *  default and the fun colours as a departure from it. */
export const TRUFFLE_VARIETIES: Record<string, TrufflePalette> = {
  ...REAL_TRUFFLES,
  ...COAT_TRUFFLES,
};

/** Only the varieties whose key isn't already what a person should read. */
export const TRUFFLE_LABELS: Record<string, string> = {
  perigord: "black périgord",
  alba: "white alba",
};

export const truffleLabel = (name: string): string => TRUFFLE_LABELS[name] ?? name;

export type PigConfig = {
  species?: string;
  color?: string;
  hat?: string;
  accessory?: string;
  background?: string;
  costume?: string;
  face?: string;
  companion?: string;
  truffle?: string;
};

export const DEFAULT_PIG: Required<PigConfig> = {
  species: "pig",
  color: "pink",
  hat: "none",
  accessory: "none",
  background: "oat",
  costume: "none",
  face: "none",
  companion: "none",
  truffle: "burgundy",
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
    // Unknown slot values fall back rather than throwing, so a config saved by a
    // newer build still renders on an older one instead of blanking the avatar.
    costume: pick(c.costume, PIG_COSTUMES, DEFAULT_PIG.costume),
    face: pick(c.face, PIG_FACES, DEFAULT_PIG.face),
    companion: pick(c.companion, PIG_COMPANIONS, DEFAULT_PIG.companion),
    truffle: c.truffle && TRUFFLE_VARIETIES[c.truffle] ? c.truffle : DEFAULT_PIG.truffle,
  };
}

function pick(value: string | undefined, allowed: readonly string[], fallback: string): string {
  return value && allowed.includes(value) ? value : fallback;
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

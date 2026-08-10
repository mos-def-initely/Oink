"use client";

/**
 * Reaction icons — spec §10.
 *
 * These carry all the attitude in the app. The avatar pig stays neutral
 * because it's an identity; these two are moods, so the emotion on screen
 * comes from what someone *did* rather than from who they are.
 *
 *   Oink   delighted — squeezed-shut happy eyes, strong blush
 *   Shame  furious   — angled brows, narrowed eyes, red-brown coat, steam
 *
 * Both keep the snout and nostrils, which is what stops them reading as
 * generic emoji at small sizes.
 */
import { useId } from "react";

const OUTLINE = "#7A4450";
const EYE = "#4A2B33";

export function OinkPig({ size = 30, active = false }: { size?: number; active?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const g = `oink-${uid}`;
  const c = active
    ? { light: "#FCD6DE", mid: "#F5BCC8", dark: "#E2A0AE", ear: "#EFAAB8", snout: "#EDA0B0", blush: "#F08FA6" }
    : { light: "#F6E2E6", mid: "#EBCBD3", dark: "#D6B2BC", ear: "#E3BCC6", snout: "#E1B8C2", blush: "#DFAEBC" };

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Oink">
      <defs>
        <radialGradient id={g} cx="36%" cy="30%" r="76%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="66%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
      </defs>
      <g stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round">
        <path d="M28 46 Q22 22 44 32 Z" fill={c.ear} />
        <path d="M92 46 Q98 22 76 32 Z" fill={c.ear} />
        <ellipse cx="60" cy="62" rx="36" ry="32" fill={`url(#${g})`} />
        <ellipse cx="60" cy="72" rx="15" ry="11" fill={c.snout} />
      </g>
      <path d="M84 44 a36 32 0 0 1 -6 44" fill="none" stroke={c.dark} strokeWidth="7" opacity="0.4" strokeLinecap="round" />
      <ellipse cx="34" cy="70" rx="8.5" ry="5.2" fill={c.blush} opacity={active ? 0.65 : 0.45} />
      <ellipse cx="86" cy="70" rx="8.5" ry="5.2" fill={c.blush} opacity={active ? 0.65 : 0.45} />
      {/* squeezed-shut delighted eyes */}
      <path d="M39 55 Q47 46 55 55" fill="none" stroke={EYE} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M65 55 Q73 46 81 55" fill="none" stroke={EYE} strokeWidth="3.4" strokeLinecap="round" />
      <ellipse cx="55" cy="72" rx="2.4" ry="3.4" fill={OUTLINE} />
      <ellipse cx="65" cy="72" rx="2.4" ry="3.4" fill={OUTLINE} />
    </svg>
  );
}

export function ShamePig({ size = 30, active = false }: { size?: number; active?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const g = `shame-${uid}`;
  const c = active
    ? { light: "#F6C6B4", mid: "#EDAC97", dark: "#D98D78", ear: "#E29C87", snout: "#DC9480", steam: "#B5705A" }
    : { light: "#EDD9D0", mid: "#DCC0B4", dark: "#C4A496", ear: "#D3B2A4", snout: "#D0AEA0", steam: "#B09287" };

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Shame">
      <defs>
        <radialGradient id={g} cx="36%" cy="30%" r="76%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="66%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
      </defs>
      <g stroke={OUTLINE} strokeWidth="2.8" strokeLinejoin="round">
        <path d="M28 46 Q22 22 44 32 Z" fill={c.ear} />
        <path d="M92 46 Q98 22 76 32 Z" fill={c.ear} />
        <ellipse cx="60" cy="62" rx="36" ry="32" fill={`url(#${g})`} />
        <ellipse cx="60" cy="74" rx="15" ry="11" fill={c.snout} />
      </g>
      <path d="M84 44 a36 32 0 0 1 -6 44" fill="none" stroke={c.dark} strokeWidth="7" opacity="0.4" strokeLinecap="round" />
      {/* heavy angled brows — the whole expression hangs off these */}
      <path d="M36 45 L56 55" stroke={EYE} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M84 45 L64 55" stroke={EYE} strokeWidth="3.8" strokeLinecap="round" />
      <ellipse cx="47" cy="60" rx="3.4" ry="3.8" fill={EYE} />
      <ellipse cx="73" cy="60" rx="3.4" ry="3.8" fill={EYE} />
      <ellipse cx="55" cy="74" rx="2.4" ry="3.4" fill={OUTLINE} />
      <ellipse cx="65" cy="74" rx="2.4" ry="3.4" fill={OUTLINE} />
      {active && (
        <path d="M96 30 q7 -5 2 -11" fill="none" stroke={c.steam} strokeWidth="3.2" strokeLinecap="round" />
      )}
    </svg>
  );
}

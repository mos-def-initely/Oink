"use client";

/**
 * Reaction icons — spec §10. "Oink" is a happy pig, "Shame" an angry one.
 * Same Vinyl finish as the rest of the family; never a clock or a bell.
 */
import { useId } from "react";

export function OinkPig({ size = 30, active = false }: { size?: number; active?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const g = `oink-${uid}`;
  const c = active ? ["#FFD0DC", "#FF8FAC", "#E4547C"] : ["#FFDCE4", "#FBB0C4", "#DE8CA4"];

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Oink">
      <defs>
        <radialGradient id={g} cx="34%" cy="26%" r="82%">
          <stop offset="0%" stopColor={c[0]} />
          <stop offset="58%" stopColor={c[1]} />
          <stop offset="100%" stopColor={c[2]} />
        </radialGradient>
      </defs>
      <path d="M11 18 Q7 4 21 12 Z" fill={c[2]} />
      <path d="M37 18 Q41 4 27 12 Z" fill={c[2]} />
      <ellipse cx="24" cy="26" rx="16" ry="14.5" fill={`url(#${g})`} />
      {/* happy squint */}
      <path d="M14 21 Q17.5 17 21 21" fill="none" stroke="#3D2230" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M27 21 Q30.5 17 34 21" fill="none" stroke="#3D2230" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="24" cy="31" rx="7.5" ry="5.4" fill={c[2]} />
      <ellipse cx="21.7" cy="31" rx="1.3" ry="1.9" fill="#A84468" />
      <ellipse cx="26.3" cy="31" rx="1.3" ry="1.9" fill="#A84468" />
      <ellipse cx="16" cy="16" rx="4.6" ry="3" fill="#fff" opacity="0.34" transform="rotate(-24 16 16)" />
    </svg>
  );
}

export function ShamePig({ size = 30, active = false }: { size?: number; active?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const g = `shame-${uid}`;
  const c = active ? ["#FFC49A", "#F79355", "#D96E2E"] : ["#F0D2C2", "#DDAE96", "#BE8B72"];

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Shame">
      <defs>
        <radialGradient id={g} cx="34%" cy="26%" r="82%">
          <stop offset="0%" stopColor={c[0]} />
          <stop offset="58%" stopColor={c[1]} />
          <stop offset="100%" stopColor={c[2]} />
        </radialGradient>
      </defs>
      <path d="M11 18 Q7 4 21 12 Z" fill={c[2]} />
      <path d="M37 18 Q41 4 27 12 Z" fill={c[2]} />
      <ellipse cx="24" cy="26" rx="16" ry="14.5" fill={`url(#${g})`} />
      {/* furrowed brows + narrowed eyes */}
      <path d="M13 17 L21 21" stroke="#3D2230" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M35 17 L27 21" stroke="#3D2230" strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="18.5" cy="24.5" rx="2.1" ry="2.5" fill="#3D2230" />
      <ellipse cx="29.5" cy="24.5" rx="2.1" ry="2.5" fill="#3D2230" />
      <ellipse cx="24" cy="32" rx="7.5" ry="5.4" fill={c[2]} />
      <ellipse cx="21.7" cy="32" rx="1.3" ry="1.9" fill="#8A5238" />
      <ellipse cx="26.3" cy="32" rx="1.3" ry="1.9" fill="#8A5238" />
      {active && <path d="M40 14 q4 -3 1 -6" fill="none" stroke="#D96E2E" strokeWidth="2.2" strokeLinecap="round" />}
    </svg>
  );
}

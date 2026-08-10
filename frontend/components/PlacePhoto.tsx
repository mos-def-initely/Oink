"use client";

/**
 * Place imagery, in priority order:
 *   1. a photo someone uploaded when logging the place
 *   2. an auto-sourced photo (the place's own og:image, or Google Places)
 *   3. a generated placeholder
 *
 * The auto-sourced photo is hotlinked from someone else's server, so it can
 * disappear or start refusing requests at any time. A failed load falls back to
 * the placeholder rather than leaving a broken image in the card.
 *
 * The placeholder is deterministic per place name, so a given place always gets
 * the same colourway rather than flickering between renders, and it's drawn
 * from the app palette so a place without a photo still belongs to the page.
 */
"use client";

import { useEffect, useState } from "react";

const PLACEHOLDERS = [
  ["#914E56", "#CFA51F"],
  ["#CFA51F", "#E6D389"],
  ["#4D303F", "#914E56"],
  ["#A9503C", "#CFA51F"],
  ["#914E56", "#D8B5F7"],
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export default function PlacePhoto({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  // A src can fail: the Google listing photo 404s whenever there's no API key
  // or the place has no photo. Falling through to the placeholder beats leaving
  // a broken image in the feed.
  const [failed, setFailed] = useState(false);

  // A new place may arrive with a different src; give it a fresh chance.
  useEffect(() => setFailed(false), [src]);

  if (src && !failed) {
    return (
      // A whisper of warmth rather than a duotone: photos stay recognisably
      // themselves, they just stop clashing with the palette around them.
      <span className={`relative block overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local uploads
            and hotlinked remote photos; the Next loader adds nothing here. */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          style={{ filter: "saturate(0.94) contrast(1.02)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-plum opacity-[0.07] mix-blend-multiply"
        />
      </span>
    );
  }

  const [from, to] = PLACEHOLDERS[hashName(alt) % PLACEHOLDERS.length];
  const initial = alt.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-label={`${alt} (no photo yet)`}
      role="img"
    >
      <span className="font-display text-5xl font-extrabold text-oat/90">{initial}</span>
    </div>
  );
}

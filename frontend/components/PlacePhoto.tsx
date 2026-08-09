/**
 * Place imagery. v1 shows an uploaded photo if there is one, otherwise a
 * generated placeholder — no auto-sourcing from the internet (spec §15).
 *
 * The placeholder is deterministic per place name, so a given place always gets
 * the same colourway rather than flickering between renders.
 */
// Drawn from the app palette so a place without a photo still belongs to the
// page. Bright arbitrary gradients here fight everything around them.
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
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- local uploads, no loader needed
    return <img src={src} alt={alt} className={`object-cover ${className}`} />;
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

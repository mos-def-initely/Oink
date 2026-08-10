"use client";
import PigAvatar from "@/components/pigs/PigAvatar";
import { FATNESS_TIERS, TIER_LABELS } from "@/lib/pig";
const now = new Date().toISOString();
const gone = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString();
export default function P() {
  return (
    <div className="bg-oat p-4">
      <div className="grid grid-cols-3 gap-2">
        {FATNESS_TIERS.map((t) => (
          <div key={t.tier} className="flex flex-col items-center">
            <PigAvatar placesLogged={t.min} lastLoggedAt={now} size={104} variant="full" />
            <p className="font-display text-[11px] font-extrabold text-ink">{TIER_LABELS[t.tier]}</p>
          </div>
        ))}
        <div className="flex flex-col items-center">
          <PigAvatar placesLogged={20} lastLoggedAt={gone} size={104} variant="full" />
          <p className="font-display text-[11px] font-extrabold text-ink">Dead</p>
        </div>
      </div>
    </div>
  );
}

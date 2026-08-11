"use client";

import PigAvatar from "@/components/pigs/PigAvatar";

const NEW = ["sax", "trumpet", "whisky"] as const;

export default function PigCheck() {
  return (
    <main className="w-[1100px] max-w-none bg-cream p-6">
      <div className="flex flex-wrap gap-6">
        {NEW.map((h) => (
          <div key={h} id={h} className="flex flex-col items-center">
            <PigAvatar size={240} variant="full" placesLogged={18} holding={h} config={{ color: "pink" }} />
            <span className="text-xs">{h}</span>
          </div>
        ))}
        {NEW.map((h) => (
          <div key={`b-${h}`} id={`b-${h}`} className="flex flex-col items-center">
            <PigAvatar size={240} variant="full" placesLogged={45} holding={h} config={{ color: "pink" }} />
            <span className="text-xs">{h} / big</span>
          </div>
        ))}
      </div>
    </main>
  );
}

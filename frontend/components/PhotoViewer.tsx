"use client";

/**
 * Full-screen photo view — spec §6.4.
 *
 * Until now no photo in the app could be opened. The header carousel scrolled
 * and its dots jumped between images, but a review's own shots were plain
 * thumbnails with no handler at all, so an uploaded photo could only ever be
 * seen at 80px.
 *
 * One component serves both surfaces, which is why it takes a plain list and an
 * index rather than reaching for a place: the carousel opens it at whichever
 * image is showing, a review thumbnail opens it at the one tapped.
 *
 * Swipe or use the arrows to move; the caption credits whoever uploaded it,
 * which review photos already know.
 *
 * Rendered through a portal onto <body>. A z-index only ranks siblings within
 * the same stacking context, and this page has several — a sticky blurred
 * header and a fixed tab bar among them — so an overlay left in the tree paints
 * *under* them however high its z-index goes.
 *
 * The ground is solid rather than a scrim. A photo wants the page gone, and at
 * 95% the layout behind stayed legible enough to compete with it.
 */
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PigAvatar from "@/components/pigs/PigAvatar";
import type { User } from "@/lib/types";

export type ViewerPhoto = {
  url: string;
  /** Absent for a place's own listing photo, which nobody here uploaded. */
  by?: User | null;
  takenAt?: string | null;
};

export default function PhotoViewer({
  photos,
  index,
  onClose,
}: {
  photos: ViewerPhoto[];
  index: number;
  onClose: () => void;
}) {
  const [at, setAt] = useState(index);
  const [touch, setTouch] = useState<number | null>(null);

  const go = useCallback(
    (delta: number) => setAt((i) => Math.min(photos.length - 1, Math.max(0, i + delta))),
    [photos.length]
  );

  useEffect(() => setAt(index), [index]);

  // Arrow keys and Escape, plus lock the page behind it so the body doesn't
  // scroll under the overlay while you swipe.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [go, onClose]);

  const photo = photos[at];
  if (!photo || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[3000] flex flex-col bg-ink-deep"
      role="dialog"
      aria-modal="true"
      aria-label="photo"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-3 pt-[calc(env(safe-area-inset-top)+10px)]">
        <span className="micro text-oat/70">
          {at + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full border-2 border-oat/50 text-lg text-oat"
          aria-label="close"
        >
          ✕
        </button>
      </div>

      <div
        className="flex flex-1 items-center justify-center px-3"
        onTouchStart={(e) => setTouch(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch === null) return;
          const dx = e.changedTouches[0].clientX - touch;
          if (Math.abs(dx) > 45) go(dx > 0 ? -1 : 1);
          setTouch(null);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local uploads and
            hotlinked remote photos; the Next loader adds nothing here. */}
        <img
          src={photo.url}
          alt=""
          className="max-h-full max-w-full rounded-xl border-2 border-oat/30 object-contain"
        />
      </div>

      <div
        className="flex items-center gap-2.5 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        {photos.length > 1 && (
          <button
            onClick={() => go(-1)}
            disabled={at === 0}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-oat/50 text-oat disabled:opacity-30"
            aria-label="previous photo"
          >
            ‹
          </button>
        )}

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {photo.by ? (
            <>
              <PigAvatar
                config={photo.by.pig_avatar_config}
                placesLogged={photo.by.places_logged}
                lastLoggedAt={photo.by.last_logged_at}
                size={24}
                variant="face"
              />
              <span className="micro truncate text-oat/80">
                {photo.by.display_name}
                {photo.takenAt ? ` · ${photo.takenAt}` : ""}
              </span>
            </>
          ) : (
            <span className="micro text-oat/60">from the listing</span>
          )}
        </div>

        {photos.length > 1 && (
          <button
            onClick={() => go(1)}
            disabled={at === photos.length - 1}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-oat/50 text-oat disabled:opacity-30"
            aria-label="next photo"
          >
            ›
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

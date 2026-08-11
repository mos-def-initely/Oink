"use client";

/** Small shared pieces used across pages. */
import Link from "next/link";
import { useEffect } from "react";

export function PageHeader({
  title,
  right,
  back,
}: {
  title: string;
  right?: React.ReactNode;
  back?: string;
}) {
  return (
    <header className="sticky top-0 z-[900] flex items-center gap-2 bg-oat/95 px-3 py-3 backdrop-blur">
      {back && (
        <Link
          href={back}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-cream text-lg"
          aria-label="back"
        >
          ←
        </Link>
      )}
      {/* Capitalised in CSS rather than in the strings: every title in the app
          is written lowercase, and a screen's name shouldn't have to be
          spelled twice to be styled once. */}
      <h1 className="min-w-0 flex-1 truncate text-3xl capitalize text-plum">{title}</h1>
      {right}
    </header>
  );
}

/**
 * Bottom sheet on phone widths (spec §6) — slides up from the bottom rather
 * than appearing as a centred desktop modal.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center">
      <button className="absolute inset-0 bg-ink/40" onClick={onClose} aria-label="close" tabIndex={-1} />
      <div className="relative max-h-[88vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl border-t-2 border-x-2 border-ink bg-oat pb-6 shadow-lift">
        <div className="sticky top-0 z-10 flex items-center gap-2 bg-oat px-4 pb-2 pt-4">
          <h2 className="min-w-0 flex-1 truncate text-xl capitalize">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-cream"
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <div className="px-4 pt-2">{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ label = "loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-oat-deep border-t-plum" />
      <p className="font-display text-sm text-ink-soft">{label}</p>
    </div>
  );
}

/**
 * Lemon is used sparingly — here and on the profile header. On a card it would
 * fight the photography; where there's none, it reads as a deliberate splash.
 */
export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mx-1 my-4 rounded-card border-2 border-dashed border-ink bg-lemon px-4 py-9 text-center">
      <p className="font-display text-lg font-bold text-ink-deep">{title}</p>
      {body && <p className="micro mx-auto mt-2 max-w-[26ch] leading-relaxed">{body}</p>}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-xl border-2 border-ink bg-rust px-3 py-2.5 font-display text-sm font-bold text-oat">
      {message}
    </p>
  );
}

export function timeAgo(iso: string): string {
  // Backend timestamps are UTC but serialised without a zone suffix; treat a
  // bare timestamp as UTC so "just now" doesn't come out hours off.
  const normalised = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const seconds = Math.floor((Date.now() - new Date(normalised).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(normalised).toLocaleDateString();
}

export const KIND_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  bar: "Bar",
  cafe: "Cafe",
};

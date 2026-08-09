"use client";

/**
 * Category picker — a dropdown with a search field at the top that narrows the
 * remaining options as you type, rather than a wall of chips.
 *
 * For bars the vocabulary is fixed (Pub / Club / Beer Garden / …); for
 * restaurants and cafes the list is suggestions and anything typed can be added
 * as a new tag (spec §6.3 / §15).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { categoriesFor } from "@/lib/categories";

export default function CategoryPicker({
  kind,
  value,
  onChange,
}: {
  kind: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { fixed, options } = categoriesFor(kind);

  // Close on an outside tap, the way a native select would.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const q = query.trim().toLowerCase();

  const visible = useMemo(() => {
    // Already-selected options drop out of the list — "the remaining options".
    const remaining = options.filter((o) => !value.includes(o));
    if (!q) return remaining;
    return remaining.filter((o) => o.toLowerCase().includes(q));
  }, [options, value, q]);

  const canAddCustom =
    !fixed &&
    q.length > 0 &&
    !options.some((o) => o.toLowerCase() === q) &&
    !value.some((v) => v.toLowerCase() === q);

  function add(v: string) {
    if (!value.includes(v)) onChange([...value, v]);
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(v: string) {
    onChange(value.filter((x) => x !== v));
  }

  return (
    <div ref={boxRef} className="relative">
      {/* Selected tags sit above the control so they're never hidden by it */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => remove(v)}
              className="tag bg-coral text-white shadow-pop"
            >
              {v}
              <span aria-hidden className="ml-0.5">✕</span>
              <span className="sr-only">Remove {v}</span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="field flex items-center justify-between text-left"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={value.length ? "text-ink" : "text-ink-soft/70"}>
          {value.length
            ? `${value.length} selected`
            : fixed
              ? "Pick what kind of bar"
              : "Add cuisine tags"}
        </span>
        <span aria-hidden className="text-ink-soft">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl bg-cream shadow-lift">
          <div className="p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (visible.length) add(visible[0]);
                  else if (canAddCustom) add(query.trim());
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder="Search…"
              className="w-full rounded-lg bg-apricot px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <ul role="listbox" className="max-h-52 overflow-y-auto pb-1">
            {visible.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => add(o)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-apricot"
                >
                  {o}
                </button>
              </li>
            ))}

            {canAddCustom && (
              <li>
                <button
                  type="button"
                  onClick={() => add(query.trim())}
                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-coral hover:bg-apricot"
                >
                  + Add “{query.trim()}”
                </button>
              </li>
            )}

            {visible.length === 0 && !canAddCustom && (
              <li className="px-4 py-3 text-sm text-ink-soft">
                {fixed ? "Nothing left to pick" : "No matches"}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

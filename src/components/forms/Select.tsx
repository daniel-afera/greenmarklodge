"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useDismiss } from "./hooks";
import { CheckIcon } from "./Field";
import { EASE_LUXE } from "@/lib/motion";

export type Option = { value: string; label: string; hint?: string; icon?: ReactNode; keywords?: string; disabled?: boolean };

/**
 * Accessible custom select (combobox + listbox) with optional search.
 * Arrow keys move, Enter picks, Escape closes, typing filters.
 */
export default function Select({
  id,
  value,
  onChange,
  options,
  searchable = false,
  searchPlaceholder = "Search…",
  pinned = [],
  placeholder = "Select",
  renderValue,
  invalid = false,
  onBlur,
  placement = "bottom",
  align = "left",
  className = "",
  triggerClassName = "",
  menuClassName = "w-full min-w-[260px]",
  labelledBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pinned?: string[];
  placeholder?: string;
  renderValue?: (o: Option | undefined) => ReactNode;
  invalid?: boolean;
  onBlur?: () => void;
  placement?: "top" | "bottom";
  align?: "left" | "right";
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  labelledBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  const ordered = useMemo(() => {
    if (!pinned.length) return options;
    const top = pinned.map((p) => options.find((o) => o.value === p)).filter(Boolean) as Option[];
    return [...top, ...options.filter((o) => !pinned.includes(o.value))];
  }, [options, pinned]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => `${o.label} ${o.hint ?? ""} ${o.keywords ?? ""} ${o.value}`.toLowerCase().includes(q)) : ordered;
  }, [options, ordered, query]);

  const openMenu = () => {
    setQuery("");
    setActive(Math.max(0, ordered.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const close = useCallback(
    (reason?: "outside" | "escape" | "pick") => {
      setOpen(false);
      onBlur?.();
      if (reason !== "outside") trigger.current?.focus();
    },
    [onBlur],
  );
  useDismiss(wrap, open, close);

  // Keep the active option in view; focus the search box / list when opened.
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  useEffect(() => {
    if (!open) return;
    (searchable ? search.current : list.current)?.focus({ preventScroll: true });
  }, [open, searchable]);

  const pick = (o: Option | undefined) => {
    if (!o || o.disabled) return;
    onChange(o.value);
    close("pick");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((a) => Math.min(items.length - 1, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(items.length - 1);
    else if (e.key === "Enter") pick(items[active]);
    else if (e.key === "Tab") close("outside");
    else return;
    e.preventDefault();
  };

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelledBy ? `${labelledBy} ${id}` : undefined}
        aria-invalid={invalid}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={`flex w-full min-w-0 items-center justify-between gap-3 text-left ${triggerClassName}`}
      >
        <span className="min-w-0 truncate">{renderValue ? renderValue(selected) : selected ? selected.label : <span className="opacity-60">{placeholder}</span>}</span>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" aria-hidden="true" className="shrink-0 opacity-70">
          <path d="M2 4.5 L6 8.5 L10 4.5" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: placement === "top" ? 10 : -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "top" ? 6 : -6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.4, ease: EASE_LUXE }}
            className={`absolute z-[70] border border-ink/10 bg-ivory text-ink shadow-[0_24px_60px_-18px_rgba(20,26,23,.45)] ${align === "right" ? "right-0" : "left-0"} ${
              placement === "top" ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+10px)]"
            } ${menuClassName}`}
          >
            {searchable && (
              <div className="flex items-center gap-3 border-b border-ink/10 px-4">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true" className="shrink-0 opacity-60">
                  <circle cx="7" cy="7" r="5.5" />
                  <path d="M11 11 L15 15" />
                </svg>
                <input
                  ref={search}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKeyDown}
                  role="searchbox"
                  aria-controls={listId}
                  aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
                  placeholder={searchPlaceholder}
                  className="!min-h-12 w-full !border-0 bg-transparent !py-3 text-[15px] focus:outline-none"
                />
              </div>
            )}
            <ul
              ref={list}
              id={listId}
              role="listbox"
              tabIndex={-1}
              data-lenis-prevent
              onKeyDown={searchable ? undefined : onKeyDown}
              aria-activedescendant={!searchable && items[active] ? `${listId}-${active}` : undefined}
              className="max-h-72 overflow-y-auto overscroll-contain py-1.5 focus:outline-none"
            >
              {items.length === 0 && <li className="px-4 py-4 text-sm text-muted">No matches for “{query}”</li>}
              {items.map((o, i) => {
                const isSel = o.value === value;
                const divider = !query && pinned.length > 0 && i === pinned.length;
                return (
                  <li
                    key={o.value}
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isSel}
                    aria-disabled={o.disabled}
                    onPointerMove={() => setActive(i)}
                    onClick={() => pick(o)}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 text-[15px] transition-colors ${divider ? "border-t border-ink/10" : ""} ${
                      i === active ? "bg-ink/[0.06]" : ""
                    } ${o.disabled ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {o.icon && <span className="flex shrink-0 items-center text-lg leading-none">{o.icon}</span>}
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.hint && <span className="shrink-0 text-xs tabular-nums text-muted">{o.hint}</span>}
                    <span className={`w-3.5 shrink-0 text-bronze-deep ${isSel ? "" : "invisible"}`}>
                      <CheckIcon />
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { addDaysISO, addMonthsISO, daysInMonth, mondayIndex, monthLabel, monthStart, prettyDate, todayISO } from "@/lib/dates";
import { EASE_LUXE } from "@/lib/motion";

export type DateRange = { from: string; to: string };

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
      <path d={dir === "left" ? "M10 3 L5 8 L10 13" : "M6 3 L11 8 L6 13"} />
    </svg>
  );
}

/**
 * Range calendar. First click sets arrival, second sets departure; a
 * preview band follows the pointer in between. Keyboard: arrows move by
 * day/week, PageUp/PageDown by month, Home/End to week edges, Enter selects.
 */
export default function Calendar({
  value,
  onChange,
  min = todayISO(),
  max,
  maxNights = 30,
  months = 2,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  min?: string;
  max?: string;
  maxNights?: number;
  months?: number;
}) {
  const [view, setView] = useState(() => monthStart(value.from || min));
  const [dir, setDir] = useState(1);
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState<string>(() => value.from || min);
  const kbd = useRef(false);
  const root = useRef<HTMLDivElement>(null);

  const selectingEnd = !!value.from && !value.to;
  const endLimit = selectingEnd ? addDaysISO(value.from, maxNights) : null;
  const lastView = addMonthsISO(view, months - 1);

  const isDisabled = (d: string) => d < min || (!!max && d > max) || (selectingEnd && endLimit !== null && d > endLimit);

  const shiftView = (n: number) => {
    setDir(n > 0 ? 1 : -1);
    setView((v) => addMonthsISO(v, n));
  };

  const pick = (d: string) => {
    if (isDisabled(d)) return;
    if (!value.from || value.to || d <= value.from) onChange({ from: d, to: "" });
    else onChange({ from: value.from, to: d });
    setFocus(d);
  };

  // Move DOM focus only after keyboard navigation.
  useEffect(() => {
    if (!kbd.current) return;
    root.current?.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus();
  }, [focus, view]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: string | null = null;
    if (e.key in steps) next = addDaysISO(focus, steps[e.key]);
    else if (e.key === "PageUp") next = addMonthsISO(focus, -1).slice(0, 8) + focus.slice(8);
    else if (e.key === "PageDown") next = addMonthsISO(focus, 1).slice(0, 8) + focus.slice(8);
    else if (e.key === "Home") next = addDaysISO(focus, -mondayIndex(focus));
    else if (e.key === "End") next = addDaysISO(focus, 6 - mondayIndex(focus));
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(focus);
      return;
    } else return;
    e.preventDefault();
    // clamp invalid day-of-month from PageUp/Down (e.g. 31 → 30)
    if (next.slice(8) > String(daysInMonth(monthStart(next))).padStart(2, "0")) next = addDaysISO(addMonthsISO(next, 1), -1);
    if (next < min) next = min;
    if (max && next > max) next = max;
    kbd.current = true;
    if (monthStart(next) < view) shiftView(-1);
    else if (monthStart(next) > lastView) shiftView(1);
    setFocus(next);
  };

  const rangeEnd = value.to || (selectingEnd && hover && hover > value.from ? hover : "");

  const renderMonth = (m: string) => {
    const offset = mondayIndex(m);
    const count = daysInMonth(m);
    const today = todayISO();
    const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => addDaysISO(m, i))];
    return (
      <div key={m} className="min-w-0 flex-1">
        <div className="mb-4 text-center font-serif text-[22px]">{monthLabel(m)}</div>
        <div className="grid grid-cols-7 text-center" role="row">
          {WEEKDAYS.map((w) => (
            <span key={w} className="pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted" aria-hidden="true">
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7" role="grid" aria-label={monthLabel(m)}>
          {cells.map((d, i) => {
            if (!d) return <span key={`b${i}`} />;
            const disabled = isDisabled(d);
            const isStart = d === value.from;
            const isEnd = d === value.to;
            const inRange = !!value.from && !!rangeEnd && d > value.from && d < rangeEnd;
            const isPreviewEnd = !value.to && d === rangeEnd;
            const band = (isStart && rangeEnd) ? "left-1/2 right-0" : isEnd || isPreviewEnd ? "left-0 right-1/2" : inRange ? "inset-x-0" : "";
            const label = prettyDate(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            return (
              <div key={d} className="relative flex h-11 items-center justify-center">
                {band && <span aria-hidden="true" className={`absolute inset-y-1 bg-bronze/15 ${band}`} />}
                <button
                  type="button"
                  data-date={d}
                  tabIndex={d === focus ? 0 : -1}
                  disabled={disabled}
                  aria-label={`${label}${isStart ? ", arrival" : ""}${isEnd ? ", departure" : ""}`}
                  aria-pressed={isStart || isEnd}
                  onClick={() => {
                    kbd.current = false;
                    pick(d);
                  }}
                  onPointerEnter={() => setHover(d)}
                  className={`relative z-[1] flex h-10 w-10 flex-col items-center justify-center rounded-full text-[14px] tabular-nums transition-colors duration-200 ${
                    isStart || isEnd
                      ? "bg-ink text-ivory"
                      : isPreviewEnd
                        ? "border border-ink/60"
                        : disabled
                          ? "cursor-not-allowed text-ink/20"
                          : "hover:bg-ink/8 hover:ring-1 hover:ring-ink/40"
                  }`}
                >
                  {Number(d.slice(8))}
                  {d === today && <span aria-hidden="true" className={`absolute bottom-1.5 h-1 w-1 rounded-full ${isStart || isEnd ? "bg-ivory" : "bg-bronze"}`} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const canPrev = view > monthStart(min);
  const canNext = !max || lastView < monthStart(max);

  return (
    <div ref={root} onKeyDown={onKeyDown} onPointerLeave={() => setHover(null)} className="relative select-none text-ink">
      <div className="absolute inset-x-0 top-0 flex justify-between">
        <button type="button" onClick={() => shiftView(-1)} disabled={!canPrev} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-ink hover:text-ivory disabled:pointer-events-none disabled:opacity-20">
          <Chevron dir="left" />
        </button>
        <button type="button" onClick={() => shiftView(1)} disabled={!canNext} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-ink hover:text-ivory disabled:pointer-events-none disabled:opacity-20">
          <Chevron dir="right" />
        </button>
      </div>
      <div className="overflow-hidden pt-1.5">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={view}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * 60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: EASE_LUXE }}
            className="flex gap-10"
          >
            {Array.from({ length: months }, (_, i) => renderMonth(addMonthsISO(view, i)))}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="sr-only" aria-live="polite">
        {selectingEnd ? `Arrival ${prettyDate(value.from, { day: "numeric", month: "long" })}. Now choose your departure date.` : value.to ? "Dates selected." : "Choose your arrival date."}
      </p>
    </div>
  );
}

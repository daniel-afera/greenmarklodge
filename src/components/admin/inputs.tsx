"use client";

import { useId, useRef } from "react";
import Field from "@/components/forms/Field";
import Select from "@/components/forms/Select";
import { TITLE_HINT } from "@/cms/fields";

type Base = { label: string; error?: string; hint?: string };

export function TextInput({
  label,
  value,
  onChange,
  max,
  multiline,
  hint,
  error,
}: Base & { value: string; onChange: (v: string) => void; max?: number; multiline?: boolean }) {
  const id = useId();
  const common = {
    id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    "aria-invalid": !!error,
    "aria-describedby": `${id}-msg`,
  };
  return (
    <Field id={id} label={label} error={error} hint={hint} counter={max ? { value: value.length, max } : undefined}>
      {multiline ? <textarea rows={Math.min(10, Math.max(3, Math.ceil(value.length / 90)))} {...common} /> : <input type="text" {...common} />}
    </Field>
  );
}

/** Title text with an italic helper: wraps the selection in *…*. */
export function TitleInput({ label, value, onChange, max, error }: Base & { value: string; onChange: (v: string) => void; max?: number }) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const italicize = () => {
    const el = ref.current;
    if (!el) return;
    const [a, b] = [el.selectionStart ?? 0, el.selectionEnd ?? 0];
    if (a === b) return;
    onChange(`${value.slice(0, a)}*${value.slice(a, b)}*${value.slice(b)}`);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + 1, b + 1);
    });
  };
  return (
    <Field id={id} label={label} error={error} hint={TITLE_HINT} counter={max ? { value: value.length, max } : undefined}>
      <div className="flex items-end gap-3">
        <input ref={ref} id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={`${id}-msg`} />
        <button
          type="button"
          onClick={italicize}
          onMouseDown={(e) => e.preventDefault()}
          className="mb-2 shrink-0 border border-ink/20 px-3 py-1.5 font-serif text-sm italic hover:border-bronze"
          title="Make the selected words italic"
        >
          Italic
        </button>
      </div>
    </Field>
  );
}

export function NumberInput({ label, value, onChange, min, max, error }: Base & { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <input id={id} type="number" inputMode="numeric" min={min} max={max} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.valueAsNumber)} />
    </Field>
  );
}

/** Trigger look shared by every custom dropdown in the admin (matches .field inputs). */
export const SELECT_TRIGGER = "min-h-12 border-b border-ink/28 py-3 text-base hover:border-ink/60 aria-expanded:border-bronze aria-[invalid=true]:border-error";

export function SelectInput({ label, value, onChange, options, error }: Base & { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <Select id={id} labelledBy={`${id}-label`} value={value} onChange={onChange} options={options} invalid={!!error} triggerClassName={SELECT_TRIGGER} />
    </Field>
  );
}

/** Compact dropdown for toolbars (sort, filter, role). */
export function MiniSelect({
  label,
  value,
  onChange,
  options,
  disabled,
  align = "right",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  align?: "left" | "right";
}) {
  const id = useId();
  return (
    <div className={`flex items-center gap-2 text-xs text-muted ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <span id={`${id}-label`}>{label}</span>
      <Select
        id={id}
        labelledBy={`${id}-label`}
        value={value}
        onChange={onChange}
        options={options}
        align={align}
        className="text-ink"
        triggerClassName="min-h-9 gap-2 border-b border-ink/25 py-1 text-sm hover:border-ink/60 aria-expanded:border-bronze"
        menuClassName="min-w-[200px]"
      />
    </div>
  );
}

/** Small text button used across the admin. */
export function MiniButton({ children, onClick, danger, disabled, title }: { children: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`text-[11px] uppercase tracking-[0.18em] underline-offset-4 hover:underline disabled:opacity-40 ${danger ? "text-error" : "text-bronze-deep"}`}
    >
      {children}
    </button>
  );
}

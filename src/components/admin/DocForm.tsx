"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { Field } from "@/cms/fields";
import { discard, publish, saveDraft } from "@/cms/actions";
import { docSchema, issuesByPath } from "@/cms/schema";
import { getIn, setIn } from "@/cms/paths";
import type { Img } from "@/content/types";
import GalleryField from "./GalleryField";
import ImageField from "./ImageField";
import { MiniButton, NumberInput, SelectInput, TextInput, TitleInput } from "./inputs";

const AUTOSAVE_MS = 800;

type Value = Record<string, unknown>;
type Errors = Record<string, string>;

// ─── Recursive field renderer ─────────────────────────────────────────

function move<T>(arr: T[], from: number, to: number) {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ListControls({ index, length, onMove, onRemove }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <div className="flex gap-4">
      <MiniButton onClick={() => onMove(index - 1)} disabled={index === 0} title="Move up">
        ↑
      </MiniButton>
      <MiniButton onClick={() => onMove(index + 1)} disabled={index === length - 1} title="Move down">
        ↓
      </MiniButton>
      <MiniButton danger onClick={onRemove}>
        Remove
      </MiniButton>
    </div>
  );
}

export function FieldView({ field, path, value, onChange, errors }: { field: Field; path: string; value: unknown; onChange: (path: string, v: unknown) => void; errors: Errors }) {
  const error = errors[path];
  const set = (v: unknown) => onChange(path, v);
  switch (field.kind) {
    case "text":
      return <TextInput label={field.label} value={String(value ?? "")} onChange={set} max={field.max} multiline={field.multiline} hint={field.hint} error={error} />;
    case "title":
      return <TitleInput label={field.label} value={String(value ?? "")} onChange={set} max={field.max} error={error} />;
    case "number":
      return <NumberInput label={field.label} value={Number(value ?? 0)} onChange={set} min={field.min} max={field.max} error={error} />;
    case "select":
      return <SelectInput label={field.label} value={String(value ?? field.options[0]?.value)} onChange={set} options={field.options} error={error} />;
    case "image":
      return <ImageField label={field.label} value={(value as Img | null) ?? null} onChange={set} optional={field.optional} error={error ?? errors[`${path}.alt`]} />;
    case "images":
      return <GalleryField label={field.label} value={(value as Img[]) ?? []} onChange={set} max={field.max} error={error} />;
    case "strings": {
      const items = (value as string[]) ?? [];
      return (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-[10px] font-medium uppercase tracking-[0.28em] text-muted">{field.label}</legend>
          {items.map((item, i) => (
            <div key={i} className="flex items-end gap-4">
              <input
                type="text"
                aria-label={`${field.itemLabel} ${i + 1}`}
                value={item}
                maxLength={120}
                onChange={(e) => set(items.map((x, j) => (j === i ? e.target.value : x)))}
                className="min-h-10 flex-1 border-0 border-b border-ink/25 bg-transparent py-2 focus:border-bronze focus:outline-none"
              />
              <ListControls index={i} length={items.length} onMove={(to) => set(move(items, i, to))} onRemove={() => set(items.filter((_, j) => j !== i))} />
            </div>
          ))}
          {(field.max === undefined || items.length < field.max) && (
            <div>
              <MiniButton onClick={() => set([...items, ""])}>+ Add {field.itemLabel.toLowerCase()}</MiniButton>
            </div>
          )}
          {error && <em className="text-xs not-italic text-error">{error}</em>}
        </fieldset>
      );
    }
    case "group":
      return (
        <fieldset className="flex flex-col gap-8 border-l border-bronze/40 pl-5 sm:pl-8">
          <legend className="-ml-5 mb-6 font-serif text-2xl sm:-ml-8">{field.label}</legend>
          {field.fields.map((f) => (
            <FieldView key={f.key} field={f} path={`${path}.${f.key}`} value={getIn(value, f.key)} onChange={onChange} errors={errors} />
          ))}
        </fieldset>
      );
    case "list": {
      const items = (value as Value[]) ?? [];
      return (
        <fieldset className="flex flex-col gap-6">
          <legend className="mb-6 font-serif text-2xl">{field.label}</legend>
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-6 border border-ink/10 p-5">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-muted">
                  {field.itemLabel} {i + 1}
                </span>
                <ListControls index={i} length={items.length} onMove={(to) => set(move(items, i, to))} onRemove={() => set(items.filter((_, j) => j !== i))} />
              </div>
              {field.fields.map((f) => (
                <FieldView key={f.key} field={f} path={`${path}.${i}.${f.key}`} value={item?.[f.key]} onChange={onChange} errors={errors} />
              ))}
            </div>
          ))}
          {(field.max === undefined || items.length < field.max) && (
            <div>
              <MiniButton onClick={() => set([...items, Object.fromEntries(field.fields.map((f) => [f.key, f.kind === "number" ? 0 : ""]))])}>
                + Add {field.itemLabel.toLowerCase()}
              </MiniButton>
            </div>
          )}
        </fieldset>
      );
    }
  }
}

// ─── Form with autosave ───────────────────────────────────────────────

type Status = { kind: "idle" | "saving" | "saved" | "error"; text?: string };

export default function DocForm({
  id,
  title,
  fields,
  initial,
  hasDraft,
  isPublished,
  viewHref,
  backHref,
}: {
  id: string;
  title: string;
  fields: Field[];
  initial: Value;
  hasDraft: boolean;
  isPublished: boolean;
  viewHref?: string;
  backHref?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Value>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dirty, setDirty] = useState(hasDraft);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const queued = useRef<Value | null>(null);
  const saving = useRef<Promise<void> | null>(null);

  const save = useCallback(
    async (v: Value) => {
      const check = docSchema(fields, "draft").safeParse(v);
      if (!check.success) {
        setErrors(issuesByPath(check.error));
        setStatus({ kind: "error", text: "Fix the highlighted fields to save." });
        return;
      }
      setErrors({});
      setStatus({ kind: "saving" });
      const res = await saveDraft(id, v);
      if (res.ok) {
        setStatus({ kind: "saved", text: `Saved ${new Date(res.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` });
        setDirty(true);
      } else {
        setErrors(res.issues ?? {});
        setStatus({ kind: "error", text: res.error });
      }
    },
    [fields, id],
  );

  /** Save now (waiting for any save in flight). */
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (saving.current) await saving.current;
    const v = queued.current;
    if (!v) return;
    queued.current = null;
    saving.current = save(v).finally(() => (saving.current = null));
    await saving.current;
  }, [save]);

  const onChange = (path: string, v: unknown) => {
    setValue((prev) => {
      const next = setIn(prev, path, v);
      queued.current = next;
      return next;
    });
    setStatus({ kind: "idle", text: "Unsaved changes" });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
  };

  // Save on tab close / navigation away.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (queued.current || saving.current) {
        void flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [flush]);

  const doPublish = () =>
    startTransition(async () => {
      await flush();
      const res = await publish(id);
      if (res.ok) {
        setDirty(false);
        setStatus({ kind: "saved", text: "Published — live on the site" });
        router.refresh();
      } else setStatus({ kind: "error", text: res.error });
    });

  const doDiscard = () =>
    startTransition(async () => {
      if (!confirm(isPublished ? "Discard all unpublished changes to this page?" : "This item was never published. Discarding deletes it. Continue?")) return;
      clearTimeout(timer.current);
      queued.current = null;
      if (saving.current) await saving.current;
      const res = await discard(id);
      if (!res.ok) return setStatus({ kind: "error", text: res.error });
      if (!isPublished && backHref) router.push(backHref);
      else {
        router.refresh();
        window.location.reload();
      }
    });

  return (
    <div className="pb-32">
      <div className="sticky top-0 z-20 -mx-5 mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 bg-ivory/95 px-5 py-4 backdrop-blur sm:-mx-10 sm:px-10">
        <div className="min-w-0">
          {backHref && (
            <Link href={backHref} className="eyebrow text-muted hover:text-ink">
              ← Back
            </Link>
          )}
          <h1 className="truncate font-serif text-3xl">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <span role="status" className={`text-xs ${status.kind === "error" ? "text-error" : "text-muted"}`}>
            {status.kind === "saving" ? "Saving…" : status.text ?? (dirty ? "Unpublished changes" : isPublished ? "Published" : "Not published yet")}
          </span>
          {viewHref && (
            <a href={`/api/edit?to=${encodeURIComponent(viewHref)}`} className="text-[11px] uppercase tracking-[0.18em] text-bronze-deep hover:underline">
              Preview
            </a>
          )}
          {(dirty || !isPublished) && (
            <button type="button" onClick={doDiscard} disabled={pending} className="text-[11px] uppercase tracking-[0.18em] text-error hover:underline disabled:opacity-40">
              Discard
            </button>
          )}
          <button type="button" onClick={doPublish} disabled={pending || (!dirty && isPublished && status.kind !== "idle")} className="btn btn-ink min-h-10 px-6">
            <span>{pending ? "Working…" : "Publish"}</span>
          </button>
        </div>
      </div>
      <div className="flex max-w-3xl flex-col gap-10">
        {fields.map((f) => (
          <FieldView key={f.key} field={f} path={f.key} value={value[f.key]} onChange={onChange} errors={errors} />
        ))}
      </div>
    </div>
  );
}

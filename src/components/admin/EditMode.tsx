"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { discardAll, getField, publishAll, saveField, type FieldInfo } from "@/cms/actions";
import { parseMark } from "@/cms/mark";
import { setIn } from "@/cms/paths";
import { useDismiss } from "@/components/forms/hooks";
import { getLenis } from "@/lib/motion";
import { FieldView } from "./DocForm";

/**
 * On-site edit mode (mounted by the site layout only for signed-in staff in
 * draft mode). Elements marked with data-cms="doc:path" get a hover outline;
 * clicking one opens a popover for that field. Saving writes the draft and
 * re-renders the page from the server. Alt/Option-click follows links.
 */

type Target = { doc: string; path: string; rect: DOMRect };

/** Kinds edited in /admin rather than in a popover. */
const ADMIN_ONLY = new Set(["images", "list"]);

function findMarked(x: number, y: number): HTMLElement | null {
  // Look through overlays (gradients, link cards) for the nearest marked element.
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest("[data-cms-ui]")) return null;
    const hit = el.closest<HTMLElement>("[data-cms]");
    if (hit) return hit;
  }
  return null;
}

function Popover({ target, onClose }: { target: Target; onClose: (saved: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState<FieldInfo | null>(null);
  const [value, setValue] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSave] = useTransition();
  const cancel = useCallback(() => onClose(false), [onClose]);
  useDismiss(ref, true, cancel);

  useEffect(() => {
    let live = true;
    getField(target.doc, target.path).then((res) => {
      if (!live) return;
      if (res.ok) {
        setInfo(res);
        setValue(res.value);
      } else setError(res.error);
    });
    return () => {
      live = false;
    };
  }, [target]);

  const done = () =>
    startSave(async () => {
      const res = await saveField(target.doc, target.path, value);
      if (res.ok) onClose(true);
      else {
        setError(res.error);
        // Issue paths are relative to the document; FieldView uses the same paths.
        setErrors(res.issues ?? {});
      }
    });

  // Place below the element if there's room, else above; clamp to the viewport.
  const width = Math.min(440, window.innerWidth - 24);
  const left = Math.min(Math.max(12, target.rect.left), window.innerWidth - width - 12);
  const below = target.rect.bottom + 12;
  const top = below + 360 < window.innerHeight ? below : Math.max(12, target.rect.top - 12 - 360);

  const adminOnly = info && ADMIN_ONLY.has(info.field.kind);

  return (
    <div
      ref={ref}
      data-cms-ui
      role="dialog"
      aria-label={info ? `Edit ${info.field.label}` : "Edit"}
      data-lenis-prevent
      className="fixed z-[300] max-h-[min(70svh,560px)] overflow-y-auto bg-ivory p-6 text-ink shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      style={{ left, top, width }}
    >
      <div className="eyebrow mb-5 flex items-center justify-between gap-4 text-bronze-deep">
        <span className="truncate">{info?.docLabel ?? "Loading…"}</span>
        {info && (
          <a href={info.adminHref} className="shrink-0 text-muted hover:text-ink">
            Open in editor ↗
          </a>
        )}
      </div>
      {!info && !error && <p className="text-sm text-muted">Loading…</p>}
      {info && adminOnly && (
        <div className="flex flex-col gap-5 text-sm">
          <p>
            <strong>{info.field.label}</strong> — add, reorder and remove these in the editor.
          </p>
          <a href={info.adminHref} className="btn btn-ink min-h-10 self-start px-6">
            <span>Open in editor</span>
          </a>
        </div>
      )}
      {info && !adminOnly && (
        <div className="flex flex-col gap-6">
          <FieldView
            field={info.field}
            path={target.path}
            value={value}
            // Groups report changes by sub-path ("address.line1"); apply them inside this field's value.
            onChange={(p, v) => setValue((prev: unknown) => (p === target.path ? v : setIn(prev, p.slice(target.path.length + 1), v)))}
            errors={errors}
          />
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-6">
            <button type="button" onClick={cancel} className="text-[11px] uppercase tracking-[0.18em] text-muted hover:text-ink">
              Cancel
            </button>
            <button type="button" onClick={done} disabled={saving} className="btn btn-ink min-h-10 px-6">
              <span>{saving ? "Saving…" : "Done"}</span>
            </button>
          </div>
        </div>
      )}
      {error && !info && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default function EditMode({ unpublished }: { unpublished: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [preview, setPreview] = useState(false);
  const [target, setTarget] = useState<Target | null>(null);
  const [hover, setHover] = useState<{ rect: DOMRect; label: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const raf = useRef(0);

  // Hover outline + click-to-edit (capture phase, so links and buttons don't fire).
  useEffect(() => {
    if (preview) return;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const el = e.altKey ? null : findMarked(e.clientX, e.clientY);
        setHover(el ? { rect: el.getBoundingClientRect(), label: parseMark(el.dataset.cms!).path.split(".").pop()! } : null);
      });
    };
    const click = (e: MouseEvent) => {
      if (e.altKey || (e.target as Element).closest("[data-cms-ui]")) return;
      const el = findMarked(e.clientX, e.clientY);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      setTarget({ ...parseMark(el.dataset.cms!), rect: el.getBoundingClientRect() });
    };
    const leave = () => setHover(null);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("click", click, true);
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("click", click, true);
      document.removeEventListener("pointerleave", leave);
    };
  }, [preview]);

  // Pause smooth scrolling while a popover is open.
  useEffect(() => {
    if (!target) return;
    getLenis()?.stop();
    return () => getLenis()?.start();
  }, [target]);

  const close = useCallback(
    (saved: boolean) => {
      setTarget(null);
      if (saved) {
        setMessage("Saved as draft");
        router.refresh();
      }
    },
    [router],
  );

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    start(async () => {
      const res = await fn();
      setMessage(res.ok ? ok : (res.error ?? "Something went wrong."));
      router.refresh();
    });

  return (
    <>
      {hover && !target && !preview && (
        <div
          aria-hidden="true"
          data-cms-ui
          className="pointer-events-none fixed z-[250] outline outline-2 outline-offset-2 outline-bronze"
          style={{ left: hover.rect.left, top: hover.rect.top, width: hover.rect.width, height: hover.rect.height }}
        >
          <span className="absolute -top-6 left-0 bg-bronze px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-ink">Edit</span>
        </div>
      )}
      {target && <Popover key={`${target.doc}:${target.path}`} target={target} onClose={close} />}

      <div data-cms-ui className="fixed inset-x-3 bottom-3 z-[260] flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-ink px-4 py-2.5 sm:px-5 sm:py-3 text-ivory shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
        <span className="flex items-center gap-3 text-sm">
          <span className="size-2 rounded-full bg-bronze-light" aria-hidden="true" />
          <span role="status">
            {message ?? (preview ? "Previewing drafts" : "Edit mode")} · {unpublished} unpublished
          </span>
        </span>
        <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.14em] sm:gap-5">
          <button type="button" onClick={() => setPreview((p) => !p)} className="hover:text-bronze-light">
            {preview ? "Edit" : "Preview"}
          </button>
          {unpublished > 0 && (
            <button type="button" disabled={busy} onClick={() => confirm("Discard all unpublished changes?") && run(discardAll, "Changes discarded")} className="text-champagne hover:text-ivory">
              Discard
            </button>
          )}
          <button type="button" disabled={busy || unpublished === 0} onClick={() => run(publishAll, "Published — live on the site")} className="btn btn-gold min-h-9 px-5">
            <span>{busy ? "Working…" : "Publish"}</span>
          </button>
          <a href="/admin" className="hover:text-bronze-light">
            Editor
          </a>
          <a href={`/api/edit/exit?to=${encodeURIComponent(pathname)}`} className="hover:text-bronze-light">
            Exit
          </a>
        </div>
      </div>
      {!preview && <p className="sr-only">Edit mode: click any outlined text or photo to change it. Hold Alt (Option) and click to follow a link.</p>}
    </>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Img } from "@/content/types";
import type { MediaFile } from "@/cms/media";
import { listLibrary } from "@/cms/media-actions";
import { describeStored } from "@/cms/image-prep";
import { MiniSelect } from "./inputs";
import { useEscape } from "@/components/forms/hooks";

/**
 * "Choose from library": pick photos already in storage instead of
 * uploading again. Rendered inline (not in a portal) so it also works inside
 * the on-site edit popover without counting as an outside click.
 */
export default function MediaPicker({
  multiple,
  exclude = [],
  onPick,
  onClose,
}: {
  multiple?: boolean;
  /** srcs already in the field (hidden from a multi-pick). */
  exclude?: string[];
  onPick: (imgs: Img[]) => void;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "unused">("all");
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    listLibrary().then((res) => {
      if (!live) return;
      if (res.ok) setFiles(res.files);
      else setError(res.error);
    });
    return () => {
      live = false;
    };
  }, []);

  // Escape closes the picker (not an edit popover beneath it); an open dropdown inside closes first.
  useEscape(true, onClose);
  useEffect(() => dialog.current?.focus(), []);

  const finish = async (urls: string[]) => {
    if (!files || !urls.length) return;
    setBusy(true);
    setError(null);
    try {
      const imgs = await Promise.all(
        urls.map(async (url): Promise<Img> => {
          const f = files.find((x) => x.url === url)!;
          const size = f.width && f.height ? { width: f.width, height: f.height, ...(f.blur ? { blur: f.blur } : {}) } : await describeStored(url);
          return { src: url, alt: f.alt ?? "", ...size };
        }),
      );
      onPick(imgs);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't use this photo.");
      setBusy(false);
    }
  };

  const shown = (files ?? []).filter((f) => !(multiple && exclude.includes(f.url)) && (filter === "all" || !f.usage.length));

  return (
    <div data-cms-ui className="fixed inset-0 z-[400] flex items-center justify-center bg-ink/60 p-3 sm:p-8" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Choose from library"
        data-lenis-prevent
        className="flex max-h-full w-full max-w-5xl flex-col bg-ivory text-ink shadow-2xl outline-none"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 px-5 py-4">
          <h2 className="font-serif text-2xl">Choose from library</h2>
          <div className="flex items-center gap-4 text-xs">
            <MiniSelect
              label="Show"
              value={filter}
              onChange={(v) => setFilter(v as "all" | "unused")}
              options={[
                { value: "all", label: "All photos" },
                { value: "unused", label: "Not used anywhere" },
              ]}
            />
            <button type="button" onClick={onClose} className="uppercase tracking-[0.18em] text-muted hover:text-ink">
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!files && !error && <p className="text-sm text-muted">Loading photos…</p>}
          {files && !shown.length && <p className="text-sm text-muted">No photos to show.</p>}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {shown.map((f) => {
              const on = chosen.includes(f.url);
              return (
                <li key={f.path}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => (multiple ? setChosen((c) => (on ? c.filter((u) => u !== f.url) : [...c, f.url])) : void finish([f.url]))}
                    aria-pressed={multiple ? on : undefined}
                    aria-label={`${f.alt || f.path.split("/").pop()}${f.usage.length ? " (in use)" : ""}`}
                    className={`relative block aspect-[4/3] w-full overflow-hidden bg-sand outline-offset-2 ${on ? "ring-2 ring-bronze ring-offset-2 ring-offset-ivory" : "hover:opacity-85"}`}
                  >
                    <Image src={f.url} alt="" fill sizes="200px" className="object-cover" />
                    {multiple && on && <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-bronze text-xs text-ink">✓</span>}
                    {!f.usage.length && <span className="absolute bottom-1.5 left-1.5 bg-ivory/90 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em]">Not used</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {(multiple || error) && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 px-5 py-4">
            <span role={error ? "alert" : undefined} className={`text-sm ${error ? "text-error" : "text-muted"}`}>
              {error ?? `${chosen.length} selected`}
            </span>
            {multiple && (
              <button type="button" disabled={busy || !chosen.length} onClick={() => void finish(chosen)} className="btn btn-ink min-h-10 px-6">
                <span>{busy ? "Adding…" : `Add ${chosen.length || ""} photo${chosen.length === 1 ? "" : "s"}`}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

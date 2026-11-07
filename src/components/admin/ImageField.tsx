"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import type { Img } from "@/content/types";
import { uploadPhoto } from "@/cms/upload";
import { MiniButton } from "./inputs";
import MediaPicker from "./MediaPicker";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif";

/** "40% 60%" → [40, 60] */
const parsePos = (p?: string): [number, number] => {
  const m = p?.match(/^([\d.]+)% ([\d.]+)%$/);
  return m ? [Number(m[1]), Number(m[2])] : [50, 50];
};

/** Photo preview where a click sets the focal point. */
export function FocalPreview({ image, onChange, className = "" }: { image: Img; onChange: (img: Img) => void; className?: string }) {
  const [x, y] = parsePos(image.position);
  const setFrom = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = Math.round(((e.clientX - r.left) / r.width) * 100);
    const py = Math.round(((e.clientY - r.top) / r.height) * 100);
    onChange({ ...image, position: `${Math.min(100, Math.max(0, px))}% ${Math.min(100, Math.max(0, py))}%` });
  };
  return (
    <button
      type="button"
      onClick={setFrom}
      title="Click the most important part of the photo. It stays in view when the photo is cropped."
      className={`relative block w-full cursor-crosshair overflow-hidden bg-sand ${className}`}
      style={{ aspectRatio: `${image.width} / ${image.height}` }}
    >
      <Image src={image.src} alt="" fill sizes="480px" className="object-contain" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ivory shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
        style={{ left: `${x}%`, top: `${y}%` }}
      />
    </button>
  );
}

export function AltInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="field">
      <span>
        <label htmlFor={id}>Description (for screen readers & search)</label>
      </span>
      <input id={id} type="text" maxLength={200} value={value} placeholder="e.g. Villa terrace among the gardens at sunset" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Hidden file input + trigger; shrinks and uploads in the browser. */
export function useUpload(onDone: (img: Img) => void, keep?: Partial<Img>) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const el = (
    <input
      ref={input}
      type="file"
      accept={ACCEPT}
      hidden
      onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setBusy(true);
        setError(null);
        try {
          onDone(await uploadPhoto(file, keep));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed.");
        } finally {
          setBusy(false);
        }
      }}
    />
  );
  return { open: () => input.current?.click(), busy, error, input: el };
}

export default function ImageField({
  label,
  value,
  onChange,
  optional,
  error,
}: {
  label: string;
  value: Img | null | undefined;
  onChange: (img: Img | null) => void;
  optional?: boolean;
  error?: string;
}) {
  const up = useUpload(onChange, value ?? undefined);
  const [picking, setPicking] = useState(false);
  const library = (
    <MiniButton onClick={() => setPicking(true)} disabled={up.busy}>
      Choose from library
    </MiniButton>
  );
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted">{label}</span>
      {value?.src ? (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,260px)_1fr]">
          <FocalPreview image={value} onChange={onChange} />
          <div className="flex flex-col gap-4">
            <AltInput value={value.alt} onChange={(alt) => onChange({ ...value, alt })} />
            <p className="text-xs leading-relaxed text-muted">Click the photo to set the focal point.</p>
            <div className="flex flex-wrap gap-5">
              <MiniButton onClick={up.open} disabled={up.busy}>
                {up.busy ? "Uploading…" : "Replace photo"}
              </MiniButton>
              {library}
              {optional && (
                <MiniButton danger onClick={() => onChange(null)}>
                  Remove
                </MiniButton>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button type="button" onClick={up.open} disabled={up.busy} className="flex h-36 items-center justify-center border border-dashed border-ink/30 text-sm text-muted hover:border-bronze">
            {up.busy ? "Uploading…" : "Upload a photo"}
          </button>
          <div>{library}</div>
        </div>
      )}
      {up.input}
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          // A library photo brings its own description if it has one; otherwise keep the current one.
          onPick={([img]) => onChange({ ...img, alt: img.alt || value?.alt || "" })}
        />
      )}
      {(up.error || error) && (
        <em role="alert" className="text-xs not-italic text-error">
          {up.error || error}
        </em>
      )}
    </div>
  );
}

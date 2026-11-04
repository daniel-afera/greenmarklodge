"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Img } from "@/content/types";
import { uploadPhoto } from "@/cms/upload";
import { AltInput, FocalPreview } from "./ImageField";
import { MiniButton } from "./inputs";
import MediaPicker from "./MediaPicker";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif";

function Tile({ img, selected, onSelect, onRemove }: { img: Img; selected: boolean; onSelect: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.src });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative aspect-square bg-sand ${isDragging ? "z-10 opacity-70" : ""} ${selected ? "ring-2 ring-bronze ring-offset-2 ring-offset-ivory" : ""}`}
    >
      <button type="button" className="absolute inset-0 cursor-grab active:cursor-grabbing" {...attributes} {...listeners} onClick={onSelect} aria-label={`Photo: ${img.alt || "no description"}. Drag to reorder, click to edit.`}>
        <Image src={img.src} alt="" fill sizes="160px" className="object-cover" style={{ objectPosition: img.position }} />
      </button>
      {!img.alt && <span className="pointer-events-none absolute bottom-1 left-1 bg-ink/80 px-1.5 py-0.5 text-[10px] text-ivory">No description</span>}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute right-1 top-1 hidden size-7 items-center justify-center bg-ink/80 text-ivory group-hover:flex group-focus-within:flex"
      >
        ×
      </button>
    </li>
  );
}

export default function GalleryField({ label, value, onChange, max = 100, error }: { label: string; value: Img[]; onChange: (v: Img[]) => void; max?: number; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onFiles = async (files: File[]) => {
    const room = Math.max(0, max - value.length);
    const list = files.slice(0, room);
    const errs: string[] = files.length > room ? [`Only ${room} more photo(s) fit here.`] : [];
    setProgress({ done: 0, total: list.length });
    // Uploads finish one by one; append each to the list as it was when they started.
    let current = value;
    for (const [i, file] of list.entries()) {
      try {
        const img = await uploadPhoto(file);
        current = [...current, img];
        onChange(current);
      } catch (err) {
        errs.push(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    setProblems(errs);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = value.findIndex((i) => i.src === active.id);
    const to = value.findIndex((i) => i.src === over.id);
    onChange(arrayMove(value, from, to));
  };

  const sel = value.find((i) => i.src === selected);
  const update = (img: Img) => onChange(value.map((i) => (i.src === img.src ? img : i)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted">
          {label} · {value.length}
        </span>
        <div className="flex flex-wrap justify-end gap-5">
          <MiniButton onClick={() => setPicking(true)} disabled={!!progress || value.length >= max}>
            Choose from library
          </MiniButton>
          <MiniButton onClick={() => input.current?.click()} disabled={!!progress || value.length >= max}>
            {progress ? `Uploading ${progress.done + 1 > progress.total ? progress.total : progress.done + 1} of ${progress.total}…` : "Add photos"}
          </MiniButton>
        </div>
      </div>
      {picking && (
        <MediaPicker
          multiple
          exclude={value.map((i) => i.src)}
          onClose={() => setPicking(false)}
          onPick={(imgs) => {
            const room = Math.max(0, max - value.length);
            if (imgs.length > room) setProblems([`Only ${room} more photo(s) fit here.`]);
            onChange([...value, ...imgs.slice(0, room)]);
          }}
        />
      )}
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) void onFiles(files);
        }}
      />
      {progress && (
        <div className="h-0.5 w-full bg-ink/10" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
          <div className="h-full bg-bronze transition-[width]" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} />
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value.map((i) => i.src)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {value.map((img) => (
              <Tile
                key={img.src}
                img={img}
                selected={img.src === selected}
                onSelect={() => setSelected(img.src === selected ? null : img.src)}
                onRemove={() => {
                  onChange(value.filter((i) => i.src !== img.src));
                  if (selected === img.src) setSelected(null);
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {!value.length && <p className="text-sm text-muted">No photos yet.</p>}
      {sel && (
        <div className="grid gap-4 border border-ink/10 p-4 sm:grid-cols-[minmax(0,260px)_1fr]">
          <FocalPreview image={sel} onChange={update} />
          <div className="flex flex-col gap-4">
            <AltInput value={sel.alt} onChange={(alt) => update({ ...sel, alt })} />
            <p className="text-xs text-muted">Click the photo to set the focal point. Drag tiles to reorder.</p>
          </div>
        </div>
      )}
      {[...problems, ...(error ? [error] : [])].map((p) => (
        <em key={p} role="alert" className="text-xs not-italic text-error">
          {p}
        </em>
      ))}
    </div>
  );
}

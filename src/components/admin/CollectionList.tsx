"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createItem, deleteForever, deleteItem, reorder, restoreItem } from "@/cms/actions";
import type { Img } from "@/content/types";
import { useConfirm } from "@/components/ui/useConfirm";

export type ListItem = { id: string; title: string; image?: Img; status: "published" | "changed" | "new" };

const STATUS = { published: "Published", changed: "Unpublished changes", new: "Not published yet" };

function Row({ item, onDelete, busy }: { item: ListItem; onDelete: () => void; busy: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-4 border-b border-ink/10 bg-ivory py-3 ${isDragging ? "relative z-10 shadow-lg" : ""}`}>
      <button type="button" {...attributes} {...listeners} aria-label={`Reorder ${item.title}`} className="cursor-grab px-2 text-lg text-muted active:cursor-grabbing">
        ⋮⋮
      </button>
      <div className="relative size-14 shrink-0 overflow-hidden bg-sand">
        {item.image?.src && <Image src={item.image.src} alt="" fill sizes="56px" className="object-cover" style={{ objectPosition: item.image.position }} />}
      </div>
      <Link href={`/admin/edit/${item.id}`} className="min-w-0 flex-1">
        <span className="block truncate font-serif text-xl hover:text-bronze-deep">{item.title}</span>
        <span className={`text-xs ${item.status === "published" ? "text-muted" : "text-bronze-deep"}`}>{STATUS[item.status]}</span>
      </Link>
      <button type="button" disabled={busy} onClick={onDelete} className="text-[11px] uppercase tracking-[0.18em] text-error hover:underline disabled:opacity-40">
        Delete
      </button>
    </li>
  );
}

export type DeletedItem = { id: string; title: string; image?: Img; deletedAt: string };

const DAY = 86_400_000;
const daysAgo = (iso: string, now: number) => {
  const d = Math.floor((now - new Date(iso).getTime()) / DAY);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

export default function CollectionList({
  type,
  singular,
  items: initial,
  deleted: initialDeleted,
  keepDays,
  canPurge,
}: {
  type: string;
  singular: string;
  items: ListItem[];
  deleted: DeletedItem[];
  keepDays: number;
  canPurge: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [deleted, setDeleted] = useState(initialDeleted);
  // Fresh server data (after a refresh) replaces local state without remounting,
  // so the Undo banner survives the refresh that a delete triggers.
  const [synced, setSynced] = useState({ initial, initialDeleted });
  if (synced.initial !== initial || synced.initialDeleted !== initialDeleted) {
    setSynced({ initial, initialDeleted });
    setItems(initial);
    setDeleted(initialDeleted);
  }
  const [undo, setUndo] = useState<ListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [ask, confirmDialog] = useConfirm();
  const [now] = useState(() => Date.now());
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const next = arrayMove(items, items.findIndex((i) => i.id === active.id), items.findIndex((i) => i.id === over.id));
    setItems(next);
    start(async () => {
      const res = await reorder(type, next.map((i) => i.id));
      setError(res.ok ? null : res.error);
    });
  };

  const add = () =>
    start(async () => {
      const res = await createItem(type);
      if (res.ok) router.push(`/admin/edit/${res.id}`);
      else setError(res.error);
    });

  // No confirmation: deleting is undoable (banner below, and "Recently deleted").
  const remove = (item: ListItem) =>
    start(async () => {
      const res = await deleteItem(item.id);
      if (!res.ok) return setError(res.error);
      setError(null);
      setItems((list) => list.filter((i) => i.id !== item.id));
      setDeleted((list) => [{ id: item.id, title: item.title, image: item.image, deletedAt: new Date().toISOString() }, ...list]);
      setUndo(item);
    });

  // Restoring re-renders from the server, which puts the item back in its old place.
  const restore = (id: string) =>
    start(async () => {
      const res = await restoreItem(id);
      if (!res.ok) return setError(res.error);
      setUndo((u) => (u?.id === id ? null : u));
      router.refresh();
    });

  const purge = async (item: DeletedItem) => {
    if (!(await ask({ title: `Delete “${item.title}” for good?`, message: "It can't be restored after this.", confirmLabel: "Delete for good", danger: true }))) return;
    start(async () => {
      const res = await deleteForever(item.id);
      if (!res.ok) return setError(res.error);
      setDeleted((list) => list.filter((i) => i.id !== item.id));
      setUndo((u) => (u?.id === item.id ? null : u)); // nothing left to undo
    });
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">Drag to reorder. Order and deletions apply to the site immediately.</p>
        <button type="button" onClick={add} disabled={busy} className="btn btn-ink min-h-10 shrink-0 px-6">
          <span>Add {singular}</span>
        </button>
      </div>
      {undo && (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-bronze/60 bg-champagne/25 px-4 py-3 text-sm">
          <span>
            Deleted “{undo.title}”. It&apos;s gone from the site.
          </span>
          <span className="flex items-center gap-5">
            <button type="button" disabled={busy} onClick={() => restore(undo.id)} className="text-[11px] font-medium uppercase tracking-[0.18em] text-bronze-deep hover:underline">
              Undo
            </button>
            <button type="button" onClick={() => setUndo(null)} aria-label="Dismiss" className="text-muted hover:text-ink">
              ×
            </button>
          </span>
        </div>
      )}
      {error && (
        <p role="alert" className="mb-4 text-sm text-error">
          {error}
        </p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="border-t border-ink/10">
            {items.map((item) => (
              <Row key={item.id} item={item} busy={busy} onDelete={() => remove(item)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {confirmDialog}
      {!items.length && <p className="py-10 text-center text-muted">Nothing here yet. While the list is empty, the site shows the built-in placeholder content.</p>}

      {deleted.length > 0 && (
        <section aria-labelledby="recently-deleted" className="mt-16">
          <h2 id="recently-deleted" className="mb-1 font-serif text-2xl">
            Recently deleted
          </h2>
          <p className="mb-4 text-sm text-muted">Restore puts an item back where it was. Deleted items are removed for good after {keepDays} days.</p>
          <ul className="border-t border-ink/10">
            {deleted.map((d) => (
              <li key={d.id} className="flex items-center gap-4 border-b border-ink/10 py-3">
                <div className="relative size-12 shrink-0 overflow-hidden bg-sand opacity-70">
                  {d.image?.src && <Image src={d.image.src} alt="" fill sizes="48px" className="object-cover grayscale" style={{ objectPosition: d.image.position }} />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-lg text-muted">{d.title}</span>
                  <span className="text-xs text-muted">Deleted {daysAgo(d.deletedAt, now)}</span>
                </div>
                <button type="button" disabled={busy} onClick={() => restore(d.id)} className="text-[11px] uppercase tracking-[0.18em] text-bronze-deep hover:underline disabled:opacity-40">
                  Restore
                </button>
                {canPurge && (
                  <button type="button" disabled={busy} onClick={() => void purge(d)} className="text-[11px] uppercase tracking-[0.18em] text-error hover:underline disabled:opacity-40">
                    Delete for good
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

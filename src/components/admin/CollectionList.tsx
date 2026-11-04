"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createItem, deleteItem, reorder } from "@/cms/actions";
import type { Img } from "@/content/types";

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

export default function CollectionList({ type, singular, items: initial }: { type: string; singular: string; items: ListItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
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

  const remove = (item: ListItem) => {
    if (!confirm(`Delete “${item.title}”? It disappears from the site immediately.`)) return;
    start(async () => {
      const res = await deleteItem(item.id);
      if (res.ok) setItems((list) => list.filter((i) => i.id !== item.id));
      else setError(res.error);
    });
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted">Drag to reorder. Order and deletions apply to the site immediately.</p>
        <button type="button" onClick={add} disabled={busy} className="btn btn-ink min-h-10 px-6">
          <span>Add {singular}</span>
        </button>
      </div>
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
      {!items.length && <p className="py-10 text-center text-muted">Nothing here yet. While the list is empty, the site shows the built-in placeholder content.</p>}
    </div>
  );
}

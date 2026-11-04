"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { MediaFile } from "@/cms/media";
import { deleteMedia } from "@/cms/media-actions";
import { MiniButton, MiniSelect } from "./inputs";
import { useConfirm } from "@/components/ui/useConfirm";

export const formatBytes = (n: number) =>
  n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(2)} GB` : n >= 1024 ** 2 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "");

type Filter = "all" | "used" | "unused";
type Sort = "newest" | "largest";

function StorageBar({ used, limit, unusedBytes, unusedCount, count }: { used: number; limit: number; unusedBytes: number; unusedCount: number; count: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  const tone = pct >= 90 ? "bg-error" : pct >= 75 ? "bg-amber-600" : "bg-bronze";
  return (
    <section aria-label="Storage" className="mb-10 border border-ink/10 p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-serif text-2xl">
          {formatBytes(used)} <span className="text-base text-muted">of {formatBytes(limit)} used</span>
        </p>
        <p className="text-sm text-muted">{pct < 1 && used > 0 ? "under 1%" : `${Math.round(pct)}%`}</p>
      </div>
      <div className="h-2 w-full bg-ink/10" role="meter" aria-label="Storage used" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used}>
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(pct, used > 0 ? 0.5 : 0)}%` }} />
      </div>
      <p className="mt-3 text-sm text-muted">
        {count} photo{count === 1 ? "" : "s"}
        {unusedCount > 0 ? ` · ${unusedCount} not used (${formatBytes(unusedBytes)})` : " · all in use"}
      </p>
    </section>
  );
}

function Tile({ file, canDelete, selected, onToggle, onDelete, busy }: { file: MediaFile; canDelete: boolean; selected: boolean; onToggle: () => void; onDelete: () => void; busy: boolean }) {
  const used = file.usage.length > 0;
  return (
    <li className={`flex flex-col border bg-ivory ${selected ? "border-bronze ring-1 ring-bronze" : "border-ink/10"}`}>
      <a href={file.url} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] bg-sand" title="Open full size">
        <Image src={file.url} alt={file.alt ?? ""} fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover" />
        <span className={`absolute left-2 top-2 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] ${used ? "bg-ink/80 text-ivory" : "bg-ivory/90 text-ink"}`}>
          {used ? "In use" : "Not used"}
        </span>
      </a>
      <div className="flex flex-1 flex-col gap-2 p-3 text-xs">
        <div className="flex justify-between gap-2 text-muted">
          <span>{formatBytes(file.size)}</span>
          <span>{fmtDate(file.createdAt)}</span>
        </div>
        {used ? (
          <ul className="flex flex-col gap-1">
            {file.usage.map((u) => (
              <li key={`${u.rowId}:${u.field}`}>
                <Link href={`/admin/edit/${u.rowId}`} className="text-ink underline-offset-2 hover:underline">
                  {u.page}
                </Link>
                <span className="text-muted">
                  {" "}
                  → {u.field}
                  {u.state !== "live" && <em className="not-italic text-bronze-deep"> ({u.state === "draft" ? "unpublished" : "live + unpublished"})</em>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          canDelete && (
            <div className="mt-auto flex items-center justify-between gap-3 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-muted">
                <input type="checkbox" checked={selected} onChange={onToggle} className="accent-bronze" />
                Select
              </label>
              <MiniButton danger onClick={onDelete} disabled={busy}>
                Delete
              </MiniButton>
            </div>
          )
        )}
      </div>
    </li>
  );
}

export default function MediaManager({ files, limit, canDelete }: { files: MediaFile[]; limit: number; canDelete: boolean }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, start] = useTransition();
  const [ask, confirmDialog] = useConfirm();

  const unused = files.filter((f) => !f.usage.length);
  const used = files.reduce((n, f) => n + f.size, 0);
  const unusedBytes = unused.reduce((n, f) => n + f.size, 0);

  const shown = useMemo(() => {
    const list = files.filter((f) => (filter === "all" ? true : filter === "used" ? f.usage.length > 0 : f.usage.length === 0));
    return sort === "largest" ? [...list].sort((a, b) => b.size - a.size) : list;
  }, [files, filter, sort]);

  const remove = async (paths: string[], what: string) => {
    if (!paths.length || !(await ask({ title: `Delete ${what}?`, message: "Deleted photos can't be recovered.", confirmLabel: "Delete", danger: true }))) return;
    start(async () => {
      const res = await deleteMedia(paths);
      if (res.ok) {
        setMessage({ text: `Deleted ${res.deleted} photo${res.deleted === 1 ? "" : "s"}.${res.skipped ? ` ${res.skipped} skipped because they're now in use.` : ""}` });
        setSelected(new Set());
        router.refresh();
      } else setMessage({ text: res.error, error: true });
    });
  };

  const toggle = (path: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const tabs: [Filter, string, number][] = [
    ["all", "All", files.length],
    ["used", "In use", files.length - unused.length],
    ["unused", "Not used", unused.length],
  ];

  return (
    <>
      {confirmDialog}
      <StorageBar used={used} limit={limit} unusedBytes={unusedBytes} unusedCount={unused.length} count={files.length} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Show" className="flex flex-wrap gap-2">
          {tabs.map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.14em] ${filter === key ? "border-ink bg-ink text-ivory" : "border-ink/20 hover:border-ink"}`}
            >
              {label} · {n}
            </button>
          ))}
        </div>
        <MiniSelect
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "largest", label: "Largest first" },
          ]}
        />
      </div>

      {canDelete && unused.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {selected.size > 0 && (
            <button type="button" disabled={busy} onClick={() => remove([...selected], `${selected.size} selected photo${selected.size === 1 ? "" : "s"}`)} className="btn btn-ink min-h-10 px-5">
              <span>Delete selected ({selected.size})</span>
            </button>
          )}
          <MiniButton danger disabled={busy} onClick={() => remove(unused.map((f) => f.path), `all ${unused.length} unused photos (${formatBytes(unusedBytes)})`)}>
            Delete all unused ({unused.length})
          </MiniButton>
        </div>
      )}

      {message && (
        <p role="status" className={`mb-6 text-sm ${message.error ? "text-error" : "text-ink"}`}>
          {message.text}
        </p>
      )}

      {shown.length ? (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((f) => (
            <Tile
              key={f.path}
              file={f}
              canDelete={canDelete}
              busy={busy}
              selected={selected.has(f.path)}
              onToggle={() => toggle(f.path)}
              onDelete={() => remove([f.path], "this photo")}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{filter === "unused" ? "Every photo is in use." : "No photos yet."}</p>
      )}
    </>
  );
}

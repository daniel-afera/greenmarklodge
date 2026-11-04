import Link from "next/link";
import { requireUser } from "@/cms/auth";
import { rowLabel } from "@/cms/labels";
import { unpublishedRows } from "@/cms/store";

export const metadata = { title: "Unpublished changes" };

export default async function AdminHome() {
  const staff = await requireUser();
  const rows = await unpublishedRows();
  return (
    <div className="max-w-3xl">
      <div className="eyebrow mb-3 text-bronze-deep">Welcome{staff.name ? `, ${staff.name}` : ""}</div>
      <h1 className="display mb-6 text-5xl">Unpublished changes</h1>
      <p className="mb-10 max-w-xl text-sm leading-relaxed text-muted">
        Edits are saved as drafts automatically. Visitors only see them after you publish. Use <strong>Edit on the site</strong> in the menu to change text and photos right on the
        page.
      </p>
      {rows.length ? (
        <ul className="border-t border-ink/10">
          {rows.map((r) => (
            <li key={r.id} className="border-b border-ink/10">
              <Link href={`/admin/edit/${r.id}`} className="flex items-center justify-between py-4 hover:text-bronze-deep">
                <span className="font-serif text-xl">{rowLabel(r)}</span>
                <span className="text-xs text-muted">{r.published ? "Changed" : "New"}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-y border-ink/10 py-10 text-center text-muted">Everything is published.</p>
      )}
    </div>
  );
}

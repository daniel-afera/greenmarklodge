import { SHOW_EDIT_ON_SITE } from "@/cms/flags";
import Link from "next/link";
import { requireUser } from "@/cms/auth";
import { rowLabel } from "@/cms/labels";
import { db, unpublishedRows } from "@/cms/store";

export const metadata = { title: "Unpublished changes" };

export default async function AdminHome() {
  const staff = await requireUser();
  const rows = await unpublishedRows();
  return (
    <div className="max-w-3xl">
      <div className="eyebrow mb-3 text-bronze-deep">Welcome{staff.name ? `, ${staff.name}` : ""}</div>
      <h1 className="display mb-6 text-5xl">Unpublished changes</h1>
      <p className="mb-10 max-w-xl text-sm leading-relaxed text-muted">
        Edits are saved as drafts automatically. Visitors only see them after you publish.
        {SHOW_EDIT_ON_SITE && (
          <>
            {" "}Use <strong>Edit on the site</strong> in the menu to change text and photos right on the page.
          </>
        )}
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
      <KeepAlive />
    </div>
  );
}

/** Older than this, the daily cron has missed at least two runs. */
const STALE_MS = 3 * 86_400_000;

function ago(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "less than an hour ago";
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"} ago`;
  return `${Math.floor(h / 24)} days ago`;
}

/** Last run of the daily database keep-alive (see /api/keepalive). */
async function KeepAlive() {
  const { data } = await db().from("keepalive").select("pinged_at").eq("id", 1).maybeSingle<{ pinged_at: string | null }>();
  const at = data?.pinged_at ? new Date(data.pinged_at).getTime() : null;
  // eslint-disable-next-line react-hooks/purity -- server component, rendered per request
  const age = at === null ? null : Date.now() - at;
  const stale = age !== null && age > STALE_MS;
  return (
    <p data-testid="keepalive" className={`mt-12 text-xs leading-relaxed ${stale ? "text-amber-700" : "text-muted"}`}>
      Database keep-alive:{" "}
      {age === null ? (
        "no ping yet. It runs daily once the site is live on Vercel."
      ) : stale ? (
        <>
          last ping {ago(age)}. The daily check isn&apos;t running, so the free database may pause after a week without activity. Check the Cron Jobs tab in Vercel.
        </>
      ) : (
        `last ping ${ago(age)}.`
      )}
    </p>
  );
}

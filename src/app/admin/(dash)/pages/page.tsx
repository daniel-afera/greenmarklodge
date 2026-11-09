import Link from "next/link";
import { requireUser } from "@/cms/auth";
import { singletons } from "@/cms/fields";
import { unpublishedRows } from "@/cms/store";

export const metadata = { title: "Pages" };

const PAGES = ["homePage", "roomsPage", "diningPage", "eventsPage", "gardensPage", "experiencesPage", "contactPage"] as const;

export default async function PagesList() {
  await requireUser();
  const changed = new Set((await unpublishedRows()).map((r) => r.id));
  return (
    <div className="max-w-3xl">
      <h1 className="display mb-10 text-5xl">Pages</h1>
      <ul className="border-t border-ink/10">
        {PAGES.map((id) => (
          <li key={id} className="border-b border-ink/10">
            <Link href={`/admin/edit/${id}`} className="flex items-center justify-between py-4 hover:text-bronze-deep">
              <span className="font-serif text-xl">{singletons[id].label}</span>
              {changed.has(id) && <span className="text-xs text-bronze-deep">Unpublished changes</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireUser } from "@/cms/auth";
import { collections, isCollection } from "@/cms/fields";
import { rowLabel } from "@/cms/labels";
import { KEEP_DELETED_DAYS, listDeleted, listRows, working } from "@/cms/store";
import type { Img } from "@/content/types";
import CollectionList, { type DeletedItem, type ListItem } from "@/components/admin/CollectionList";

export default async function ListPage({ params }: PageProps<"/admin/list/[type]">) {
  const staff = await requireUser();
  const { type } = await params;
  if (!isCollection(type)) notFound();
  const c = collections[type];
  const [rows, gone] = await Promise.all([listRows(type), listDeleted(type)]);
  const thumb = (r: (typeof rows)[number]) => {
    const v = working(r) as { image?: Img; images?: Img[] };
    return v.image ?? v.images?.[0];
  };

  const items: ListItem[] = rows.map((r) => ({
    id: r.id,
    title: rowLabel(r),
    image: thumb(r),
    status: r.published === null ? "new" : r.draft !== null ? "changed" : "published",
  }));
  const deleted: DeletedItem[] = gone.map((r) => ({ id: r.id, title: rowLabel(r), image: thumb(r), deletedAt: r.deleted_at! }));

  return (
    <>
      <h1 className="display mb-8 text-5xl">{c.label}</h1>
      <CollectionList
        key={type}
        type={type}
        singular={c.singular}
        items={items}
        deleted={deleted}
        keepDays={KEEP_DELETED_DAYS}
        canPurge={staff.role === "owner"}
      />
    </>
  );
}

export async function generateMetadata({ params }: PageProps<"/admin/list/[type]">) {
  const { type } = await params;
  return { title: isCollection(type) ? collections[type].label : "List" };
}

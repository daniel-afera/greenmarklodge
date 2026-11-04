import { notFound } from "next/navigation";
import { requireUser } from "@/cms/auth";
import { collections, isCollection } from "@/cms/fields";
import { rowLabel } from "@/cms/labels";
import { listRows, working } from "@/cms/store";
import type { Img } from "@/content/types";
import CollectionList, { type ListItem } from "@/components/admin/CollectionList";

export default async function ListPage({ params }: PageProps<"/admin/list/[type]">) {
  await requireUser();
  const { type } = await params;
  if (!isCollection(type)) notFound();
  const c = collections[type];
  const rows = await listRows(type);

  const items: ListItem[] = rows.map((r) => {
    const v = working(r) as { image?: Img; images?: Img[] };
    return {
      id: r.id,
      title: rowLabel(r),
      image: v.image ?? v.images?.[0],
      status: r.published === null ? "new" : r.draft !== null ? "changed" : "published",
    };
  });

  return (
    <>
      <h1 className="display mb-8 text-5xl">{c.label}</h1>
      <CollectionList key={rows.map((r) => r.id).join()} type={type} singular={c.singular} items={items} />
    </>
  );
}

export async function generateMetadata({ params }: PageProps<"/admin/list/[type]">) {
  const { type } = await params;
  return { title: isCollection(type) ? collections[type].label : "List" };
}

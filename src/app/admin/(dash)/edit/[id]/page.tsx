import { notFound } from "next/navigation";
import { requireUser } from "@/cms/auth";
import { fieldsFor, isCollection, isSingleton } from "@/cms/fields";
import { rowHref, rowLabel } from "@/cms/labels";
import { db, getRow, working } from "@/cms/store";
import { withFallback } from "@/content";
import DocForm from "@/components/admin/DocForm";

export const metadata = { title: "Edit" };

export default async function EditPage({ params }: PageProps<"/admin/edit/[id]">) {
  await requireUser();
  const { id } = await params;
  let row = await getRow(id);

  // A page that was never saved: start it from the built-in content.
  if (!row && isSingleton(id)) {
    await db().from("content").insert({ id, type: "singleton", published: null, draft: withFallback(id, {}) });
    row = await getRow(id);
  }
  if (!row) notFound();
  const fields = fieldsFor(row);
  if (!fields) notFound();

  const value = (row.type === "singleton" ? withFallback(id, working(row)) : working(row)) as Record<string, unknown>;
  const back = isCollection(row.type) ? `/admin/list/${row.type}` : id === "siteSettings" || id === "galleryPage" ? undefined : "/admin/pages";

  return (
    <DocForm
      // Stable across autosaves (each save re-renders this page); keeps focus and typing.
      key={row.id}
      id={row.id}
      title={rowLabel(row)}
      fields={fields}
      initial={value}
      hasDraft={row.draft !== null}
      isPublished={row.published !== null}
      viewHref={rowHref(row)}
      backHref={back}
    />
  );
}

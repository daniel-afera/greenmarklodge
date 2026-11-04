import { requireUser } from "@/cms/auth";
import { getLibrary, STORAGE_LIMIT } from "@/cms/media";
import MediaManager from "@/components/admin/MediaManager";

export const metadata = { title: "Photos" };

export default async function MediaPage() {
  const staff = await requireUser();
  const files = await getLibrary();
  return (
    <div className="max-w-6xl">
      <h1 className="display mb-4 text-5xl">Photos</h1>
      <p className="mb-10 max-w-2xl text-sm leading-relaxed text-muted">
        Every photo uploaded to the site. A photo is <strong>in use</strong> if a published page or an unpublished change shows it. Replaced or removed photos stay here until
        they&apos;re deleted{staff.role === "owner" ? "" : " by an owner"}.
      </p>
      <MediaManager files={files} limit={STORAGE_LIMIT} canDelete={staff.role === "owner"} />
    </div>
  );
}

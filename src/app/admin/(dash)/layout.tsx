import { requireUser } from "@/cms/auth";
import { collections, singletons, type CollectionType } from "@/cms/fields";
import { unpublishedRows } from "@/cms/store";
import { getSettings } from "@/content";
import PublishAll from "@/components/admin/PublishAll";
import Sidebar, { type NavItem } from "@/components/admin/Sidebar";

const LIST_ORDER: CollectionType[] = ["room", "experience", "venue", "testimonial"];
const PAGE_IDS = Object.keys(singletons).filter((id) => id !== "siteSettings" && id !== "galleryPage");

export default async function DashLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireUser();
  const [rows, settings] = await Promise.all([unpublishedRows(), getSettings()]);
  const countWhere = (pred: (r: (typeof rows)[number]) => boolean) => rows.filter(pred).length;

  const items: NavItem[] = [
    { href: "/admin", label: `Unpublished`, count: rows.length },
    { href: "/admin/pages", label: "Pages", count: countWhere((r) => PAGE_IDS.includes(r.id)) },
    ...LIST_ORDER.map((t) => ({ href: `/admin/list/${t}`, label: collections[t].label, count: countWhere((r) => r.type === t) })),
    { href: "/admin/edit/galleryPage", label: "Gallery", count: countWhere((r) => r.id === "galleryPage") },
    { href: "/admin/media", label: "Photos" },
    { href: "/admin/edit/siteSettings", label: "Settings", count: countWhere((r) => r.id === "siteSettings") },
    ...(staff.role === "owner" ? [{ href: "/admin/staff", label: "Staff" }] : []),
  ];

  return (
    <>
      <Sidebar items={items} name={staff.name} role={staff.role} siteName={settings.name} />
      {/* Room for the fixed "Publish all" bar, so it never covers the last row of content. */}
      <main className={`px-5 py-8 sm:px-10 lg:ml-64 lg:py-10 ${rows.length ? "pb-32 lg:pb-32" : ""}`}>{children}</main>
      <PublishAll count={rows.length} />
    </>
  );
}

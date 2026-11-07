import type { Metadata } from "next";
import { MotionConfig } from "motion/react";
import { getMenuPreviews, getRoomOptions, getSettings, isEditing } from "@/content";
import { fullName } from "@/lib/site";
import { hotelJsonLd, jsonLdString, pageMeta } from "@/lib/seo";
import { unpublishedRows } from "@/cms/store";
import EditMode from "@/components/admin/EditMode";
import { SiteProvider } from "@/components/layout/SiteContext";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Preloader from "@/components/layout/Preloader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Cursor from "@/components/layout/Cursor";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const full = fullName(s);
  // Pages override title, canonical and share card via pageMeta(); these are the defaults.
  return {
    ...pageMeta(s, { path: "/" }),
    title: { default: `${full} — ${s.address.line1}, ${s.address.country}`, template: `%s · ${full}` },
    applicationName: full,
  };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, menuPreviews, editing, rooms] = await Promise.all([getSettings(), getMenuPreviews(), isEditing(), getRoomOptions()]);
  const unpublished = editing ? (await unpublishedRows()).length : 0;
  return (
    <SiteProvider value={{ settings, menuPreviews, editing }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(hotelJsonLd(settings, rooms)) }} />
      <MotionConfig reducedMotion="user">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-ivory focus:px-4 focus:py-2">
          Skip to content
        </a>
        <SmoothScroll />
        {!editing && <Preloader />}
        <Header />
        <main id="main">{children}</main>
        <Footer settings={settings} />
        {editing ? <EditMode unpublished={unpublished} /> : <Cursor />}
      </MotionConfig>
    </SiteProvider>
  );
}

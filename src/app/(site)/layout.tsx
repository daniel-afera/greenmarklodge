import type { Metadata } from "next";
import { MotionConfig } from "motion/react";
import { getMenuPreviews, getSettings } from "@/content";
import { SiteProvider } from "@/components/layout/SiteContext";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Preloader from "@/components/layout/Preloader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Cursor from "@/components/layout/Cursor";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const full = `${s.name} Lodge`;
  return {
    title: { default: `${full} — ${s.address.line1}, ${s.address.country}`, template: `%s · ${full}` },
    description: s.description,
    openGraph: { title: full, description: s.description, images: s.shareImage ? [s.shareImage.src] : undefined },
  };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, menuPreviews] = await Promise.all([getSettings(), getMenuPreviews()]);
  return (
    <SiteProvider value={{ settings, menuPreviews }}>
      <MotionConfig reducedMotion="user">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-ivory focus:px-4 focus:py-2">
          Skip to content
        </a>
        <SmoothScroll />
        <Preloader />
        <Header />
        <main id="main">{children}</main>
        <Footer settings={settings} />
        <Cursor />
      </MotionConfig>
    </SiteProvider>
  );
}

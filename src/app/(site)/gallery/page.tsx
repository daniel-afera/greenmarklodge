import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import { getGalleryPage, getSettings } from "@/content";
import { pageMeta } from "@/lib/seo";
import GalleryGrid from "./GalleryGrid";

export async function generateMetadata(): Promise<Metadata> {
  const [p, s] = await Promise.all([getGalleryPage(), getSettings()]);
  return pageMeta(s, { title: p.hero.eyebrow, description: p.hero.text, path: "/gallery", image: p.hero.image });
}

export default async function GalleryPage() {
  const page = await getGalleryPage();
  return (
    <>
      <PageHero hero={page.hero} doc="galleryPage" />
      <div className="pt-[clamp(64px,8vw,120px)]">
        <GalleryGrid images={page.images} />
      </div>
    </>
  );
}

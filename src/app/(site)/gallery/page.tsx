import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import { getGalleryPage } from "@/content";
import GalleryGrid from "./GalleryGrid";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getGalleryPage();
  return { title: p.hero.eyebrow };
}

export default async function GalleryPage() {
  const page = await getGalleryPage();
  return (
    <>
      <PageHero hero={page.hero} />
      <div className="pt-[clamp(64px,8vw,120px)]">
        <GalleryGrid images={page.images} />
      </div>
    </>
  );
}

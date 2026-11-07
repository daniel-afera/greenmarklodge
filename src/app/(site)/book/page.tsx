import type { Metadata } from "next";
import { Suspense } from "react";
import BookingWizard from "@/components/booking/BookingWizard";
import DatesIntro from "@/components/booking/DatesIntro";
import { getRoomOptions, getSettings } from "@/content";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [s, rooms] = await Promise.all([getSettings(), getRoomOptions()]);
  return pageMeta(s, { title: "Request a booking", description: "Send a booking request to our reception team.", path: "/book", image: rooms[0]?.image });
}

/**
 * The wizard reads the URL (?room=…&checkin=…), so it renders in the browser.
 * Until then this server-rendered placeholder keeps the same layout and the
 * real first heading, so the HTML has an <h1> for search engines.
 */
function Placeholder() {
  return (
    <div className="flex min-h-svh flex-wrap">
      <div aria-hidden="true" className="hidden min-h-svh flex-[1_1_420px] bg-ink lg:block" />
      <div className="flex min-w-0 flex-[999_1_600px] flex-col px-[clamp(20px,5vw,88px)] pt-28 [@media(max-height:800px)]:pt-24">
        <div aria-hidden="true" className="mb-8 h-[30px] border-t-2 border-ink/10 [@media(max-height:800px)]:mb-5" />
        <DatesIntro />
      </div>
    </div>
  );
}

export default async function BookPage() {
  const rooms = await getRoomOptions();
  return (
    <Suspense fallback={<Placeholder />}>
      <BookingWizard rooms={rooms} />
    </Suspense>
  );
}

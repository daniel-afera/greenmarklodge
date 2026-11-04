import type { Metadata } from "next";
import { Suspense } from "react";
import BookingWizard from "@/components/booking/BookingWizard";
import { getRoomOptions } from "@/content";

export const metadata: Metadata = {
  title: "Request a booking",
  description: "Send a booking request to our reception team.",
};

export default async function BookPage() {
  const rooms = await getRoomOptions();
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <BookingWizard rooms={rooms} />
    </Suspense>
  );
}

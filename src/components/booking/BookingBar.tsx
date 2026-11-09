"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { RoomOption } from "@/content/types";
import { Arrow } from "@/components/ui/ButtonLink";
import DateRangeField from "@/components/forms/DateRangeField";
import GuestField from "@/components/forms/GuestField";
import Select from "@/components/forms/Select";
import type { DateRange } from "@/components/forms/Calendar";
import { addDaysISO, todayISO } from "@/lib/dates";
import { DEFAULT_ARRIVAL_IN, DEFAULT_NIGHTS, defaultRoom, stayIssues } from "@/lib/booking-schema";

/** Glass booking bar on the hero — hands off to /book with the choices prefilled. */
export default function BookingBar({ rooms, className = "" }: { rooms: RoomOption[]; className?: string }) {
  const router = useRouter();
  const [dates, setDates] = useState<DateRange>(() => ({ from: addDaysISO(todayISO(), DEFAULT_ARRIVAL_IN), to: addDaysISO(todayISO(), DEFAULT_ARRIVAL_IN + DEFAULT_NIGHTS) }));
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [room, setRoom] = useState(() => defaultRoom(rooms));
  const [error, setError] = useState("");

  const cell = "min-w-0 border-b border-ivory/20 px-6 py-3.5 md:border-b-0 md:border-r";

  return (
    <div className={className}>
      <form
        noValidate
        className="flex flex-wrap items-stretch border border-ivory/25 bg-night/40 backdrop-blur-xl"
        onSubmit={(e) => {
          e.preventDefault();
          const issues = stayIssues({ checkin: dates.from, checkout: dates.to, ...guests, room }, rooms);
          const first = issues.checkin || issues.checkout || issues.room;
          if (first) return setError(first);
          setError("");
          const q = new URLSearchParams({ checkin: dates.from, checkout: dates.to, adults: String(guests.adults), children: String(guests.children) });
          if (room) q.set("room", room);
          router.push(`/book?${q}`);
        }}
      >
        <DateRangeField
          value={dates}
          onChange={(r) => {
            setDates(r);
            setError("");
          }}
          tone="dark"
          placement="top"
          className="flex-[2_1_300px] md:border-r md:border-ivory/20"
          segmentClassName="px-6 py-3.5 max-sm:px-4 first:border-r first:border-ivory/20 max-md:border-b max-md:border-ivory/20"
        />
        <GuestField adults={guests.adults} kids={guests.children} onChange={setGuests} className={`flex-[1_1_170px] max-md:hidden ${cell}`} />
        <div className={`flex flex-[1_1_180px] flex-col gap-1.5 max-md:hidden ${cell}`}>
          <span id="bb-room-label" className="eyebrow text-[10px] text-champagne">
            Residence
          </span>
          <Select
            id="bb-room"
            labelledBy="bb-room-label"
            value={room}
            onChange={setRoom}
            placement="top"
            options={[{ value: "", label: "Any residence" }, ...rooms.map((r) => ({ value: r.slug, label: r.name}))]}
            triggerClassName="font-serif text-xl min-h-8"
          />
        </div>
        <button type="submit" className="btn btn-gold min-h-16 flex-1 basis-[220px] border-0 md:min-h-[76px]">
          <span>Reserve</span>
          <Arrow />
        </button>
      </form>
      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 inline-flex items-center gap-2 bg-error/90 px-4 py-2 text-[13px] text-ivory backdrop-blur"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

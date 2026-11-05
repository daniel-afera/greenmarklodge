"use client";

import CmsImage from "@/components/ui/CmsImage";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EASE_CURTAIN, EASE_LUXE, getLenis } from "@/lib/motion";
import Logo from "@/components/ui/Logo";
import { fullName, nav } from "@/lib/site";
import { useSite } from "./SiteContext";

export default function Menu({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { settings: site, menuPreviews } = useSite();
  const [hover, setHover] = useState<string>(pathname);
  const preview = menuPreviews[hover] ?? menuPreviews["/"];

  useEffect(() => {
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      getLenis()?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className="fixed inset-0 z-[90] overflow-y-auto bg-ink text-ivory"
      data-lenis-prevent
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(100% 0 0 0)" }}
      transition={{ duration: 0.9, ease: EASE_CURTAIN }}
    >
      <div className="flex items-center justify-between border-b border-ivory/10 px-[clamp(20px,4vw,56px)] py-4">
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="flex min-h-11 items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] transition-colors hover:text-bronze-light"
        >
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M5 5 L23 23 M23 5 L5 23" />
          </svg>
          Close
        </button>
        <Logo size={56} alt={fullName(site)} className="size-12 sm:size-14" />
        <Link href="/book" onClick={onClose} className="btn btn-light !min-h-11 !px-5">
          <span>Reserve</span>
        </Link>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-12 px-[clamp(20px,4vw,56px)] py-[clamp(32px,6vw,72px)] lg:grid-cols-[1.1fr_1fr]">
        <nav aria-label="Main">
          <ul className="flex flex-col gap-1">
            {nav.map((item, i) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                // Font size lives on the <li> so the em-based clip below scales with it. The clip
                // masks the slide-in like overflow-hidden would, but leaves room under the line
                // for descenders (g, y) without making rows taller.
                // Height term: 100svh minus top bar (~89px), page padding (≤144px) and gaps (24px),
                // shared by 7 rows at line-height 1.1 → the list fills the screen without scrolling.
                <li key={item.href} className="font-serif text-[clamp(34px,min(6.5vw,calc((100svh_-_260px)_/_7.8)),96px)] [clip-path:inset(0_-100vw_-0.3em_0)]">
                  <motion.div
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-110%", transition: { duration: 0.4, ease: EASE_CURTAIN } }}
                    transition={{ duration: 1.1, ease: EASE_LUXE, delay: 0.35 + i * 0.06 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      onMouseEnter={() => setHover(item.href)}
                      onFocus={() => setHover(item.href)}
                      className={`group flex items-baseline gap-6 font-light leading-[1.1] transition-[color,padding] duration-700 ease-[cubic-bezier(.19,1,.22,1)] hover:pl-6 hover:text-bronze-light ${
                        active ? "text-bronze-light" : ""
                      }`}
                    >
                      <span className="font-sans text-xs tracking-[0.2em] text-ivory/40">0{i + 1}</span>
                      {item.label}
                    </Link>
                  </motion.div>
                </li>
              );
            })}
          </ul>
        </nav>

        <motion.div
          className="hidden flex-col gap-8 lg:flex"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: EASE_LUXE, delay: 0.55 }}
        >
          <div className="relative h-[46vh] min-h-[320px] overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.div
                key={preview.src}
                className="absolute inset-0"
                initial={{ clipPath: "inset(0 0 0 100%)", scale: 1.1 }}
                animate={{ clipPath: "inset(0 0 0 0%)", scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.6, delay: 0.3 } }}
                transition={{ duration: 1, ease: EASE_LUXE }}
              >
                <CmsImage image={preview} alt="" fill sizes="45vw" className="object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm leading-7 text-ivory/70">
            <div>
              <div className="eyebrow mb-2 text-bronze-light">Reservations</div>
              {site.phone}
              <br />
              {site.email}
            </div>
            <div>
              <div className="eyebrow mb-2 text-bronze-light">Find us</div>
              {site.address.line1}, {site.address.line2}
              <br />
              {site.address.country}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

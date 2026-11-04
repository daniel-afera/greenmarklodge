"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { fullName } from "@/lib/site";
import { useSite } from "./SiteContext";
import Logo from "@/components/ui/Logo";
import Magnetic from "@/components/ui/Magnetic";
import Menu from "./Menu";

/** Pages without a dark full-bleed hero get the solid header straight away. */
const SOLID_ROUTES = ["/book"];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { settings: site } = useSite();

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 500 && y > last + 2 ? true : y < last - 2 ? false : (h) => h);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || SOLID_ROUTES.includes(pathname);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,color,border-color,transform,backdrop-filter] duration-700 ease-[cubic-bezier(.19,1,.22,1)] ${
          solid ? "border-ink/10 bg-ivory/90 text-ink backdrop-blur-xl" : "border-ivory/15 bg-transparent text-ivory"
        } ${hidden && !open ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-[clamp(20px,4vw,56px)] py-4">
          <div className="flex items-center gap-10">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="group flex min-h-11 items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em]"
            >
              <span className="flex w-7 flex-col gap-1.5" aria-hidden="true">
                <span className="h-px w-full bg-current" />
                <span className="h-px w-3/5 bg-current transition-all duration-500 ease-[cubic-bezier(.19,1,.22,1)] group-hover:w-full" />
              </span>
              <span className="hidden sm:inline">Menu</span>
            </button>
            <nav aria-label="Quick links" className="hidden gap-8 text-xs uppercase tracking-[0.14em] lg:flex">
              <Link className="hlink" href="/rooms" data-active={pathname.startsWith("/rooms")}>Stay</Link>
              <Link className="hlink" href="/dining" data-active={pathname === "/dining"}>Dine</Link>
              <Link className="hlink" href="/spa" data-active={pathname === "/spa"}>Unwind</Link>
            </nav>
          </div>

          <Link href="/" className="flex items-center">
            <Logo size={56} alt={`${fullName(site)} home`} priority className="size-12 sm:size-14" />
          </Link>

          <div className="flex items-center justify-end gap-7">
            <Link className="hlink hidden text-xs uppercase tracking-[0.14em] lg:inline" href="/contact" data-active={pathname === "/contact"}>
              Contact
            </Link>
            <Magnetic strength={0.25}>
              <Link href="/book" className={`btn ${solid ? "btn-dark" : "btn-light"} !min-h-11 !px-5`}>
                <span>Book</span>
              </Link>
            </Magnetic>
          </div>
        </div>
      </header>
      <AnimatePresence>{open && <Menu onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

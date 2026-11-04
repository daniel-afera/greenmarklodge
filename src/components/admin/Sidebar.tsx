"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/cms/staff-actions";

export type NavItem = { href: string; label: string; count?: number };

export default function Sidebar({ items, name, role, siteName }: { items: NavItem[]; name: string; role: string; siteName: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));
  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-ink px-5 py-4 text-ivory lg:hidden">
        <span className="font-serif text-xl uppercase tracking-[0.3em]">{siteName}</span>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="admin-nav" className="eyebrow">
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <aside
        id="admin-nav"
        className={`${open ? "flex" : "hidden"} fixed inset-0 top-[60px] z-40 flex-col overflow-y-auto bg-ink px-6 py-8 text-ivory lg:inset-y-0 lg:left-0 lg:top-0 lg:flex lg:w-64`}
      >
        <Link href="/admin" className="mb-10 hidden font-serif text-2xl uppercase tracking-[0.3em] lg:block">
          {siteName}
        </Link>
        <nav aria-label="Editor" className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active(item.href) ? "page" : undefined}
              className={`flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${active(item.href) ? "bg-ivory/10 text-ivory" : "text-ivory/70 hover:text-ivory"}`}
            >
              {item.label}
              {!!item.count && <span className="min-w-6 rounded-full bg-bronze px-2 text-center text-xs text-ink">{item.count}</span>}
            </Link>
          ))}
          <a href="/api/edit?to=/" className="mt-6 border border-ivory/25 px-3 py-2.5 text-center text-sm text-ivory hover:border-bronze-light">
            Edit on the site →
          </a>
        </nav>
        <div className="mt-10 border-t border-ivory/15 pt-6 text-sm">
          <div className="text-ivory">{name || "Signed in"}</div>
          <div className="mb-4 text-xs capitalize text-ivory/75">{role}</div>
          <div className="flex gap-5 text-xs">
            <Link href="/admin/password" className="text-ivory/80 hover:text-ivory">
              Change password
            </Link>
            <form action={signOut}>
              <button className="text-ivory/80 hover:text-ivory">Sign out</button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

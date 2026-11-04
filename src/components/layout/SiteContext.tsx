"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MenuPreviews, SiteSettings } from "@/content/types";

/** `editing`: on-site edit mode (no preloader, curtain or custom cursor). */
type Ctx = { settings: SiteSettings; menuPreviews: MenuPreviews; editing?: boolean };

const SiteCtx = createContext<Ctx | null>(null);

export function SiteProvider({ value, children }: { value: Ctx; children: ReactNode }) {
  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export function useSite() {
  const v = useContext(SiteCtx);
  if (!v) throw new Error("useSite must be used inside <SiteProvider>");
  return v;
}

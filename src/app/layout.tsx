import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = { themeColor: "#1C2420" };

/**
 * Runs before first paint: the preloader plays only on the first home-page
 * visit of a tab, and never for reduced-motion users (see .preloader in globals.css).
 */
const introScript = `try{var d=document.documentElement;if(location.pathname==="/"&&!sessionStorage.getItem("gml-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-intro","");sessionStorage.setItem("gml-intro","1")}}catch(e){}`;

/**
 * Without JavaScript, nothing would play the scroll reveals, so everything
 * that starts hidden (motion's inline opacity/transform) is shown as-is,
 * scroll-lit words are fully lit, and the page-change curtain and custom
 * cursor are removed.
 */
const noScriptCss = `[style*="opacity:0;"],[style$="opacity:0"]{opacity:1!important}[style*="transform:translate"],[style*="transform:scale"]{transform:none!important}[style*="clip-path:inset"]{clip-path:none!important}[style*="filter:blur"]{filter:none!important}[data-word]{opacity:1!important}[data-curtain],[data-no-js-hide]{display:none!important}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: introScript may add data-intro to <html> before React hydrates.
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: noScriptCss }} />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}

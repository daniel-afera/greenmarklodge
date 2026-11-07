"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Google Maps iframe that loads only when it's about to scroll into view (or
 * is tapped). The embed pulls in ~1 MB of Google scripts, which used to slow
 * the whole contact page; until then a light placeholder stands in.
 */
export default function MapEmbed({ src, address, cms }: { src: string; address: string; cms?: { "data-cms"?: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || load) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLoad(true);
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div ref={ref} className="relative h-[320px] overflow-hidden border border-ink/10 bg-sand/40" {...cms}>
      {load ? (
        <iframe
          title={`Map: ${address}`}
          src={src}
          className="h-full w-full grayscale-[0.6] transition-[filter] duration-700 hover:grayscale-0"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-[linear-gradient(rgba(28,36,32,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(28,36,32,.06)_1px,transparent_1px)] bg-[size:40px_40px] p-6 text-center">
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none" aria-hidden="true" className="text-bronze-deep">
            <path d="M14 35s12-11.2 12-21A12 12 0 1 0 2 14c0 9.8 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <button type="button" onClick={() => setLoad(true)} className="btn btn-ink">
            <span>Show map</span>
          </button>
          <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="hlink text-xs text-muted">
            Open in Google Maps
          </a>
        </div>
      )}
      <noscript>
        <iframe title={`Map: ${address}`} src={src} className="absolute inset-0 h-full w-full" loading="lazy" />
      </noscript>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element -- tiny static SVGs; next/image adds nothing here */

/** Country flag from public/flags (scripts/copy-flags.ts). Emoji flags show as letters on Windows. */
export default function Flag({ code, className = "" }: { code: string; className?: string }) {
  return (
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt=""
      width={20}
      height={15}
      loading="lazy"
      decoding="async"
      className={`inline-block h-[15px] w-5 shrink-0 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)] ${className}`}
    />
  );
}

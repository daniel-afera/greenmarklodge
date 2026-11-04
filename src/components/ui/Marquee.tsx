import type { CSSProperties, ReactNode } from "react";

/** Infinite horizontal loop. Children are rendered twice for a seamless wrap. */
export default function Marquee({
  children,
  duration = 40,
  className = "",
}: {
  children: ReactNode;
  duration?: number;
  className?: string;
}) {
  return (
    <div className={`marquee-hover overflow-hidden ${className}`}>
      <div className="animate-marquee flex w-max" style={{ "--marquee-duration": `${duration}s` } as CSSProperties}>
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

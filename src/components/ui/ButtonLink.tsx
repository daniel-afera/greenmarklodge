import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import Magnetic from "./Magnetic";

type Variant = "light" | "dark" | "gold" | "ink";

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" aria-hidden="true" className={className}>
      <path d="M0 5 H17 M12 0.5 L17 5 L12 9.5" />
    </svg>
  );
}

export default function ButtonLink({
  variant = "dark",
  children,
  className = "",
  arrow = false,
  magnetic = true,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; children: ReactNode; arrow?: boolean; magnetic?: boolean }) {
  const link = (
    <Link className={`btn btn-${variant} ${className}`} {...props}>
      <span>{children}</span>
      {arrow && <Arrow />}
    </Link>
  );
  return magnetic ? <Magnetic strength={0.25}>{link}</Magnetic> : link;
}

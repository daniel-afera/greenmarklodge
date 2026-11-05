import Image from "next/image";

/** The round Green Mark badge (public/logo.svg). */
export default function Logo({ size, alt = "", className = "", priority }: { size: number; alt?: string; className?: string; priority?: boolean }) {
  return <Image src="/logo.svg" alt={alt} width={size} height={size} priority={priority} unoptimized className={`rounded-full ${className}`} />;
}

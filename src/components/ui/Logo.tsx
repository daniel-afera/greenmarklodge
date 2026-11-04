import Image from "next/image";

/** The round Green Mark badge (public/logo.webp, made by `npm run photos -- --logo`). */
export default function Logo({ size, alt = "", className = "", priority }: { size: number; alt?: string; className?: string; priority?: boolean }) {
  return <Image src="/logo.webp" alt={alt} width={size} height={size} priority={priority} className={`rounded-full ${className}`} />;
}

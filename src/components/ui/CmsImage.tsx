import Image, { type ImageProps } from "next/image";
import type { Img } from "@/content/types";

/**
 * next/image for CMS images: applies the editor's focal point as
 * object-position and the blurred preview while loading.
 */
export default function CmsImage({
  image,
  alt,
  fill,
  className = "",
  style,
  cms,
  ...props
}: { image: Img; alt?: string; cms?: { "data-cms"?: string } } & Omit<ImageProps, "src" | "alt" | "width" | "height" | "placeholder" | "blurDataURL">) {
  const blur = image.blur ? { placeholder: "blur" as const, blurDataURL: image.blur } : {};
  return (
    <Image
      src={image.src}
      alt={alt ?? image.alt}
      {...(fill ? { fill: true } : { width: image.width, height: image.height })}
      {...blur}
      className={className}
      style={{ objectPosition: image.position, ...style }}
      {...cms}
      {...props}
    />
  );
}

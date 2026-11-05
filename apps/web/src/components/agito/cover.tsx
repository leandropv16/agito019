import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Cover } from "@/lib/types";

export function CoverImage({
  cover,
  alt,
  className,
}: {
  cover: Cover;
  alt: string;
  className?: string;
}) {
  const src = cover?.url ?? cover?.thumbnailUrl;
  if (!src) {
    return <div className={cn("bg-linear-to-br from-secondary via-card to-primary/30", className)} aria-hidden />;
  }
  return (
    <Image
      src={src}
      alt={cover?.altText ?? alt}
      fill
      className={cn("object-cover", className)}
      sizes="(max-width: 768px) 100vw, 400px"
    />
  );
}

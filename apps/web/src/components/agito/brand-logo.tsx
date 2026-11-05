import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string | null;
  className?: string;
  /** Altura visual no mobile. Desktop sobe um pouco via className padrao. */
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  /** full: wordmark. symbol: so o circulo. responsive: simbolo no mobile, wordmark no desktop. */
  variant?: "full" | "symbol" | "responsive";
};

const fullSize = {
  sm: "h-7 md:h-8",
  md: "h-8 md:h-9",
  lg: "h-10 md:h-12",
} as const;

const symbolSize = {
  sm: "size-8",
  md: "size-9",
  lg: "size-11",
} as const;

const markClass = "w-auto shrink-0 invert";

export function BrandLogo({
  href = "/",
  className,
  size = "md",
  priority,
  variant = "full",
}: BrandLogoProps) {
  const fetchPriority = priority ? "high" : undefined;
  const image =
    variant === "responsive" ? (
      <span className={cn("inline-flex items-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/agito019-symbol.svg"
          alt="AGITO019"
          fetchPriority={fetchPriority}
          className={cn(markClass, symbolSize[size], "md:hidden")}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/agito019-logo.svg"
          alt="AGITO019"
          fetchPriority={fetchPriority}
          className={cn(markClass, fullSize[size], "hidden md:block")}
        />
      </span>
    ) : (
      <span className={cn("inline-flex items-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={variant === "symbol" ? "/brand/agito019-symbol.svg" : "/brand/agito019-logo.svg"}
          alt="AGITO019"
          fetchPriority={fetchPriority}
          className={cn(markClass, variant === "symbol" ? symbolSize[size] : fullSize[size])}
        />
      </span>
    );

  if (!href) {
    return image;
  }

  return (
    <Link href={href} className="inline-flex shrink-0" aria-label="AGITO019">
      {image}
    </Link>
  );
}

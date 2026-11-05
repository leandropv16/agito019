import { cn } from "@/lib/utils";

/**
 * Símbolo da marca no canto superior direito da capa do evento.
 * Decorativo: o título do evento e o nome da marca já estão na página.
 */
export function EventCoverBrandBadge({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const frame = size === "md" ? "size-10" : "size-8";
  const mark = size === "md" ? "size-6" : "size-5";

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-2.5 right-2.5 z-20 inline-flex items-center justify-center rounded-full border border-white/20 bg-black/60 shadow-sm backdrop-blur-md",
        frame,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/agito019-symbol.svg"
        alt=""
        width={size === "md" ? 24 : 20}
        height={size === "md" ? 24 : 20}
        className={cn("shrink-0 invert object-contain", mark)}
      />
    </span>
  );
}

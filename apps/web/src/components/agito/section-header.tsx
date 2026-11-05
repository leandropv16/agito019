import Link from "next/link";

export function SectionHeader({
  eyebrow,
  title,
  href,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{eyebrow}</p> : null}
        <h2 className="break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-white/60 transition-colors hover:text-primary">
          Ver todos
        </Link>
      ) : null}
    </div>
  );
}

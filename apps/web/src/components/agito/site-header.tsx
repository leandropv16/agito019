"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/agito/brand-logo";
import { useChromeMotion, useMenuMotion } from "@/components/agito/motion";

const links = [
  { href: "/hoje", label: "Hoje" },
  { href: "/musica-ao-vivo", label: "Música ao vivo" },
  { href: "/explorar", label: "Explorar" },
  { href: "/musicos", label: "Artistas" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hidden = pathname.startsWith("/painel") || pathname.startsWith("/entrar");
  useChromeMotion(barRef, "header");
  useMenuMotion(menuRef, open && !hidden);
  if (hidden) {
    return null;
  }
  return (
    <header ref={barRef} className="sticky top-0 z-40 border-b border-white/8 bg-[#0a0a0a]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-3 px-4">
        <div data-chrome className="min-w-0">
          <BrandLogo href="/" size="md" priority variant="responsive" />
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {links.map((link) => (
            <Link key={link.label} href={link.href} data-chrome className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <Link href="/entrar" data-chrome className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-primary">
            Painel
          </Link>
        </nav>
        <button data-chrome className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <div ref={menuRef} className="border-t border-white/8 px-4 py-3 md:hidden">
          <nav className="grid gap-1 text-sm">
            {links.map((link) => (
              <Link key={link.label} href={link.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-2">
                {link.label}
              </Link>
            ))}
            <Link href="/entrar" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-2">
              Entrar no painel
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

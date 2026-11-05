"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/agito/brand-logo";
import { useChromeMotion } from "@/components/agito/motion";

export function SiteFooter() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const hidden = pathname.startsWith("/painel") || pathname.startsWith("/entrar");
  useChromeMotion(ref, "footer");
  if (hidden) {
    return null;
  }
  return (
    <footer ref={ref} className="mt-20 border-t border-white/8 bg-[#0a0a0a]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div data-chrome>
          <BrandLogo href="/" size="sm" />
          <p className="mt-3 text-sm text-muted-foreground">O marketplace do rolê na região 019. Eventos, música ao vivo e lugares para ir hoje.</p>
        </div>
        <div data-chrome>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Explorar</p>
          <div className="mt-3 grid text-sm">
            <Link href="/hoje" className="flex min-h-11 items-center">O que fazer hoje</Link>
            <Link href="/musica-ao-vivo" className="flex min-h-11 items-center">Música ao vivo no 019</Link>
            <Link href="/campinas/barzinho-com-show" className="flex min-h-11 items-center">Barzinho com show</Link>
            <Link href="/musicos" className="flex min-h-11 items-center">Artistas</Link>
          </div>
        </div>
        <div data-chrome>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cidades</p>
          <div className="mt-3 grid text-sm">
            <Link href="/campinas" className="flex min-h-11 items-center">Campinas</Link>
            <Link href="/americana" className="flex min-h-11 items-center">Americana</Link>
            <Link href="/indaiatuba" className="flex min-h-11 items-center">Indaiatuba</Link>
            <Link href="/sumare" className="flex min-h-11 items-center">Sumaré</Link>
            <Link href="/hortolandia" className="flex min-h-11 items-center">Hortolândia</Link>
          </div>
        </div>
        <div data-chrome>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Parceiros</p>
          <p className="mt-3 text-sm text-muted-foreground">Tem um bar, casa ou palco? Cadastre a programação no painel.</p>
          <Link href="/entrar" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary">
            Acessar painel
          </Link>
          <div className="mt-4 grid text-sm text-muted-foreground">
            <Link href="/privacidade" className="flex min-h-11 items-center">Privacidade</Link>
            <Link href="/termos" className="flex min-h-11 items-center">Termos de uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

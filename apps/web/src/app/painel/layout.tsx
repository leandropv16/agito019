"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/agito/brand-logo";
import { apiFetch } from "@/lib/api";

const adminOnly = new Set([
  "/painel/cidades",
  "/painel/categorias",
  "/painel/publicos",
  "/painel/comodidades",
  "/painel/generos",
  "/painel/planos",
  "/painel/campanhas",
  "/painel/usuarios",
  "/painel/denuncias",
  "/painel/metricas",
]);

const links = [
  { href: "/painel", label: "Dashboard" },
  { href: "/painel/estabelecimentos", label: "Estabelecimentos" },
  { href: "/painel/musicos", label: "Músicos" },
  { href: "/painel/eventos", label: "Eventos" },
  { href: "/painel/promocoes", label: "Promoções" },
  { href: "/painel/denuncias", label: "Denúncias" },
  { href: "/painel/metricas", label: "Cliques" },
  { href: "/painel/cidades", label: "Cidades" },
  { href: "/painel/categorias", label: "Categorias" },
  { href: "/painel/publicos", label: "Públicos" },
  { href: "/painel/comodidades", label: "Comodidades" },
  { href: "/painel/generos", label: "Gêneros" },
  { href: "/painel/planos", label: "Planos" },
  { href: "/painel/campanhas", label: "Campanhas" },
  { href: "/painel/usuarios", label: "Usuários" },
];

type Me = { id: string; name: string; role: "ADMIN" | "PARTNER" };

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    apiFetch<Me>("/auth/me")
      .then(setMe)
      .catch(() => router.replace("/entrar"));
  }, [router]);

  if (!me) {
    return <div className="p-8 text-muted-foreground">Carregando painel...</div>;
  }

  const visible = links.filter((link) => me.role === "ADMIN" || !adminOnly.has(link.href));

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-border p-4 md:border-b-0 md:border-r">
        <BrandLogo href="/painel" size="sm" />
        <p className="mt-1 text-xs text-muted-foreground">
          {me.name} · {me.role}
        </p>
        <nav className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-1">
          {visible.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-3 py-2 ${pathname === link.href ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          className="mt-6 text-sm text-muted-foreground"
          onClick={async () => {
            await apiFetch("/auth/logout", { method: "POST" });
            router.replace("/entrar");
          }}
        >
          Sair
        </button>
      </aside>
      <div className="p-4 md:p-8">{children}</div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Flame,
  Music,
  Plus,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

type MeInfo = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PARTNER";
  establishments?: Array<{ id: string; name: string; slug: string }>;
};

type PartnerEstablishmentSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
  eventsCount: number;
  activePlan: string | null;
};

type DashboardData = {
  role?: "ADMIN" | "PARTNER";
  publishedEstablishments: number;
  upcomingEvents: number;
  liveMusicToday: number;
  activePromotions: number;
  activeCampaigns: number;
  pendingPayments: number;
  partnerEstablishments?: PartnerEstablishmentSummary[];
};

export default function DashboardPage() {
  const [me, setMe] = useState<MeInfo | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<MeInfo>("/auth/me").catch(() => null),
      apiFetch<DashboardData>("/admin/dashboard").catch(() => null),
    ])
      .then(([meRes, dashRes]) => {
        setMe(meRes);
        setData(dashRes);
      })
      .finally(() => setLoading(false));
  }, []);

  const isPartner = me?.role === "PARTNER" || data?.role === "PARTNER";

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Carregando informações do painel...
      </div>
    );
  }

  // Visualização de Parceiro (Dono do estabelecimento)
  if (isPartner) {
    const establishments = data?.partnerEstablishments || [];
    return (
      <div className="space-y-8 pb-16">
        {/* Banner de Boas-vindas e Ação Principal */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/15 via-card to-card p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                Painel do Parceiro AGITO019
              </p>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl">
              Olá, {me?.name || "Parceiro"}!
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mantenha a agenda e atrações do seu local sempre atualizadas para ganhar destaque
              no portal e ser descoberto por milhares de pessoas na região 019.
            </p>
            <div className="pt-2">
              <Link href="/painel/eventos">
                <Button className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-primary/90 transition">
                  <Plus className="h-4 w-4" />
                  Cadastrar novo evento na agenda
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Métricas do Parceiro */}
        <div>
          <h2 className="font-display text-xl mb-4">Métricas da sua agenda</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Eventos futuros
                </p>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 font-display text-4xl">{data?.upcomingEvents ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">cadastrados para os próximos dias</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Música ao vivo hoje
                </p>
                <Music className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-3 font-display text-4xl text-emerald-400">
                {data?.liveMusicToday ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">shows programados para a data de hoje</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Promoções ativas
                </p>
                <Flame className="h-4 w-4 text-amber-400" />
              </div>
              <p className="mt-3 font-display text-4xl">{data?.activePromotions ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">ofertas e promoções vigentes</p>
            </div>
          </div>
        </div>

        {/* Seus Estabelecimentos Gerenciados */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Seus estabelecimentos</h2>
            <Link
              href="/painel/eventos"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Ver agenda completa
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {establishments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-2 text-sm">Nenhum estabelecimento vinculado à sua conta ainda.</p>
              <p className="text-xs">Entre em contato com o administrador do AGITO019.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {establishments.map((est) => (
                <div
                  key={est.id}
                  className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 transition hover:border-primary/40"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-2xl text-foreground">{est.name}</h3>
                        <p className="text-xs text-muted-foreground">slug: {est.slug}</p>
                      </div>
                      <Badge
                        className={
                          est.status === "PUBLISHED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {est.status === "PUBLISHED" ? "Publicado no portal" : "Em rascunho"}
                      </Badge>
                    </div>

                    {/* Status do Plano */}
                    <div className="rounded-2xl bg-secondary/50 p-3 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Plano de visibilidade:
                      </p>
                      <div className="flex items-center gap-1.5 text-xs">
                        {est.activePlan ? (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            <span className="font-semibold text-foreground">
                              {est.activePlan} (Destaque Ativo)
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Plano Padrão gratuito
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Contagem de Eventos */}
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{est.eventsCount}</span> eventos
                      cadastrados no histórico deste local.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    <Link href="/painel/eventos" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs flex items-center justify-center gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Novo evento
                      </Button>
                    </Link>
                    {est.status === "PUBLISHED" && (
                      <Link
                        href={`/lugares/${est.slug}`}
                        target="_blank"
                        className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                        title="Ver página pública no portal"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Visualização de Administrador (Global)
  const adminCards = [
    {
      key: "publishedEstablishments",
      label: "Estabelecimentos publicados",
      value: data?.publishedEstablishments ?? 0,
      icon: Building2,
      color: "text-foreground",
    },
    {
      key: "upcomingEvents",
      label: "Eventos futuros",
      value: data?.upcomingEvents ?? 0,
      icon: Calendar,
      color: "text-primary",
    },
    {
      key: "liveMusicToday",
      label: "Música ao vivo hoje",
      value: data?.liveMusicToday ?? 0,
      icon: Music,
      color: "text-emerald-400",
    },
    {
      key: "activePromotions",
      label: "Promoções ativas",
      value: data?.activePromotions ?? 0,
      icon: Flame,
      color: "text-amber-400",
    },
    {
      key: "activeCampaigns",
      label: "Campanhas ativas",
      value: data?.activeCampaigns ?? 0,
      icon: Sparkles,
      color: "text-purple-400",
    },
    {
      key: "pendingPayments",
      label: "Pagamentos pendentes",
      value: data?.pendingPayments ?? 0,
      icon: CreditCard,
      color: "text-rose-400",
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Admin */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-3xl">Dashboard Geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão executiva do portal AGITO019, parceiros e engajamento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/painel/eventos">
            <Button size="sm" className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Novo evento
            </Button>
          </Link>
          <Link href="/painel/estabelecimentos/novo">
            <Button size="sm" variant="outline" className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Novo local
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid de Métricas Gerais */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-3xl border border-border bg-card p-5 space-y-3 transition hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {card.label}
                </p>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className={`font-display text-4xl ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Atalhos Rápidos para Administração */}
      <div>
        <h2 className="font-display text-xl mb-4">Gestão do ecossistema</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/painel/usuarios"
            className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 hover:border-primary/40 transition group"
          >
            <div className="rounded-2xl bg-secondary p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Usuários e Parceiros</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crie acessos para donos de bar e gere credenciais de WhatsApp.
              </p>
            </div>
          </Link>

          <Link
            href="/painel/planos"
            className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 hover:border-primary/40 transition group"
          >
            <div className="rounded-2xl bg-secondary p-3 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Planos Comerciais</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure recursos, visibilidade e preços de planos diários.
              </p>
            </div>
          </Link>

          <Link
            href="/painel/campanhas"
            className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 hover:border-primary/40 transition group"
          >
            <div className="rounded-2xl bg-secondary p-3 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Campanhas e Pagamentos</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Controle ativações de destaque e conciliação de pagamentos.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

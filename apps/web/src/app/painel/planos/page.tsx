"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Edit,
  Plus,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

type CommercialPlan = {
  id: string;
  name: string;
  slug: string;
  dailyPriceCents: number | null;
  active: boolean;
  showPhoto: boolean;
  showInstagram: boolean;
  showWebsite: boolean;
  showMap: boolean;
  showArtist: boolean;
  showArtistInstagram: boolean;
  highlighted: boolean;
  priority: number;
};

function centsToReaisString(cents: number | null): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function reaisStringToCents(val: string): number | null {
  if (!val.trim()) return null;
  const num = parseFloat(val.replace(/\./g, "").replace(",", "."));
  return Number.isNaN(num) ? null : Math.round(num * 100);
}

export default function Page() {
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [priceReais, setPriceReais] = useState("");
  const [priority, setPriority] = useState("0");
  const [active, setActive] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);
  const [showInstagram, setShowInstagram] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showArtist, setShowArtist] = useState(false);
  const [showArtistInstagram, setShowArtistInstagram] = useState(false);
  const [highlighted, setHighlighted] = useState(false);

  async function loadPlans() {
    setLoading(true);
    try {
      const data = await apiFetch<CommercialPlan[]>("/admin/commercial-plans");
      setPlans(data);
    } catch {
      // Erro
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlans();
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    setName("");
    setPriceReais("5,00");
    setPriority("10");
    setActive(true);
    setShowPhoto(true);
    setShowInstagram(false);
    setShowWebsite(false);
    setShowMap(false);
    setShowArtist(false);
    setShowArtistInstagram(false);
    setHighlighted(false);
    setErrorMsg("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(plan: CommercialPlan) {
    setEditingId(plan.id);
    setName(plan.name);
    setPriceReais(centsToReaisString(plan.dailyPriceCents));
    setPriority(String(plan.priority));
    setActive(plan.active);
    setShowPhoto(plan.showPhoto);
    setShowInstagram(plan.showInstagram);
    setShowWebsite(plan.showWebsite);
    setShowMap(plan.showMap);
    setShowArtist(plan.showArtist);
    setShowArtistInstagram(plan.showArtistInstagram);
    setHighlighted(plan.highlighted);
    setErrorMsg("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const payload = {
      name,
      dailyPriceCents: reaisStringToCents(priceReais),
      priority: Number(priority) || 0,
      active,
      showPhoto,
      showInstagram,
      showWebsite,
      showMap,
      showArtist,
      showArtistInstagram,
      highlighted,
    };

    try {
      if (editingId) {
        await apiFetch(`/admin/commercial-plans/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/admin/commercial-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      await loadPlans();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao salvar plano");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-3xl">Planos Comerciais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure as opções de planos de divulgação para estabelecimentos e músicos parceiros.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo plano comercial
        </Button>
      </div>

      {/* Lista de Planos */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Carregando planos comerciais...</div>
      ) : plans.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-4 font-display text-lg">Nenhum plano comercial cadastrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie o primeiro pacote de visibilidade e recursos para os parceiros.
          </p>
          <Button type="button" onClick={handleOpenCreate} className="mt-4">
            Cadastrar primeiro plano
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col justify-between rounded-3xl border bg-card p-6 transition ${
                plan.highlighted
                  ? "border-amber-500/50 shadow-md ring-1 ring-amber-500/30"
                  : "border-border"
              }`}
            >
              <div className="space-y-4">
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl text-foreground flex items-center gap-2">
                      {plan.name}
                      {plan.highlighted && (
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">slug: {plan.slug}</p>
                  </div>
                  <Badge
                    className={
                      plan.active
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {plan.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                {/* Preço e Prioridade */}
                <div className="rounded-2xl bg-secondary/50 p-3 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-2xl text-foreground">
                      {plan.dailyPriceCents !== null
                        ? `R$ ${(plan.dailyPriceCents / 100).toFixed(2)}`
                        : "Negociado"}
                    </span>
                    {plan.dailyPriceCents !== null && (
                      <span className="text-xs text-muted-foreground">/ dia</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Prioridade de exibição: <span className="font-semibold text-foreground">{plan.priority}</span>
                  </p>
                </div>

                {/* Recursos Incluídos */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Recursos inclusos no plano:
                  </p>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      {plan.showPhoto ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.showPhoto ? "text-foreground" : "text-muted-foreground line-through"}>
                        Fotos na galeria e card
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.showInstagram ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.showInstagram ? "text-foreground" : "text-muted-foreground line-through"}>
                        Link para Instagram do local
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.showWebsite ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.showWebsite ? "text-foreground" : "text-muted-foreground line-through"}>
                        Link para Website oficial
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.showMap ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.showMap ? "text-foreground" : "text-muted-foreground line-through"}>
                        Mapa interativo e rotas
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.showArtist ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.showArtist ? "text-foreground" : "text-muted-foreground line-through"}>
                        Exibição de músicos e artistas
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.showArtistInstagram ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.showArtistInstagram ? "text-foreground" : "text-muted-foreground line-through"}>
                        Instagram dos artistas participantes
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.highlighted ? (
                        <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.highlighted ? "font-semibold text-amber-400" : "text-muted-foreground line-through"}>
                        Destaque VIP nos resultados de busca
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Ações */}
              <div className="mt-6 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(plan)}
                  className="w-full flex items-center justify-center gap-2 text-xs"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar configurações do plano
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição de Plano */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-2xl">
                  {editingId ? "Editar Plano Comercial" : "Novo Plano Comercial"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Defina os recursos incluídos, preço por dia e regras de visibilidade.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {errorMsg && (
                <div className="rounded-2xl bg-destructive/10 p-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}

              {/* Informações Básicas */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Nome do plano</label>
                  <Input
                    placeholder="Ex: Plano Ouro · Destaque Total"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Preço diário em reais (R$/dia)
                  </label>
                  <Input
                    placeholder="Ex: 5,00 (ou em branco se negociado)"
                    value={priceReais}
                    onChange={(e) => setPriceReais(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Deixe em branco para valor negociado diretamente.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Prioridade de ordenação
                  </label>
                  <Input
                    type="number"
                    placeholder="Ex: 10, 50, 100"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Números maiores aparecem antes nos resultados.
                  </p>
                </div>
              </div>

              {/* Toggles de Recursos do Plano */}
              <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Configuração de Recursos e Toggles:
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-xs font-medium cursor-pointer hover:bg-secondary/40 transition">
                    <input
                      type="checkbox"
                      checked={showPhoto}
                      onChange={(e) => setShowPhoto(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Exibir fotos e galeria</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-xs font-medium cursor-pointer hover:bg-secondary/40 transition">
                    <input
                      type="checkbox"
                      checked={showInstagram}
                      onChange={(e) => setShowInstagram(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Exibir link do Instagram</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-xs font-medium cursor-pointer hover:bg-secondary/40 transition">
                    <input
                      type="checkbox"
                      checked={showWebsite}
                      onChange={(e) => setShowWebsite(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Exibir link do site oficial</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-xs font-medium cursor-pointer hover:bg-secondary/40 transition">
                    <input
                      type="checkbox"
                      checked={showMap}
                      onChange={(e) => setShowMap(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Exibir mapa e como chegar</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-xs font-medium cursor-pointer hover:bg-secondary/40 transition">
                    <input
                      type="checkbox"
                      checked={showArtist}
                      onChange={(e) => setShowArtist(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Exibir músicos e atrações</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-xs font-medium cursor-pointer hover:bg-secondary/40 transition">
                    <input
                      type="checkbox"
                      checked={showArtistInstagram}
                      onChange={(e) => setShowArtistInstagram(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Exibir Instagram do artista</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-card p-2.5 text-xs font-medium cursor-pointer hover:bg-secondary/40 transition sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={highlighted}
                      onChange={(e) => setHighlighted(e.target.checked)}
                      className="rounded border-border text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-amber-400 font-semibold">
                      Destaque VIP nos resultados de busca do portal
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-xs font-medium cursor-pointer hover:bg-secondary/40 transition sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Plano ativo e disponível para contratação</span>
                  </label>
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : editingId ? "Salvar alterações" : "Criar plano"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

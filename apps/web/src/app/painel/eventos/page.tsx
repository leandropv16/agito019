"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Image as ImageIcon,
  Lock,
  MapPin,
  Music,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import {
  ALL_EVENT_FORMATS,
  EVENT_FORMAT_DEFS,
  type EventFormatSlug,
  extractFormatFromDescription,
  injectFormatIntoDescription,
  resolveEventFormat,
} from "@/lib/shared";
import { EventFormatBadge } from "@/components/agito/event-format-badge";

type Named = { id: string; name: string };

type MeInfo = {
  id: string;
  name: string;
  role: "ADMIN" | "PARTNER";
  establishments?: Named[];
};

type EventMedia = {
  id: string;
  url: string;
  isCover?: boolean;
};

type EventDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  establishmentId: string;
  establishment?: { id: string; name: string; slug: string };
  eventType: string;
  startAt: string;
  endAt: string | null;
  status: string;
  agendaStatus: string;
  entryPriceType: string | null;
  entryPriceCents: number | null;
  hasMusic: boolean | null;
  artists?: Named[];
  genres?: Named[];
  audiences?: Named[];
  media?: EventMedia[];
  cover?: { id: string; url: string } | null;
};

function formatIsoToInputDateTime(isoString?: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatCentsToReais(cents?: number | null): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function parseReaisToCents(val: string): number | null {
  if (!val.trim()) return null;
  const num = parseFloat(val.replace(/\./g, "").replace(",", "."));
  return Number.isNaN(num) ? null : Math.round(num * 100);
}

function extractPublicVenueFromDescription(desc: string): {
  publicVenue: string;
  cleanDescription: string;
} {
  const match = desc.match(/\[localPublico:(.+?)\]/i);
  if (match) {
    return {
      publicVenue: match[1].trim(),
      cleanDescription: desc.replace(match[0], "").trim(),
    };
  }
  return { publicVenue: "", cleanDescription: desc };
}

const FORMAT_SELECT_OPTIONS = ALL_EVENT_FORMATS.map((fmt) => ({
  value: fmt.slug,
  label: `${fmt.name} (${fmt.universe})`,
}));

export default function Page() {
  const [me, setMe] = useState<MeInfo | null>(null);
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [places, setPlaces] = useState<Named[]>([]);
  const [artists, setArtists] = useState<Named[]>([]);
  const [genres, setGenres] = useState<Named[]>([]);
  const [audiences, setAudiences] = useState<Named[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de listagem
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "UPCOMING" | "PAST">(
    "UPCOMING",
  );

  // Estado do Modal de Edição / Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Campos do Formulário
  const [title, setTitle] = useState("");
  const [formatSlug, setFormatSlug] = useState<string>("apresentacoes-de-bandas");
  const [publicVenue, setPublicVenue] = useState("");
  const [description, setDescription] = useState("");
  const [establishmentId, setEstablishmentId] = useState("");
  const [eventType, setEventType] = useState("LIVE_MUSIC");
  const [agendaStatus, setAgendaStatus] = useState("CONFIRMED");
  const [eventStatus, setEventStatus] = useState("PUBLISHED");
  const [entryPriceType, setEntryPriceType] = useState("FREE");
  const [entryPriceReais, setEntryPriceReais] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [hasMusic, setHasMusic] = useState<boolean>(true);
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>([]);

  // Capa / Imagem
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [meRes, eventsRes, placesRes, artistsRes, genresRes, audiencesRes] =
        await Promise.all([
          apiFetch<MeInfo>("/auth/me").catch(() => null),
          apiFetch<{ data: EventDetail[] }>("/admin/events"),
          apiFetch<{ data: Named[] }>("/admin/establishments"),
          apiFetch<{ data: Named[] }>("/admin/artists").catch(() => ({
            data: [],
          })),
          apiFetch<Named[]>("/public/genres").catch(() => []),
          apiFetch<Named[]>("/public/audiences").catch(() => []),
        ]);

      setMe(meRes);
      setEvents(eventsRes.data);
      setPlaces(placesRes.data);
      setArtists(artistsRes.data);
      setGenres(genresRes);
      setAudiences(audiencesRes);
    } catch (err) {
      console.error("Erro ao carregar dados de eventos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const isPartner = me?.role === "PARTNER";
  const partnerEstablishments = useMemo(() => {
    if (!isPartner) return places;
    if (me?.establishments && me.establishments.length > 0) {
      return me.establishments;
    }
    return places;
  }, [isPartner, me?.establishments, places]);

  const isSinglePartnerPlace = isPartner && partnerEstablishments.length === 1;

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setFormatSlug("apresentacoes-de-bandas");
    setPublicVenue("");
    setDescription("");
    setEventType("LIVE_MUSIC");
    setAgendaStatus("CONFIRMED");
    setEventStatus("PUBLISHED");
    setEntryPriceType("FREE");
    setEntryPriceReais("");
    setStartAt("");
    setEndAt("");
    setHasMusic(true);
    setSelectedArtistIds([]);
    setSelectedGenreIds([]);
    setSelectedAudienceIds([]);
    setCoverMediaId(null);
    setCoverPreviewUrl(null);
    setErrorMsg("");

    if (isSinglePartnerPlace) {
      setEstablishmentId(partnerEstablishments[0].id);
    } else if (partnerEstablishments.length > 0) {
      setEstablishmentId(partnerEstablishments[0].id);
    } else {
      setEstablishmentId("");
    }
  }

  function handleOpenCreate() {
    resetForm();
    setIsModalOpen(true);
  }

  function handleOpenEdit(event: EventDetail) {
    setEditingId(event.id);
    setTitle(event.title);

    const { formatSlug: extractedFormat, cleanDescription: descWithoutFormat } =
      extractFormatFromDescription(event.description);
    const { publicVenue: extractedVenue, cleanDescription: finalDesc } =
      extractPublicVenueFromDescription(descWithoutFormat);

    const resolved =
      extractedFormat ?? resolveEventFormat(event).slug;

    setFormatSlug(resolved);
    setPublicVenue(extractedVenue);
    setDescription(finalDesc);

    setEstablishmentId(event.establishmentId);
    setEventType(event.eventType);
    setAgendaStatus(event.agendaStatus);
    setEventStatus(event.status);
    setEntryPriceType(event.entryPriceType ?? "FREE");
    setEntryPriceReais(formatCentsToReais(event.entryPriceCents));
    setStartAt(formatIsoToInputDateTime(event.startAt));
    setEndAt(formatIsoToInputDateTime(event.endAt));
    setHasMusic(event.hasMusic ?? true);
    setSelectedArtistIds(event.artists?.map((a) => a.id) ?? []);
    setSelectedGenreIds(event.genres?.map((g) => g.id) ?? []);
    setSelectedAudienceIds(event.audiences?.map((a) => a.id) ?? []);

    const existingCover =
      event.cover ||
      event.media?.find((m) => m.isCover) ||
      event.media?.[0];
    if (existingCover) {
      setCoverMediaId(existingCover.id);
      setCoverPreviewUrl(existingCover.url);
    } else {
      setCoverMediaId(null);
      setCoverPreviewUrl(null);
    }

    setErrorMsg("");
    setIsModalOpen(true);
  }

  function handleFormatChange(newSlug: string) {
    setFormatSlug(newSlug);
    const def = EVENT_FORMAT_DEFS[newSlug as EventFormatSlug];
    if (def) {
      setEventType(def.defaultEventType);
      if (def.universe === "shows" || newSlug === "encontro-de-som") {
        setHasMusic(true);
      } else if (newSlug === "corridas" || newSlug === "ciclismo-pedal") {
        setHasMusic(false);
      }
    }
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    setErrorMsg("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await apiFetch<{ id: string; url: string }>("/admin/media", {
        method: "POST",
        body,
      });
      setCoverMediaId(res.id);
      setCoverPreviewUrl(res.url);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Falha ao enviar imagem do cartaz",
      );
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!establishmentId) {
      setErrorMsg("Selecione um estabelecimento");
      return;
    }
    if (!startAt) {
      setErrorMsg("Informe a data e horário de início do evento");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const entryPriceCents =
      entryPriceType === "FREE" ? null : parseReaisToCents(entryPriceReais);

    let finalDesc = description.trim();
    if (publicVenue.trim()) {
      finalDesc = `${finalDesc}\n\n[localPublico:${publicVenue.trim()}]`.trim();
    }
    if (formatSlug) {
      finalDesc = injectFormatIntoDescription(
        finalDesc,
        formatSlug as EventFormatSlug,
      );
    }

    const chosenFormatDef = EVENT_FORMAT_DEFS[formatSlug as EventFormatSlug];
    const validEventType = chosenFormatDef
      ? chosenFormatDef.defaultEventType
      : eventType;

    const payload: Record<string, unknown> = {
      title,
      description: finalDesc || null,
      establishmentId,
      eventType: validEventType,
      startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : null,
      status: eventStatus,
      agendaStatus,
      entryPriceType,
      entryPriceCents,
      hasMusic,
      artists: selectedArtistIds.map((artistId, sortOrder) => ({
        artistId,
        sortOrder,
      })),
      genreIds: selectedGenreIds,
      audienceIds: selectedAudienceIds,
    };

    if (coverMediaId) {
      payload.media = [{ mediaId: coverMediaId, isCover: true, sortOrder: 0 }];
    }

    try {
      if (editingId) {
        await apiFetch(`/admin/events/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao salvar evento");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(event: EventDetail) {
    if (
      !window.confirm(
        `Deseja realmente remover o evento "${event.title}" da programação?`,
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/admin/events/${event.id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir evento");
    }
  }

  // Filtragem dos eventos
  const filteredEvents = useMemo(() => {
    const now = new Date().getTime();
    return events.filter((ev) => {
      const matchSearch =
        ev.title.toLowerCase().includes(search.toLowerCase()) ||
        (ev.establishment?.name || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || ev.status === statusFilter;

      const evTime = new Date(ev.startAt).getTime();
      let matchTime = true;
      if (timeFilter === "UPCOMING") {
        matchTime = evTime >= now - 4 * 3600 * 1000;
      } else if (timeFilter === "PAST") {
        matchTime = evTime < now - 4 * 3600 * 1000;
      }

      return matchSearch && matchStatus && matchTime;
    });
  }, [events, search, statusFilter, timeFilter]);

  function formatDateTimeDisplay(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Dynamic start time label
  const startAtLabel =
    formatSlug === "corridas" || formatSlug === "ciclismo-pedal"
      ? "Horário de largada"
      : formatSlug === "apresentacoes-de-bandas" || formatSlug === "shows-em-pracas"
      ? "Início dos shows / apresentações"
      : "Data e horário de início";

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-3xl">Agenda de Eventos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPartner
              ? "Gerencie a programação musical, corridas, encontros e eventos do seu estabelecimento."
              : "Gerencie todos os eventos cadastrados na plataforma AGITO019."}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Cadastrar novo evento
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou local..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtro de Tempo (Próximos vs Passados) */}
        <div className="flex rounded-2xl bg-secondary p-1">
          <button
            type="button"
            onClick={() => setTimeFilter("UPCOMING")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              timeFilter === "UPCOMING"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Próximos
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter("PAST")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              timeFilter === "PAST"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Passados
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              timeFilter === "ALL"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
        </div>

        {/* Filtro de Status */}
        <div className="w-[160px]">
          <SelectField
            aria-label="Filtrar status"
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: "ALL", label: "Todos os status" },
              { value: "PUBLISHED", label: "Publicados" },
              { value: "DRAFT", label: "Rascunhos" },
              { value: "CANCELLED", label: "Cancelados" },
            ]}
          />
        </div>
      </div>

      {/* Lista de Eventos */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          Carregando programação de eventos...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-4 font-display text-lg">Nenhum evento encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || statusFilter !== "ALL" || timeFilter !== "UPCOMING"
              ? "Tente ajustar os filtros de busca para visualizar outros eventos."
              : "Cadastre o primeiro evento para movimentar sua agenda no AGITO019."}
          </p>
          <Button type="button" onClick={handleOpenCreate} className="mt-4">
            Cadastrar primeiro evento
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const coverImage =
              event.cover ||
              event.media?.find((m) => m.isCover) ||
              event.media?.[0];

            const { publicVenue: venueNote } =
              extractPublicVenueFromDescription(event.description ?? "");

            return (
              <div
                key={event.id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  {/* Cartaz do Evento ou Placeholder */}
                  <div className="relative aspect-16/9 w-full overflow-hidden bg-secondary">
                    {coverImage ? (
                      <Image
                        src={coverImage.url}
                        alt={event.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Music className="h-10 w-10 opacity-30" />
                      </div>
                    )}

                    {/* Top Format Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <EventFormatBadge event={event} size="sm" />
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <Badge
                        className={
                          event.status === "PUBLISHED"
                            ? "bg-emerald-500/90 text-white"
                            : event.status === "DRAFT"
                            ? "bg-amber-500/90 text-white"
                            : "bg-rose-500/90 text-white"
                        }
                      >
                        {event.status === "PUBLISHED"
                          ? "Publicado"
                          : event.status === "DRAFT"
                          ? "Rascunho"
                          : "Cancelado"}
                      </Badge>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="p-5 space-y-2.5">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {event.establishment?.name || "Local não informado"}
                      </p>
                      <h3 className="font-display text-lg text-foreground line-clamp-1 mt-0.5">
                        {event.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{formatDateTimeDisplay(event.startAt)}</span>
                    </div>

                    {venueNote ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="line-clamp-1">Ponto: {venueNote}</span>
                      </div>
                    ) : null}

                    {/* Preço / Entrada */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>
                        {event.entryPriceType === "FREE"
                          ? "Entrada Gratuita"
                          : event.entryPriceType === "COUVERT"
                          ? `Couvert: R$ ${formatCentsToReais(event.entryPriceCents)}`
                          : event.entryPriceType === "TICKET"
                          ? `Ingresso: R$ ${formatCentsToReais(event.entryPriceCents)}`
                          : event.entryPriceType === "FROM"
                          ? `A partir de R$ ${formatCentsToReais(event.entryPriceCents)}`
                          : event.entryPriceType === "UP_TO"
                          ? `Até R$ ${formatCentsToReais(event.entryPriceCents)}`
                          : "Consulte o local"}
                      </span>
                    </div>

                    {/* Músicos / Atrações */}
                    {event.artists && event.artists.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {event.artists.map((artist) => (
                          <span
                            key={artist.id}
                            className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-foreground font-medium"
                          >
                            🎤 {artist.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between border-t border-border p-4 bg-secondary/20">
                  <Badge
                    className={
                      event.agendaStatus === "CONFIRMED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }
                  >
                    {event.agendaStatus === "CONFIRMED"
                      ? "Confirmado"
                      : "Pendente"}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(event)}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(event)}
                      className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição Completa de Evento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-2xl">
                  {editingId ? "Editar Evento" : "Cadastrar Novo Evento"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preencha o formato, horário, local e cartaz de divulgação.
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

              {/* Seção 1: Estabelecimento */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Estabelecimento / Responsável
                </label>
                {isSinglePartnerPlace ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 p-3 text-sm font-medium">
                    <Lock className="h-4 w-4 text-primary" />
                    <span>{partnerEstablishments[0].name}</span>
                    <Badge className="ml-auto bg-primary/20 text-primary">
                      Seu estabelecimento
                    </Badge>
                  </div>
                ) : (
                  <SelectField
                    aria-label="Estabelecimento"
                    value={establishmentId}
                    onValueChange={setEstablishmentId}
                    placeholder="Selecione o estabelecimento"
                    required
                    options={partnerEstablishments.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                )}
              </div>

              {/* Seção 2: Cartaz / Imagem de Capa do Evento */}
              <div className="space-y-2 rounded-2xl border border-border bg-secondary/20 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Cartaz / Imagem de Capa do Evento
                  </label>
                  {coverPreviewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverMediaId(null);
                        setCoverPreviewUrl(null);
                      }}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remover cartaz
                    </button>
                  )}
                </div>

                {coverPreviewUrl ? (
                  <div className="relative aspect-16/9 w-full max-w-md mx-auto overflow-hidden rounded-2xl border border-border shadow-xs">
                    <Image
                      src={coverPreviewUrl}
                      alt="Cartaz do evento"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 text-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-2 text-xs font-medium text-foreground">
                      Faça upload do cartaz oficial do show, corrida ou evento
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      PNG, JPG ou WEBP até 5MB
                    </p>
                    <label className="mt-3 cursor-pointer rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition">
                      {uploadingCover ? "Enviando imagem..." : "Selecionar arquivo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingCover}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleCoverUpload(file);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Seção 3: Título e Modalidade (18 Formatos) */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Título do evento
                  </label>
                  <Input
                    placeholder="Ex: Corrida Noturna Taquaral 10k"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Formato / Modalidade do evento
                  </label>
                  <SelectField
                    aria-label="Formato do evento"
                    value={formatSlug}
                    onValueChange={handleFormatChange}
                    options={FORMAT_SELECT_OPTIONS}
                  />
                </div>
              </div>

              {/* Seção 4: Local Público ou Ponto de Encontro (Opcional) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Ponto de encontro ou local público (opcional)
                </label>
                <Input
                  placeholder="Ex: Portão 7 da Lagoa do Taquaral, Praça Arautos da Paz, Kartódromo"
                  value={publicVenue}
                  onChange={(e) => setPublicVenue(e.target.value)}
                />
              </div>

              {/* Seção 5: Datas e Horários */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {startAtLabel}
                  </label>
                  <Input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Data e horário de término (opcional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Seção 6: Preço e Entrada */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Tipo de entrada
                  </label>
                  <SelectField
                    aria-label="Tipo de entrada"
                    value={entryPriceType}
                    onValueChange={setEntryPriceType}
                    options={[
                      { value: "FREE", label: "Gratuito (Entrada franca)" },
                      { value: "COUVERT", label: "Couvert artístico" },
                      { value: "TICKET", label: "Ingresso fixo" },
                      { value: "FROM", label: "A partir de" },
                      { value: "UP_TO", label: "Até" },
                    ]}
                  />
                </div>

                {entryPriceType !== "FREE" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Valor em reais (R$)
                    </label>
                    <Input
                      placeholder="Ex: 20,00"
                      value={entryPriceReais}
                      onChange={(e) => setEntryPriceReais(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Seção 7: Descrição */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Descrição detalhada e atrações
                </label>
                <Textarea
                  placeholder="Conte os detalhes do evento, distâncias da corrida, premiações, food trucks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Seção 8: Artistas / Músicos */}
              {artists.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Artistas / Músicos participantes
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1 rounded-2xl border border-border p-2 bg-secondary/30">
                    {artists.map((artist) => (
                      <label
                        key={artist.id}
                        className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-secondary/60 p-1.5 rounded-xl transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedArtistIds.includes(artist.id)}
                          onChange={() =>
                            setSelectedArtistIds((curr) =>
                              curr.includes(artist.id)
                                ? curr.filter((id) => id !== artist.id)
                                : [...curr, artist.id],
                            )
                          }
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span>{artist.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção 9: Gêneros Musicais e Públicos */}
              <div className="grid gap-4 sm:grid-cols-2">
                {genres.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Gêneros Musicais
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1">
                      {genres.map((g) => {
                        const sel = selectedGenreIds.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() =>
                              setSelectedGenreIds((curr) =>
                                sel
                                  ? curr.filter((id) => id !== g.id)
                                  : [...curr, g.id],
                              )
                            }
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                              sel
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {g.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {audiences.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Públicos-alvo
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1">
                      {audiences.map((a) => {
                        const sel = selectedAudienceIds.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() =>
                              setSelectedAudienceIds((curr) =>
                                sel
                                  ? curr.filter((id) => id !== a.id)
                                  : [...curr, a.id],
                              )
                            }
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                              sel
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {a.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 10: Status e Publicação */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Status do evento
                  </label>
                  <SelectField
                    aria-label="Status do evento"
                    value={eventStatus}
                    onValueChange={setEventStatus}
                    options={[
                      {
                        value: "PUBLISHED",
                        label: "Publicado (Visível no portal)",
                      },
                      {
                        value: "DRAFT",
                        label: "Rascunho (Salvar sem publicar)",
                      },
                      { value: "CANCELLED", label: "Cancelado" },
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Status da agenda
                  </label>
                  <SelectField
                    aria-label="Status da agenda"
                    value={agendaStatus}
                    onValueChange={setAgendaStatus}
                    options={[
                      {
                        value: "CONFIRMED",
                        label: "Confirmado pelo estabelecimento",
                      },
                      { value: "PENDING", label: "Pendente de confirmação" },
                    ]}
                  />
                </div>
              </div>

              {/* Checkbox de Música ao vivo */}
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMusic}
                  onChange={(e) => setHasMusic(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>Evento conta com atração musical ou som ao vivo</span>
              </label>

              {/* Modal Actions */}
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
                  {submitting
                    ? "Salvando..."
                    : editingId
                    ? "Salvar alterações"
                    : "Publicar evento"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

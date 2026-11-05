"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DAYS_OF_WEEK } from "@/lib/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, API_URL } from "@/lib/api";

type Catalog = { id: string; name: string };

const emptyHours = DAYS_OF_WEEK.map((day) => ({
  dayOfWeek: day,
  opensAt: "18:00",
  closesAt: "02:00",
  closed: day === "MONDAY",
}));

export function EstablishmentForm({ id }: { id?: string }) {
  const router = useRouter();
  const [cities, setCities] = useState<Catalog[]>([]);
  const [categories, setCategories] = useState<Catalog[]>([]);
  const [audiences, setAudiences] = useState<Catalog[]>([]);
  const [amenities, setAmenities] = useState<Catalog[]>([]);
  const [genres, setGenres] = useState<Catalog[]>([]);
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    description: "",
    phone: "",
    whatsapp: "",
    instagramUrl: "",
    websiteUrl: "",
    addressStreet: "",
    addressNumber: "",
    neighborhood: "",
    postalCode: "",
    cityId: "",
    latitude: "-22.9058",
    longitude: "-47.0608",
    status: "DRAFT",
    categoryIds: [] as string[],
    audienceIds: [] as string[],
    amenityIds: [] as string[],
    genreIds: [] as string[],
    hasMusic: null as boolean | null,
    businessHours: emptyHours,
  });

  useEffect(() => {
    Promise.all([
      apiFetch<Catalog[]>("/public/cities"),
      apiFetch<Catalog[]>("/public/categories"),
      apiFetch<Catalog[]>("/public/audiences"),
      apiFetch<Catalog[]>("/public/amenities"),
      apiFetch<Catalog[]>("/public/genres"),
    ]).then(([c, cat, aud, ame, gen]) => {
      setCities(c);
      setCategories(cat);
      setAudiences(aud);
      setAmenities(ame);
      setGenres(gen);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    apiFetch<Record<string, unknown>>(`/admin/establishments/${id}`).then((row) => {
      setForm((current) => ({
        ...current,
        name: String(row.name ?? ""),
        shortDescription: String(row.shortDescription ?? ""),
        description: String(row.description ?? ""),
        phone: String(row.phone ?? ""),
        whatsapp: String(row.whatsapp ?? ""),
        instagramUrl: String(row.instagramUrl ?? ""),
        websiteUrl: String(row.websiteUrl ?? ""),
        addressStreet: String(row.addressStreet ?? ""),
        addressNumber: String(row.addressNumber ?? ""),
        neighborhood: String(row.neighborhood ?? ""),
        postalCode: String(row.postalCode ?? ""),
        cityId: String(row.cityId ?? ""),
        latitude: String(row.latitude ?? ""),
        longitude: String(row.longitude ?? ""),
        status: String(row.status ?? "DRAFT"),
        categoryIds: ((row.categories as Catalog[]) ?? []).map((item) => item.id),
        audienceIds: ((row.audiences as Catalog[]) ?? []).map((item) => item.id),
        amenityIds: ((row.amenities as Catalog[]) ?? []).map((item) => item.id),
        genreIds: ((row.genres as Catalog[]) ?? []).map((item) => item.id),
        hasMusic: typeof row.hasMusic === "boolean" ? row.hasMusic : null,
      }));
    });
  }, [id]);

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    const media = await apiFetch<{ id: string }>("/admin/media", { method: "POST", body });
    setMediaIds((current) => [...current, media.id]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      media: mediaIds.map((mediaId, index) => ({ mediaId, isCover: index === 0, sortOrder: index })),
    };
    try {
      if (id) {
        await apiFetch(`/admin/establishments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/admin/establishments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      router.push("/painel/estabelecimentos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  return (
    <form className="grid max-w-3xl gap-6" onSubmit={submit}>
      <section className="grid gap-3">
        <h2 className="font-display text-xl">Informações</h2>
        <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input placeholder="Resumo" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
        <Textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <SelectField
          aria-label="Status"
          value={form.status}
          onValueChange={(status) => setForm({ ...form, status })}
          options={[
            { value: "DRAFT", label: "Rascunho" },
            { value: "PUBLISHED", label: "Publicado" },
            { value: "ARCHIVED", label: "Arquivado" },
          ]}
        />
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-xl">Contato e redes</h2>
        <Input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        <Input placeholder="Instagram URL" value={form.instagramUrl} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} />
        <Input placeholder="Site" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-xl">Localização</h2>
        <Input placeholder="Rua" value={form.addressStreet} onChange={(e) => setForm({ ...form, addressStreet: e.target.value })} />
        <Input placeholder="Número" value={form.addressNumber} onChange={(e) => setForm({ ...form, addressNumber: e.target.value })} />
        <Input placeholder="Bairro" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
        <Input placeholder="CEP" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
        <SelectField
          aria-label="Cidade"
          value={form.cityId}
          onValueChange={(cityId) => setForm({ ...form, cityId })}
          placeholder="Cidade"
          required
          options={cities.map((city) => ({ value: city.id, label: city.name }))}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
          <Input placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl">Música no local</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { value: true, label: "Com musica" },
            { value: false, label: "Sem musica" },
            { value: null, label: "Não informado" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setForm({ ...form, hasMusic: option.value })}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
                form.hasMusic === option.value ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl">Gêneros</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {genres.map((item) => {
            const active = form.genreIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setForm({ ...form, genreIds: toggle(form.genreIds, item.id) })}
                className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
                  active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl">Categorias</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((item) => (
            <label key={item.id} className="text-sm">
              <input type="checkbox" checked={form.categoryIds.includes(item.id)} onChange={() => setForm({ ...form, categoryIds: toggle(form.categoryIds, item.id) })} /> {item.name}
            </label>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl">Clima e público</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {audiences.map((item) => (
            <label key={item.id} className="text-sm">
              <input type="checkbox" checked={form.audienceIds.includes(item.id)} onChange={() => setForm({ ...form, audienceIds: toggle(form.audienceIds, item.id) })} /> {item.name}
            </label>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl">Comodidades</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {amenities.map((item) => (
            <label key={item.id} className="text-sm">
              <input type="checkbox" checked={form.amenityIds.includes(item.id)} onChange={() => setForm({ ...form, amenityIds: toggle(form.amenityIds, item.id) })} /> {item.name}
            </label>
          ))}
        </div>
      </section>
      <section className="grid gap-2">
        <h2 className="font-display text-xl">Horários</h2>
        {form.businessHours.map((hour, index) => (
          <div key={hour.dayOfWeek} className="grid grid-cols-4 items-center gap-2 text-sm">
            <span>{hour.dayOfWeek}</span>
            <Input
              type="time"
              value={hour.opensAt}
              onChange={(e) => {
                const businessHours = [...form.businessHours];
                businessHours[index] = { ...hour, opensAt: e.target.value };
                setForm({ ...form, businessHours });
              }}
            />
            <Input
              type="time"
              value={hour.closesAt}
              onChange={(e) => {
                const businessHours = [...form.businessHours];
                businessHours[index] = { ...hour, closesAt: e.target.value };
                setForm({ ...form, businessHours });
              }}
            />
            <label>
              <input
                type="checkbox"
                checked={hour.closed}
                onChange={(e) => {
                  const businessHours = [...form.businessHours];
                  businessHours[index] = { ...hour, closed: e.target.checked };
                  setForm({ ...form, businessHours });
                }}
              />{" "}
              Fechado
            </label>
          </div>
        ))}
      </section>
      <section>
        <h2 className="font-display text-xl">Fotos</h2>
        <p className="text-sm text-muted-foreground">JPEG, PNG ou WEBP. A primeira vira capa.</p>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <p className="text-xs text-muted-foreground">{mediaIds.length} arquivo(s) prontos · {API_URL}</p>
      </section>
      {error ? <p className="text-destructive">{error}</p> : null}
      <Button type="submit">Salvar</Button>
    </form>
  );
}

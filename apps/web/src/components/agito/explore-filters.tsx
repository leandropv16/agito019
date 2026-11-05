"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ALL_EVENT_FORMATS, type NamedSlug } from "@/lib/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Sheet } from "@/components/ui/sheet";

export type ExploreValues = {
  search?: string;
  city?: string;
  date?: string;
  type?: string;
  category?: string;
  audience?: string;
  genre?: string;
  liveMusic?: string;
  promotion?: string;
};

const FORMAT_OPTIONS = [
  { value: "", label: "Todos os formatos de evento" },
  ...ALL_EVENT_FORMATS.map((fmt) => ({
    value: fmt.slug,
    label: fmt.name,
  })),
];

function Fields({
  values,
  cities,
  categories,
  audiences,
  genres,
  onChange,
}: {
  values: ExploreValues;
  cities: NamedSlug[];
  categories: NamedSlug[];
  audiences: NamedSlug[];
  genres: NamedSlug[];
  onChange: (name: keyof ExploreValues, value: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <Input
        placeholder="Buscar evento, local ou bairro"
        defaultValue={values.search}
        onBlur={(event) => onChange("search", event.target.value)}
      />

      <SelectField
        aria-label="Modalidade de Evento"
        value={values.type ?? ""}
        onValueChange={(value) => onChange("type", value)}
        placeholder="Modalidade de Evento"
        options={FORMAT_OPTIONS}
      />

      <SelectField
        aria-label="Cidade"
        value={values.city ?? ""}
        onValueChange={(value) => onChange("city", value)}
        placeholder="Todas as cidades"
        options={[
          { value: "", label: "Todas as cidades" },
          ...cities.map((item) => ({ value: item.slug, label: item.name })),
        ]}
      />

      <Input
        type="date"
        value={values.date ?? ""}
        onChange={(e) => onChange("date", e.target.value)}
      />

      <SelectField
        aria-label="Categoria"
        value={values.category ?? ""}
        onValueChange={(value) => onChange("category", value)}
        placeholder="Categoria"
        options={[
          { value: "", label: "Categoria" },
          ...categories.map((item) => ({ value: item.slug, label: item.name })),
        ]}
      />

      <SelectField
        aria-label="Público"
        value={values.audience ?? ""}
        onValueChange={(value) => onChange("audience", value)}
        placeholder="Público"
        options={[
          { value: "", label: "Público" },
          ...audiences.map((item) => ({ value: item.slug, label: item.name })),
        ]}
      />

      <SelectField
        aria-label="Gênero"
        value={values.genre ?? ""}
        onValueChange={(value) => onChange("genre", value)}
        placeholder="Gênero"
        options={[
          { value: "", label: "Gênero" },
          ...genres.map((item) => ({ value: item.slug, label: item.name })),
        ]}
      />

      <label className="flex items-center gap-2 text-sm text-white/90 cursor-pointer">
        <input
          type="checkbox"
          checked={values.liveMusic === "true"}
          onChange={(e) =>
            onChange("liveMusic", e.target.checked ? "true" : "")
          }
          className="rounded border-border text-primary focus:ring-primary"
        />
        Música ao vivo
      </label>

      <label className="flex items-center gap-2 text-sm text-white/90 cursor-pointer">
        <input
          type="checkbox"
          checked={values.promotion === "true"}
          onChange={(e) =>
            onChange("promotion", e.target.checked ? "true" : "")
          }
          className="rounded border-border text-primary focus:ring-primary"
        />
        Com promoção
      </label>
    </div>
  );
}

export function ExploreFilters(props: {
  values: ExploreValues;
  cities: NamedSlug[];
  categories: NamedSlug[];
  audiences: NamedSlug[];
  genres: NamedSlug[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(props.values);

  function apply(next: ExploreValues) {
    setValues(next);
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/explorar?${params.toString()}`);
  }

  function change(name: keyof ExploreValues, value: string) {
    apply({ ...values, [name]: value || undefined });
  }

  return (
    <>
      <div className="mb-4 md:hidden">
        <Sheet trigger={<Button variant="outline" className="h-11 w-full">Filtros</Button>} title="Filtros">
          <Fields {...props} values={values} onChange={change} />
        </Sheet>
      </div>
      <aside className="hidden w-72 shrink-0 md:block">
        <div className="sticky top-24 rounded-[20px] border border-white/10 bg-[#141414] p-5">
          <h2 className="mb-3 font-display text-lg font-bold text-white">Filtros</h2>
          <Fields {...props} values={values} onChange={change} />
        </div>
      </aside>
    </>
  );
}

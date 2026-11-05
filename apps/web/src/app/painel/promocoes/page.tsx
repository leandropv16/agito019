"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

type Named = { id: string; name: string };
type Promo = { id: string; title: string; active: boolean };

export default function Page() {
  const [rows, setRows] = useState<Promo[]>([]);
  const [places, setPlaces] = useState<Named[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [establishmentId, setEstablishmentId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  async function load() {
    const [list, est] = await Promise.all([
      apiFetch<{ data: Promo[] }>("/admin/promotions"),
      apiFetch<{ data: Named[] }>("/admin/establishments"),
    ]);
    setRows(list.data);
    setPlaces(est.data);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Promoções</h1>
      <form
        className="mt-4 grid max-w-xl gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await apiFetch("/admin/promotions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description,
              establishmentId,
              startsAt: new Date(startsAt).toISOString(),
              endsAt: new Date(endsAt).toISOString(),
              active: true,
            }),
          });
          setTitle("");
          await load();
        }}
      >
        <SelectField
          aria-label="Estabelecimento"
          value={establishmentId}
          onValueChange={setEstablishmentId}
          placeholder="Estabelecimento"
          required
          options={places.map((item) => ({ value: item.id, label: item.name }))}
        />
        <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
        <Button type="submit">Salvar promoção</Button>
      </form>
      <ul className="mt-6 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-border p-3">
            {row.title} {row.active ? "" : "(inativa)"}
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { apiFetch } from "@/lib/api";

type Named = { id: string; name: string };
type Campaign = {
  id: string;
  paymentStatus: string;
  unitPriceCents: number;
  totalPriceCents: number;
  plan: { name: string };
  establishment?: { name: string } | null;
  artist?: { name: string } | null;
};

export default function Page() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [plans, setPlans] = useState<Named[]>([]);
  const [places, setPlaces] = useState<Named[]>([]);
  const [artists, setArtists] = useState<Named[]>([]);
  const [commercialPlanId, setPlan] = useState("");
  const [target, setTarget] = useState("establishment");
  const [establishmentId, setEstablishmentId] = useState("");
  const [artistId, setArtistId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [unitPriceCents, setUnit] = useState("1500");
  const [totalPriceCents, setTotal] = useState("15000");
  const [notes, setNotes] = useState("");

  async function load() {
    const [list, p, est, art] = await Promise.all([
      apiFetch<Campaign[]>("/admin/commercial-campaigns"),
      apiFetch<Named[]>("/admin/commercial-plans"),
      apiFetch<{ data: Named[] }>("/admin/establishments"),
      apiFetch<{ data: Named[] }>("/admin/artists"),
    ]);
    setRows(list);
    setPlans(p);
    setPlaces(est.data);
    setArtists(art.data);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Campanhas</h1>
      <form
        className="mt-4 grid max-w-xl gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await apiFetch("/admin/commercial-campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              commercialPlanId,
              establishmentId: target === "establishment" ? establishmentId : null,
              artistId: target === "artist" ? artistId : null,
              startsAt: new Date(startsAt).toISOString(),
              endsAt: new Date(endsAt).toISOString(),
              unitPriceCents: Number(unitPriceCents),
              totalPriceCents: Number(totalPriceCents),
              paymentStatus: "PENDING",
              notes,
            }),
          });
          await load();
        }}
      >
        <SelectField
          aria-label="Plano"
          value={commercialPlanId}
          onValueChange={setPlan}
          placeholder="Plano"
          required
          options={plans.map((item) => ({ value: item.id, label: item.name }))}
        />
        <SelectField
          aria-label="Alvo da campanha"
          value={target}
          onValueChange={setTarget}
          options={[
            { value: "establishment", label: "Estabelecimento" },
            { value: "artist", label: "Artista" },
          ]}
        />
        {target === "establishment" ? (
          <SelectField
            aria-label="Local"
            value={establishmentId}
            onValueChange={setEstablishmentId}
            placeholder="Local"
            required
            options={places.map((item) => ({ value: item.id, label: item.name }))}
          />
        ) : (
          <SelectField
            aria-label="Músico"
            value={artistId}
            onValueChange={setArtistId}
            placeholder="Músico"
            required
            options={artists.map((item) => ({ value: item.id, label: item.name }))}
          />
        )}
        <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
        <Input placeholder="Valor unitário (centavos)" value={unitPriceCents} onChange={(e) => setUnit(e.target.value)} />
        <Input placeholder="Valor total (centavos)" value={totalPriceCents} onChange={(e) => setTotal(e.target.value)} />
        <Input placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit">Criar campanha</Button>
      </form>
      <ul className="mt-6 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
            <span>
              {row.plan.name} · {row.establishment?.name ?? row.artist?.name} · {row.paymentStatus}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await apiFetch(`/admin/commercial-campaigns/${row.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ paymentStatus: "PAID" }),
                });
                await load();
              }}
            >
              Marcar pago
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

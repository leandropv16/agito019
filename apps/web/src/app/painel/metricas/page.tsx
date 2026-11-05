"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Summary = {
  since: string;
  total: number;
  byTarget: {
    ROUTE: number;
    WHATSAPP: number;
    PHONE: number;
    INSTAGRAM: number;
  };
  recent: Array<{
    id: string;
    target: string;
    entityType: string;
    entityId: string;
    path: string | null;
    createdAt: string;
  }>;
};

export default function Page() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    void apiFetch<Summary>("/admin/click-metrics").then(setData);
  }, []);

  if (!data) {
    return <p className="text-muted-foreground">Carregando métricas...</p>;
  }

  const cards = [
    { label: "Rota / mapas", value: data.byTarget.ROUTE },
    { label: "WhatsApp", value: data.byTarget.WHATSAPP },
    { label: "Telefone", value: data.byTarget.PHONE },
    { label: "Instagram", value: data.byTarget.INSTAGRAM },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">Cliques</h1>
      <p className="mt-2 text-sm text-muted-foreground">Resumo local dos últimos 30 dias. Sem analytics de terceiros.</p>
      <p className="mt-4 text-sm">Total: {data.total}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-2 font-display text-3xl">{card.value}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-8 font-display text-2xl">Recentes</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {data.recent.map((row) => (
          <li key={row.id} className="rounded-xl border border-border px-3 py-2">
            {row.target} · {row.entityType} · {row.path ?? "..."} ·{" "}
            {new Date(row.createdAt).toLocaleString("pt-BR")}
          </li>
        ))}
        {data.recent.length === 0 ? <li className="text-muted-foreground">Sem cliques registrados.</li> : null}
      </ul>
    </div>
  );
}

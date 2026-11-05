"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { REPORT_PROBLEM_LABELS } from "@/lib/shared";

type Report = {
  id: string;
  problemType: keyof typeof REPORT_PROBLEM_LABELS;
  comment: string | null;
  createdAt: string;
  resolvedAt: string | null;
  event: {
    title: string;
    slug: string;
    startAt: string;
    agendaStatus: string;
    establishment: string;
    city: string;
  };
};

export default function Page() {
  const [rows, setRows] = useState<Report[]>([]);

  async function load() {
    setRows(await apiFetch<Report[]>("/admin/event-reports"));
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Denúncias de agenda</h1>
      <p className="mt-2 text-sm text-muted-foreground">Relatos públicos de erro na programação.</p>
      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-border p-4">
            <p className="font-semibold">
              {row.event.title} · {REPORT_PROBLEM_LABELS[row.problemType]}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {row.event.establishment} · {row.event.city} · agenda {row.event.agendaStatus}
            </p>
            {row.comment ? <p className="mt-2 text-sm">{row.comment}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground">{new Date(row.createdAt).toLocaleString("pt-BR")}</span>
              {row.resolvedAt ? (
                <span className="text-emerald-300">Resolvida</span>
              ) : (
                <Button
                  size="sm"
                  onClick={async () => {
                    await apiFetch(`/admin/event-reports/${row.id}/resolve`, { method: "PATCH" });
                    await load();
                  }}
                >
                  Marcar resolvida
                </Button>
              )}
            </div>
          </li>
        ))}
        {rows.length === 0 ? <li className="text-muted-foreground">Nenhuma denúncia ainda.</li> : null}
      </ul>
    </div>
  );
}

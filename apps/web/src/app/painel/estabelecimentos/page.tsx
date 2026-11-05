"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type Row = { id: string; name: string; slug: string; status: string; city: { name: string } };
type Me = { role: "ADMIN" | "PARTNER" };

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [role, setRole] = useState<Me["role"]>("PARTNER");
  useEffect(() => {
    Promise.all([apiFetch<{ data: Row[] }>("/admin/establishments"), apiFetch<Me>("/auth/me")]).then(([res, me]) => {
      setRows(res.data);
      setRole(me.role);
    });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Estabelecimentos</h1>
        {role === "ADMIN" ? (
          <Button asChild>
            <Link href="/painel/estabelecimentos/novo">Novo</Link>
          </Button>
        ) : null}
      </div>
      <div className="mt-6 space-y-2">
        {rows.map((row) => (
          <Link key={row.id} href={`/painel/estabelecimentos/${row.id}`} className="block rounded-2xl border border-border p-4">
            <p className="font-semibold">{row.name}</p>
            <p className="text-sm text-muted-foreground">
              {row.city.name} · {row.status}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

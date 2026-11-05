"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

type Item = { id: string; name: string; slug: string; active: boolean; sortOrder?: number };

export function CatalogPage({ title, path }: { title: string; path: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    try {
      setItems(await apiFetch<Item[]>(path));
      setForbidden(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes("não permitido")) {
        setForbidden(true);
        return;
      }
      throw error;
    }
  }

  useEffect(() => {
    void load();
  }, [path]);

  if (forbidden) {
    return (
      <div>
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="mt-4 text-muted-foreground">Acesso restrito ao administrador.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl">{title}</h1>
      <form
        className="mt-4 flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          await apiFetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          setName("");
          await load();
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo nome" required />
        <Button type="submit">Criar</Button>
      </form>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-2">Nome</th>
              <th>Slug</th>
              <th>Ativo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="py-2">{item.name}</td>
                <td>{item.slug}</td>
                <td>{item.active ? "sim" : "não"}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await apiFetch(`${path}/${item.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ active: !item.active }),
                      });
                      await load();
                    }}
                  >
                    {item.active ? "Desativar" : "Ativar"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

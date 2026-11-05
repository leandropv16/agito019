"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

type Artist = { id: string; name: string; type: string; status: string };
type Catalog = { id: string; name: string };
type Me = { role: "ADMIN" | "PARTNER" };

export default function Page() {
  const [rows, setRows] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Catalog[]>([]);
  const [role, setRole] = useState<Me["role"]>("PARTNER");
  const [name, setName] = useState("");
  const [type, setType] = useState("BAND");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [hireUrl, setHireUrl] = useState("");
  const [genreIds, setGenreIds] = useState<string[]>([]);

  async function load() {
    const [list, g, me] = await Promise.all([
      apiFetch<{ data: Artist[] }>("/admin/artists"),
      apiFetch<Catalog[]>("/public/genres"),
      apiFetch<Me>("/auth/me"),
    ]);
    setRows(list.data);
    setGenres(g);
    setRole(me.role);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Músicos</h1>
      {role === "ADMIN" ? (
        <form
          className="mt-4 grid max-w-xl gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await apiFetch("/admin/artists", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name,
                type,
                bio,
                whatsapp: whatsapp || undefined,
                videoUrl: videoUrl || undefined,
                hireUrl: hireUrl || undefined,
                status: "PUBLISHED",
                genreIds,
              }),
            });
            setName("");
            setBio("");
            setWhatsapp("");
            setVideoUrl("");
            setHireUrl("");
            await load();
          }}
        >
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <SelectField
            aria-label="Tipo de músico"
            value={type}
            onValueChange={setType}
            options={[
              { value: "SOLO", label: "Solo" },
              { value: "DUO", label: "Dupla" },
              { value: "BAND", label: "Banda" },
              { value: "DJ", label: "DJ" },
              { value: "OTHER", label: "Outro" },
            ]}
          />
          <Textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          <Input placeholder="WhatsApp (só números)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          <Input placeholder="URL do vídeo (YouTube)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          <Input placeholder="Link Contratar (opcional)" value={hireUrl} onChange={(e) => setHireUrl(e.target.value)} />
          <div className="flex flex-wrap gap-2 text-sm">
            {genres.map((genre) => (
              <label key={genre.id}>
                <input
                  type="checkbox"
                  checked={genreIds.includes(genre.id)}
                  onChange={() =>
                    setGenreIds((current) =>
                      current.includes(genre.id) ? current.filter((id) => id !== genre.id) : [...current, genre.id],
                    )
                  }
                />{" "}
                {genre.name}
              </label>
            ))}
          </div>
          <Button type="submit">Cadastrar músico</Button>
        </form>
      ) : null}
      <ul className="mt-6 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-border p-3">
            {row.name} · {row.type} · {row.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

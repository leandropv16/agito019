"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select-field";
import { apiFetch } from "@/lib/api";

type EstablishmentItem = { id: string; name: string; slug?: string };

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PARTNER";
  active: boolean;
  createdAt?: string;
  establishments?: EstablishmentItem[];
};

type GeneratedAccess = {
  name: string;
  email: string;
  plainPassword: string;
  establishmentNames: string;
};

function generatePasswordSuggestion(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Agito#${digits}!`;
}

export default function Page() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [places, setPlaces] = useState<EstablishmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modal de criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PARTNER");
  const [selectedEstablishmentIds, setSelectedEstablishmentIds] = useState<string[]>([]);

  // Notificação de sucesso / credenciais
  const [successAccess, setSuccessAccess] = useState<GeneratedAccess | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [usersData, estData] = await Promise.all([
        apiFetch<UserRow[]>("/admin/users"),
        apiFetch<{ data: EstablishmentItem[] }>("/admin/establishments"),
      ]);
      setUsers(usersData);
      setPlaces(estData.data);
    } catch {
      // Erro ao carregar
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function handleOpenCreateModal() {
    setName("");
    setEmail("");
    setPassword(generatePasswordSuggestion());
    setRole("PARTNER");
    setSelectedEstablishmentIds([]);
    setErrorMsg("");
    setSuccessAccess(null);
    setIsModalOpen(true);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      if (role === "PARTNER" && selectedEstablishmentIds.length > 0) {
        const res = await apiFetch<{
          user: UserRow;
          plainPassword: string;
          establishments: Array<{ id: string; name: string }>;
        }>("/admin/users/invite-partner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            establishmentIds: selectedEstablishmentIds,
          }),
        });

        const estNames = res.establishments.map((e) => e.name).join(", ") || "seu estabelecimento";
        setSuccessAccess({
          name: res.user.name,
          email: res.user.email,
          plainPassword: res.plainPassword,
          establishmentNames: estNames,
        });
      } else {
        await apiFetch("/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            establishmentIds: selectedEstablishmentIds,
          }),
        });

        const estNames = places
          .filter((p) => selectedEstablishmentIds.includes(p.id))
          .map((p) => p.name)
          .join(", ") || "painel geral";

        setSuccessAccess({
          name,
          email,
          plainPassword: password,
          establishmentNames: estNames,
        });
      }

      setIsModalOpen(false);
      await load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao criar usuário");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(user: UserRow) {
    if (!window.confirm(`Deseja gerar uma nova senha provisória para ${user.name}?`)) {
      return;
    }
    try {
      const res = await apiFetch<{
        user: UserRow;
        plainPassword: string;
        establishments: Array<{ id: string; name: string }>;
      }>(`/admin/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const estNames = res.establishments?.map((e) => e.name).join(", ") || "seu estabelecimento";
      setSuccessAccess({
        name: user.name,
        email: user.email,
        plainPassword: res.plainPassword,
        establishmentNames: estNames,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao resetar senha");
    }
  }

  function formatWhatsAppMessage(access: GeneratedAccess) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://agito019.com.br";
    return `Olá ${access.name}! Aqui está seu acesso exclusivo ao painel do AGITO019 para gerenciar ${access.establishmentNames}:\n\nLink: ${origin}/entrar\nE-mail: ${access.email}\nSenha provisória: ${access.plainPassword}\n\nNo painel você pode cadastrar e atualizar sua agenda de eventos, atrações musicais e promoções. Qualquer dúvida estamos à disposição!`;
  }

  async function copyToWhatsApp(access: GeneratedAccess) {
    const text = formatWhatsAppMessage(access);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert("Texto copiado para a área de transferência!");
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-3xl">Usuários e Acessos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie administradores e parceiros com acesso ao painel do AGITO019.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      {/* Card de Notificação de Acesso Criado / Resetado */}
      {successAccess && (
        <div className="rounded-3xl border-2 border-emerald-500/40 bg-emerald-950/20 p-6 text-foreground">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="h-5 w-5" />
                <span>Credenciais prontas para entrega a {successAccess.name}!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Copie os dados prontos para enviar diretamente pelo WhatsApp para o cliente:
              </p>
              <div className="mt-3 rounded-2xl bg-card p-4 font-mono text-xs text-muted-foreground space-y-1 border border-border">
                <p><span className="text-foreground font-semibold">E-mail:</span> {successAccess.email}</p>
                <p><span className="text-foreground font-semibold">Senha provisória:</span> {successAccess.plainPassword}</p>
                <p><span className="text-foreground font-semibold">Locais vinculados:</span> {successAccess.establishmentNames}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => copyToWhatsApp(successAccess)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado para WhatsApp!" : "Copiar dados para WhatsApp"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSuccessAccess(null)}
                className="text-xs"
              >
                Fechar aviso
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-[180px]">
          <SelectField
            aria-label="Filtrar por papel"
            value={roleFilter}
            onValueChange={setRoleFilter}
            options={[
              { value: "ALL", label: "Todos os papéis" },
              { value: "ADMIN", label: "Administradores" },
              { value: "PARTNER", label: "Parceiros" },
            ]}
          />
        </div>
      </div>

      {/* Lista de Usuários */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Carregando usuários...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-4 font-display text-lg">Nenhum usuário encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || roleFilter !== "ALL"
              ? "Tente ajustar os filtros de busca."
              : "Cadastre o primeiro usuário do sistema."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {user.role === "ADMIN" ? (
                      <Shield className="h-5 w-5 text-amber-400 shrink-0" />
                    ) : (
                      <UserCheck className="h-5 w-5 text-sky-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold leading-tight">{user.name}</p>
                      <p className="text-xs text-muted-foreground break-all">{user.email}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      user.role === "ADMIN"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-sky-500/20 text-sky-400"
                    }
                  >
                    {user.role}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${user.active ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <span>{user.active ? "Conta ativa" : "Inativo"}</span>
                </div>

                {/* Estabelecimentos vinculados */}
                {user.role === "PARTNER" && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Locais gerenciados:
                    </p>
                    {user.establishments && user.establishments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.establishments.map((est) => (
                          <span
                            key={est.id}
                            className="rounded-lg bg-secondary px-2 py-0.5 text-xs text-foreground"
                          >
                            {est.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-muted-foreground">Nenhum local vinculado</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetPassword(user)}
                  className="w-full flex items-center justify-center gap-2 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Gerar nova senha
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação de Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <h3 className="font-display text-xl">Novo usuário</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              {errorMsg && (
                <div className="rounded-2xl bg-destructive/10 p-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Nome completo</label>
                <Input
                  placeholder="Ex: João da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">E-mail de acesso</label>
                <Input
                  type="email"
                  placeholder="Ex: joao@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">Senha provisória</label>
                  <button
                    type="button"
                    onClick={() => setPassword(generatePasswordSuggestion())}
                    className="text-xs text-primary hover:underline"
                  >
                    Gerar senha segura
                  </button>
                </div>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Papel no sistema</label>
                <SelectField
                  aria-label="Papel"
                  value={role}
                  onValueChange={setRole}
                  options={[
                    { value: "PARTNER", label: "Parceiro (Dono ou Gerente de Estabelecimento)" },
                    { value: "ADMIN", label: "Administrador Geral" },
                  ]}
                />
              </div>

              {role === "PARTNER" && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Selecione os estabelecimentos que este parceiro poderá gerenciar:
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-2xl border border-border p-3 bg-secondary/30">
                    {places.map((place) => (
                      <label
                        key={place.id}
                        className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:bg-secondary/50 p-1.5 rounded-xl transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEstablishmentIds.includes(place.id)}
                          onChange={() =>
                            setSelectedEstablishmentIds((current) =>
                              current.includes(place.id)
                                ? current.filter((id) => id !== place.id)
                                : [...current, place.id],
                            )
                          }
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span>{place.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                  {submitting ? "Criando..." : "Salvar usuário"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

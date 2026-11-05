"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, KeyRound, Plus, RefreshCw, UserCheck, Users } from "lucide-react";
import { EstablishmentForm } from "../form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt?: string;
};

type EstablishmentBasic = {
  id: string;
  name: string;
  slug: string;
};

type GeneratedAccess = {
  name: string;
  email: string;
  plainPassword: string;
  establishmentName: string;
};

function generatePasswordSuggestion(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Agito#${digits}!`;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<"form" | "users">("form");
  const [establishment, setEstablishment] = useState<EstablishmentBasic | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successAccess, setSuccessAccess] = useState<GeneratedAccess | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");

  useEffect(() => {
    apiFetch<EstablishmentBasic>(`/admin/establishments/${id}`)
      .then(setEstablishment)
      .catch(() => null);
  }, [id]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const data = await apiFetch<UserRow[]>(`/admin/establishments/${id}/users`);
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (activeTab === "users") {
      void loadUsers();
    }
  }, [activeTab, id]);

  function handleOpenCreateModal() {
    setClientName("");
    setClientEmail("");
    setClientPassword(generatePasswordSuggestion());
    setErrorMsg("");
    setSuccessAccess(null);
    setIsModalOpen(true);
  }

  async function handleCreatePartner(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await apiFetch<{
        user: UserRow;
        plainPassword: string;
        establishments: Array<{ id: string; name: string }>;
      }>("/admin/users/invite-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName,
          email: clientEmail,
          password: clientPassword,
          establishmentIds: [id],
        }),
      });

      setSuccessAccess({
        name: res.user.name,
        email: res.user.email,
        plainPassword: res.plainPassword,
        establishmentName: establishment?.name || "seu estabelecimento",
      });
      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao criar acesso");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(userId: string, userName: string, userEmail: string) {
    if (!window.confirm(`Deseja gerar uma nova senha provisória para ${userName}?`)) {
      return;
    }
    try {
      const res = await apiFetch<{
        user: UserRow;
        plainPassword: string;
        establishments: Array<{ id: string; name: string }>;
      }>(`/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      setSuccessAccess({
        name: userName,
        email: userEmail,
        plainPassword: res.plainPassword,
        establishmentName: establishment?.name || "seu estabelecimento",
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao resetar senha");
    }
  }

  function formatWhatsAppMessage(access: GeneratedAccess) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://agito019.com.br";
    return `Olá ${access.name}! Aqui está seu acesso exclusivo ao painel do AGITO019 para gerenciar ${access.establishmentName}:\n\nLink: ${origin}/entrar\nE-mail: ${access.email}\nSenha provisória: ${access.plainPassword}\n\nNo painel você pode cadastrar e atualizar sua agenda de eventos, atrações musicais e promoções. Qualquer dúvida estamos à disposição!`;
  }

  async function copyToWhatsApp(access: GeneratedAccess) {
    const text = formatWhatsAppMessage(access);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      alert("Texto copiado para a área de transferência!");
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/painel/estabelecimentos" className="flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Estabelecimentos
            </Link>
            <span>/</span>
            <span>{establishment?.name ?? "Carregando..."}</span>
          </div>
          <h1 className="mt-1 font-display text-3xl">
            {establishment ? establishment.name : "Editar estabelecimento"}
          </h1>
        </div>

        {/* Abas */}
        <div className="flex rounded-2xl bg-secondary p-1">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "form" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Dados do local
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "users" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            Responsáveis com Acesso
            {users.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                {users.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Card de Notificação de Acesso Gerado */}
      {successAccess && (
        <div className="rounded-3xl border-2 border-emerald-500/40 bg-emerald-950/20 p-6 text-foreground">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="h-5 w-5" />
                <span>Acesso gerado com sucesso para {successAccess.name}!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Copie os dados prontos para enviar diretamente pelo WhatsApp para o cliente:
              </p>
              <div className="mt-3 rounded-2xl bg-card p-4 font-mono text-xs text-muted-foreground space-y-1 border border-border">
                <p><span className="text-foreground font-semibold">E-mail:</span> {successAccess.email}</p>
                <p><span className="text-foreground font-semibold">Senha provisória:</span> {successAccess.plainPassword}</p>
                <p><span className="text-foreground font-semibold">Local:</span> {successAccess.establishmentName}</p>
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

      {/* Conteúdo da Aba Form */}
      {activeTab === "form" && (
        <div>
          <EstablishmentForm id={id} />
        </div>
      )}

      {/* Conteúdo da Aba Responsáveis */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6">
            <div>
              <h2 className="font-display text-2xl">Responsáveis com Acesso / Clientes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Proprietários e gerentes com permissão para gerenciar a agenda de eventos, atrações e informações de {establishment?.name}.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar acesso para cliente
            </Button>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-muted-foreground">Carregando responsáveis...</div>
          ) : users.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/60" />
              <h3 className="mt-4 font-display text-lg">Nenhum responsável vinculado</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Crie o primeiro acesso para que o dono ou gerente do estabelecimento possa acessar o painel e atualizar a programação.
              </p>
              <Button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-4"
              >
                Criar primeiro acesso
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <Badge className={user.role === "ADMIN" ? "bg-amber-500/20 text-amber-400" : "bg-sky-500/20 text-sky-400"}>
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={`h-2 w-2 rounded-full ${user.active ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <span>{user.active ? "Conta ativa" : "Inativo"}</span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(user.id, user.name, user.email)}
                      className="w-full flex items-center justify-center gap-2 text-xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Resetar senha e gerar mensagem WhatsApp
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal de Criação de Acesso */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-xl">Criar acesso para cliente</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreatePartner} className="mt-4 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    O usuário será criado com papel de Parceiro e vinculado automaticamente a {establishment?.name}.
                  </p>

                  {errorMsg && (
                    <div className="rounded-2xl bg-destructive/10 p-3 text-xs text-destructive">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Nome do responsável</label>
                    <Input
                      placeholder="Ex: Carlos Oliveira"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">E-mail do responsável</label>
                    <Input
                      type="email"
                      placeholder="Ex: contato@barexemplo.com.br"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground">Senha provisória</label>
                      <button
                        type="button"
                        onClick={() => setClientPassword(generatePasswordSuggestion())}
                        className="text-xs text-primary hover:underline"
                      >
                        Gerar nova senha segura
                      </button>
                    </div>
                    <Input
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Mínimo de 8 caracteres. O cliente poderá alterar a senha depois.
                    </p>
                  </div>

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
                      {submitting ? "Criando..." : "Salvar e gerar mensagem"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

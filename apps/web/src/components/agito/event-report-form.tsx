"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { REPORT_PROBLEM_LABELS } from "@/lib/shared";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";

const options = Object.entries(REPORT_PROBLEM_LABELS).map(([value, label]) => ({ value, label }));

export function EventReportForm({ eventId }: { eventId: string }) {
  const [problemType, setProblemType] = useState("WRONG_TIME");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  return (
    <form
      className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus("sending");
        try {
          const res = await fetch(`${API_URL}/public/event-reports`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventId,
              problemType,
              comment: comment.trim() || undefined,
            }),
          });
          if (!res.ok) throw new Error("fail");
          const data = (await res.json()) as { message?: string };
          setMessage(data.message ?? "Obrigado. Vamos conferir a agenda.");
          setStatus("ok");
          setComment("");
        } catch {
          setStatus("error");
          setMessage("Não deu para enviar agora. Tente de novo em instantes.");
        }
      }}
    >
      <h3 className="font-display text-xl">Algo errado nesta agenda?</h3>
      <p className="text-sm text-muted-foreground">
        Avisa a gente. A denúncia ajuda a manter a programação confiável.
      </p>
      <SelectField
        aria-label="Tipo do problema"
        value={problemType}
        onValueChange={setProblemType}
        options={options}
      />
      <Textarea
        placeholder="Comentário opcional"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
      />
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Enviando..." : "Enviar denúncia"}
      </Button>
      {status === "ok" || status === "error" ? (
        <p className={`text-sm ${status === "ok" ? "text-emerald-300" : "text-amber-200"}`}>{message}</p>
      ) : null}
    </form>
  );
}

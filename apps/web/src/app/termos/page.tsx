import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Termos curtos do MVP AGITO019 para consulta de agenda na região 019.",
  alternates: { canonical: siteUrl("/termos") },
};

export default function TermosPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Legal</p>
      <h1 className="mt-2 font-display text-4xl">Termos de uso</h1>
      <p className="mt-4 text-muted-foreground">
        Ao usar o AGITO019, você consulta uma agenda colaborativa de bares, casas e músicos da região 019.
      </p>
      <section className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          A programação pública é informativa. Horários, preços e line-ups podem mudar. Confirme com o local quando
          fizer diferença para você.
        </p>
        <p>
          Parceiros são responsáveis pelas informações que publicam no painel. O status de confiança da agenda
          (confirmado, pendente ou desatualizado) é um sinal de apoio, não uma garantia formal.
        </p>
        <p>
          Planos comerciais e campanhas usam pagamento manual no painel neste MVP. Não há cobrança automática por
          cartão ou gateway.
        </p>
        <p>
          Conteúdo ofensivo, enganoso ou sem autorização pode ser removido. Em caso de dúvida, fale com a equipe pelo
          painel ou pelos canais oficiais do projeto.
        </p>
      </section>
    </article>
  );
}

import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Como o AGITO019 trata dados no MVP local da região 019.",
  alternates: { canonical: siteUrl("/privacidade") },
};

export default function PrivacidadePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Legal</p>
      <h1 className="mt-2 font-display text-4xl">Privacidade</h1>
      <p className="mt-4 text-muted-foreground">
        O AGITO019 é um MVP local de programação na região 019. Esta página descreve, em linguagem simples, o que
        coletamos hoje.
      </p>
      <section className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Contas de parceiros e administradores guardam nome, e-mail e senha criptografada para acesso ao painel.
        </p>
        <p>
          Ao usar o site público, podemos registrar cliques em rotas, WhatsApp, telefone e Instagram para entender o
          que ajuda as pessoas a chegar nos eventos. Esses registros ficam no nosso banco, sem ferramentas de
          analytics de terceiros.
        </p>
        <p>
          Denúncias de erro na agenda ficam vinculadas ao evento reportado, com o tipo do problema e um comentário
          opcional.
        </p>
        <p>
          Não vendemos dados pessoais. Em produção futura, esta política será revisada com base no uso real do
          produto e nas obrigações legais aplicáveis.
        </p>
      </section>
    </article>
  );
}

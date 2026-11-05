"use client";

import { BrandLogo } from "@/components/agito/brand-logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <BrandLogo href="/" variant="symbol" size="lg" />
      <h1 className="mt-4 font-display text-3xl">Algo saiu do ritmo</h1>
      <p className="mt-2 text-muted-foreground">Não rolou carregar essa página agora.</p>
      <Button className="mt-6" onClick={reset}>
        Tentar de novo
      </Button>
    </div>
  );
}

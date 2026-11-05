import Link from "next/link";
import { BrandLogo } from "@/components/agito/brand-logo";
import { Intro } from "@/components/agito/motion";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Intro className="mx-auto max-w-xl px-4 py-16 text-center">
      <div data-intro>
      <BrandLogo href="/" size="lg" className="mx-auto" />
      </div>
      <h1 data-intro className="mt-6 break-words font-display text-3xl">Esse rolê não existe</h1>
      <p data-intro className="mt-2 text-muted-foreground">A página ou o local que você procura não está no 019.</p>
      <div data-intro>
      <Button asChild className="mt-6">
        <Link href="/explorar">Explorar o 019</Link>
      </Button>
      </div>
    </Intro>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IntentLanding } from "@/components/agito/intent-landing";
import { isSeoWhenSlug } from "@/lib/seo/intents";
import { landingMetadata, loadSeoLanding } from "@/lib/seo/load-landing";

export const revalidate = 60;

async function load(when: string) {
  if (!isSeoWhenSlug(when)) {
    return null;
  }
  return loadSeoLanding({ topic: "musica-ao-vivo", when });
}

export async function generateMetadata({ params }: { params: Promise<{ when: string }> }): Promise<Metadata> {
  const landing = await load((await params).when);
  return landing ? landingMetadata(landing) : { title: "Música ao vivo no 019", robots: { index: false, follow: true } };
}

export default async function MusicaAoVivoWhenPage({ params }: { params: Promise<{ when: string }> }) {
  const landing = await load((await params).when);
  if (!landing) {
    notFound();
  }
  return <IntentLanding landing={landing} />;
}

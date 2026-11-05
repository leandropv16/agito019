import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IntentLanding } from "@/components/agito/intent-landing";
import { landingMetadata, loadSeoLanding } from "@/lib/seo/load-landing";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const landing = await loadSeoLanding({ when: "hoje" });
  return landing ? landingMetadata(landing) : { title: "Hoje no 019" };
}

export default async function HojePage() {
  const landing = await loadSeoLanding({ when: "hoje" });
  if (!landing) {
    notFound();
  }
  return <IntentLanding landing={landing} />;
}

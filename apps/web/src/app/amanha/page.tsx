import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IntentLanding } from "@/components/agito/intent-landing";
import { landingMetadata, loadSeoLanding } from "@/lib/seo/load-landing";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const landing = await loadSeoLanding({ when: "amanha" });
  return landing ? landingMetadata(landing) : { title: "Amanhã no 019" };
}

export default async function AmanhaPage() {
  const landing = await loadSeoLanding({ when: "amanha" });
  if (!landing) {
    notFound();
  }
  return <IntentLanding landing={landing} />;
}

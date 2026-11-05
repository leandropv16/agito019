import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IntentLanding } from "@/components/agito/intent-landing";
import { isReservedCitySlug, isSeoTopicSlug, isSeoWhenSlug } from "@/lib/seo/intents";
import { landingMetadata, loadSeoLanding } from "@/lib/seo/load-landing";

export const revalidate = 60;

async function load(citySlug: string, intent: string, when: string) {
  if (isReservedCitySlug(citySlug) || !isSeoTopicSlug(intent) || !isSeoWhenSlug(when)) {
    return null;
  }
  return loadSeoLanding({ city: citySlug, slot: intent, slot2: when });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string; intent: string; when: string }>;
}): Promise<Metadata> {
  const { citySlug, intent, when } = await params;
  const landing = await load(citySlug, intent, when);
  if (!landing) {
    return { title: "Página", robots: { index: false, follow: true } };
  }
  return landingMetadata(landing);
}

export default async function CityIntentWhenPage({
  params,
}: {
  params: Promise<{ citySlug: string; intent: string; when: string }>;
}) {
  const { citySlug, intent, when } = await params;
  const landing = await load(citySlug, intent, when);
  if (!landing) {
    notFound();
  }
  return <IntentLanding landing={landing} />;
}

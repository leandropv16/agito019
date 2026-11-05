import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IntentLanding } from "@/components/agito/intent-landing";
import { isReservedCitySlug, isSeoTopicSlug, isSeoWhenSlug } from "@/lib/seo/intents";
import { landingMetadata, loadSeoLanding } from "@/lib/seo/load-landing";

export const revalidate = 60;

async function load(citySlug: string, intent: string) {
  if (isReservedCitySlug(citySlug) || (!isSeoTopicSlug(intent) && !isSeoWhenSlug(intent))) {
    return null;
  }
  return loadSeoLanding({ city: citySlug, slot: intent });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string; intent: string }>;
}): Promise<Metadata> {
  const { citySlug, intent } = await params;
  const landing = await load(citySlug, intent);
  if (!landing) {
    return { title: "Página", robots: { index: false, follow: true } };
  }
  return landingMetadata(landing);
}

export default async function CityIntentPage({
  params,
}: {
  params: Promise<{ citySlug: string; intent: string }>;
}) {
  const { citySlug, intent } = await params;
  const landing = await load(citySlug, intent);
  if (!landing) {
    notFound();
  }
  return <IntentLanding landing={landing} />;
}

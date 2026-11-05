import type { Metadata } from "next";
import { ApiError, publicGet } from "@/lib/api";
import type { SeoLanding } from "@/lib/types";
import { siteUrl } from "./site";

export async function loadSeoLanding(input: {
  city?: string;
  topic?: string;
  when?: string;
  slot?: string;
  slot2?: string;
}): Promise<SeoLanding | null> {
  const params = new URLSearchParams();
  if (input.city) params.set("city", input.city);
  if (input.topic) params.set("topic", input.topic);
  if (input.when) params.set("when", input.when);
  if (input.slot) params.set("slot", input.slot);
  if (input.slot2) params.set("slot2", input.slot2);
  try {
    return await publicGet<SeoLanding>(`/public/seo/landing?${params.toString()}`, {
      next: {
        revalidate: 60,
        tags: ["public", "seo", input.city ? `seo:city:${input.city}` : "seo:region"],
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function landingMetadata(landing: SeoLanding): Metadata {
  const url = siteUrl(landing.canonicalPath);
  return {
    title: landing.title,
    description: landing.description,
    alternates: { canonical: url },
    robots: landing.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: landing.title,
      description: landing.description,
      url,
      locale: "pt_BR",
      type: "website",
      siteName: "AGITO019",
      images: landing.ogImage ? [{ url: landing.ogImage, alt: landing.h1 }] : undefined,
    },
    twitter: {
      card: landing.ogImage ? "summary_large_image" : "summary",
      title: landing.title,
      description: landing.description,
    },
  };
}

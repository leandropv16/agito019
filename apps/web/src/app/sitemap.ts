import type { MetadataRoute } from "next";
import { publicGet } from "@/lib/api";
import { siteOrigin, siteUrl } from "@/lib/seo/site";
import type { SeoSitemapPayload } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await publicGet<SeoSitemapPayload>("/public/seo/sitemap", {
    next: { revalidate: 60, tags: ["sitemap", "seo", "public"] },
  }).catch(() => null);
  const origin = siteOrigin();
  if (!payload?.entries.length) {
    return [
      { url: siteUrl("/"), changeFrequency: "daily", priority: 1 },
      { url: `${origin}/explorar`, changeFrequency: "hourly", priority: 0.3 },
    ];
  }
  return payload.entries.map((entry) => ({
    url: `${origin}${entry.path}`,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}

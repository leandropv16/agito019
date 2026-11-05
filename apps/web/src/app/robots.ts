import type { MetadataRoute } from "next";
import { siteOrigin, siteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/painel", "/entrar", "/api"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: siteOrigin(),
  };
}

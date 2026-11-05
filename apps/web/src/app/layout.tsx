import type { Metadata } from "next";
import { Be_Vietnam_Pro, Outfit } from "next/font/google";
import { JsonLd } from "@/components/agito/json-ld";
import { MotionRefresh } from "@/components/agito/motion";
import { SiteHeader } from "@/components/agito/site-header";
import { SiteFooter } from "@/components/agito/site-footer";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: ["400", "500", "600", "700"],
});

const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.FRONTEND_URL ?? "http://localhost:3000"),
  title: {
    default: "AGITO019: o que tem para fazer hoje no 019?",
    template: "%s | AGITO019",
  },
  description:
    "Bares, música ao vivo, eventos e promoções em Campinas, Americana, Limeira, Piracicaba, Sumaré, Hortolândia e toda a região 019.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-agito019.png", sizes: "180x180", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AGITO019",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "AGITO019: o que tem para fazer hoje no 019?",
    description: "Música ao vivo, barzinhos e programação na região 019.",
    locale: "pt_BR",
    type: "website",
    siteName: "AGITO019",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGITO019: o que tem para fazer hoje no 019?",
    description: "Música ao vivo, barzinhos e programação na região 019.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <JsonLd data={{ "@context": "https://schema.org", "@graph": [organizationJsonLd(), websiteJsonLd()] }} />
        <MotionRefresh />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

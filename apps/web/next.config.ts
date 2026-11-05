import type { NextConfig } from "next";
import path from "node:path";

const sharedEntry = path.resolve(__dirname, "../../packages/shared/src/index.ts");

function uploadRemotePattern() {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const url = new URL(raw);
    const protocol = url.protocol === "https:" ? "https" : "http";
    return {
      protocol,
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/uploads/**",
    } as const;
  } catch {
    return null;
  }
}

const uploadPattern = uploadRemotePattern();

const nextConfig: NextConfig = {
  transpilePackages: ["@agito019/shared"],
  turbopack: {
    resolveAlias: {
      "@agito019/shared": sharedEntry,
    },
  },
  webpack: (config) => {
    // Google Drive + HMR corrompe o filesystem cache do webpack e deixa
    // modules undefined no client (TypeError reading 'call').
    config.cache = false;
    config.resolve.alias = {
      ...config.resolve.alias,
      "@agito019/shared": sharedEntry,
    };
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
  // Em dev, evita o browser reusar chunks velhos apos rebuild/.next limpo.
  async headers() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3001", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "3001", pathname: "/uploads/**" },
      ...(uploadPattern ? [uploadPattern] : []),
    ],
  },
};

export default nextConfig;

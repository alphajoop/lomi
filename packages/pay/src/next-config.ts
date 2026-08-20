import type { NextConfig } from "next";

const SUPABASE_HOST = "mdswvokxrnfggrujsfjd.supabase.co";

type WebpackResolveConfig = {
  resolve?: {
    extensionAlias?: Record<string, string | string[]>;
  };
};

/** Webpack fallback: remap TypeScript ESM `.js` specifiers to `.ts`. Turbopack uses compiled `dist/` instead. */
function applyTypeScriptJsExtensionAlias(webpackConfig: WebpackResolveConfig) {
  webpackConfig.resolve = webpackConfig.resolve ?? {};
  webpackConfig.resolve.extensionAlias = {
    ...webpackConfig.resolve.extensionAlias,
    ".js": [".ts", ".tsx", ".js"],
    ".mjs": [".mts", ".mjs"],
  };
}

export function createHostedCommerceNextConfig(
  overrides: NextConfig = {},
): NextConfig {
  const previousWebpack = overrides.webpack;
  return {
    reactStrictMode: true,
    devIndicators: false,
    turbopack: {},
    transpilePackages: [
      "@lomi./ui",
      "@lomi./shared",
      "@lomi./queries",
      "@lomi./pay",
      "@lomi./receipt-pdf",
    ],
    experimental: {
      optimizeServerReact: true,
      optimizeCss: process.env.NODE_ENV === "production",
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: SUPABASE_HOST,
          port: "",
          pathname: "/storage/v1/object/public/**",
        },
        {
          protocol: "https",
          hostname: SUPABASE_HOST,
          port: "",
          pathname: "/storage/v1/render/image/public/**",
        },
        {
          protocol: "https",
          hostname: SUPABASE_HOST,
          port: "",
          pathname: "/storage/v1/object/sign/**",
        },
      ],
      formats: ["image/webp", "image/avif"],
      minimumCacheTTL: 2419200,
    },
    compiler: {
      removeConsole: process.env.NODE_ENV === "production",
    },
    compress: true,
    poweredByHeader: false,
    generateEtags: false,
    async headers() {
      if (process.env.NODE_ENV === "development") {
        return [
          {
            source: "/(.*)",
            headers: [{ key: "X-DNS-Prefetch-Control", value: "on" }],
          },
        ];
      }
      return [
        {
          source: "/(.*)",
          headers: [{ key: "X-DNS-Prefetch-Control", value: "on" }],
        },
        {
          source: "/_next/static/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        {
          source: "/api/og",
          headers: [
            {
              key: "Cache-Control",
              value:
                "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
            },
          ],
        },
      ];
    },
    ...overrides,
    webpack: (webpackConfig, options) => {
      applyTypeScriptJsExtensionAlias(webpackConfig);
      return previousWebpack
        ? previousWebpack(webpackConfig, options)
        : webpackConfig;
    },
  };
}

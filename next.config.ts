import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "symbol-sdk",
    "symbol-crypto-wasm-node",
    "@resvg/resvg-js",
  ],

  outputFileTracingIncludes: {
    "/api/stamp/scan": [
      "./public/fonts/NotoSansJP-Regular.ttf",
    ],
  },
};

export default nextConfig;
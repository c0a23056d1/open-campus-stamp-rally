import type { NextConfig } from "next";
import {
  NormalModuleReplacementPlugin,
  ProvidePlugin,
} from "webpack";

const nextConfig: NextConfig = {
  /*
   * API Routeなどサーバー側では、
   * Node版のSymbol SDKをそのまま使用する。
   */
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

  /*
   * next build（Turbopack）のブラウザ側向け設定
   */
  turbopack: {
    resolveAlias: {
      "symbol-crypto-wasm-node":
        "symbol-crypto-wasm-web/symbol_crypto_wasm.js",
    },
  },

  /*
   * next dev --webpack向け設定
   */
  webpack(config, { isServer }) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    /*
     * クライアント側だけWeb版WASMへ置き換える。
     * API Routeなどサーバー側はNode版を使用する。
     */
    if (!isServer) {
      config.plugins.push(
        new NormalModuleReplacementPlugin(
          /^symbol-crypto-wasm-node$/,
          "symbol-crypto-wasm-web/symbol_crypto_wasm.js"
        )
      );

      config.plugins.push(
        new ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        })
      );
    }

    return config;
  },
};

export default nextConfig;
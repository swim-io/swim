const { addBeforeLoader, loaderByName, whenTest } = require("@craco/craco");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
// const webpack = require("webpack");

module.exports = {
  babel: {
    plugins: [
      "@babel/plugin-proposal-nullish-coalescing-operator",
      ...whenTest(
        () => [
          // Without this EUI breaks. See https://github.com/elastic/eui/issues/3973
          [
            "@babel/plugin-transform-modules-commonjs",
            { allowTopLevelThis: true },
          ],
        ],
        [],
      ),
    ],
  },
  jest: {
    configure: {
      globals: {
        // Without this we get an error via @certusone/wormhole-sdk
        crypto: {},
      },
      resetMocks: true,
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      const wasmExtensionRegExp = /\.wasm$/;
      webpackConfig.resolve.extensions.push(".wasm");

      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      const wasmLoader = {
        test: /\.wasm$/,
        include: /node_modules\/(bridge|token-bridge)/,
        loaders: ["wasm-loader"],
      };

      addBeforeLoader(webpackConfig, loaderByName("file-loader"), wasmLoader);

      // Disable code splitting to prevent ChunkLoadError
      webpackConfig.optimization.runtimeChunk = false;
      webpackConfig.optimization.splitChunks = {
        cacheGroups: {
          default: false,
        },
        chunks(chunk) {
          return false;
        },
      };
      webpackConfig.optimization.chunkIds = "named";
      webpackConfig.output.filename =
        process.env.NODE_ENV === "development"
          ? "static/js/[name].[hash].js"
          : "static/js/[name].[chunkhash].js";
      webpackConfig.output.chunkFilename =
        process.env.NODE_ENV === "development"
          ? "static/js/[name].[hash].js"
          : "static/js/[name].[chunkhash].js";

      if (process.env.NODE_ENV !== "development") {
        webpackConfig.devtool = "source-map";

        if (process.env.SKIP_SENTRY !== "true") {
          if (!process.env.SENTRY_AUTH_TOKEN) {
            throw new Error("SENTRY_AUTH_TOKEN is not set");
          }
          // Upload source maps to Sentry
          if (!process.env.SENTRY_RELEASE) {
            throw new Error("SENTRY_RELEASE is not set");
          }
          webpackConfig.plugins = [
            ...webpackConfig.plugins,
            new SentryWebpackPlugin({
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: "swim",
              project: "ui",
              release: process.env.SENTRY_RELEASE,
              include: "build",
              ignoreFile: ".gitignore",
            }),
          ];
        }
      }

      return webpackConfig;
    },
  },
};

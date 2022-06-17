const { whenTest } = require("@craco/craco");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const webpack = require("webpack");

module.exports = {
  // reactScriptsVersion: 'react-scripts' /* (default value) */,
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
      // Verbose output from Webpack to help debugging on CI
      webpackConfig.stats = "verbose"

      // add wasm-loader
      const oneOfRules = webpackConfig.module.rules.find((rule) => rule.oneOf);
      oneOfRules.oneOf.unshift({
        test: /\.wasm$/,
        include: /node_modules\/@certusone\/wormhole-sdk/,
        loader: require.resolve("wasm-loader"),
      });

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

      // add polufills that are not included in webpack 5
      webpackConfig = {
        ...webpackConfig,
        ignoreWarnings: [/Failed to parse source map/],
        resolve: {
          ...webpackConfig.resolve,
          fallback: {
            fs: require.resolve("browserify-fs"),
            path: require.resolve("path-browserify"),
            stream: require.resolve("stream-browserify"),
            crypto: require.resolve("crypto-browserify"),
          },
        },
      };

      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        }),
      );

      if (process.env.NODE_ENV !== "development") {
        webpackConfig.devtool = "source-map";

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

      return webpackConfig;
    },
  },
};

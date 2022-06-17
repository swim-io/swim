const path = require("path");
const cracoBabelLoader = require("craco-babel-loader");
const { addBeforeLoader, loaderByName, whenTest, getLoaders } = require("@craco/craco");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
// const { ProvidePlugin } = require('webpack');

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
    configure: (webpackConfig, {env, paths}) => {
      // console.log("initial webpackConfig");
      // console.log(JSON.stringify(webpackConfig, null, 2));

      const wasmExtensionRegExp = /\.wasm$/;
      webpackConfig.resolve.extensions.push(".wasm");

      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      // webpackConfig.module.rules.push({
      //   test: /node_modules\/@polkadot.+\/packageInfo\.js$/,
      //   loader: require.resolve("@open-wc/webpack-import-meta-loader"),
      // });
      // console.log(JSON.stringify(webpackConfig.module.rules, null, 2));

      // const fileLoaders = getLoaders(webpackConfig, loaderByName("file-loader"));
      // console.log(JSON.stringify(fileLoaders, null, 2));


      const wasmLoader = {
        test: /\.wasm$/,
        include: /node_modules\/(bridge|token-bridge)/,
        loader: "wasm-loader",
      };

      const oneOfRules = webpackConfig.module.rules.find((rule) => rule.oneOf);
      // console.log(`oneOfRules: ${JSON.stringify(oneOfRules, null, 2)}`);
      const fileLoaderRuleIdx = oneOfRules.oneOf.indexOf((rule) =>
        (rule.use && rule.use.includes((useObj) => useObj.loader.indexOf("file-loader") >= 0))
        ||
        (rule.loader && rule.loader.indexOf("file-loader"))
      );
      oneOfRules.oneOf.splice(fileLoaderRuleIdx, 0, wasmLoader);


      // const wasmLoader = {
      //   // test: /node_modules\/.+\.wasm$/,
      //   test: /\.wasm$/,
      //   // test: new RegExp('\.wasm$'),
      //
      //
      //   // include: [
      //   //   new RegExp('node_modules\/(bridge|token-bridge)')
      //   //   // path.resolve(__dirname, 'bridge'),
      //   //   // path.resolve(__dirname, 'token-bridge'),
      //   // ],
      //   // use: [ 'wasm-loader']
      //   use: ['wasm-loader'],
      //   // loader: 'wasm-loader',
      //   // use: { loader: 'wasm-loader' },
      // };


      // addBeforeLoader(webpackConfig, loaderByName("file-loader"), wasmLoader);

      // webpackConfig.experiments =  {
      //   asyncWebAssembly: true,
      //   syncWebAssembly: true
      // };

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
    // plugins: [new ProvidePlugin({ Buffer: ['buffer', 'Buffer'] })]
  },
  plugins: [
    {
      plugin: cracoBabelLoader,
      options: {
        includes: [
          // /node_modules\/@polkadot\/(?!cjs\/).*/,
          // /node_modules\/@acala-network\/(?!cjs\/).*/
          path.resolve(__dirname, "node_modules/@polkadot"),
          path.resolve(__dirname, "node_modules/@acala-network"),
        ],
      },
    },
  ],
};

const path = require("path");

module.exports = {
  staticDirs: ["../public"],
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    // storybook-preset-craco picks up our webpack/babel config from craco.config.cjs
    {
      name: "storybook-preset-craco",
      options: {
        cracoConfigFile: path.resolve("craco.config.cjs"),
      },
    },
  ],
  framework: "@storybook/react",
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  core: {
    disableTelemetry: true,
  },
  webpackFinal: async (config) => {
    // "manually" tell webpack these modules need transpiling.
    config.module.rules.forEach((rule) => {
      (rule.oneOf || []).forEach((oneOf) => {
        if (
          oneOf.loader &&
          oneOf.loader.indexOf("babel-loader") >= 0 &&
          oneOf.include.includes(path.resolve(".storybook"))
        ) {
          oneOf.include.push(
            path.resolve("node_modules/aptos"),
            path.resolve("node_modules/@solana"),
          );
        }
      });
    });

    config.externals = {
      "@certusone/wormhole-sdk": "{}",
    };

    config.node = {
      ...config.node,
      fs: "empty",
    };

    return config;
  },
};

const webpackConfig = require("../config/webpack.config.js");

module.exports = {
  core: {
    builder: "webpack5",
  },
  staticDirs: ["../public"],
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
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
  webpackFinal: async (config, { configType }) => {
    console.log("configType", configType);
    config.externals = {
      "@certusone/wormhole-sdk": "{}",
    };
    return {
      ...config,
      module: {
        ...config.module,
        rules: webpackConfig(configType.toLowerCase()).module.rules,
      },
    };
  },
};

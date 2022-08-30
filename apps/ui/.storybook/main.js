const path = require("path");

module.exports = {
  staticDirs: ["../public"],
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/preset-create-react-app",
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
    config.externals = {
      "@certusone/wormhole-sdk": "{}",
    };

    config.resolve.alias["@solana/spl-token"] = path.resolve(
      "node_modules/@solana/spl-token/lib/cjs",
    );
    config.resolve.alias["@solana/buffer-layout-utils"] = path.resolve(
      "node_modules/@solana/buffer-layout-utils/lib/cjs",
    );
    return config;
  },
};

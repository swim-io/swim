const webpack = require("webpack")

module.exports = {
  staticDirs: ["../public"],
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions", "@storybook/preset-create-react-app"],
  framework: "@storybook/react",
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop => prop.parent ? !/node_modules/.test(prop.parent.fileName) : true
    }
  },
  core: {
    disableTelemetry: true,
    builder: "webpack5"
  },
  webpackFinal: async config => {
    // Verbose output from Webpack to help debugging on CI
    config.stats = "verbose"

    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
      })
    )

    config.externals = {
      "@certusone/wormhole-sdk": "{}"
    };
    return config;
  }
};
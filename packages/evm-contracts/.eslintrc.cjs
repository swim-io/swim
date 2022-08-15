require("@swim-io/eslint-config/patch/modern-module-resolution.cjs");

module.exports = {
  extends: ["@swim-io/eslint-config"],
  parserOptions: {
    project: "./tsconfig-dev.json",
    // Make sure correct `tsconfig.json` is found in monorepo
    tsconfigRootDir: __dirname,
  },
  overrides: [
    {
      files: ["./test/*.@(ts|tsx)"],
      rules: {
        // used when asserting with expect.stringMatching() where it returns `any`
        "@typescript-eslint/no-unsafe-assignment": "off",
      },
    },
  ],
};

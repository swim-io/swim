require("@swim-io/eslint-config/patch/modern-module-resolution.cjs");

module.exports = {
  root: true,
  overrides: [
    {
      files: ["**/*.{cjs,js,mjs}"],
      extends: ["@swim-io/eslint-config"],
    },
    {
      files: ["**/*.{cts,mts,ts,tsx}"],
      plugins: ["i18next"],
      extends: ["@swim-io/eslint-config/react", "plugin:i18next/recommended"],
      parserOptions: {
        // Make sure correct `tsconfig.json` is found in monorepo
        tsconfigRootDir: __dirname,
      },
      rules: {
        // Enable periodically - we don’t want the linter to force us to upgrade at inconvenient times
        "deprecation/deprecation": "off",
        // no point exporting unused code since this isn't a library
        "import/no-unused-modules": ["error", { unusedExports: true }],
        // allow mutable state on class instances and zustand drafts
        "functional/immutable-data": [
          "error",
          { ignorePattern: ["this", "draft"] },
        ],
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-render-in-setup.md
        "testing-library/no-render-in-setup": [
          "error",
          { allowTestingFrameworkSetupHook: "beforeEach" },
        ],
      },
      overrides: [
        {
          files: ["**/*.d.ts"],
          rules: {
            "import/unambiguous": "off",
          },
        },
        {
          files: ["src/**/*.stories.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
          rules: {
            // used when asserting with expect.stringMatching() where it returns `any`
            "@typescript-eslint/no-unsafe-assignment": "off",
            // allow mutation in test files for convenience
            "functional/immutable-data": "off",
            // test files do not need i18n
            "i18next/no-literal-string": "off",
            // these are expected by Storybook
            "import/no-anonymous-default-export": "off",
          },
        },
        {
          files: [
            "src/**/*.stories.{ts,tsx}",
            "src/__mocks__/**/*",
            "src/fixtures/**/*",
          ],
          rules: {
            // Storybook/Jest magic
            // keep fixtures around even if they aren't used right now
            "import/no-unused-modules": "off",
          },
        },
        {
          files: ["src/contracts/**/*.ts"],
          rules: {
            // eslint comments are auto generated
            "eslint-comments/no-unlimited-disable": "off",
          },
        },
      ],
    },
    {
      files: ["**/*.json"],
      overrides: [
        {
          files: ["!src/locales/**/*.json"],
          parser: "jsonc-eslint-parser",
        },
        {
          files: ["src/locales/**/*.json"],
          plugins: ["eslint-plugin-i18n-json"],
          rules: {
            "i18n-json/sorted-keys": "error",
          },
        },
      ],
    },
  ],
};

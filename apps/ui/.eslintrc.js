require("@swim-io/eslint-config/patch/modern-module-resolution");

module.exports = {
  extends: ["@swim-io/eslint-config/react"],
  rules: {
    // Enable periodically - we don’t want the linter to force us to upgrade at inconvenient times
    "deprecation/deprecation": "off",
    // rules we maybe want
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
      files: [
        "src/**/*.stories.@(js|jsx|ts|tsx)",
        "src/**/*.test.@(js|jsx|ts|tsx)",
      ],
      rules: {
        // used when asserting with expect.stringMatching() where it returns `any`
        "@typescript-eslint/no-unsafe-assignment": "off",
        // allow mutation in test files for convenience
        "functional/immutable-data": "off",
        // these are expected by Storybook
        "import/no-anonymous-default-export": "off",
      },
    },
    {
      files: [
        "src/**/*.stories.@(js|jsx|ts|tsx)",
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
};

require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  extends: ["@swim-io/eslint-config/react"],
  rules: {
    // rules we maybe want
    "import/no-unused-modules": ["error", { unusedExports: true }],
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
        "functional/immutable-data": "off",
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

const tsConfig = {
  plugins: ["@typescript-eslint", "deprecation"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/typescript",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    // @typescript-eslint
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/member-ordering": "error",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-unnecessary-condition": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-shadow": "error",
    "@typescript-eslint/prefer-readonly-parameter-types": "off",

    // deprecation
    "deprecation/deprecation": "warn",
  },
  overrides: [
    {
      files: ["**/*.test.{cts,mts,ts,tsx}"],
      env: {
        node: true,
      },
      rules: {
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
      },
    },
  ],
};

module.exports = {
  plugins: ["eslint-comments", "functional", "import", "jest", "prettier"],
  extends: [
    "eslint:recommended",
    "prettier",
    "plugin:prettier/recommended",
    "plugin:eslint-comments/recommended",
    "plugin:import/recommended",
    "plugin:functional/external-recommended",
    "plugin:functional/no-mutations",
    "plugin:jest/recommended",
  ],
  env: {
    "jest/globals": true,
  },
  rules: {
    // Vanilla ESLint
    "no-console": ["warn", { allow: ["error", "info", "table", "warn"] }],
    "no-undef": "error",
    "sort-imports": ["error", { ignoreDeclarationSort: true }],

    // allow disable eslint rules for whole file without re-enable it in the end of the file
    "eslint-comments/disable-enable-pair": ["error", { allowWholeFile: true }],
    // make sure every eslint-disable comments are in use
    "eslint-comments/no-unused-disable": "error",

    // functional
    "functional/immutable-data": ["error", { ignorePattern: "this" }],
    "functional/no-let": "off",
    "functional/prefer-readonly-type": ["error", { ignoreClass: "fieldsOnly" }],

    // import
    "import/extensions": ["error", "always", { ts: "never", tsx: "never" }],
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-absolute-path": "error",
    "import/no-amd": "error",
    "import/no-commonjs": "error",
    "import/no-cycle": "error",
    "import/no-deprecated": "error",
    "import/no-dynamic-require": "error",
    "import/no-mutable-exports": "error",
    "import/no-self-import": "error",
    "import/no-unused-modules": "error",
    "import/no-useless-path-segments": "error",
    "import/order": [
      "error",
      { alphabetize: { order: "asc" }, "newlines-between": "always" },
    ],
    "import/unambiguous": "error",
  },
  overrides: [
    {
      files: ["*.cjs"],
      env: {
        node: true,
      },
      rules: {
        "functional/immutable-data": "off", // `exports` object is mutable
        "import/no-commonjs": "off",
        "import/unambiguous": "off",
      },
    },
    {
      files: ["*.{cts,mts,ts,tsx}"],
      ...tsConfig,
    },
  ],
};

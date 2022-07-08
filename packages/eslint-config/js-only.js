module.exports = {
  root: true,
  plugins: ["functional", "import", "jest", "prettier"],
  extends: [
    "eslint:recommended",
    "prettier",
    "plugin:prettier/recommended",
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
};

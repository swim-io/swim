module.exports = {
  plugins: ["@sayari", "i18next", "react"],
  extends: [
    "@swim-io",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "react-app",
    "react-app/jest",
    "plugin:i18next/recommended",
  ],
  rules: {
    "@sayari/no-unwrapped-jsx-text": "error",
    "react-hooks/exhaustive-deps": [
      "error",
      {
        // support package `use-deep-compare`
        additionalHooks:
          "(useDeepCompareCallback|useDeepCompareEffect|useDeepCompareMemo)",
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.{stories,test}.{cjs,cts,js,mjs,mts,ts,tsx}"],
      rules: {
        // test files do not need i18n
        "i18next/no-literal-string": "off",
      },
    },
  ],
};

module.exports = {
  plugins: ["react", "@sayari"],
  extends: [
    "@swim-io",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "react-app",
    "react-app/jest",
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
};

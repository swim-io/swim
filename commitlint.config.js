module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "core",
        "eslint-config",
        "pool-deployment",
        "pool-math",
        "pool-playground",
        "pool-sdk",
        "quarry-deployment",
        "redeemer",
        "solana-types",
        "solana-usdc-usdt-swap",
        "swim-anchor",
        "token-projects",
        "tsconfig",
        "ui",
        "utils",
      ],
    ],
    "subject-case": [0, "never"],
  },
};

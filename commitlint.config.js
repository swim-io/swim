module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "pool-deployment",
        "pool-playground",
        "quarry-deployment",
        "ui",
        "pool-sdk",
        "pool-state",
        "pool-utils",
        "solana-usdc-usdc-usdt-swap",
      ],
    ],
    "subject-case": [0, "never"],
  },
};

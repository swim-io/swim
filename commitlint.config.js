module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "pool-deployment",
        "pool-math",
        "pool-playground",
        "pool-sdk",
        "quarry-deployment",
        "solana-usdc-usdc-usdt-swap",
        "ui",
      ],
    ],
    "subject-case": [0, "never"],
  },
};

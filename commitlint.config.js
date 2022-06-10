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
        "solana-usdc-usdc-usdt-swap",
      ],
    ],
  },
};

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "core",
        "eslint-config",
        "evm",
        "evm-contracts",
        "pool-deployment",
        "pool-math",
        "pool-playground",
        "pool-sdk",
        "quarry-deployment",
        "redeemer",
        "solana",
        "solana-usdc-usdt-swap",
        "token-projects",
        "tsconfig",
        "ui",
        "utils",
      ],
    ],
    "subject-case": [0, "never"],
  },
};

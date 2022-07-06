import { PRESETS, createSolanaEcosystemConfig } from "./plugin";

describe("createSolanaEcosystemConfig", () => {
  test("creates an ecosystem config", () => {
    const chains = [...PRESETS.values()];
    const result = createSolanaEcosystemConfig(chains);
    expect(result).toStrictEqual({
      id: "solana",
      protocol: "solana-protocol",
      wormholeChainId: 1,
      displayName: "Solana",
      gasToken: {
        name: "sol",
        symbol: "SOL",
        decimals: 9,
      },
      chains,
    });
  });
});

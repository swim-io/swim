import { PRESETS, createEcosystemConfig } from "./plugin";

describe("createEcosystemConfig", () => {
  test("creates an ecosystem config", () => {
    const chains = [...PRESETS.values()];
    const result = createEcosystemConfig(chains);
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

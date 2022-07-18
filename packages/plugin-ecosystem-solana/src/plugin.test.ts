import { plugin } from "./plugin";

describe("createEcosystemConfig", () => {
  test("creates an ecosystem config", () => {
    const result = plugin.createEcosystemConfig();
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
      chains: plugin.presetChains,
    });
  });
});

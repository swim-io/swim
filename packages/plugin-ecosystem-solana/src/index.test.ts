import createEcosystemConfig, { PRESETS } from ".";

describe("createEcosystemConfig", () => {
  test("creates an ecosystem config", () => {
    const chainSpecs = [...PRESETS.values()];
    const result = createEcosystemConfig(chainSpecs);
    expect(result).toStrictEqual({
      id: "solana",
      protocol: "solana-protocol",
      wormholeChainId: 1,
      displayName: "Solana",
      nativeTokenSymbol: "SOL",
      chainSpecs,
    });
  });
});

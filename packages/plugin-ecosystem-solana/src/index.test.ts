import { Env } from "./base";

import type { SolanaChainSpec } from ".";
import createEcosystemConfig from ".";

describe("createEcosystemConfig", () => {
  test("creates an ecosystem config", () => {
    const chainSpecs: readonly SolanaChainSpec[] = [
      {
        env: Env.Mainnet,
        chainId: 101,
        wormhole: {
          bridge: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
          tokenBridge: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
        },
        endpoint: "https://solana-api.projectserum.com",
        wsEndpoint: "",
        tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        otterTotCollection: "EpozLY9dQ1jnaU5Wof524K7p9uHYxkuLF2hi32cf8W9s",
      },
    ];
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

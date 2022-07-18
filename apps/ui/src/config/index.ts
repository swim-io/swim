import { Env } from "@swim-io/core-types";
import type { EvmTx as GenericEvmTx } from "@swim-io/evm-types";
import { EVM_PROTOCOL } from "@swim-io/evm-types";
import type {
  SolanaChainConfig,
  SolanaEcosystemConfig,
  SolanaTx,
} from "@swim-io/plugin-ecosystem-solana";
import { SOLANA_PROTOCOL } from "@swim-io/plugin-ecosystem-solana";

import type { ReadonlyRecord } from "../utils";

import type {
  EvmChainConfig,
  EvmEcosystemConfig,
  EvmEcosystemId,
} from "./ecosystem";
import { ECOSYSTEMS } from "./ecosystem";
import type { PoolSpec } from "./pools";
import { POOLS } from "./pools";
import { REDEEMER } from "./redeemer";
import type { RedeemerSpec } from "./redeemer";
import type { TokenSpec } from "./tokens";
import { TOKENS } from "./tokens";
import type { WormholeConfig } from "./wormhole";
import { WORMHOLE_CONFIGS } from "./wormhole";

export * from "./ecosystem";
export * from "./pools";
export * from "./projects";
export * from "./tokens";
export * from "./utils";
export * from "./wormhole";

export type EvmTx = GenericEvmTx<EvmEcosystemId>;
export type Tx = SolanaTx | EvmTx;

export type EcosystemConfigWithSingleChain =
  | (SolanaEcosystemConfig & { readonly chain: SolanaChainConfig })
  | (EvmEcosystemConfig & { readonly chain: EvmChainConfig });

export interface Config {
  readonly ecosystems: readonly EcosystemConfigWithSingleChain[];
  readonly pools: readonly PoolSpec[];
  readonly tokens: readonly TokenSpec[];
  readonly wormhole: WormholeConfig;
  readonly redeemer: RedeemerSpec;
}

const buildConfig = (env: Env): Config => {
  const ecosystems = Object.values(ECOSYSTEMS).reduce<
    readonly EcosystemConfigWithSingleChain[]
  >((accumulator, ecosystem): readonly EcosystemConfigWithSingleChain[] => {
    switch (ecosystem.protocol) {
      case SOLANA_PROTOCOL: {
        const chain = ecosystem.chains.get(env) ?? null;
        return chain === null
          ? accumulator
          : [
              ...accumulator,
              {
                ...ecosystem,
                chain,
              },
            ];
      }
      case EVM_PROTOCOL: {
        const chain = ecosystem.chains.get(env) ?? null;
        return chain === null
          ? accumulator
          : [
              ...accumulator,
              {
                ...ecosystem,
                chain,
              },
            ];
      }
      default:
        throw new Error("Unknown protocol");
    }
  }, []);
  return {
    ecosystems,
    pools: POOLS[env],
    tokens: TOKENS[env],
    wormhole: WORMHOLE_CONFIGS[env],
    redeemer: REDEEMER[env],
  };
};

export const CONFIGS: ReadonlyRecord<Env, Config> = {
  [Env.Mainnet]: buildConfig(Env.Mainnet),
  [Env.Devnet]: buildConfig(Env.Devnet),
  [Env.Local]: buildConfig(Env.Local),
  [Env.Custom]: buildConfig(Env.Custom),
};

export const DEFAULT_ENV = Env.Mainnet;

// TODO: Add support for custom env
// const LOCALHOST_REGEXP = /localhost|127\.0\.0\.1/;

// export const overrideLocalnetIp = (config: Config, ip: string): Config => ({
//   ...config,
//   wormhole: {
//     ...config.wormhole,
//     rpcUrls: config.wormhole.rpcUrls.map((rpcUrl) =>
//       rpcUrl.replace(LOCALHOST_REGEXP, ip),
//     ),
//   },
//   chains: {
//     ...config.chains,
//     [SOLANA_PROTOCOL]: [
//       {
//         ...config.chains[SOLANA_PROTOCOL][0],
//         endpoint: config.chains[SOLANA_PROTOCOL][0].endpoint.replace(
//           LOCALHOST_REGEXP,
//           ip,
//         ),
//       },
//       ...config.chains[SOLANA_PROTOCOL].slice(1),
//     ],
//     [EVM_PROTOCOL]: config.chains[EVM_PROTOCOL].map(
//       (chainSpec: { readonly rpcUrls: readonly string[] }) => ({
//         ...chainSpec,
//         rpcUrls: chainSpec.rpcUrls.map((rpcUrl: string) =>
//           rpcUrl.replace(LOCALHOST_REGEXP, ip),
//         ),
//       }),
//     ),
//   },
// });

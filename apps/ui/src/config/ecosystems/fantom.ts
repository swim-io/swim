import { Env } from "@swim-io/core";
import type { EvmEcosystemId } from "@swim-io/evm";
import { fantom as fantomFromSdk } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId as TokenProjectIdV2 } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import { TokenProjectIdV1 } from "../tokenProjects";

import type { EvmChainConfigV1, EvmEcosystemConfigV1 } from "./types";

const mainnet: EvmChainConfigV1<EvmEcosystemId.Fantom> = {
  ...fantomFromSdk.chains[Env.Mainnet],
  tokens: [
    {
      id: "mainnet-fantom-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "Dnr8fDaswHtYMSKbtR9e8D5EadyxqyJwE98xp17ZxE2E",
            decimals: 6,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfigV1<EvmEcosystemId.Fantom> = {
  ...fantomFromSdk.chains[Env.Testnet],
  tokens: [
    {
      id: "testnet-fantom-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "9uJH6SjzmoqdiZXjcwYKuRevbYh5tR449FU5pg4rpden",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "testnet-fantom-lp-usdc",
      projectId: TokenProjectIdV2.SwimLpFantomUsdc,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    },
  ],
  pools: [],
};

export const fantom = assertType<EvmEcosystemConfigV1<EvmEcosystemId.Fantom>>()(
  {
    ...fantomFromSdk,
    chains: {
      [Env.Mainnet]: mainnet,
      [Env.Testnet]: testnet,
    },
  } as const,
);

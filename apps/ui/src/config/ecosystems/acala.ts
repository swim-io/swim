import { Env } from "@swim-io/core";
import type { EvmEcosystemId } from "@swim-io/evm";
import { acala as acalaFromSdk } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId as TokenProjectIdV2 } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import { TokenProjectIdV1 } from "../tokenProjects";

import type { EvmChainConfigV1, EvmEcosystemConfigV1 } from "./types";

const mainnet: EvmChainConfigV1<EvmEcosystemId.Acala> = {
  ...acalaFromSdk.chains[Env.Mainnet],
  tokens: [
    {
      id: "mainnet-acala-ausd",
      projectId: TokenProjectIdV1.Ausd,
      nativeDetails: {
        address: "0x0000000000000000000000000000000000000000", // TODO: Update
        decimals: 6, // TODO: Update
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "11111111111111111111111111111112", // TODO: Update
            decimals: 6, // TODO: Update
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfigV1<EvmEcosystemId.Acala> = {
  ...acalaFromSdk.chains[Env.Testnet],
  tokens: [
    {
      id: "testnet-acala-ausd",
      projectId: TokenProjectIdV1.Ausd,
      nativeDetails: {
        address: "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B",
        decimals: 12,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "BbdPh2Nvpp7XftBHWENJu5dpC5gF5FtCSyFLTU4qNr7g",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "testnet-acala-lp-ausd",
      projectId: TokenProjectIdV2.SwimLpAcalaAusd,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    },
  ],
  pools: [],
};

export const acala = assertType<EvmEcosystemConfigV1<EvmEcosystemId.Acala>>()({
  ...acalaFromSdk,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
  },
} as const);

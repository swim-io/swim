import { PublicKey } from "@solana/web3.js";
import type { EvmClient, EvmEcosystemId } from "@swim-io/evm";
import { isEvmEcosystemId } from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import {
  SOLANA_ECOSYSTEM_ID,
  deserializeSwimPool,
  isSolanaTx,
} from "@swim-io/solana";
import type {
  SolanaClient,
  SolanaEcosystemId,
  SolanaTx,
  SwimPoolState,
} from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import { atomicToHuman, findOrThrow } from "@swim-io/utils";
import Decimal from "decimal.js";

import { bnOrBigNumberToDecimal } from "../../amounts";
import type {
  Config,
  EvmPoolSpec,
  PoolSpec,
  SolanaPoolSpec,
  TokenConfig,
} from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import type { Tx } from "../crossEcosystem";

import { deserializeSwimPoolV2 } from "./deserializeSwimPoolV2";

export interface SolanaPoolState extends SwimPoolState {
  readonly ecosystem: SolanaEcosystemId;
}

export interface EvmPoolState {
  readonly ecosystem: EvmEcosystemId;
  readonly isPaused: boolean;
  readonly balances: readonly Decimal[];
  readonly totalLpSupply: Decimal;
  readonly ampFactor: Decimal;
  readonly lpFee: Decimal;
  readonly governanceFee: Decimal;
}

export type PoolState = SolanaPoolState | EvmPoolState;

export type TokensByPoolId = ReadonlyRecord<
  string, // Pool ID
  {
    readonly tokens: readonly TokenConfig[];
    readonly lpToken: TokenConfig;
  }
>;

export const getTokensByPool = ({ pools, tokens }: Config): TokensByPoolId =>
  pools.reduce(
    (accumulator, { id: poolId, tokens: poolTokens, lpToken }) => ({
      ...accumulator,
      [poolId]: {
        tokens: poolTokens.map((tokenId) =>
          findOrThrow(tokens, (token) => token.id === tokenId),
        ),
        lpToken: findOrThrow(tokens, (token) => token.id === lpToken),
      },
    }),
    {},
  );

export const isPoolTx = (
  poolContractAddress: string,
  tx: Tx,
): tx is SolanaTx => {
  if (!isSolanaTx(tx)) {
    return false;
  }
  const { message } = tx.original.transaction;
  return message.instructions.some(
    (ix) => ix.programId.toBase58() === poolContractAddress,
  );
};

export const isSolanaPool = (pool: PoolSpec): pool is SolanaPoolSpec =>
  pool.ecosystem === SOLANA_ECOSYSTEM_ID;

export const getSolanaPoolState = async (
  solanaClient: SolanaClient,
  poolSpec: SolanaPoolSpec,
): Promise<SolanaPoolState | null> => {
  const numberOfTokens = poolSpec.tokens.length;
  const accountInfo = await solanaClient.connection.getAccountInfo(
    new PublicKey(poolSpec.address),
  );
  if (accountInfo === null) {
    return null;
  }
  const swimPool = poolSpec.isLegacyPool
    ? deserializeSwimPool(numberOfTokens, accountInfo.data)
    : deserializeSwimPoolV2(numberOfTokens, accountInfo.data);

  return {
    ...swimPool,
    ecosystem: SOLANA_ECOSYSTEM_ID,
  };
};

export const getEvmPoolState = async (
  evmClient: EvmClient,
  poolSpec: EvmPoolSpec,
  tokens: readonly TokenConfig[],
  routingContractAddress: string,
): Promise<EvmPoolState> => {
  const { ecosystem, address } = poolSpec;
  const contract = Routing__factory.connect(
    routingContractAddress,
    evmClient.provider,
  );
  const lpToken = findOrThrow(tokens, ({ id }) => id === poolSpec.lpToken);
  const poolTokens = poolSpec.tokens.map((tokenId) =>
    findOrThrow(tokens, ({ id }) => id === tokenId),
  );
  const lpTokenDetails = getTokenDetailsForEcosystem(lpToken, ecosystem);
  if (lpTokenDetails === null) {
    throw new Error("Token details not found");
  }
  const [state] = await contract.getPoolStates([address]);
  return {
    isPaused: state.paused,
    ecosystem,
    balances: poolTokens.map((token, i) => {
      const tokenDetails = getTokenDetailsForEcosystem(token, ecosystem);
      if (tokenDetails === null) {
        throw new Error("Token details not found");
      }
      return atomicToHuman(
        new Decimal(state.balances[i][1].toString()),
        tokenDetails.decimals,
      );
    }),
    totalLpSupply: atomicToHuman(
      new Decimal(state.totalLpSupply[1].toString()),
      lpTokenDetails.decimals,
    ),
    ampFactor: bnOrBigNumberToDecimal(state.ampFactor[0]).div(
      10 ** state.ampFactor[1],
    ),
    lpFee: bnOrBigNumberToDecimal(state.lpFee[0]).div(10 ** state.lpFee[1]),
    governanceFee: bnOrBigNumberToDecimal(state.governanceFee[0]).div(
      10 ** state.governanceFee[1],
    ),
  };
};

export const isEvmPoolState = (
  poolState: PoolState | null,
): poolState is EvmPoolState =>
  poolState !== null && isEvmEcosystemId(poolState.ecosystem);

export const isSolanaPoolState = (
  poolState: PoolState,
): poolState is SolanaPoolState => poolState.ecosystem === SOLANA_ECOSYSTEM_ID;

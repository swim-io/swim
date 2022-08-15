import { PublicKey } from "@solana/web3.js";
import { Routing__factory } from "@swim-io/evm-contracts";
import type { SwimPoolState } from "@swim-io/solana";
import { deserializeSwimPool } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import { findOrThrow } from "@swim-io/utils";
import Decimal from "decimal.js";

import { atomicToHuman, bnOrBigNumberToDecimal } from "../../amounts";
import type {
  Config,
  EvmEcosystemId,
  EvmPoolSpec,
  PoolSpec,
  SolanaPoolSpec,
  TokenSpec,
} from "../../config";
import {
  EcosystemId,
  getTokenDetailsForEcosystem,
  isEvmEcosystemId,
} from "../../config";
import type { SolanaTx, Tx } from "../crossEcosystem";
import { isSolanaTx } from "../crossEcosystem";
import type { EvmConnection } from "../evm";
import type { SolanaConnection } from "../solana";

export interface SolanaPoolState extends SwimPoolState {
  readonly ecosystem: EcosystemId.Solana;
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
    readonly tokens: readonly TokenSpec[];
    readonly lpToken: TokenSpec;
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
  const { message } = tx.parsedTx.transaction;
  return message.instructions.some(
    (ix) => ix.programId.toBase58() === poolContractAddress,
  );
};

export const isSolanaPool = (pool: PoolSpec): pool is SolanaPoolSpec =>
  pool.ecosystem === EcosystemId.Solana;

export const getSolanaPoolState = async (
  solanaConnection: SolanaConnection,
  poolSpec: SolanaPoolSpec,
): Promise<SolanaPoolState | null> => {
  const numberOfTokens = poolSpec.tokens.length;
  const accountInfo = await solanaConnection.getAccountInfo(
    new PublicKey(poolSpec.address),
  );
  if (accountInfo === null) {
    return null;
  }
  const swimPool = deserializeSwimPool(numberOfTokens, accountInfo.data);
  return {
    ...swimPool,
    ecosystem: EcosystemId.Solana,
  };
};

export const getEvmPoolState = async (
  evmConnection: EvmConnection,
  poolSpec: EvmPoolSpec,
  tokens: readonly TokenSpec[],
  routingContractAddress: string,
): Promise<EvmPoolState> => {
  const { ecosystem, address } = poolSpec;
  const contract = Routing__factory.connect(
    routingContractAddress,
    evmConnection.provider,
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
): poolState is SolanaPoolState => poolState.ecosystem === EcosystemId.Solana;

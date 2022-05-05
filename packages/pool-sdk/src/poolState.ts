import {
  PublicKey,
  Connection,
} from "@solana/web3.js";

import type { AmpFactor as AmpFactorBorsh } from "./from_ui/ampFactor";
import type { SwimPoolState as PoolStateBorsh } from "./from_ui/poolState";
import { deserializeSwimPool, swimPool } from "./from_ui/poolState";
import { createProgramAddress } from "./from_ui/solanaUtils";
import { Decimal, Timestamp } from "./common";
import { POOL_PROGRAM_IDS } from "./constants";
import { FromPool } from "./poolConversion";

export function programIdFromTokenCount(tokenCount: number): PublicKey {
  const programId = POOL_PROGRAM_IDS[tokenCount];
  if (!programId)
    throw new Error(`missing program id implementation for tokenCount=${tokenCount}`);
  return new PublicKey(programId);
}

export function dataSizeFromTokenCount(tokenCount: number): number {
  return swimPool(tokenCount).span;
}

export function tokenCountFromDataSize(bytes: number): number {
  const BASE_SIZE = swimPool(0).span;
  const MARGINAL_SIZE = swimPool(1).span - BASE_SIZE;
  const tokenData = bytes - BASE_SIZE;
  if (tokenData % MARGINAL_SIZE != 0)
    throw new Error("not a vaild pool account size");
  return tokenData / MARGINAL_SIZE;
}

export function calcPoolAuthority(
  tokenCount: number,
  poolStateKey: PublicKey,
  nonce: number,
): PublicKey {
  return createProgramAddress(
    [poolStateKey.toBuffer(), Buffer.from([nonce])],
    programIdFromTokenCount(tokenCount)
  );
}

export class AmpFactor {
  constructor(
    readonly initialValue: Decimal,
    readonly initialTs: Timestamp,
    readonly targetValue: Decimal,
    readonly targetTs: Timestamp
    ) {
      if (this.initialTs > this.targetTs)
        throw new Error("invalid timestamps");
    }

    static from(borsh: AmpFactorBorsh): AmpFactor {
      return new AmpFactor(
        FromPool.decimal(borsh.initialValue),
        FromPool.time(borsh.initialTs),
        FromPool.decimal(borsh.targetValue),
        FromPool.time(borsh.targetTs)
      );
    }

    get(blockTs: Timestamp): Decimal {
      if (blockTs > this.targetTs) return this.targetValue;

      const valueDiff = this.targetValue.sub(this.initialValue);
      const timeSinceInitial = blockTs - this.initialTs;
      const totalAdjustmentTime = this.targetTs - this.initialTs;
      const delta = valueDiff.mul(timeSinceInitial / totalAdjustmentTime);
      return this.initialValue.plus(delta);
    }
}

export interface ConstantStateData {
  nonce: number;
  lpMintKey: PublicKey;
  lpDecimalEqualizer: number;
  tokenMintKeys: readonly PublicKey[];
  tokenDecimalEqualizers: readonly number[];
  tokenKeys: readonly PublicKey[];
}

export interface MutableStateData {
  isPaused: boolean,
  ampFactor: AmpFactor,
  lpFee: Decimal,
  governanceFee: Decimal,
  governanceKey: PublicKey,
  governanceFeeKey: PublicKey,
  preparedGovernanceKey: PublicKey,
  governanceTransitionTs: Timestamp,
  preparedLpFee: Decimal,
  preparedGovernanceFee: Decimal,
  feeTransitionTs: Timestamp,
  previousDepth: Decimal,
}

export class PoolState implements ConstantStateData, MutableStateData {
  readonly authority: PublicKey;
  readonly programId: PublicKey;

  constructor(
    readonly address: PublicKey,
    readonly nonce: number,
    readonly isPaused: boolean,
    readonly ampFactor: AmpFactor,
    readonly lpFee: Decimal,
    readonly governanceFee: Decimal,
    readonly lpMintKey: PublicKey,
    readonly lpDecimalEqualizer: number,
    readonly tokenMintKeys: readonly PublicKey[],
    readonly tokenDecimalEqualizers: readonly number[],
    readonly tokenKeys: readonly PublicKey[],
    readonly governanceKey: PublicKey,
    readonly governanceFeeKey: PublicKey,
    readonly preparedGovernanceKey: PublicKey,
    readonly governanceTransitionTs: Timestamp,
    readonly preparedLpFee: Decimal,
    readonly preparedGovernanceFee: Decimal,
    readonly feeTransitionTs: Timestamp,
    readonly previousDepth: Decimal
  ) {
    this.authority = calcPoolAuthority(this.tokenCount, address, nonce);
    this.programId = programIdFromTokenCount(this.tokenCount);
  }

  static from(address: PublicKey, data: PoolStateBorsh | Buffer): PoolState {
    if (Buffer.isBuffer(data)) {
      const tokenCount = tokenCountFromDataSize(data.length);
      data = deserializeSwimPool(tokenCount, data);
    }

    return new PoolState(
      address,
      data.nonce,
      data.isPaused,
      AmpFactor.from(data.ampFactor),
      FromPool.fee(data.lpFee),
      FromPool.fee(data.governanceFee),
      data.lpMintKey,
      data.lpDecimalEqualizer,
      data.tokenMintKeys,
      data.tokenDecimalEqualizers,
      data.tokenKeys,
      data.governanceKey,
      data.governanceFeeKey,
      data.preparedGovernanceKey,
      FromPool.time(data.governanceTransitionTs),
      FromPool.fee(data.preparedLpFee),
      FromPool.fee(data.preparedGovernanceFee),
      FromPool.time(data.feeTransitionTs),
      new Decimal(data.previousDepth.toString()).div(new Decimal(10).pow(Math.max(...data.tokenDecimalEqualizers))),
    );
  }

  get tokenCount(): number {
    return this.tokenKeys.length;
  }
}

export async function getPoolState(connection: Connection, address: PublicKey): Promise<PoolState> {
  const account = await connection.getAccountInfo(address);
  return PoolState.from(address, account.data);
}

export async function getPoolStates(connection: Connection, poolProgramId: PublicKey): Promise<PoolState[]> {
  const poolAccounts = await connection.getProgramAccounts(poolProgramId);
  return poolAccounts.map(pool => PoolState.from(pool.pubkey, pool.account.data));
}

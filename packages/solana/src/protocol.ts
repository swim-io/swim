import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type {
  ChainConfig,
  EcosystemConfig,
  Env,
  PoolConfig,
  Tx,
} from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

export type SolanaProtocol = "solana-protocol";
export const SOLANA_PROTOCOL: SolanaProtocol = "solana-protocol";

export type SolanaEcosystemId = "solana";
export const SOLANA_ECOSYSTEM_ID: SolanaEcosystemId = "solana";

export interface SolanaPoolConfig extends PoolConfig {
  readonly ecosystemId: SolanaEcosystemId;
  /** The Swim program ID */
  readonly contract: string;
  /**
   * Maps token IDs to addresses of token accounts owned by the pool
   */
  readonly tokenAccounts: ReadonlyMap<string, string>;
  readonly governanceFeeAccount: string;
}

export interface SolanaChainConfig extends ChainConfig {
  readonly routingContractStateAddress: string;
  readonly twoPoolContractAddress: string;
  readonly pools: readonly SolanaPoolConfig[];
}

export interface SolanaEcosystemConfig extends EcosystemConfig {
  readonly id: SolanaEcosystemId;
  readonly protocol: SolanaProtocol;
  readonly chains: Partial<ReadonlyRecord<Env, SolanaChainConfig>>;
}

export enum SolanaTxType {
  PortalInitiateTransfer = "portal:initiateTransfer",
  PortalRedeem = "portal:redeem",
  WormholeVerifySignatures = "wormhole:verifySignatures",
  WormholePostVaa = "wormhole:postVaa",
  SplTokenCreateAccount = "splToken:createAccount",
  SwimPropellerAdd = "swimPropeller:add",
  SwimPropellerTransfer = "swimPropeller:transfer",
  SwimCompleteNativeWithPayload = "swim:completeNativeWithPayload",
  SwimProcessSwimPayload = "swim:processSwimPayload",
}

export type SolanaTx = Tx<ParsedTransactionWithMeta, SolanaEcosystemId>;

export const isSolanaTx = (tx: Tx<any>): tx is SolanaTx =>
  tx.ecosystemId === SOLANA_ECOSYSTEM_ID;

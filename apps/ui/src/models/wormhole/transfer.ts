import type { Keypair } from "@solana/web3.js";

import type { EvmChainConfig, TokenDetails, TokenSpec, Tx } from "../../config";
import type { Amount } from "../amount";
import type { EvmConnection } from "../evm";
import type { EvmWalletAdapter } from "../wallets";

export interface WormholeTransfer {
  readonly interactionId: string;
  readonly token: TokenSpec;
  readonly amount: Amount;
  readonly splTokenAccountAddress: string;
  readonly evmChain: EvmChainConfig;
  readonly evmWallet: EvmWalletAdapter;
  readonly evmConnection: EvmConnection;
  readonly fromTokenDetails: TokenDetails;
  readonly existingTxs: readonly Tx[];
}

export interface WormholeTransferWithSignatureSet extends WormholeTransfer {
  readonly signatureSetKeypair: Keypair;
}

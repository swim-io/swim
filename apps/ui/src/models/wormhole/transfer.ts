import type { Keypair } from "@solana/web3.js";
import type { TokenDetails } from "@swim-io/core";
import type { EvmWalletAdapter } from "@swim-io/evm";

import type { EvmSpec, TokenConfig } from "../../config";
import type { Amount } from "../amount";
import type { Tx } from "../crossEcosystem";
import type { EvmConnection } from "../evm";

export interface WormholeTransfer {
  readonly interactionId: string;
  readonly token: TokenConfig;
  readonly amount: Amount;
  readonly splTokenAccountAddress: string;
  readonly evmChain: EvmSpec;
  readonly evmWallet: EvmWalletAdapter;
  readonly evmConnection: EvmConnection;
  readonly fromTokenDetails: TokenDetails;
  readonly existingTxs: readonly Tx[];
}

export interface WormholeTransferWithSignatureSet extends WormholeTransfer {
  readonly signatureSetKeypair: Keypair;
}

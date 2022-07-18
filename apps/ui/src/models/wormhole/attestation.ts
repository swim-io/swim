import {
  attestFromEth,
  attestFromSolana,
  createWrappedOnEth,
  createWrappedOnSolana,
  getEmitterAddressEth,
  getEmitterAddressSolana,
  getSignedVAAWithRetry,
  parseSequenceFromLogEth,
  parseSequenceFromLogSolana,
  postVaaSolanaWithRetry,
} from "@certusone/wormhole-sdk";
import type { SolanaChainConfig } from "@swim-io/plugin-ecosystem-solana";
import solanaPlugin from "@swim-io/plugin-ecosystem-solana";
import type { ContractReceipt } from "ethers";

import type { ChainConfig, EvmChainConfig, WormholeConfig } from "../../config";
import { ECOSYSTEMS } from "../../config";
import type { SolanaConnection } from "../solana";
import { DEFAULT_MAX_RETRIES } from "../solana";
import type { EvmWalletAdapter, SolanaWalletAdapter } from "../wallets";

// TODO: Refactor to use Tx instead of CrossChainResult
interface CrossChainResult {
  readonly solanaTxIds: readonly string[];
  readonly ethereumTxIds: readonly string[];
  readonly bnbTxIds: readonly string[];
}

export interface AttestationResult {
  readonly txId: string;
  readonly emitterAddress: string;
  readonly sequence: string;
}

export const attestSplToken = async (
  chain: ChainConfig,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  mintAddress: string,
): Promise<AttestationResult> => {
  if (!solanaWallet.publicKey) {
    throw new Error("No Solana public key");
  }

  const tx = await attestFromSolana(
    solanaConnection.rawConnection,
    chain.wormholeBridge,
    chain.wormholeTokenBridge,
    solanaWallet.publicKey.toBase58(),
    mintAddress,
  );
  const signed = await solanaWallet.signTransaction(tx);
  // NOTE: Wormhole SDK's attestFromSolana doesn't give us the signing key so we can't send with retry
  const txId = await solanaConnection.rawConnection.sendRawTransaction(
    signed.serialize(),
  );
  const info = await solanaConnection.getTx(txId);

  const sequence = parseSequenceFromLogSolana(info);
  const emitterAddress = await getEmitterAddressSolana(
    chain.wormholeTokenBridge,
  );

  return {
    txId,
    emitterAddress,
    sequence,
  };
};

export const setUpSplTokensOnEvm = async (
  { rpcUrls }: WormholeConfig,
  solanaChain: SolanaChainConfig,
  evmChain: EvmChainConfig,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  evmWallet: EvmWalletAdapter,
  mintAddresses: readonly string[],
): Promise<CrossChainResult> => {
  if (!evmWallet.signer) {
    throw new Error("No EVM chain wallet signer");
  }

  await evmWallet.switchNetwork(evmChain.chainId);

  const attestations = await Promise.all(
    mintAddresses.map((mintAddress) =>
      attestSplToken(solanaChain, solanaConnection, solanaWallet, mintAddress),
    ),
  );

  const vaas = await Promise.all(
    attestations.map(({ emitterAddress, sequence }) =>
      getSignedVAAWithRetry(
        [...rpcUrls],
        solanaPlugin.wormholeChainId,
        emitterAddress,
        sequence,
      ),
    ),
  );

  let evmReceipts: readonly ContractReceipt[] = [];
  // Use a for loop to ensure the sequence does not get out of order
  for (const { vaaBytes } of vaas) {
    evmReceipts = [
      ...evmReceipts,
      await createWrappedOnEth(
        evmChain.wormholeTokenBridge,
        evmWallet.signer,
        vaaBytes,
      ),
    ];
  }
  const evmTxIds = evmReceipts.map(({ transactionHash }) => transactionHash);
  return {
    solanaTxIds: attestations.map(({ txId }) => txId),
    ethereumTxIds: evmChain.ecosystemId === "ethereum" ? evmTxIds : [],
    bnbTxIds: evmChain.ecosystemId === "bnb" ? evmTxIds : [],
  };
};

export const attestErc20Token = async (
  evmChain: EvmChainConfig,
  evmWallet: EvmWalletAdapter,
  tokenContractAddress: string,
): Promise<AttestationResult> => {
  if (!evmWallet.signer) {
    throw new Error("No EVM chain wallet signer");
  }

  await evmWallet.switchNetwork(evmChain.chainId);

  const receipt = await attestFromEth(
    evmChain.wormholeTokenBridge,
    evmWallet.signer,
    tokenContractAddress,
  );
  const sequence = parseSequenceFromLogEth(receipt, evmChain.wormholeBridge);
  const emitterAddress = getEmitterAddressEth(evmChain.wormholeTokenBridge);

  return {
    txId: receipt.transactionHash,
    emitterAddress,
    sequence,
  };
};

export const setUpErc20Tokens = async (
  { rpcUrls }: WormholeConfig,
  evmChain: EvmChainConfig,
  solanaChain: SolanaChainConfig,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  evmWallet: EvmWalletAdapter,
  tokenContractAddresses: readonly string[],
): Promise<CrossChainResult> => {
  let attestations: readonly AttestationResult[] = [];
  // Use a for loop to ensure the sequence does not get out of order
  for (const tokenContractAddress of tokenContractAddresses) {
    attestations = [
      ...attestations,
      await attestErc20Token(evmChain, evmWallet, tokenContractAddress),
    ];
  }

  const evmEcosystem = ECOSYSTEMS[evmChain.ecosystemId];
  const vaas = await Promise.all(
    attestations.map(({ emitterAddress, sequence }) =>
      getSignedVAAWithRetry(
        [...rpcUrls],
        evmEcosystem.wormholeChainId,
        emitterAddress,
        sequence,
      ),
    ),
  );

  await Promise.all(
    vaas.map(({ vaaBytes }) => {
      if (!solanaWallet.publicKey) {
        throw new Error("No Solana public key");
      }
      return postVaaSolanaWithRetry(
        solanaConnection.rawConnection,
        solanaWallet.signTransaction.bind(solanaWallet),
        solanaChain.wormholeBridge,
        solanaWallet.publicKey.toBase58(),
        Buffer.from(vaaBytes),
        DEFAULT_MAX_RETRIES,
      );
    }),
  );

  const solanaTxIds = await Promise.all(
    vaas.map(async ({ vaaBytes }) => {
      if (!solanaWallet.publicKey) {
        throw new Error("No Solana public key");
      }
      const tx = await createWrappedOnSolana(
        solanaConnection.rawConnection,
        solanaChain.wormholeBridge,
        solanaChain.wormholeTokenBridge,
        solanaWallet.publicKey.toBase58(),
        vaaBytes,
      );
      return solanaConnection.sendAndConfirmTx(
        solanaWallet.signTransaction.bind(solanaWallet),
        tx,
      );
    }),
  );

  const evmTxIds = attestations.map(({ txId }) => txId);

  return {
    solanaTxIds,
    ethereumTxIds: evmChain.ecosystemId === "ethereum" ? evmTxIds : [],
    bnbTxIds: evmChain.ecosystemId === "bnb" ? evmTxIds : [],
  };
};

import {
  attestFromEth,
  attestFromSolana,
  createWrappedOnEth,
  createWrappedOnSolana,
  getEmitterAddressEth,
  getEmitterAddressSolana,
  parseSequenceFromLogEth,
  parseSequenceFromLogSolana,
  postVaaSolanaWithRetry,
} from "@certusone/wormhole-sdk";
import type { WormholeChainConfig, WormholeConfig } from "@swim-io/core";
import type { EvmWalletAdapter } from "@swim-io/evm";
import type { SolanaConnection, SolanaWalletAdapter } from "@swim-io/solana";
import { DEFAULT_MAX_RETRIES, SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { ContractReceipt } from "ethers";

import type { EcosystemId, EvmSpec } from "../../config";
import { ECOSYSTEMS, WormholeChainId } from "../../config";

import { getSignedVaaWithRetry } from "./guardiansRpc";

export interface CrossEcosystemResult {
  readonly txId: string;
  readonly ecosystemId: EcosystemId;
}

export interface AttestationResult {
  readonly txId: string;
  readonly emitterAddress: string;
  readonly sequence: string;
}

export const attestSplToken = async (
  solanaWormhole: WormholeChainConfig,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  mintAddress: string,
): Promise<AttestationResult> => {
  if (!solanaWallet.publicKey) {
    throw new Error("No Solana public key");
  }

  const tx = await attestFromSolana(
    solanaConnection.rawConnection,
    solanaWormhole.bridge,
    solanaWormhole.portal,
    solanaWallet.publicKey.toBase58(),
    mintAddress,
  );
  const signed = await solanaWallet.signTransaction(tx);
  // NOTE: Wormhole SDK's attestFromSolana doesn't give us the signing key so we can't send with retry
  const txId = await solanaConnection.rawConnection.sendRawTransaction(
    signed.serialize(),
  );
  const txResponse = await solanaConnection.getTx(txId);
  const sequence = parseSequenceFromLogSolana(txResponse);
  const emitterAddress = await getEmitterAddressSolana(solanaWormhole.portal);

  return {
    txId,
    emitterAddress,
    sequence,
  };
};

export const setUpSplTokensOnEvm = async (
  { rpcUrls }: WormholeConfig,
  solanaWormhole: WormholeChainConfig,
  evmChain: EvmSpec,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  evmWallet: EvmWalletAdapter,
  mintAddresses: readonly string[],
): Promise<readonly CrossEcosystemResult[]> => {
  if (!evmWallet.signer) {
    throw new Error("No EVM chain wallet signer");
  }

  await evmWallet.switchNetwork(evmChain.chainId);

  const attestations = await Promise.all(
    mintAddresses.map((mintAddress) =>
      attestSplToken(
        solanaWormhole,
        solanaConnection,
        solanaWallet,
        mintAddress,
      ),
    ),
  );

  const vaas = await Promise.all(
    attestations.map(({ emitterAddress, sequence }) =>
      getSignedVaaWithRetry(
        [...rpcUrls],
        WormholeChainId.Solana,
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
        evmChain.wormhole.portal,
        evmWallet.signer,
        vaaBytes,
      ),
    ];
  }
  return [
    ...attestations.map(({ txId }) => ({
      txId,
      ecosystemId: SOLANA_ECOSYSTEM_ID,
    })),
    ...evmReceipts.map(({ transactionHash }) => ({
      txId: transactionHash,
      ecosystemId: evmChain.ecosystem,
    })),
  ];
};

export const attestErc20Token = async (
  evmChain: EvmSpec,
  evmWallet: EvmWalletAdapter,
  tokenContractAddress: string,
): Promise<AttestationResult> => {
  if (!evmWallet.signer) {
    throw new Error("No EVM chain wallet signer");
  }

  await evmWallet.switchNetwork(evmChain.chainId);

  const receipt = await attestFromEth(
    evmChain.wormhole.portal,
    evmWallet.signer,
    tokenContractAddress,
  );
  const sequence = parseSequenceFromLogEth(receipt, evmChain.wormhole.bridge);
  const emitterAddress = getEmitterAddressEth(evmChain.wormhole.portal);

  return {
    txId: receipt.transactionHash,
    emitterAddress,
    sequence,
  };
};

export const setUpErc20Tokens = async (
  { rpcUrls }: WormholeConfig,
  evmChain: EvmSpec,
  solanaWormhole: WormholeChainConfig,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  evmWallet: EvmWalletAdapter,
  tokenContractAddresses: readonly string[],
): Promise<readonly CrossEcosystemResult[]> => {
  let attestations: readonly AttestationResult[] = [];
  // Use a for loop to ensure the sequence does not get out of order
  for (const tokenContractAddress of tokenContractAddresses) {
    attestations = [
      ...attestations,
      await attestErc20Token(evmChain, evmWallet, tokenContractAddress),
    ];
  }

  const evmEcosystem = ECOSYSTEMS[evmChain.ecosystem];
  const vaas = await Promise.all(
    attestations.map(({ emitterAddress, sequence }) =>
      getSignedVaaWithRetry(
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
        solanaWormhole.bridge,
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
        solanaWormhole.bridge,
        solanaWormhole.portal,
        solanaWallet.publicKey.toBase58(),
        vaaBytes,
      );
      return solanaConnection.sendAndConfirmTx(
        solanaWallet.signTransaction.bind(solanaWallet),
        tx,
      );
    }),
  );

  return [
    ...attestations.map(({ txId }) => ({
      txId,
      ecosystemId: evmChain.ecosystem,
    })),
    ...solanaTxIds.map((txId) => ({
      txId,
      ecosystemId: SOLANA_ECOSYSTEM_ID,
    })),
  ];
};

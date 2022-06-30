import {
  getEmitterAddressEth,
  getEmitterAddressSolana,
  getSignedVAAWithRetry,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import type { ethers } from "ethers";

import type {
  ChainsByProtocol,
  Config,
  TokenSpec,
  WormholeChainSpec,
  WormholeConfig,
} from "../../config";
import {
  ECOSYSTEMS,
  EcosystemId,
  Protocol,
  WormholeChainId,
  getSolanaTokenDetails,
} from "../../config";
import { findOrThrow, isNotNull } from "../../utils";
import type {
  EvmTx,
  SolanaTx,
  Tx,
  TxWithTokenId,
  TxsByTokenId,
} from "../crossEcosystem";
import { isEvmTx, isSolanaTx } from "../crossEcosystem";
import type { SolanaConnection } from "../solana";
import { findTokenAccountForMint } from "../solana";
import type { SolanaWalletAdapter } from "../wallets";

import { DEFAULT_WORMHOLE_RETRIES } from "./constants";
import {
  isLockEvmTx,
  isUnlockEvmTx,
  lockEvmToken,
  unlockEvmToken,
} from "./evm";
import {
  generateLockSplTokensTxs,
  generateUnlockSplTokenTxIds,
  isLockSplTx,
  isRedeemOnSolanaTx,
  isUnlockSplTx,
  lockSplTokens,
  parseSequenceFromLogSolana,
  unlockSplToken,
} from "./solana";
import type {
  WormholeTransfer,
  WormholeTransferWithSignatureSet,
} from "./transfer";

export interface CrossChainResult {
  readonly solanaTxIds: readonly string[];
  readonly ethereumTxIds: readonly string[];
  readonly bscTxIds: readonly string[];
}

export const isTransferToTx = (
  chainsConfig: ChainsByProtocol,
  walletAddress: string,
  splTokenAccounts: readonly TokenAccountInfo[],
  token: TokenSpec,
  solanaMint: string,
  signatureSetAddress: string | null,
  tx: Tx,
): boolean => {
  if (isSolanaTx(tx)) {
    const solanaWormhole = chainsConfig[Protocol.Solana][0].wormhole;
    const splTokenAccount = findTokenAccountForMint(
      solanaMint,
      walletAddress,
      splTokenAccounts,
    );
    if (splTokenAccount === null) {
      return false;
    }
    return isUnlockSplTx(
      solanaWormhole,
      token,
      signatureSetAddress,
      splTokenAccount.address.toBase58(),
      tx,
    );
  } else if (isEvmTx(tx)) {
    const sourceChainSpec =
      chainsConfig[Protocol.Evm].find(
        (config) => config.ecosystem === tx.ecosystem,
      ) ?? null;
    return (
      sourceChainSpec !== null &&
      isLockEvmTx(sourceChainSpec.wormhole, token, tx)
    );
  }
  return false;
};

export const isTransferFromTx = (
  chainsConfig: ChainsByProtocol,
  walletAddress: string,
  splTokenAccounts: readonly TokenAccountInfo[],
  token: TokenSpec,
  tx: Tx,
): boolean => {
  if (isSolanaTx(tx)) {
    const solanaWormhole = chainsConfig[Protocol.Solana][0].wormhole;
    const solanaMint = getSolanaTokenDetails(token).address;
    const splTokenAccount = findTokenAccountForMint(
      solanaMint,
      walletAddress,
      splTokenAccounts,
    );
    if (splTokenAccount === null) {
      return false;
    }
    return isLockSplTx(
      solanaWormhole,
      splTokenAccount.address.toBase58(),
      token,
      tx,
    );
  }
  if (isEvmTx(tx)) {
    const destinationChainSpec =
      chainsConfig[Protocol.Evm].find(
        (config) => config.ecosystem === tx.ecosystem,
      ) ?? null;
    return (
      destinationChainSpec !== null &&
      isUnlockEvmTx(destinationChainSpec.wormhole, token, tx)
    );
  }
  return false;
};

export async function* generateTransferEvmTokensToSolana(
  config: Config,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  transfers: readonly WormholeTransferWithSignatureSet[],
): AsyncGenerator<TxWithTokenId> {
  const { chains, wormhole } = config;
  const solanaChainSpec = chains[Protocol.Solana][0];
  const solanaWormhole = solanaChainSpec.wormhole;
  const solanaPublicKey = solanaWallet.publicKey;
  if (!solanaPublicKey) {
    throw new Error("No Solana public key");
  }

  let approvalResponses: readonly (ethers.providers.TransactionResponse | null)[] =
    [];
  let transferResponses: readonly ethers.providers.TransactionResponse[] = [];
  let sequences: readonly string[] = [];
  for (const transfer of transfers) {
    const existingLockEvmTx =
      transfer.existingTxs.find<EvmTx>((tx: Tx): tx is EvmTx => {
        if (!isEvmTx(tx)) {
          return false;
        }
        const sourceChainSpec = findOrThrow(
          chains[Protocol.Evm],
          (chain) => chain.ecosystem === tx.ecosystem,
        );
        const sourceWormhole = sourceChainSpec.wormhole;
        return isLockEvmTx(sourceWormhole, transfer.token, tx);
      }) ?? null;
    if (existingLockEvmTx !== null) {
      transferResponses = [...transferResponses, existingLockEvmTx.txResponse];
      const sequence = parseSequenceFromLogEth(
        existingLockEvmTx.txReceipt,
        transfer.evmChain.wormhole.bridge,
      );
      sequences = [...sequences, sequence];
      yield {
        tokenId: transfer.token.id,
        tx: existingLockEvmTx,
      };
      continue;
    }
    const { approvalResponses: newApprovalResponses, transferResponse } =
      await lockEvmToken(transfer);
    approvalResponses = [...approvalResponses, ...newApprovalResponses];
    transferResponses = [...transferResponses, transferResponse];

    const createEvmResult = async (
      txResponse: ethers.providers.TransactionResponse,
    ): Promise<TxWithTokenId> => {
      const txReceipt = await transfer.evmConnection.getTxReceiptOrThrow(
        txResponse,
      );
      return {
        tokenId: transfer.token.id,
        tx: {
          ecosystem: transfer.evmChain.ecosystem,
          txId: txReceipt.transactionHash,
          timestamp: txResponse.timestamp ?? null,
          interactionId: transfer.interactionId,
          txResponse,
          txReceipt,
        },
      };
    };

    for (const approvalResponse of newApprovalResponses) {
      yield createEvmResult(approvalResponse);
    }

    const transferResult = await createEvmResult(transferResponse);
    if (!isEvmTx(transferResult.tx)) {
      // NOTE: This should never happen
      throw new Error("Unexpected tx");
    }
    const sequence = parseSequenceFromLogEth(
      transferResult.tx.txReceipt,
      transfer.evmChain.wormhole.bridge,
    );
    sequences = [...sequences, sequence];
    yield transferResult;
  }

  for (let i = 0; i < transfers.length; ++i) {
    const transfer = transfers[i];
    const existingRedeemOnSolanaTx =
      transfer.existingTxs.find<SolanaTx>(
        // TODO: Find postVaa txs too
        (tx: Tx): tx is SolanaTx =>
          isSolanaTx(tx) &&
          isRedeemOnSolanaTx(
            solanaWormhole,
            transfer.token,
            transfer.splTokenAccountAddress,
            tx,
          ),
      ) ?? null;
    if (existingRedeemOnSolanaTx !== null) {
      yield {
        tokenId: transfer.token.id,
        tx: existingRedeemOnSolanaTx,
      };
      continue;
    }

    const unlockSplTokenTxIdsGenerator = generateUnlockSplTokenTxIds(
      transfer.interactionId,
      wormhole.endpoint,
      ECOSYSTEMS[transfer.evmChain.ecosystem].wormholeChainId,
      getEmitterAddressEth(transfer.evmChain.wormhole.tokenBridge),
      sequences[i],
      solanaWormhole,
      solanaConnection,
      solanaWallet,
      transfer.signatureSetKeypair,
    );
    for await (const txId of unlockSplTokenTxIdsGenerator) {
      const tx = await solanaConnection.getParsedTx(txId);
      yield {
        tokenId: transfer.token.id,
        tx: {
          ecosystem: EcosystemId.Solana,
          txId,
          timestamp: tx.blockTime ?? null,
          interactionId: transfer.interactionId,
          parsedTx: tx,
        },
      };
    }
  }
}

export const transferEvmTokensToSolana = async (
  solanaConnection: SolanaConnection,
  { endpoint }: WormholeConfig,
  solanaWormhole: WormholeChainSpec,
  solanaWallet: SolanaWalletAdapter,
  transfers: readonly WormholeTransfer[],
): Promise<TxsByTokenId> => {
  const solanaPublicKey = solanaWallet.publicKey;
  if (!solanaPublicKey) {
    throw new Error("No Solana public key");
  }

  let approvalResponses: readonly (ethers.providers.TransactionResponse | null)[] =
    [];
  let transferResponses: readonly ethers.providers.TransactionResponse[] = [];
  for (const transfer of transfers) {
    const { approvalResponses: newApprovalResponses, transferResponse } =
      await lockEvmToken(transfer);
    approvalResponses = [...approvalResponses, ...newApprovalResponses];
    transferResponses = [...transferResponses, transferResponse];
  }
  const approvalReceipts = await Promise.all(
    approvalResponses.map((approvalResponse, i) =>
      approvalResponse === null
        ? null
        : transfers[i].evmConnection.getTxReceiptOrThrow(approvalResponse),
    ),
  );
  const transferReceipts = await Promise.all(
    transferResponses.map((transferResponse, i) =>
      transfers[i].evmConnection.getTxReceiptOrThrow(transferResponse),
    ),
  );

  const sequences = transferReceipts.map((transferReceipt, i) =>
    parseSequenceFromLogEth(
      transferReceipt,
      transfers[i].evmChain.wormhole.bridge,
    ),
  );

  const solanaTxIds = await Promise.all(
    transfers.map((transfer, i) =>
      unlockSplToken(
        transfer.interactionId,
        endpoint,
        ECOSYSTEMS[transfer.evmChain.ecosystem].wormholeChainId,
        getEmitterAddressEth(transfer.evmChain.wormhole.tokenBridge),
        sequences[i],
        solanaWormhole,
        solanaConnection,
        solanaWallet,
      ),
    ),
  );
  const solanaTxs = await Promise.all(
    solanaTxIds.map((txIds) => solanaConnection.getParsedTxs(txIds)),
  );

  return transfers.reduce<TxsByTokenId>(
    (accumulator, { evmChain, interactionId, token }, i) => {
      const approvalResponse = approvalResponses[i];
      const approvalReceipt = approvalReceipts[i];
      const transferResponse = transferResponses[i];
      const transferReceipt = transferReceipts[i];

      const approvalTx: EvmTx | null =
        approvalResponse && approvalReceipt
          ? {
              ecosystem: evmChain.ecosystem,
              txId: approvalReceipt.transactionHash,
              timestamp: approvalResponse.timestamp ?? null,
              interactionId,
              txResponse: approvalResponse,
              txReceipt: approvalReceipt,
            }
          : null;
      const transferTx: EvmTx = {
        ecosystem: evmChain.ecosystem,
        txId: transferReceipt.transactionHash,
        timestamp: transferResponse.timestamp ?? null,
        interactionId,
        txResponse: transferResponse,
        txReceipt: transferReceipt,
      };
      const evmTxs = [approvalTx, transferTx].filter(isNotNull);
      const solanaTxsForTransfer = solanaTxs[i].map(
        (solanaTx): SolanaTx => ({
          ecosystem: EcosystemId.Solana,
          txId: solanaTx.transaction.signatures[0],
          timestamp: solanaTx.blockTime ?? null,
          interactionId,
          parsedTx: solanaTx,
        }),
      );
      return {
        ...accumulator,
        [token.id]: [...evmTxs, ...solanaTxsForTransfer],
      };
    },
    {},
  );
};

export async function* generateTransferSplTokensToEvm(
  config: Config,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  transfers: readonly WormholeTransfer[],
): AsyncGenerator<TxWithTokenId> {
  if (!solanaWallet.publicKey) {
    throw new Error("No Solana public key");
  }

  const { chains, wormhole } = config;
  const solanaWormhole = chains[Protocol.Solana][0].wormhole;
  const emitterAddress = await getEmitterAddressSolana(
    solanaWormhole.tokenBridge,
  );

  const lockSplTokensTxsGenerator = generateLockSplTokensTxs(
    solanaWormhole,
    solanaConnection,
    solanaWallet,
    transfers,
  );

  let i = 0;
  let lockSplTokensTxs: readonly SolanaTx[] = [];
  for await (const tx of lockSplTokensTxsGenerator) {
    lockSplTokensTxs = [...lockSplTokensTxs, tx];
    yield {
      tokenId: transfers[i].token.id,
      tx,
    };
    ++i;
  }
  const vaaBytesResponses = await Promise.all(
    lockSplTokensTxs.map(async (tx) => {
      const sequence = parseSequenceFromLogSolana(tx.parsedTx);
      return getSignedVAAWithRetry(
        [wormhole.endpoint],
        WormholeChainId.Solana,
        emitterAddress,
        sequence,
        undefined,
        undefined,
        DEFAULT_WORMHOLE_RETRIES,
      );
    }),
  );

  for (let j = 0; j < transfers.length; ++j) {
    const transfer = transfers[j];
    const destinationChainSpec =
      chains[Protocol.Evm].find(
        (chain) => chain.ecosystem === transfer.token.nativeEcosystem,
      ) ?? null;
    const existingUnlockEvmTx =
      (destinationChainSpec &&
        transfer.existingTxs.find<EvmTx>(
          (tx: Tx): tx is EvmTx =>
            isEvmTx(tx) &&
            isUnlockEvmTx(destinationChainSpec.wormhole, transfer.token, tx),
        )) ??
      null;
    if (existingUnlockEvmTx !== null) {
      yield {
        tokenId: transfer.token.id,
        tx: existingUnlockEvmTx,
      };
    } else {
      const evmResponse = await unlockEvmToken(
        transfer,
        vaaBytesResponses[j].vaaBytes,
      );
      const evmReceipt = await transfer.evmConnection.getTxReceiptOrThrow(
        evmResponse,
      );
      yield {
        tokenId: transfer.token.id,
        tx: {
          ecosystem: transfer.evmChain.ecosystem,
          txId: evmReceipt.transactionHash,
          timestamp: evmResponse.timestamp ?? null,
          interactionId: transfer.interactionId,
          txResponse: evmResponse,
          txReceipt: evmReceipt,
        },
      };
    }
  }
}

export const transferSplTokensToEvm = async (
  solanaConnection: SolanaConnection,
  { endpoint }: WormholeConfig,
  solanaWormhole: WormholeChainSpec,
  solanaWallet: SolanaWalletAdapter,
  transfers: readonly WormholeTransfer[],
): Promise<TxsByTokenId> => {
  if (!solanaWallet.publicKey) {
    throw new Error("No Solana public key");
  }

  const solanaResults = await lockSplTokens(
    endpoint,
    solanaWormhole,
    solanaConnection,
    solanaWallet,
    transfers,
  );

  let evmResponses: readonly ethers.providers.TransactionResponse[] = [];
  for (let i = 0; i < transfers.length; ++i) {
    const evmResponse = await unlockEvmToken(
      transfers[i],
      solanaResults[i].vaaBytes,
    );
    evmResponses = [...evmResponses, evmResponse];
  }
  const evmReceipts = await Promise.all(
    evmResponses.map((evmResponse, i) =>
      transfers[i].evmConnection.getTxReceiptOrThrow(evmResponse),
    ),
  );

  const solanaTxs = await solanaConnection.getParsedTxs(
    solanaResults.map(({ txId }) => txId),
  );

  return transfers.reduce<TxsByTokenId>(
    (accumulator, { evmChain, interactionId, token }, i) => {
      const solanaTx: SolanaTx = {
        ecosystem: EcosystemId.Solana,
        txId: solanaTxs[i].transaction.signatures[0],
        timestamp: solanaTxs[i].blockTime ?? null,
        interactionId,
        parsedTx: solanaTxs[i],
      };
      const evmResponse = evmResponses[i];
      const evmReceipt = evmReceipts[i];
      const evmTx: EvmTx = {
        ecosystem: evmChain.ecosystem,
        txId: evmReceipt.transactionHash,
        timestamp: evmResponse.timestamp ?? null,
        interactionId,
        txResponse: evmResponse,
        txReceipt: evmReceipt,
      };
      return {
        ...accumulator,
        [token.id]: [solanaTx, evmTx],
      };
    },
    {},
  );
};

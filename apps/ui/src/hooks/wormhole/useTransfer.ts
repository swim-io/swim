import {
  getEmitterAddressEth,
  getEmitterAddressSolana,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import type { WormholeChainConfig, WormholeConfig } from "@swim-io/core/types";
import { isEvmEcosystemId } from "@swim-io/evm";
import type {
  EvmChainConfig,
  EvmClient,
  EvmEcosystemId,
  EvmTx,
  EvmWalletAdapter,
} from "@swim-io/evm";
import type {
  SolanaClient,
  SolanaWalletAdapter,
  TokenAccount,
} from "@swim-io/solana";
import {
  SOLANA_ECOSYSTEM_ID,
  parseSequenceFromLogSolana,
} from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import { WormholeChainId, getSignedVaaWithRetry } from "@swim-io/wormhole";
import Decimal from "decimal.js";
import type { ethers } from "ethers";
import { useCallback, useMemo, useState } from "react";

import type { ChainSpec, EcosystemId, TokenConfig } from "../../config";
import {
  ECOSYSTEMS,
  Protocol,
  getSolanaTokenDetails,
  getWormholeRetries,
} from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import {
  Amount,
  formatWormholeAddress,
  generateId,
  getWrappedTokenInfo,
  humanDecimalToAtomicString,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient, useSplTokenAccountsQuery } from "../solana";

export const enum TransferStatus {
  BridgedTokens,
  FetchingVaa,
  FetchedVaa,
  Transfered,
}

type TransferData = {
  readonly token: TokenConfig;
  readonly sourceEcosystemId: EcosystemId;
  readonly targetEcosystemId: EcosystemId;
  readonly amount: string;
  readonly addTransferInfo: (
    status: TransferStatus,
    data: ReadonlyArray<string>,
  ) => void;
};

const txResponseToTx = async (
  interactionId: string,
  ecosystemId: EvmEcosystemId,
  client: EvmClient,
  txResponse: ethers.providers.TransactionResponse,
): Promise<EvmTx> => {
  const txReceipt = await client.getTxReceiptOrThrow(txResponse);
  return {
    interactionId,
    ecosystemId,
    id: txReceipt.transactionHash,
    timestamp: txResponse.timestamp ?? null,
    response: txResponse,
    receipt: txReceipt,
  };
};

async function transferFromSolanaToEvm(
  interactionId: string,
  token: TokenConfig,
  value: string,
  toEcosystem: EcosystemId,
  solanaWallet: SolanaWalletAdapter,
  evmWallet: EvmWalletAdapter,
  evmChain: EvmChainConfig & ChainSpec,
  wormhole: WormholeConfig,
  solanaClient: SolanaClient,
  evmClient: EvmClient,
  solanaWormhole: WormholeChainConfig,
  addTransferInfo: (
    status: TransferStatus,
    data: ReadonlyArray<string>,
  ) => void,
): Promise<string> {
  const solanaWalletAddress = solanaWallet.address ?? null;
  if (!solanaWalletAddress) {
    throw new Error("No Solana wallet address");
  }

  const amount = Amount.fromHuman(token, new Decimal(value));
  const evmEcosystem = ECOSYSTEMS[toEcosystem];

  const evmWalletAddress = evmWallet.address;
  if (evmWalletAddress === null) {
    throw new Error("No EVM wallet address");
  }
  const isWrappedToken = token.wrappedDetails.size > 0;
  const auxiliarySigner = Keypair.generate();

  const transferSplTokenTxId = await solanaClient.initiateWormholeTransfer({
    atomicAmount: amount.toAtomicString(SOLANA_ECOSYSTEM_ID),
    interactionId,
    targetAddress: formatWormholeAddress(
      evmEcosystem.protocol,
      evmWalletAddress,
    ),
    targetChainId: evmEcosystem.wormholeChainId,
    tokenProjectId: token.projectId,
    wallet: solanaWallet,
    auxiliarySigner,
    wrappedTokenInfo: isWrappedToken
      ? getWrappedTokenInfo(token, SOLANA_ECOSYSTEM_ID)
      : undefined,
  });
  addTransferInfo(TransferStatus.BridgedTokens, [transferSplTokenTxId]);
  const parsedTx = await solanaClient.getParsedTx(transferSplTokenTxId);

  const sequence = parseSequenceFromLogSolana(parsedTx);
  addTransferInfo(TransferStatus.FetchingVaa, []);

  const emitterAddress = await getEmitterAddressSolana(solanaWormhole.portal);
  const sourceChainId = WormholeChainId.Solana;
  const retries = getWormholeRetries(sourceChainId);
  let vaa;
  try {
    const { vaaBytes } = await getSignedVaaWithRetry(
      [...wormhole.rpcUrls],
      sourceChainId,
      emitterAddress,
      sequence,
      undefined,
      undefined,
      retries,
    );
    vaa = vaaBytes;
  } catch (e) {
    throw new Error(`Failed to fetch signed VAA. Sequence: ${sequence}`);
  }

  addTransferInfo(TransferStatus.FetchedVaa, []);
  await evmWallet.switchNetwork(evmChain.chainId);
  const redeemResponse = await evmClient.completeWormholeTransfer({
    interactionId,
    vaa,
    wallet: evmWallet,
  });
  if (redeemResponse === null) {
    throw new Error(
      `Transaction not found: (unlock/mint on ${evmChain.ecosystem})`,
    );
  }
  const tx = await evmClient.getTxReceiptOrThrow(redeemResponse);
  addTransferInfo(TransferStatus.Transfered, [tx.transactionHash]);
  return tx.transactionHash;
}

async function transferFromEvmToEvm(
  interactionId: string,
  token: TokenConfig,
  value: string,
  evmWallet: EvmWalletAdapter,
  targetEvmChain: EvmChainConfig & ChainSpec,
  sourceEvmChain: EvmChainConfig & ChainSpec,
  targetEcosystemId: EcosystemId,
  wormhole: WormholeConfig,
  evmClient: EvmClient,
  addTransferInfo: (
    status: TransferStatus,
    info: ReadonlyArray<string>,
  ) => void,
): Promise<string> {
  const fromEcosystem = token.nativeEcosystemId as EvmEcosystemId;
  const { wormholeChainId } = ECOSYSTEMS[targetEcosystemId];
  const { wormholeChainId: sourceChainId } = ECOSYSTEMS[fromEcosystem];

  if (!evmWallet.address) {
    throw new Error("No EVM address");
  }
  const isWrappedToken = token.wrappedDetails.size > 0;

  const { approvalResponses, transferResponse } =
    await evmClient.initiateWormholeTransfer({
      atomicAmount: humanDecimalToAtomicString(
        new Decimal(value),
        token,
        fromEcosystem,
      ),
      interactionId,
      targetAddress: formatWormholeAddress(Protocol.Evm, evmWallet.address),
      targetChainId: wormholeChainId,
      tokenProjectId: token.projectId,
      wallet: evmWallet,
      wrappedTokenInfo: isWrappedToken
        ? getWrappedTokenInfo(token, fromEcosystem)
        : undefined,
    });
  addTransferInfo(TransferStatus.BridgedTokens, [transferResponse.hash]);

  const [transferTx] = await Promise.all(
    [transferResponse, ...approvalResponses].map((txResponse) =>
      txResponseToTx(interactionId, fromEcosystem, evmClient, txResponse),
    ),
  );

  addTransferInfo(TransferStatus.BridgedTokens, [
    transferTx.receipt.transactionHash,
  ]);

  const sequence = parseSequenceFromLogEth(
    transferTx.receipt,
    sourceEvmChain.wormhole.bridge,
  );
  addTransferInfo(TransferStatus.FetchingVaa, []);

  const retries = getWormholeRetries(sourceChainId);
  let vaa;
  try {
    const { vaaBytes } = await getSignedVaaWithRetry(
      [...wormhole.rpcUrls],
      sourceChainId,
      getEmitterAddressEth(sourceEvmChain.wormhole.portal),
      sequence,
      undefined,
      undefined,
      retries,
    );
    vaa = vaaBytes;
  } catch (e) {
    throw new Error(`Failed to fetch signed VAA. Sequence: ${sequence}`);
  }

  addTransferInfo(TransferStatus.FetchedVaa, []);
  await evmWallet.switchNetwork(targetEvmChain.chainId);
  const redeemResponse = await evmClient.completeWormholeTransfer({
    interactionId,
    vaa,
    wallet: evmWallet,
  });
  if (redeemResponse === null) {
    throw new Error(
      `Transaction not found: (unlock/mint on ${targetEvmChain.ecosystem})`,
    );
  }
  const res = await evmClient.getTxReceiptOrThrow(redeemResponse);
  addTransferInfo(TransferStatus.Transfered, [res.transactionHash]);
  return res.transactionHash;
}

async function transferFromEvmToSolana(
  interactionId: string,
  token: TokenConfig,
  value: string,
  evmWallet: EvmWalletAdapter,
  solanaWallet: SolanaWalletAdapter,
  sourceEvmChain: EvmChainConfig & ChainSpec,
  wormhole: WormholeConfig,
  evmClient: EvmClient,
  solanaClient: SolanaClient,
  splTokenAccounts: readonly TokenAccount[],
  addTransferInfo: (
    status: TransferStatus,
    info: ReadonlyArray<string>,
  ) => void,
): Promise<readonly string[]> {
  const fromEcosystem = token.nativeEcosystemId as EvmEcosystemId;
  const { wormholeChainId: sourceChainId } = ECOSYSTEMS[fromEcosystem];
  const splTokenAccountAddress = findOrThrow(
    splTokenAccounts,
    ({ mint }) => mint.toBase58() === getSolanaTokenDetails(token).address,
  ).address.toBase58();

  if (!evmWallet.address) {
    throw new Error("No EVM address");
  }
  const isWrappedToken = token.wrappedDetails.size > 0;

  const { approvalResponses, transferResponse } =
    await evmClient.initiateWormholeTransfer({
      atomicAmount: humanDecimalToAtomicString(
        new Decimal(value),
        token,
        fromEcosystem,
      ),
      interactionId,
      targetAddress: formatWormholeAddress(
        Protocol.Solana,
        splTokenAccountAddress,
      ),
      targetChainId: WormholeChainId.Solana,
      tokenProjectId: token.projectId,
      wallet: evmWallet,
      wrappedTokenInfo: isWrappedToken
        ? getWrappedTokenInfo(token, fromEcosystem)
        : undefined,
    });
  addTransferInfo(TransferStatus.BridgedTokens, [transferResponse.hash]);

  const [transferTx] = await Promise.all(
    [transferResponse, ...approvalResponses].map((txResponse) =>
      txResponseToTx(interactionId, fromEcosystem, evmClient, txResponse),
    ),
  );

  const sequence = parseSequenceFromLogEth(
    transferTx.receipt,
    sourceEvmChain.wormhole.bridge,
  );

  addTransferInfo(TransferStatus.FetchingVaa, []);
  const retries = getWormholeRetries(sourceChainId);
  let vaa;
  try {
    const { vaaBytes } = await getSignedVaaWithRetry(
      [...wormhole.rpcUrls],
      sourceChainId,
      getEmitterAddressEth(sourceEvmChain.wormhole.portal),
      sequence,
      undefined,
      undefined,
      retries,
    );
    vaa = vaaBytes;
  } catch (e) {
    throw new Error(`Failed to fetch signed VAA. Sequence: ${sequence}`);
  }

  addTransferInfo(TransferStatus.FetchedVaa, []);
  const auxiliarySigner = Keypair.generate();
  const txIds = await solanaClient.completeWormholeTransfer({
    interactionId,
    vaa,
    wallet: solanaWallet,
    auxiliarySigner,
  });
  addTransferInfo(TransferStatus.Transfered, [...txIds]);
  return [...txIds];
}

interface TransferResult {
  readonly isSending: boolean;
  readonly error: string | null;
  readonly handleTransfer: (data: TransferData) => void;
}

export const useTransfer = (): TransferResult => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = useEnvironment(selectConfig);
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { chains, wormhole } = config;
  const getEvmClient = useGetEvmClient();
  const solanaClient = useSolanaClient();
  const wallets = useWallets();

  const handleTransfer = useCallback(
    async ({
      token,
      sourceEcosystemId,
      targetEcosystemId,
      amount,
      addTransferInfo,
    }: TransferData) => {
      setIsSending(true);
      setError(null);
      const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
      const solanaWormhole = chains[Protocol.Solana][0].wormhole;

      if (!wormhole) {
        setIsSending(false);
        setError("No Wormhole RPC configured");
        throw new Error("No Wormhole RPC configured");
      }
      const interactionId = generateId();

      if (
        isEvmEcosystemId(sourceEcosystemId) &&
        targetEcosystemId === SOLANA_ECOSYSTEM_ID
      ) {
        const evmWallet = wallets[sourceEcosystemId].wallet;
        const evmClient = getEvmClient(sourceEcosystemId);
        if (!evmWallet) {
          setIsSending(false);
          setError("No EVM wallet");
          throw new Error("No EVM wallet");
        }
        if (!solanaWallet) {
          setIsSending(false);
          setError("No Solana wallet");
          throw new Error("No Solana wallet");
        }
        const sourceEvmChain = findOrThrow(
          chains[Protocol.Evm],
          ({ ecosystem }) => ecosystem === sourceEcosystemId,
        );
        try {
          await transferFromEvmToSolana(
            interactionId,
            token,
            amount,
            evmWallet,
            solanaWallet,
            sourceEvmChain,
            wormhole,
            evmClient,
            solanaClient,
            splTokenAccounts,
            addTransferInfo,
          );
        } catch (e) {
          console.error(e);
          setIsSending(false);
          setError(String(error));
        }
      }
      if (
        isEvmEcosystemId(sourceEcosystemId) &&
        isEvmEcosystemId(targetEcosystemId)
      ) {
        const evmWallet = wallets[sourceEcosystemId].wallet;
        if (!evmWallet) {
          setIsSending(false);
          setError("No EVM wallet");
          throw new Error("No EVM wallet");
        }
        const targetEvmChain = findOrThrow(
          chains[Protocol.Evm],
          ({ ecosystem }) => ecosystem === targetEcosystemId,
        );
        const sourceEvmChain = findOrThrow(
          chains[Protocol.Evm],
          ({ ecosystem }) => ecosystem === sourceEcosystemId,
        );
        const evmClient = getEvmClient(sourceEcosystemId);
        try {
          await transferFromEvmToEvm(
            interactionId,
            token,
            amount,
            evmWallet,
            targetEvmChain,
            sourceEvmChain,
            targetEcosystemId,
            wormhole,
            evmClient,
            addTransferInfo,
          );
        } catch (e) {
          console.error("Error", e);
          setError(String(e));
          setIsSending(false);
        }
      }

      if (
        sourceEcosystemId === SOLANA_ECOSYSTEM_ID &&
        isEvmEcosystemId(targetEcosystemId)
      ) {
        const evmWallet = wallets[targetEcosystemId].wallet;

        if (!evmWallet) {
          setIsSending(false);
          setError("No EVM wallet");
          throw new Error("No EVM wallet");
        }
        if (!solanaWallet) {
          setIsSending(false);
          setError("No Solana wallet");
          throw new Error("No Solana wallet");
        }
        const evmWalletAddress = evmWallet.address;
        if (evmWalletAddress === null) {
          setIsSending(false);
          setError("No EVM wallet address");
          throw new Error("No EVM wallet address");
        }
        const evmChain = findOrThrow(
          chains[Protocol.Evm],
          ({ ecosystem }) => ecosystem === targetEcosystemId,
        );
        const evmClient = getEvmClient(targetEcosystemId);

        try {
          await transferFromSolanaToEvm(
            interactionId,
            token,
            amount,
            targetEcosystemId,
            solanaWallet,
            evmWallet,
            evmChain,
            wormhole,
            solanaClient,
            evmClient,
            solanaWormhole,
            addTransferInfo,
          );
        } catch (e) {
          console.error(e);
          setError(String(e));
          setIsSending(false);
        }
      }
      setIsSending(false);
    },
    [
      chains,
      error,
      getEvmClient,
      solanaClient,
      splTokenAccounts,
      wallets,
      wormhole,
    ],
  );

  return useMemo(
    () => ({
      handleTransfer,
      isSending,
      error,
    }),
    [handleTransfer, isSending, error],
  );
};

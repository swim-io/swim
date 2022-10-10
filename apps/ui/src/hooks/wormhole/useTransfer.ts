import {
  parseSequenceFromLogEth,
  getEmitterAddressEth,
  getEmitterAddressSolana,
} from "@certusone/wormhole-sdk";
import {
  ChainSpec,
  EcosystemId,
  ECOSYSTEMS,
  getSolanaTokenDetails,
  getWormholeRetries,
  Protocol,
  TokenConfig,
} from "config";
import {
  parseSequenceFromLogSolana,
  SolanaClient,
  SolanaWalletAdapter,
  SOLANA_ECOSYSTEM_ID,
  TokenAccount,
} from "@swim-io/solana";
import { selectConfig } from "core/selectors";
import { useEnvironment } from "core/store";
import { findOrThrow } from "@swim-io/utils";

import { useWallets } from "hooks/crossEcosystem";
import { useGetEvmClient } from "hooks/evm";
import { useSolanaClient, useSplTokenAccountsQuery } from "hooks/solana";
import { useCallback, useMemo, useState } from "react";
import {
  EvmClient,
  EvmEcosystemId,
  EvmTx,
  EvmWalletAdapter,
  isEvmEcosystemId,
} from "@swim-io/evm";
import type { EvmChainConfig } from "@swim-io/evm";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  Amount,
  formatWormholeAddress,
  generateId,
  getWrappedTokenInfo,
  humanDecimalToAtomicString,
} from "models";
import Decimal from "decimal.js";
import { getSignedVaaWithRetry, WormholeChainId } from "@swim-io/wormhole";
import { ethers } from "ethers";
import { WormholeChainConfig, WormholeConfig } from "@swim-io/core/types";

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

  const auxiliarySigner = Keypair.generate();
  console.log(
    "signer",
    auxiliarySigner,
    evmEcosystem.protocol,
    evmWalletAddress,
  );
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
    wrappedTokenInfo: getWrappedTokenInfo(token, SOLANA_ECOSYSTEM_ID),
  });

  const parsedTx = await solanaClient.getParsedTx(transferSplTokenTxId);
  const sequence = parseSequenceFromLogSolana(parsedTx);
  const emitterAddress = await getEmitterAddressSolana(solanaWormhole.portal);
  const sourceChainId = WormholeChainId.Solana;
  const retries = getWormholeRetries(sourceChainId);
  const { vaaBytes: vaa } = await getSignedVaaWithRetry(
    [...wormhole.rpcUrls],
    sourceChainId,
    emitterAddress,
    sequence,
    undefined,
    undefined,
    retries,
  );
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
  return await (
    await evmClient.getTxReceiptOrThrow(redeemResponse)
  ).transactionHash;
}

async function transferFromEvmToEvm(
  interactionId: string,
  token: TokenConfig,
  value: string,
  evmWallet: EvmWalletAdapter,
  targetEvmChain: EvmChainConfig & ChainSpec,
  sourceEvmChain: EvmChainConfig & ChainSpec,
  wormhole: WormholeConfig,
  evmClient: EvmClient,
): Promise<string> {
  const fromEcosystem = token?.nativeEcosystemId as EvmEcosystemId;
  const { wormholeChainId: emitterChainId } =
    ECOSYSTEMS[token.nativeEcosystemId];

  if (!evmWallet.address) {
    throw new Error("No EVM address");
  }
  // Process transfer if transfer txId does not exist
  const { approvalResponses, transferResponse } =
    await evmClient.initiateWormholeTransfer({
      atomicAmount: humanDecimalToAtomicString(
        new Decimal(value),
        token,
        fromEcosystem,
      ),
      interactionId,
      targetAddress: formatWormholeAddress(Protocol.Evm, evmWallet.address),
      targetChainId: emitterChainId,
      tokenProjectId: token.projectId,
      wallet: evmWallet,
      wrappedTokenInfo: getWrappedTokenInfo(token, fromEcosystem),
    });
  console.log("response", approvalResponses, transferResponse);
  const [transferTx, ...approvalTxs] = await Promise.all(
    [transferResponse, ...approvalResponses].map((txResponse) =>
      txResponseToTx(interactionId, fromEcosystem, evmClient, txResponse),
    ),
  );
  console.log("approvals", [transferTx, ...approvalTxs]);
  const sequences = await Promise.all(
    [...approvalTxs, transferTx].map(async (tx) => {
      const transferResponse = await evmClient.provider.getTransaction(tx.id);
      const transferTx = await txResponseToTx(
        interactionId,
        fromEcosystem,
        evmClient,
        transferResponse,
      );
      console.log("transfer in sequences", transferTx);
      return parseSequenceFromLogEth(
        transferTx.receipt,
        sourceEvmChain.wormhole.bridge,
      );
    }),
  );
  console.log("sequences", sequences);
  const retries = getWormholeRetries(emitterChainId);
  const { vaaBytes: vaa } = await getSignedVaaWithRetry(
    [...wormhole.rpcUrls],
    emitterChainId,
    getEmitterAddressEth(sourceEvmChain.wormhole.portal),
    sequences[0],
    undefined,
    undefined,
    retries,
  );
  console.log("RESPONSE init", [transferTx, ...approvalTxs], sequences);
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
  console.info("RESPONSE", res, redeemResponse);
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
): Promise<string[]> {
  const fromEcosystem = token?.nativeEcosystemId as EvmEcosystemId;
  const splTokenAccountAddress = findOrThrow(
    splTokenAccounts,
    ({ mint }) => mint.toBase58() === getSolanaTokenDetails(token).address,
  ).address.toBase58();
  const { wormholeChainId: emitterChainId } =
    ECOSYSTEMS[token.nativeEcosystemId];

  if (!evmWallet.address) {
    throw new Error("No EVM address");
  }

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
      targetChainId: emitterChainId,
      tokenProjectId: token.projectId,
      wallet: evmWallet,
      wrappedTokenInfo: getWrappedTokenInfo(token, fromEcosystem),
    });
  console.log("response", approvalResponses, transferResponse);
  const [transferTx, ...approvalTxs] = await Promise.all(
    [transferResponse, ...approvalResponses].map((txResponse) =>
      txResponseToTx(interactionId, fromEcosystem, evmClient, txResponse),
    ),
  );
  console.log("approvals", [transferTx, ...approvalTxs]);
  const sequences = await Promise.all(
    [...approvalTxs, transferTx].map(async (tx) => {
      const transferResponse = await evmClient.provider.getTransaction(tx.id);
      const transferTx = await txResponseToTx(
        interactionId,
        fromEcosystem,
        evmClient,
        transferResponse,
      );
      console.log("transfer in sequences", transferTx);
      return parseSequenceFromLogEth(
        transferTx.receipt,
        sourceEvmChain.wormhole.bridge,
      );
    }),
  );
  console.log("sequences", sequences);
  const retries = getWormholeRetries(emitterChainId);
  const { vaaBytes: vaa } = await getSignedVaaWithRetry(
    [...wormhole.rpcUrls],
    emitterChainId,
    getEmitterAddressEth(sourceEvmChain.wormhole.portal),
    sequences[0],
    undefined,
    undefined,
    retries,
  );

  console.log("vaa", vaa);
  const txIds = await solanaClient.completeWormholeTransfer({
    interactionId,
    vaa,
    wallet: solanaWallet,
  });
  console.log("txIds", txIds);
  return [...txIds];
}

type TransferData = {
  readonly token: TokenConfig;
  readonly sourceEcosystemId: EcosystemId;
  readonly targetEcosystemId: EcosystemId;
  readonly amount: string;
};

export const useTransfer = (): any => {
  const [isSending, setIsSending] = useState(false);
  const [isVAAPending, setIsVAAPending] = useState(false);
  const config = useEnvironment(selectConfig);
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { chains, wormhole } = config;
  const getEvmClient = useGetEvmClient();
  const solanaClient = useSolanaClient();
  const wallets = useWallets();

  // console.log("Wallets", wallets);

  const handleTransfer = useCallback(
    async ({
      token,
      sourceEcosystemId,
      targetEcosystemId,
      amount,
    }: TransferData) => {
      const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
      const solanaWormhole = chains[Protocol.Solana][0].wormhole;
      let txId = "";
      if (!solanaWallet) {
        throw new Error("No Solana wallet");
      }
      if (!wormhole) {
        throw new Error("No Wormhole RPC configured");
      }
      const interactionId = generateId();
      console.log("INTERACTION ID", interactionId);
      setIsSending(true);
      if (
        isEvmEcosystemId(sourceEcosystemId) &&
        targetEcosystemId === SOLANA_ECOSYSTEM_ID
      ) {
        console.log("EVM to Solana");
        const evmWallet = wallets[sourceEcosystemId].wallet;
        const evmClient = getEvmClient(sourceEcosystemId);
        if (!evmWallet) {
          throw new Error("No EVM wallet");
        }
        const sourceEvmChain = findOrThrow(
          chains[Protocol.Evm],
          ({ ecosystem }) => ecosystem === sourceEcosystemId,
        );
        try {
          const txIds = await transferFromEvmToSolana(
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
          );
          console.log("solana txids", txIds);
        } catch (e) {
          console.error(e);
          setIsSending(false);
          setIsVAAPending(false);
          throw e;
        }
      }
      if (
        isEvmEcosystemId(sourceEcosystemId) &&
        isEvmEcosystemId(targetEcosystemId)
      ) {
        console.log("EVM to EVM");
        const evmWallet = wallets[sourceEcosystemId].wallet as EvmWalletAdapter;
        if (!evmWallet) {
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
        const evmClient = getEvmClient(sourceEcosystemId as EvmEcosystemId);
        try {
          txId = await transferFromEvmToEvm(
            interactionId,
            token,
            amount,
            evmWallet,
            targetEvmChain,
            sourceEvmChain,
            wormhole,
            evmClient,
          );
        } catch (error) {
          console.log("Error", error);
          setIsSending(false);
          setIsVAAPending(false);
        }
      }

      if (
        sourceEcosystemId === SOLANA_ECOSYSTEM_ID &&
        isEvmEcosystemId(targetEcosystemId)
      ) {
        console.log("Solana to EVM");
        const evmWallet = wallets[targetEcosystemId].wallet as EvmWalletAdapter;

        if (!evmWallet) {
          throw new Error("No EVM wallet");
        }
        const evmWalletAddress = evmWallet.address;
        if (evmWalletAddress === null) {
          throw new Error("No EVM wallet address");
        }
        const evmChain = findOrThrow(
          chains[Protocol.Evm],
          ({ ecosystem }) => ecosystem === targetEcosystemId,
        );
        const evmClient = getEvmClient(targetEcosystemId as EvmEcosystemId);

        try {
          txId = await transferFromSolanaToEvm(
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
          );
          console.log("txId", txId);
        } catch (error) {
          setIsSending(false);
          setIsVAAPending(false);
        }
      }
      setIsSending(false);
    },
    [],
  );

  return useMemo(
    () => ({
      handleTransfer,
      isVAAPending,
      isSending,
    }),
    [handleTransfer, isVAAPending, isSending],
  );
};

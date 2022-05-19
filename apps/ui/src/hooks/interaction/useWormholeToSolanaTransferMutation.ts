import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import type { ethers } from "ethers";
import type { QueryClient } from "react-query";
import { useMutation, useQueryClient } from "react-query";

import type { Env, EvmEcosystemId } from "../../config";
import {
  EcosystemId,
  Protocol,
  ecosystems,
  getSolanaTokenDetails,
} from "../../config";
import {
  useConfig,
  useEnvironment,
  useEvmConnections,
  useSolanaConnection,
} from "../../contexts";
import type { EvmConnection, EvmTx, SolanaTx, Tx } from "../../models";
import {
  Amount,
  generateUnlockSplTokenTxIds,
  lockEvmToken,
} from "../../models";
import { findOrThrow } from "../../utils";
import { useWallets } from "../crossEcosystem";
import { useSplTokenAccountsQuery } from "../solana";

import type { WormholeToSolanaTransferState } from "./useInteractionState";

const txResponseToTx = async (
  interactionId: string,
  ecosystemId: EvmEcosystemId,
  evmConnection: EvmConnection,
  txResponse: ethers.providers.TransactionResponse,
): Promise<EvmTx> => {
  const txReceipt = await evmConnection.getTxReceiptOrThrow(txResponse);
  return {
    interactionId,
    ecosystem: ecosystemId,
    txId: txReceipt.transactionHash,
    timestamp: txResponse.timestamp ?? null,
    txResponse,
    txReceipt,
  };
};

const updateTxQueryCache = (queryClient: QueryClient, env: Env, tx: Tx) => {
  const { ecosystem, interactionId } = tx;
  queryClient.setQueryData<readonly Tx[]>(
    [env, "txsForInteraction", interactionId, ecosystem],
    (txs) => [tx, ...(txs ?? [])],
  );
};

export const useWormholeToSolanaTransferMutation = () => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { chains, wormhole } = useConfig();
  const evmConnections = useEvmConnections();
  const solanaConnection = useSolanaConnection();
  const wallets = useWallets();
  const solanaWormhole = chains[Protocol.Solana][0].wormhole;

  return useMutation(async (transfer: WormholeToSolanaTransferState) => {
    const { token, value, fromEcosystem, interactionId } = transfer;

    const evmConnection = evmConnections[fromEcosystem];
    const evmWallet = wallets[fromEcosystem].wallet;
    if (!evmWallet) {
      throw new Error("No EVM wallet");
    }
    const solanaWallet = wallets[EcosystemId.Solana].wallet;
    if (!solanaWallet) {
      throw new Error("No Solana wallet");
    }
    const evmChain = findOrThrow(
      chains[Protocol.Evm],
      ({ ecosystem }) => ecosystem === fromEcosystem,
    );
    const tokenDetail = token.detailsByEcosystem.get(fromEcosystem);
    if (!tokenDetail) {
      throw new Error("No token detail");
    }
    const splTokenAccount = findOrThrow(
      splTokenAccounts,
      ({ mint }) => mint.toBase58() === getSolanaTokenDetails(token).address,
    );

    const { approvalResponses, transferResponse } = await lockEvmToken({
      interactionId: transfer.interactionId,
      token: token,
      amount: Amount.fromHuman(token, value),
      evmChain,
      evmConnection,
      fromTokenDetails: tokenDetail,
      evmWallet,
      splTokenAccountAddress: splTokenAccount.address.toBase58(),
      existingTxs: [],
    });

    const approvalTxs = await Promise.all(
      approvalResponses.map((txResponse) =>
        txResponseToTx(interactionId, fromEcosystem, evmConnection, txResponse),
      ),
    );
    approvalTxs.forEach((tx) => updateTxQueryCache(queryClient, env, tx));

    const transferTx = await txResponseToTx(
      interactionId,
      fromEcosystem,
      evmConnection,
      transferResponse,
    );
    updateTxQueryCache(queryClient, env, transferTx);

    const sequence = parseSequenceFromLogEth(
      transferTx.txReceipt,
      evmChain.wormhole.bridge,
    );

    const unlockSplTokenTxIdsGenerator = generateUnlockSplTokenTxIds(
      transfer.interactionId,
      wormhole.endpoint,
      ecosystems[fromEcosystem].wormholeChainId,
      getEmitterAddressEth(evmChain.wormhole.tokenBridge),
      sequence,
      solanaWormhole,
      solanaConnection,
      solanaWallet,
      Keypair.generate(),
    );
    for await (const txId of unlockSplTokenTxIdsGenerator) {
      const parsedTx = await solanaConnection.getParsedTx(txId);
      const tx: SolanaTx = {
        ecosystem: EcosystemId.Solana,
        txId,
        timestamp: parsedTx.blockTime ?? null,
        interactionId: transfer.interactionId,
        parsedTx: parsedTx,
      };
      updateTxQueryCache(queryClient, env, tx);
    }
  });
};

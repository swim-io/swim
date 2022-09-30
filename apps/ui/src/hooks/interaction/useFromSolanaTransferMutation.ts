import { getEmitterAddressSolana } from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import type { SolanaClient, TokenAccount } from "@swim-io/solana";
import {
  SOLANA_ECOSYSTEM_ID,
  findTokenAccountForMint,
  parseSequenceFromLogSolana,
} from "@swim-io/solana";
import { findOrThrow, isEachNotNull } from "@swim-io/utils";
import { WormholeChainId } from "@swim-io/wormhole";
import { useMutation } from "react-query";

import {
  ECOSYSTEMS,
  Protocol,
  getSolanaTokenDetails,
  getTokenDetailsForEcosystem,
  getWormholeRetries,
} from "../../config";
import type { Config } from "../../config";
import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import type { InteractionState, Tx } from "../../models";
import {
  Amount,
  formatWormholeAddress,
  getSignedVaaWithRetry,
  getToEcosystemOfFromSolanaTransfer,
  getTokensByPool,
  getTransferredAmounts,
  getWrappedTokenInfo,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient, useSplTokenAccountsQuery } from "../solana";

const getTransferredAmountsByTokenId = async (
  interactionState: InteractionState,
  txIds: readonly string[],
  solanaClient: SolanaClient,
  solanaWalletAddress: string,
  splTokenAccounts: readonly TokenAccount[],
  config: Config,
) => {
  const tokensByPoolId = getTokensByPool(config);
  const { interaction, solanaPoolOperations } = interactionState;
  const outputOperation = solanaPoolOperations[solanaPoolOperations.length - 1];
  const {
    operation: { poolId },
  } = outputOperation;
  const { tokens, lpToken } = tokensByPoolId[poolId];
  const txs: readonly Tx[] = await Promise.all(
    txIds.map(async (id) => {
      const parsedTx = await solanaClient.getParsedTx(id);
      return {
        id,
        ecosystemId: SOLANA_ECOSYSTEM_ID,
        timestamp: parsedTx.blockTime ?? null,
        interactionId: interaction.id,
        parsedTx,
      };
    }),
  );
  return getTransferredAmounts(
    solanaWalletAddress,
    splTokenAccounts,
    tokens,
    lpToken,
    txs,
  );
};

export const useFromSolanaTransferMutation = () => {
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const config = useEnvironment(selectConfig);
  const { chains, wormhole } = config;
  const getEvmClient = useGetEvmClient();
  const solanaClient = useSolanaClient();
  const wallets = useWallets();
  const solanaWormhole = chains[Protocol.Solana][0].wormhole;
  const updateInteractionState = useInteractionState(
    (state) => state.updateInteractionState,
  );
  const getInteractionState = useInteractionState(selectGetInteractionState);

  return useMutation(async (interactionId: string) => {
    const interactionState = getInteractionState(interactionId);
    const { interaction } = interactionState;
    const { fromSolanaTransfers } = interactionState;

    const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
    if (!solanaWallet) {
      throw new Error("No Solana wallet");
    }
    const solanaWalletAddress = solanaWallet.address ?? null;
    if (!solanaWalletAddress) {
      throw new Error("No Solana wallet address");
    }
    if (!wormhole) {
      throw new Error("No Wormhole RPC configured");
    }

    const poolOperationTxIds = interactionState.solanaPoolOperations.map(
      ({ txId }) => txId,
    );
    if (!isEachNotNull(poolOperationTxIds)) {
      throw new Error("Incomplete pool operations");
    }
    const transferredAmounts = await getTransferredAmountsByTokenId(
      interactionState,
      poolOperationTxIds,
      solanaClient,
      solanaWalletAddress,
      splTokenAccounts,
      config,
    );

    let transferSplTokenTxIds: readonly string[] = [];
    for (const [index, transfer] of fromSolanaTransfers.entries()) {
      const toEcosystem = getToEcosystemOfFromSolanaTransfer(
        transfer,
        interaction,
      );
      const { token, txIds } = transfer;
      // Transfer already completed, skip
      if (txIds.transferSplToken !== null) {
        transferSplTokenTxIds = [
          ...transferSplTokenTxIds,
          txIds.transferSplToken,
        ];
        continue;
      }

      const value =
        transfer.value ??
        transferredAmounts[transfer.token.id]?.toHuman(
          transfer.token.nativeEcosystemId,
        );
      if (!value) {
        throw new Error("Unknown transfer amount");
      }
      const amount = Amount.fromHuman(token, value);
      const evmEcosystem = ECOSYSTEMS[toEcosystem];
      const solanaTokenDetails = getSolanaTokenDetails(token);
      const evmWallet = wallets[toEcosystem].wallet;
      if (!evmWallet) {
        throw new Error("No EVM wallet");
      }
      const evmWalletAddress = evmWallet.address;
      if (evmWalletAddress === null) {
        throw new Error("No EVM wallet address");
      }
      const toTokenDetails = getTokenDetailsForEcosystem(token, toEcosystem);
      if (!toTokenDetails) {
        throw new Error("No token details");
      }
      const splTokenAccount = findTokenAccountForMint(
        solanaTokenDetails.address,
        solanaWalletAddress,
        splTokenAccounts,
      );
      if (splTokenAccount === null) {
        throw new Error("Missing SPL token account");
      }

      let transferSplTokenTxId = transfer.txIds.transferSplToken;
      if (transferSplTokenTxId === null) {
        // No existing tx
        const auxiliarySigner = Keypair.generate();
        transferSplTokenTxId = await solanaClient.initiateWormholeTransfer({
          atomicAmount: amount.toAtomicString(SOLANA_ECOSYSTEM_ID),
          interactionId,
          targetAddress: formatWormholeAddress(
            evmEcosystem.protocol,
            evmWalletAddress,
          ),
          targetChainId: evmEcosystem.wormholeChainId,
          tokenId: token.id,
          wallet: solanaWallet,
          auxiliarySigner,
          wrappedTokenInfo: getWrappedTokenInfo(token, SOLANA_ECOSYSTEM_ID),
        });
        // Update transfer state with txId
        updateInteractionState(interactionId, (draft) => {
          draft.fromSolanaTransfers[index].txIds.transferSplToken =
            transferSplTokenTxId;
        });
        transferSplTokenTxIds = [
          ...transferSplTokenTxIds,
          transferSplTokenTxId,
        ];
      }
    }

    for (const [index, transfer] of fromSolanaTransfers.entries()) {
      // Claim token completed, skip
      if (transfer.txIds.claimTokenOnEvm !== null) {
        continue;
      }
      const toEcosystem = getToEcosystemOfFromSolanaTransfer(
        transfer,
        interaction,
      );
      const transferSplTokenTxId = transferSplTokenTxIds[index];
      const evmWallet = wallets[toEcosystem].wallet;
      if (!evmWallet) {
        throw new Error("No EVM wallet");
      }
      const evmChain = findOrThrow(
        chains[Protocol.Evm],
        ({ ecosystem }) => ecosystem === toEcosystem,
      );
      const parsedTx = await solanaClient.getParsedTx(transferSplTokenTxId);
      const sequence = parseSequenceFromLogSolana(parsedTx);
      const emitterAddress = await getEmitterAddressSolana(
        solanaWormhole.portal,
      );
      const sourceChainId = WormholeChainId.Solana;
      const retries = getWormholeRetries(sourceChainId);
      const vaaBytesResponse = await getSignedVaaWithRetry(
        [...wormhole.rpcUrls],
        sourceChainId,
        emitterAddress,
        sequence,
        undefined,
        undefined,
        retries,
      );
      await evmWallet.switchNetwork(evmChain.chainId);
      const evmClient = getEvmClient(toEcosystem);
      const redeemResponse = await evmClient.completeWormholeTransfer({
        interactionId,
        vaa: vaaBytesResponse.vaaBytes,
        wallet: evmWallet,
      });
      if (redeemResponse === null) {
        throw new Error(
          `Transaction not found: (unlock/mint on ${evmChain.ecosystem})`,
        );
      }
      const evmReceipt = await evmClient.getTxReceiptOrThrow(redeemResponse);
      const claimTokenOnEvmTxId = evmReceipt.transactionHash;
      // Update transfer state with txId
      updateInteractionState(interactionId, (draft) => {
        draft.fromSolanaTransfers[index].txIds.claimTokenOnEvm =
          claimTokenOnEvmTxId;
      });
    }
  });
};

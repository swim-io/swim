import {
  getEmitterAddressSolana,
  getSignedVAAWithRetry,
} from "@certusone/wormhole-sdk";
import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type { Transaction } from "@solana/web3.js";
import { useMutation } from "react-query";

import type { Config } from "../../config";
import {
  ECOSYSTEMS,
  EcosystemId,
  Protocol,
  WormholeChainId,
  getSolanaTokenDetails,
} from "../../config";
import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import type { InteractionState, SolanaConnection, Tx } from "../../models";
import {
  Amount,
  evmAddressToWormhole,
  findTokenAccountForMint,
  getTokensByPool,
  getTransferredAmounts,
  parseSequenceFromLogSolana,
  redeemOnEth,
  transferFromSolana,
} from "../../models";
import { getToEcosystemOfFromSolanaTransfer } from "../../models/swim/transfer";
import { DEFAULT_WORMHOLE_RETRIES } from "../../models/wormhole/constants";
import { findOrThrow, isEachNotNull } from "../../utils";
import { useWallets } from "../crossEcosystem";
import { useEvmConnections } from "../evm";
import {
  useSolanaConnection,
  useSolanaWallet,
  useSplTokenAccountsQuery,
} from "../solana";

const getTransferredAmountsByTokenId = async (
  interactionState: InteractionState,
  txIds: readonly string[],
  solanaConnection: SolanaConnection,
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
    txIds.map(async (txId) => {
      const parsedTx = await solanaConnection.getParsedTx(txId);
      return {
        ecosystem: EcosystemId.Solana as const,
        txId,
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
  const evmConnections = useEvmConnections();
  const solanaConnection = useSolanaConnection();
  const wallets = useWallets();
  const { address: solanaWalletAddress } = useSolanaWallet();
  const solanaWormhole = chains[Protocol.Solana][0].wormhole;
  const updateInteractionState = useInteractionState(
    (state) => state.updateInteractionState,
  );
  const getInteractionState = useInteractionState(selectGetInteractionState);

  return useMutation(async (interactionId: string) => {
    const interactionState = getInteractionState(interactionId);
    const { interaction } = interactionState;
    const { fromSolanaTransfers } = interactionState;

    const solanaWallet = wallets[EcosystemId.Solana].wallet;
    if (!solanaWallet) {
      throw new Error("No Solana wallet");
    }
    if (!solanaWalletAddress) {
      throw new Error("No Solana wallet address");
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
      solanaConnection,
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
          transfer.token.nativeEcosystem,
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
      const evmChain = findOrThrow(
        chains[Protocol.Evm],
        ({ ecosystem }) => ecosystem === toEcosystem,
      );
      const tokenDetail = token.detailsByEcosystem.get(toEcosystem);
      if (!tokenDetail) {
        throw new Error("No token detail");
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
        const { tx, messageKeypair } = await transferFromSolana(
          interactionId,
          solanaConnection,
          solanaWormhole.bridge,
          solanaWormhole.tokenBridge,
          solanaWalletAddress,
          splTokenAccount.address.toBase58(),
          solanaTokenDetails.address,
          BigInt(amount.toAtomicString(EcosystemId.Solana)),
          evmAddressToWormhole(evmWalletAddress),
          evmEcosystem.wormholeChainId,
          token.nativeEcosystem === evmChain.ecosystem
            ? evmAddressToWormhole(
                token.detailsByEcosystem.get(evmChain.ecosystem)?.address ?? "",
              )
            : undefined,
          token.nativeEcosystem === evmChain.ecosystem
            ? evmEcosystem.wormholeChainId
            : undefined,
        );
        transferSplTokenTxId = await solanaConnection.sendAndConfirmTx(
          async (txToSign: Transaction) => {
            txToSign.partialSign(messageKeypair);
            return solanaWallet.signTransaction(txToSign);
          },
          tx,
        );
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
      const parsedTx = await solanaConnection.getParsedTx(transferSplTokenTxId);
      const sequence = parseSequenceFromLogSolana(parsedTx);
      const emitterAddress = await getEmitterAddressSolana(
        solanaWormhole.tokenBridge,
      );
      const vaaBytesResponse = await getSignedVAAWithRetry(
        [...wormhole.rpcUrls],
        WormholeChainId.Solana,
        emitterAddress,
        sequence,
        undefined,
        undefined,
        DEFAULT_WORMHOLE_RETRIES,
      );
      const evmSigner = evmWallet.signer;
      if (evmSigner === null) {
        throw new Error("Missing EVM signer");
      }
      await evmWallet.switchNetwork(evmChain.chainId);
      const redeemResponse = await redeemOnEth(
        interactionId,
        evmChain.wormhole.tokenBridge,
        evmSigner,
        vaaBytesResponse.vaaBytes,
      );
      if (redeemResponse === null) {
        throw new Error(
          `Transaction not found: (unlock/mint on ${evmChain.ecosystem})`,
        );
      }
      const evmReceipt = await evmConnections[toEcosystem].getTxReceiptOrThrow(
        redeemResponse,
      );
      const claimTokenOnEvmTxId = evmReceipt.transactionHash;
      // Update transfer state with txId
      updateInteractionState(interactionId, (draft) => {
        draft.fromSolanaTransfers[index].txIds.claimTokenOnEvm =
          claimTokenOnEvmTxId;
      });
    }
  });
};

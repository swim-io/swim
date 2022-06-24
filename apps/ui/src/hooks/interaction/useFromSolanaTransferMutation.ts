import {
  getEmitterAddressSolana,
  getSignedVAAWithRetry,
} from "@certusone/wormhole-sdk";
import type { Transaction } from "@solana/web3.js";
import { useMutation } from "react-query";

import {
  EcosystemId,
  Protocol,
  WormholeChainId,
  ecosystems,
  getSolanaTokenDetails,
  isEvmEcosystemId,
} from "../../config";
import { useEvmConnections, useSolanaConnection } from "../../contexts";
import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import {
  Amount,
  evmAddressToWormhole,
  findTokenAccountForMint,
  isFromSolanaTransferCompleted,
  parseSequenceFromLogSolana,
  redeemOnEth,
  transferFromSolana,
} from "../../models";
import { getToEcosystemOfFromSolanaTransfer } from "../../models/swim/transfer";
import { DEFAULT_WORMHOLE_RETRIES } from "../../models/wormhole/constants";
import { findOrThrow, getRecordKeys, groupBy } from "../../utils";
import { useWallets } from "../crossEcosystem";
import { useSolanaWallet, useSplTokenAccountsQuery } from "../solana";

export const useFromSolanaTransferMutation = () => {
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { chains, wormhole } = useEnvironment(selectConfig);
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

    const transfersByToEcosystem = groupBy(fromSolanaTransfers, (transfer) =>
      getToEcosystemOfFromSolanaTransfer(transfer, interaction),
    );

    for (const toEcosystem of getRecordKeys(transfersByToEcosystem)) {
      const transfers = transfersByToEcosystem[toEcosystem];
      await Promise.all(
        transfers.map(async (transfer) => {
          const index = fromSolanaTransfers.findIndex(
            (target) => target === transfer,
          );
          if (index === -1) {
            throw new Error("Invalid transfer index");
          }
          // Transfer already completed, skip
          if (isFromSolanaTransferCompleted(transfer)) {
            return;
          }
          const { token, value } = transfer;
          if (value === null) {
            throw new Error("Unknown transfer amount");
          }
          const amount = Amount.fromHuman(token, value);
          const evmEcosystem = ecosystems[toEcosystem];
          const solanaTokenDetails = getSolanaTokenDetails(token);
          if (!isEvmEcosystemId(toEcosystem)) {
            throw new Error("Invalid toEcosystem");
          }
          const evmWallet = wallets[toEcosystem].wallet;
          if (!evmWallet) {
            throw new Error("No EVM wallet");
          }
          const evmWalletAddress = evmWallet.address;
          if (evmWalletAddress === null) {
            throw new Error("No EVM wallet address");
          }
          const solanaWallet = wallets[EcosystemId.Solana].wallet;
          if (!solanaWallet) {
            throw new Error("No Solana wallet");
          }
          if (!solanaWalletAddress) {
            throw new Error("No Solana wallet address");
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
                    token.detailsByEcosystem.get(evmChain.ecosystem)?.address ??
                      "",
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
          }

          const parsedTx = await solanaConnection.getParsedTx(
            transferSplTokenTxId,
          );
          const sequence = parseSequenceFromLogSolana(parsedTx);
          const emitterAddress = await getEmitterAddressSolana(
            solanaWormhole.tokenBridge,
          );
          const vaaBytesResponse = await getSignedVAAWithRetry(
            [wormhole.endpoint],
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
          const evmReceipt = await evmConnections[
            toEcosystem
          ].getTxReceiptOrThrow(redeemResponse);
          const claimTokenOnEvmTxId = evmReceipt.transactionHash;
          // Update transfer state with txId
          updateInteractionState(interactionId, (draft) => {
            draft.fromSolanaTransfers[index].txIds.claimTokenOnEvm =
              claimTokenOnEvmTxId;
          });
        }),
      );
    }
  });
};

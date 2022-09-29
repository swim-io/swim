import { getEmitterAddressSolana } from "@certusone/wormhole-sdk";
import type { Transaction } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { evmAddressToWormhole } from "@swim-io/evm";
import type { SolanaConnection, TokenAccount } from "@swim-io/solana";
import {
  SOLANA_ECOSYSTEM_ID,
  createTransferFromSolanaTx,
  findTokenAccountForMint,
  parseSequenceFromLogSolana,
} from "@swim-io/solana";
import { findOrThrow, isEachNotNull } from "@swim-io/utils";
import { WormholeChainId } from "@swim-io/wormhole";
import { useMutation } from "react-query";

import type { Config } from "../../config";
import {
  ECOSYSTEMS,
  Protocol,
  getSolanaTokenDetails,
  getTokenDetailsForEcosystem,
  getWormholeRetries,
} from "../../config";
import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import type { InteractionState, Tx } from "../../models";
import {
  Amount,
  getSignedVaaWithRetry,
  getToEcosystemOfFromSolanaTransfer,
  getTokensByPool,
  getTransferredAmounts,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmConnection } from "../evm";
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
    txIds.map(async (id) => {
      const parsedTx = await solanaConnection.getParsedTx(id);
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
  const getEvmConnection = useGetEvmConnection();
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

    const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
    if (!solanaWallet) {
      throw new Error("No Solana wallet");
    }
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
      const evmChain = findOrThrow(
        chains[Protocol.Evm],
        ({ ecosystem }) => ecosystem === toEcosystem,
      );
      const tokenDetails = getTokenDetailsForEcosystem(token, toEcosystem);
      if (!tokenDetails) {
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
        const messageKeypair = Keypair.generate();
        const tx = await createTransferFromSolanaTx({
          interactionId,
          solanaConnection,
          bridgeAddress: solanaWormhole.bridge,
          portalAddress: solanaWormhole.portal,
          payerAddress: solanaWalletAddress,
          auxiliarySignerAddress: messageKeypair.publicKey.toString(),
          fromAddress: splTokenAccount.address.toBase58(),
          mintAddress: solanaTokenDetails.address,
          amount: BigInt(amount.toAtomicString(SOLANA_ECOSYSTEM_ID)),
          targetAddress: evmAddressToWormhole(evmWalletAddress),
          targetChain: evmEcosystem.wormholeChainId,
          originAddress:
            token.nativeEcosystemId === evmChain.ecosystem
              ? evmAddressToWormhole(
                  getTokenDetailsForEcosystem(token, evmChain.ecosystem)
                    ?.address ?? "",
                )
              : undefined,
          originChain:
            token.nativeEcosystemId === evmChain.ecosystem
              ? evmEcosystem.wormholeChainId
              : undefined,
        });
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
      const evmSigner = evmWallet.signer;
      if (evmSigner === null) {
        throw new Error("Missing EVM signer");
      }
      await evmWallet.switchNetwork(evmChain.chainId);
      const evmConnection = getEvmConnection(toEcosystem);
      const redeemResponse = await evmConnection.redeemOnEth({
        interactionId,
        signer: evmSigner,
        signedVaa: vaaBytesResponse.vaaBytes,
      });
      if (redeemResponse === null) {
        throw new Error(
          `Transaction not found: (unlock/mint on ${evmChain.ecosystem})`,
        );
      }
      const evmReceipt = await evmConnection.getTxReceiptOrThrow(
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

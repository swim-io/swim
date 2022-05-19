import {
  EcosystemId,
  Protocol,
  getSolanaTokenDetails,
  isEvmEcosystemId,
} from "../../config";
import { useConfig } from "../../contexts";
import {
  InteractionType,
  findTokenAccountForMint,
  isEvmTx,
  isRedeemOnSolanaTx,
  isSolanaTx,
} from "../../models";
import { findOrThrow } from "../../utils";
import { useSplTokenAccountsQuery } from "../solana";

import { useInteraction } from "./useInteraction";
import type { WormholeToSolanaTransferState } from "./useInteractionState";
import { useTxsForInteractionQuery } from "./useTxsForInteractionQuery";

export const useWormholeToSolanaTransfersState = (
  interactionId: string,
): readonly WormholeToSolanaTransferState[] => {
  const config = useConfig();
  const interaction = useInteraction(interactionId);
  const solanaAddress = interaction.connectedWallets[EcosystemId.Solana];
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { data: txs = [] } = useTxsForInteractionQuery(interactionId);

  if (!solanaAddress) {
    throw Error("Solana address not found");
  }

  // Only for swap at the moment
  if (interaction.type !== InteractionType.Swap) {
    return [];
  }

  const {
    params: { exactInputAmount },
  } = interaction;
  const fromToken = exactInputAmount.tokenSpec;
  const solanaTxs = txs.filter(isSolanaTx);
  const { chains } = config;
  const solanaChainSpec = chains[Protocol.Solana][0];
  const solanaWormhole = solanaChainSpec.wormhole;

  // No WormholeToSolana if fromToken is not Evm
  const fromEcosystem = isEvmEcosystemId(fromToken.nativeEcosystem)
    ? fromToken.nativeEcosystem
    : null;
  if (!fromEcosystem) {
    return [];
  }

  const evmTxs = txs.filter(isEvmTx);
  // Find existing match tx
  const sourceChainSpec = findOrThrow(
    chains[Protocol.Evm],
    (chain) => chain.ecosystem === fromEcosystem,
  );
  const approveAndTransferToken = evmTxs.filter(
    (tx) =>
      tx.txResponse.to?.toLowerCase() ===
        sourceChainSpec.wormhole.tokenBridge.toLowerCase() && // "wormholeChainSpec.tokenBridge.toLowerCase()" &&
      tx.txReceipt.logs.some(
        (log) =>
          log.address.toLowerCase() ===
          fromToken.detailsByEcosystem.get(tx.ecosystem)?.address,
      ),
  );

  const solanaTokenDetails = getSolanaTokenDetails(fromToken);
  const splTokenAccount = findTokenAccountForMint(
    solanaTokenDetails.address,
    solanaAddress,
    splTokenAccounts,
  );
  const splTokenAccountAddress = splTokenAccount?.address.toBase58();
  const claimTokenOnSolana =
    splTokenAccountAddress &&
    solanaTxs.find((tx) =>
      isRedeemOnSolanaTx(solanaWormhole, fromToken, splTokenAccountAddress, tx),
    );

  return [
    {
      id: `${interaction.id}_${fromToken.nativeEcosystem}_${fromToken.symbol}_toSolana`,
      interactionId: interaction.id,
      token: fromToken,
      value: exactInputAmount.value,
      fromEcosystem: fromEcosystem,
      txs: {
        approveAndTransferToken,
        postVaaOnSolana: null,
        claimTokenOnSolana: claimTokenOnSolana || null,
      },
    },
  ];
};

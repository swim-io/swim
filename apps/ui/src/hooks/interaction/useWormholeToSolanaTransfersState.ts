import type { ChainsByProtocol, TokenSpec } from "../../config";
import {
  Protocol,
  getSolanaTokenDetails,
  isEvmEcosystemId,
} from "../../config";
import { useConfig } from "../../contexts";
import type { EvmTx, SolanaTx, Tx } from "../../models";
import {
  InteractionType,
  isEvmTx,
  isPostVaaSolanaTx,
  isRedeemOnSolanaTx,
  isSolanaTx,
} from "../../models";

import { useInteraction } from "./useInteraction";
import type {
  PrepareSplTokenAccountsState,
  WormholeToSolanaTransferState,
} from "./useInteractionState";
import { usePrepareSplTokenAccountsState } from "./usePrepareSplTokenAccountsState";
import { useTxsForInteractionQuery } from "./useTxsForInteractionQuery";

const findApproveAndTransferTokenTxs = (
  txs: readonly Tx[] | null,
  fromToken: TokenSpec,
  chainsConfig: ChainsByProtocol,
): readonly EvmTx[] | null => {
  if (txs === null) {
    return null;
  }
  const sourceChainSpec = chainsConfig[Protocol.Evm].find(
    ({ ecosystem }) => ecosystem === fromToken.nativeEcosystem,
  );
  if (!sourceChainSpec) {
    return null;
  }
  const fromTokenAddress = fromToken.detailsByEcosystem.get(
    fromToken.nativeEcosystem,
  )?.address;
  if (!fromTokenAddress) {
    return null;
  }
  const approveAndTransferTokenTxs = txs
    .filter(isEvmTx)
    .filter((tx) => tx.ecosystem === fromToken.nativeEcosystem)
    .filter(
      ({ txResponse, txReceipt }) =>
        txResponse.to?.toLowerCase() ===
          sourceChainSpec.wormhole.tokenBridge.toLowerCase() &&
        txReceipt.logs.some(
          (log) => log.address.toLowerCase() === fromTokenAddress,
        ),
    );
  return approveAndTransferTokenTxs;
};

const findClaimTokenOnSolana = (
  txs: readonly Tx[] | null,
  fromToken: TokenSpec,
  chainsConfig: ChainsByProtocol,
  splTokenAccountsState: PrepareSplTokenAccountsState,
): SolanaTx | null => {
  if (txs === null) {
    return null;
  }
  const solanaMint = getSolanaTokenDetails(fromToken).address;
  const solanaWormhole = chainsConfig[Protocol.Solana][0].wormhole;
  const splTokenAccount = splTokenAccountsState[solanaMint];
  if (splTokenAccount === null) {
    return null;
  }
  const splTokenAccountAddress = splTokenAccount.address.toBase58();
  const claimTokenOnSolanaTx = txs
    .filter(isSolanaTx)
    .find((tx) =>
      isRedeemOnSolanaTx(solanaWormhole, fromToken, splTokenAccountAddress, tx),
    );
  return claimTokenOnSolanaTx ?? null;
};

const findPostVaaOnSolanaTxs = (
  txs: readonly Tx[] | null,
  chainsConfig: ChainsByProtocol,
): SolanaTx | null => {
  if (txs === null) {
    return null;
  }
  const solanaWormhole = chainsConfig[Protocol.Solana][0].wormhole;
  const claimTokenOnSolanaTx = txs
    .filter(isSolanaTx)
    .find((tx) => isPostVaaSolanaTx(solanaWormhole, null, tx));
  return claimTokenOnSolanaTx ?? null;
};

export const useWormholeToSolanaTransfersState = (
  interactionId: string,
): readonly WormholeToSolanaTransferState[] => {
  const config = useConfig();
  const interaction = useInteraction(interactionId);
  const splTokenAccountsState = usePrepareSplTokenAccountsState(interactionId);
  const { data: txs = null } = useTxsForInteractionQuery(interactionId);

  // Only for swap at the moment
  if (interaction.type !== InteractionType.Swap) {
    return [];
  }

  const {
    params: { exactInputAmount },
  } = interaction;
  const fromToken = exactInputAmount.tokenSpec;
  const { chains } = config;

  // No WormholeToSolana if fromToken is not Evm
  const fromEcosystem = isEvmEcosystemId(fromToken.nativeEcosystem)
    ? fromToken.nativeEcosystem
    : null;
  if (!fromEcosystem) {
    return [];
  }
  return [
    {
      interactionId: interaction.id,
      token: fromToken,
      value: exactInputAmount.value,
      txs: {
        approveAndTransferToken: findApproveAndTransferTokenTxs(
          txs,
          fromToken,
          chains,
        ),
        postVaaOnSolana: null,
        claimTokenOnSolana: findClaimTokenOnSolana(
          txs,
          fromToken,
          chains,
          splTokenAccountsState,
        ),
      },
    },
  ];
};

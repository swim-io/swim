import type { ChainsByProtocol, TokenSpec } from "../../config";
import { EcosystemId, Protocol, getSolanaTokenDetails } from "../../config";
import { useConfig } from "../../contexts";
import type { EvmTx, SolanaTx, SwapInteraction, Tx } from "../../models";
import {
  InteractionType,
  isEvmTx,
  isLockSplTx,
  isSolanaTx,
  isUnlockEvmTx,
} from "../../models";

import { useInteraction } from "./useInteraction";
import type {
  PrepareSplTokenAccountsState,
  WormholeFromSolanaTransferState,
} from "./useInteractionState";
import { usePrepareSplTokenAccountsState } from "./usePrepareSplTokenAccountsState";
import { useTxsForInteractionQuery } from "./useTxsForInteractionQuery";

const findTransferSplTokenTx = (
  txs: readonly Tx[] | null,
  toToken: TokenSpec,
  chainsConfig: ChainsByProtocol,
  splTokenAccountsState: PrepareSplTokenAccountsState,
): SolanaTx | null => {
  if (txs === null) {
    return null;
  }
  const solanaMint = getSolanaTokenDetails(toToken).address;
  const solanaWormhole = chainsConfig[Protocol.Solana][0].wormhole;
  const splTokenAccount = splTokenAccountsState[solanaMint];
  if (splTokenAccount === null) {
    return null;
  }
  const splTokenAccountAddress = splTokenAccount.address.toBase58();
  const transferSplTokenTx = txs
    .filter(isSolanaTx)
    .find((tx) =>
      isLockSplTx(solanaWormhole, splTokenAccountAddress, toToken, tx),
    );
  return transferSplTokenTx ?? null;
};

const findClaimTokenOnEvmTx = (
  txs: readonly Tx[] | null,
  toToken: TokenSpec,
  chainsConfig: ChainsByProtocol,
): EvmTx | null => {
  if (txs === null) {
    return null;
  }
  const destinationChainSpec = chainsConfig[Protocol.Evm].find(
    ({ ecosystem }) => ecosystem === toToken.nativeEcosystem,
  );
  if (!destinationChainSpec) {
    return null;
  }
  const claimTokenOnEvmTx = txs
    .filter(isEvmTx)
    .filter((tx) => tx.ecosystem === toToken.nativeEcosystem)
    .find((tx) => isUnlockEvmTx(destinationChainSpec.wormhole, toToken, tx));
  return claimTokenOnEvmTx ?? null;
};

const generateTransferForSwapInteraction = (
  interaction: SwapInteraction,
  txs: readonly Tx[] | null,
  splTokenAccountsState: PrepareSplTokenAccountsState,
  chainsConfig: ChainsByProtocol,
): readonly WormholeFromSolanaTransferState[] => {
  const {
    params: { minimumOutputAmount },
  } = interaction;
  const toToken = minimumOutputAmount.tokenSpec;
  // No WormholeFromSolana if toToken is Solana
  if (toToken.nativeEcosystem === EcosystemId.Solana) {
    return [];
  }
  return [
    {
      token: toToken,
      value: null,
      txs: {
        transferSplToken: findTransferSplTokenTx(
          txs,
          toToken,
          chainsConfig,
          splTokenAccountsState,
        ),
        claimTokenOnEvm: findClaimTokenOnEvmTx(txs, toToken, chainsConfig),
      },
    },
  ];
};

export const useWormholeFromSolanaTransfersState = (
  interactionId: string,
): readonly WormholeFromSolanaTransferState[] => {
  const { chains } = useConfig();
  const interaction = useInteraction(interactionId);
  const splTokenAccountsState = usePrepareSplTokenAccountsState(interactionId);
  const { data: txs = null } = useTxsForInteractionQuery(interactionId);
  switch (interaction.type) {
    case InteractionType.Swap:
      return generateTransferForSwapInteraction(
        interaction,
        txs,
        splTokenAccountsState,
        chains,
      );
    default:
      return [];
  }
};

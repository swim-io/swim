import { CHAIN_ID_SOLANA, isEVMChain } from "@certusone/wormhole-sdk";
import { useMutation } from "react-query";

import type { WormholeTransfer } from "../../models";

import { useTransferEvmToEvmMutation } from "./useTransferEvmToEvmMutation";
import { useTransferEvmToSolanaMutation } from "./useTransferEvmToSolanaMutation";
import { useTransferSolanaToEvmMutation } from "./useTransferSolanaToEvmMutation";

export const useWormholeTransfer = () => {
  const { mutateAsync: transferEvmToEvm } = useTransferEvmToEvmMutation();
  const { mutateAsync: transferEvmToSolana } = useTransferEvmToSolanaMutation();
  const { mutateAsync: transferSolanaToEvm } = useTransferSolanaToEvmMutation();

  return useMutation(async (transfer: WormholeTransfer) => {
    const {
      sourceDetails: { chainId: sourceChainId },
      targetDetails: { chainId: targetChainId },
    } = transfer;
    if (sourceChainId === targetChainId) {
      throw new Error("Source and target chains are the same");
    }

    if (sourceChainId === CHAIN_ID_SOLANA) {
      if (isEVMChain(targetChainId)) {
        return await transferSolanaToEvm(transfer);
      }
      throw new Error(`Transfer from Solana to ${targetChainId} not supported`);
    }
    if (isEVMChain(sourceChainId)) {
      if (targetChainId === CHAIN_ID_SOLANA) {
        return await transferEvmToSolana(transfer);
      }
      if (isEVMChain(targetChainId)) {
        return await transferEvmToEvm(transfer);
      }
      throw new Error(
        `Transfer from ${sourceChainId} to ${targetChainId} not supported`,
      );
    }
  });
};

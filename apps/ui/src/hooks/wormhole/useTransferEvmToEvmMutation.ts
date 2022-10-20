import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { isEvmEcosystemId } from "@swim-io/evm";
import { findOrThrow, humanToAtomic } from "@swim-io/utils";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { ECOSYSTEM_LIST, Protocol, getWormholeRetries } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { WormholeTransfer } from "../../models";
import {
  formatWormholeAddress,
  getSignedVaaWithRetry,
  getWrappedTokenInfoFromNativeDetails,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";

export const useTransferEvmToEvmMutation = () => {
  const { chains, wormhole } = useEnvironment(selectConfig, shallow);
  const getEvmClient = useGetEvmClient();
  const wallets = useWallets();

  return useMutation(
    async ({
      interactionId,
      value,
      sourceDetails,
      targetDetails,
      nativeDetails,
      onTxResult,
    }: WormholeTransfer) => {
      if (!wormhole) {
        throw new Error("No Wormhole RPC configured");
      }

      const [sourceEcosystem, targetEcosystem] = [
        sourceDetails.chainId,
        targetDetails.chainId,
      ].map((chainId) =>
        findOrThrow(
          ECOSYSTEM_LIST,
          (ecosystem) => ecosystem.wormholeChainId === chainId,
        ),
      );
      const sourceEcosystemId = sourceEcosystem.id;
      if (!isEvmEcosystemId(sourceEcosystemId)) {
        throw new Error("Invalid source chain");
      }
      const targetEcosystemId = targetEcosystem.id;
      if (!isEvmEcosystemId(targetEcosystemId)) {
        throw new Error("Invalid target chain");
      }
      const sourceChain = findOrThrow(
        chains[Protocol.Evm],
        (chain) => chain.ecosystem === sourceEcosystemId,
      );
      const targetChain = findOrThrow(
        chains[Protocol.Evm],
        (chain) => chain.ecosystem === targetEcosystemId,
      );

      const evmWallet = wallets[sourceEcosystemId].wallet;
      if (evmWallet === null) {
        throw new Error("Missing EVM wallet");
      }
      const evmWalletAddress = evmWallet.address;
      if (evmWalletAddress === null) {
        throw new Error("Missing EVM wallet address");
      }

      const sourceClient = getEvmClient(sourceEcosystemId);
      const targetClient = getEvmClient(targetEcosystemId);

      await evmWallet.switchNetwork(sourceChain.chainId);
      // Process transfer if transfer txId does not exist
      const { approvalResponses, transferResponse } =
        await sourceClient.initiateWormholeTransfer({
          atomicAmount: humanToAtomic(value, sourceDetails.decimals).toString(),
          interactionId,
          sourceAddress: sourceDetails.address,
          targetAddress: formatWormholeAddress(Protocol.Evm, evmWalletAddress),
          targetChainId: targetDetails.chainId,
          wallet: evmWallet,
          wrappedTokenInfo: getWrappedTokenInfoFromNativeDetails(
            sourceDetails.chainId,
            nativeDetails,
          ),
        });

      approvalResponses.forEach((response) =>
        onTxResult({
          chainId: sourceDetails.chainId,
          txId: response.hash,
        }),
      );

      const transferTx = await sourceClient.getTx(transferResponse);
      onTxResult({
        chainId: sourceDetails.chainId,
        txId: transferTx.id,
      });
      const sequence = parseSequenceFromLogEth(
        transferTx.receipt,
        sourceChain.wormhole.bridge,
      );
      const retries = getWormholeRetries(sourceDetails.chainId);
      const { vaaBytes: vaa } = await getSignedVaaWithRetry(
        [...wormhole.rpcUrls],
        sourceDetails.chainId,
        getEmitterAddressEth(sourceChain.wormhole.portal),
        sequence,
        undefined,
        undefined,
        retries,
      );

      await evmWallet.switchNetwork(targetChain.chainId);
      const redeemResponse = await targetClient.completeWormholeTransfer({
        interactionId,
        vaa,
        wallet: evmWallet,
      });
      if (redeemResponse === null) {
        throw new Error(
          `Transaction not found: (unlock/mint on ${targetEcosystemId})`,
        );
      }
      const redeemTx = await targetClient.getTx(redeemResponse);
      onTxResult({
        chainId: targetDetails.chainId,
        txId: redeemTx.id,
      });
    },
  );
};

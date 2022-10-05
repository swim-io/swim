import { getEmitterAddressEth } from "@certusone/wormhole-sdk";
import { evmAddressToWormhole, isEvmEcosystemId } from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import { findOrThrow } from "@swim-io/utils";
import type { BigNumber } from "ethers";
import { ethers } from "ethers";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import {
  ECOSYSTEMS,
  Protocol,
  getTokenDetailsForEcosystem,
  getWormholeRetries,
} from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type { CrossChainEvmToEvmSwapInteractionState } from "../../models";
import {
  InteractionType,
  SwapType,
  humanDecimalToAtomicString,
} from "../../models";
import { getSignedVaaWithRetry } from "../../models/wormhole/guardiansRpc";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";

export const useCrossChainEvmToEvmSwapInteractionMutation = () => {
  const { updateInteractionState } = useInteractionStateV2();
  const wallets = useWallets();
  const getEvmClient = useGetEvmClient();
  const { chains, evmRoutingContract, ecosystems, wormhole } = useEnvironment(
    selectConfig,
    shallow,
  );
  return useMutation(
    async (interactionState: CrossChainEvmToEvmSwapInteractionState) => {
      if (!wormhole) {
        throw new Error("No Wormhole RPC configured");
      }
      const { interaction } = interactionState;
      const { fromTokenData, toTokenData } = interaction.params;
      const fromEcosystem = fromTokenData.ecosystemId;
      const toEcosystem = toTokenData.ecosystemId;
      if (!isEvmEcosystemId(fromEcosystem) || !isEvmEcosystemId(toEcosystem)) {
        throw new Error("Expect EVM ecosystem id");
      }
      const wallet = wallets[fromEcosystem].wallet;
      if (
        wallet === null ||
        wallet.address === null ||
        wallet.signer === null
      ) {
        throw new Error(`${fromEcosystem} wallet not found`);
      }
      const fromTokenSpec = fromTokenData.tokenConfig;
      const toTokenSpec = toTokenData.tokenConfig;
      const fromChainSpec = findOrThrow(
        chains[Protocol.Evm],
        (chain) => chain.ecosystem === fromEcosystem,
      );
      const toChainSpec = findOrThrow(
        chains[Protocol.Evm],
        (chain) => chain.ecosystem === toEcosystem,
      );
      const fromTokenDetails = getTokenDetailsForEcosystem(
        fromTokenSpec,
        fromEcosystem,
      );
      const toTokenDetails = getTokenDetailsForEcosystem(
        toTokenSpec,
        toEcosystem,
      );
      if (fromTokenDetails === null || toTokenDetails === null) {
        throw new Error("Missing token details");
      }
      const fromEvmClient = getEvmClient(fromEcosystem);
      const fromRouting = Routing__factory.connect(
        evmRoutingContract,
        fromEvmClient.provider,
      );
      const memo = `0x${interaction.id}`;
      let swapAndTransferTxId = interactionState.swapAndTransferTxId;
      if (swapAndTransferTxId === null) {
        const atomicAmount = humanDecimalToAtomicString(
          fromTokenData.value,
          fromTokenData.tokenConfig,
          fromTokenData.ecosystemId,
        );
        const approvalResponses = await fromEvmClient.approveTokenAmount({
          atomicAmount,
          mintAddress: fromTokenDetails.address,
          wallet,
          spenderAddress: evmRoutingContract,
        });
        const approvalTxs = await Promise.all(
          approvalResponses.map((response) =>
            fromEvmClient.getTxReceiptOrThrow(response),
          ),
        );
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.CrossChainEvmToEvm
          ) {
            throw new Error("Interaction type mismatch");
          }
          draft.approvalTxIds = approvalTxs.map((tx) => tx.transactionHash);
        });
        const crossChainInitiateRequest = await fromRouting.populateTransaction[
          "crossChainInitiate(address,uint256,uint256,uint16,bytes32,bytes16)"
        ](
          fromTokenDetails.address,
          humanDecimalToAtomicString(
            fromTokenData.value,
            fromTokenSpec,
            fromEcosystem,
          ),
          "0", // firstMinimumOutputAmount
          ecosystems[toEcosystem].wormholeChainId,
          evmAddressToWormhole(wallet.address), // toOwner
          memo,
        );
        const crossChainInitiateResponse = await wallet.signer.sendTransaction(
          crossChainInitiateRequest,
        );
        const crossChainInitiateReceipt =
          await fromEvmClient.getTxReceiptOrThrow(crossChainInitiateResponse);
        swapAndTransferTxId = crossChainInitiateReceipt.transactionHash;
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.CrossChainEvmToEvm
          ) {
            throw new Error("Interaction type mismatch");
          }
          draft.swapAndTransferTxId = crossChainInitiateReceipt.transactionHash;
        });
      }
      const swapAndTransferResponse =
        await fromEvmClient.provider.getTransaction(swapAndTransferTxId);
      let event = null;
      while (!event) {
        const events = await fromRouting.queryFilter(
          fromRouting.filters["MemoInteraction(bytes16)"](memo),
          swapAndTransferResponse.blockHash,
        );
        event = events.find(
          ({ topics }) =>
            topics[topics.length - 1] === `${memo}${"00".repeat(16)}`,
        );
      }
      const swimInteractionData = fromRouting.interface.decodeEventLog(
        fromRouting.interface.events["MemoInteraction(bytes16)"],
        event.data,
      ) as unknown as {
        readonly results: string;
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_swimUsdAmount, wormholeSequence] =
        ethers.utils.defaultAbiCoder.decode(
          ["uint256", "uint64"],
          swimInteractionData.results,
        ) as readonly [BigNumber, BigNumber];
      const { wormholeChainId: emitterChainId } = ECOSYSTEMS[fromEcosystem];
      const retries = getWormholeRetries(emitterChainId);
      const vaaBytesResponse = await getSignedVaaWithRetry(
        [...wormhole.rpcUrls],
        ecosystems[fromEcosystem].wormholeChainId,
        getEmitterAddressEth(fromChainSpec.wormhole.portal),
        wormholeSequence.toString(),
        undefined,
        undefined,
        retries,
      );
      await wallet.switchNetwork(toChainSpec.chainId);
      const toEvmClient = getEvmClient(toEcosystem);
      const toRouting = Routing__factory.connect(
        evmRoutingContract,
        toEvmClient.provider,
      );
      const crossChainInRequest = await toRouting.populateTransaction[
        "crossChainComplete(bytes,address,uint256,bytes16)"
      ](vaaBytesResponse.vaaBytes, toTokenDetails.address, "0", memo);
      const crossChainInResponse = await wallet.signer.sendTransaction(
        crossChainInRequest,
      );
      const crossChainInReceipt = await toEvmClient.getTxReceiptOrThrow(
        crossChainInResponse,
      );
      updateInteractionState(interaction.id, (draft) => {
        if (
          draft.interactionType !== InteractionType.SwapV2 ||
          draft.swapType !== SwapType.CrossChainEvmToEvm
        ) {
          throw new Error("Interaction type mismatch");
        }
        draft.receiveAndSwapTxId = crossChainInReceipt.transactionHash;
      });
    },
  );
};

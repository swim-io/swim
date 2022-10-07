import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import {
  EVM_ECOSYSTEMS,
  evmAddressToWormhole,
  isEvmEcosystemId,
} from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import {
  ECOSYSTEMS,
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
import { useSwimUsd } from "../swim";

export const useCrossChainEvmToEvmSwapInteractionMutation = () => {
  const { updateInteractionState } = useInteractionStateV2();
  const wallets = useWallets();
  const getEvmClient = useGetEvmClient();
  const { env } = useEnvironment();
  const { ecosystems, wormhole } = useEnvironment(selectConfig, shallow);
  const swimUsd = useSwimUsd();
  return useMutation(
    async (interactionState: CrossChainEvmToEvmSwapInteractionState) => {
      if (!wormhole) {
        throw new Error("No Wormhole RPC configured");
      }
      if (swimUsd === null) {
        throw new Error("SwimUsd not found");
      }
      const { interaction } = interactionState;
      const { fromTokenData, toTokenData, firstMinimumOutputAmount } =
        interaction.params;
      if (firstMinimumOutputAmount === null) {
        throw new Error("Missing first minimum output amount");
      }
      const fromEcosystem = fromTokenData.ecosystemId;
      const toEcosystem = toTokenData.ecosystemId;
      if (
        !isEvmEcosystemId(fromEcosystem) ||
        !isEvmEcosystemId(toEcosystem) ||
        fromEcosystem === toEcosystem
      ) {
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
      const fromChainConfig = EVM_ECOSYSTEMS[fromEcosystem].chains[env] ?? null;
      if (fromChainConfig === null) {
        throw new Error(`${fromEcosystem} chain config not found`);
      }
      const toChainConfig = EVM_ECOSYSTEMS[toEcosystem].chains[env] ?? null;
      if (toChainConfig === null) {
        throw new Error(`${toEcosystem} chain config not found`);
      }
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
        fromChainConfig.routingContractAddress,
        fromEvmClient.provider,
      );
      const memo = `0x${interaction.id}`;
      let { crossChainInitiateTxId } = interactionState;
      if (crossChainInitiateTxId === null) {
        const atomicAmount = humanDecimalToAtomicString(
          fromTokenData.value,
          fromTokenData.tokenConfig,
          fromTokenData.ecosystemId,
        );
        const approvalResponses = await fromEvmClient.approveTokenAmount({
          atomicAmount,
          mintAddress: fromTokenDetails.address,
          wallet,
          spenderAddress: fromChainConfig.routingContractAddress,
        });
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.CrossChainEvmToEvm
          ) {
            throw new Error("Interaction type mismatch");
          }
          draft.approvalTxIds = approvalResponses.map(({ hash }) => hash);
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
          humanDecimalToAtomicString(
            firstMinimumOutputAmount,
            swimUsd,
            toEcosystem,
          ),
          ecosystems[toEcosystem].wormholeChainId,
          evmAddressToWormhole(wallet.address), // toOwner
          memo,
        );
        const crossChainInitiateResponse = await wallet.signer.sendTransaction(
          crossChainInitiateRequest,
        );
        crossChainInitiateTxId = crossChainInitiateResponse.hash;
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.CrossChainEvmToEvm
          ) {
            throw new Error("Interaction type mismatch");
          }
          draft.crossChainInitiateTxId = crossChainInitiateResponse.hash;
        });
      }
      const crossChainInitiateResponse =
        await fromEvmClient.provider.getTransaction(crossChainInitiateTxId);
      const crossChainInitiateReceipt = await fromEvmClient.getTxReceiptOrThrow(
        crossChainInitiateResponse,
      );
      const wormholeSequence = parseSequenceFromLogEth(
        crossChainInitiateReceipt,
        fromChainConfig.wormhole.bridge,
      );
      const { wormholeChainId: emitterChainId } = ECOSYSTEMS[fromEcosystem];
      const retries = getWormholeRetries(emitterChainId);
      const vaaBytesResponse = await getSignedVaaWithRetry(
        [...wormhole.rpcUrls],
        ecosystems[fromEcosystem].wormholeChainId,
        getEmitterAddressEth(fromChainConfig.wormhole.portal),
        wormholeSequence.toString(),
        undefined,
        undefined,
        retries,
      );
      await wallet.switchNetwork(toChainConfig.chainId);
      const toEvmClient = getEvmClient(toEcosystem);
      const toRouting = Routing__factory.connect(
        toChainConfig.routingContractAddress,
        toEvmClient.provider,
      );
      const crossChainCompleteRequest = await toRouting.populateTransaction[
        "crossChainComplete(bytes,address,uint256,bytes16)"
      ](
        vaaBytesResponse.vaaBytes,
        toTokenDetails.address,
        humanDecimalToAtomicString(
          toTokenData.value,
          toTokenSpec,
          toTokenData.ecosystemId,
        ),
        memo,
      );
      const crossChainCompleteResponse = await wallet.signer.sendTransaction(
        crossChainCompleteRequest,
      );
      updateInteractionState(interaction.id, (draft) => {
        if (
          draft.interactionType !== InteractionType.SwapV2 ||
          draft.swapType !== SwapType.CrossChainEvmToEvm
        ) {
          throw new Error("Interaction type mismatch");
        }
        draft.crossChainCompleteTxId = crossChainCompleteResponse.hash;
      });
    },
  );
};

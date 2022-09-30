import { isEvmEcosystemId } from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { getTokenDetailsForEcosystem } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type { SingleChainEvmSwapInteractionState } from "../../models";
import {
  InteractionType,
  SwapType,
  humanDecimalToAtomicString,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";

export const useSingleChainEvmSwapInteractionMutation = () => {
  const wallets = useWallets();
  const { updateInteractionState } = useInteractionStateV2();
  const getEvmClient = useGetEvmClient();
  const { evmRoutingContract } = useEnvironment(selectConfig, shallow);
  return useMutation(
    async (interactionState: SingleChainEvmSwapInteractionState) => {
      const { interaction } = interactionState;
      const { fromTokenData, toTokenData } = interaction.params;
      const { ecosystemId } = fromTokenData;
      if (!isEvmEcosystemId(ecosystemId)) {
        throw new Error("Expect EVM ecosystem id");
      }
      const { wallet } = wallets[ecosystemId];
      if (wallet === null) {
        throw new Error(`${ecosystemId} wallet not found`);
      }
      const { address, signer } = wallet;
      if (address === null || signer === null) {
        throw new Error(`${ecosystemId} wallet not connected`);
      }
      const fromTokenSpec = fromTokenData.tokenConfig;
      const toTokenSpec = toTokenData.tokenConfig;
      const fromTokenAddress = getTokenDetailsForEcosystem(
        fromTokenSpec,
        fromTokenData.ecosystemId,
      )?.address;
      const toTokenAddress = getTokenDetailsForEcosystem(
        toTokenSpec,
        toTokenData.ecosystemId,
      )?.address;

      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error("Missing token address");
      }
      const client = getEvmClient(ecosystemId);
      const tokenDetails = getTokenDetailsForEcosystem(
        fromTokenSpec,
        ecosystemId,
      );
      if (tokenDetails === null) {
        throw new Error("Missing token details");
      }
      const inputAmountAtomicString = humanDecimalToAtomicString(
        fromTokenData.value,
        fromTokenSpec,
        fromTokenData.ecosystemId,
      );
      const approvalResponses = await client.approveTokenAmount({
        atomicAmount: inputAmountAtomicString,
        wallet,
        mintAddress: tokenDetails.address,
        spenderAddress: evmRoutingContract,
      });
      const approvalTxs = await Promise.all(
        approvalResponses.map((response) =>
          client.getTxReceiptOrThrow(response),
        ),
      );
      updateInteractionState(interaction.id, (draft) => {
        if (
          draft.interactionType !== InteractionType.SwapV2 ||
          draft.swapType !== SwapType.SingleChainEvm
        ) {
          throw new Error("Interaction type mismatch");
        }
        draft.approvalTxIds = approvalTxs.map((tx) => tx.transactionHash);
      });

      const routingContract = Routing__factory.connect(
        evmRoutingContract,
        client.provider,
      );
      const txRequest = await routingContract.populateTransaction[
        "onChainSwap(address,uint256,address,address,uint256,bytes16)"
      ](
        fromTokenAddress,
        inputAmountAtomicString,
        address,
        toTokenAddress,
        humanDecimalToAtomicString(
          toTokenData.value,
          toTokenSpec,
          toTokenData.ecosystemId,
        ),
        `0x${interaction.id}`,
      );
      const txResponse = await signer.sendTransaction(txRequest);
      const evmReceipt = await client.getTxReceiptOrThrow(txResponse);
      const onChainSwapTxId = evmReceipt.transactionHash;
      updateInteractionState(interaction.id, (draft) => {
        if (
          draft.interactionType !== InteractionType.SwapV2 ||
          draft.swapType !== SwapType.SingleChainEvm
        ) {
          throw new Error("Interaction type mismatch");
        }
        draft.onChainSwapTxId = onChainSwapTxId;
      });
    },
  );
};

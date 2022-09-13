import { isEvmEcosystemId } from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import { findOrThrow } from "@swim-io/utils";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { Protocol, getTokenDetailsForEcosystem } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type { SingleChainEvmSwapInteractionState } from "../../models";
import {
  Amount,
  InteractionType,
  SwapType,
  approveAmount,
  humanDecimalToAtomicString,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmConnection } from "../evm";

export const useSingleChainEvmSwapInteractionMutation = () => {
  const wallets = useWallets();
  const { updateInteractionState } = useInteractionStateV2();
  const getEvmConnection = useGetEvmConnection();
  const { chains, evmRoutingContract } = useEnvironment(selectConfig, shallow);
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
      const connection = getEvmConnection(ecosystemId);
      const evmChainSpec = findOrThrow(
        chains[Protocol.Evm],
        (chain) => chain.ecosystem === ecosystemId,
      );
      const tokenDetails = getTokenDetailsForEcosystem(
        fromTokenSpec,
        ecosystemId,
      );
      if (tokenDetails === null) {
        throw new Error("Missing token details");
      }
      const approvalResponses = await approveAmount(
        Amount.fromHuman(fromTokenSpec, fromTokenData.value),
        evmChainSpec,
        connection,
        tokenDetails,
        wallet,
        evmRoutingContract,
      );
      const approvalTxs = await Promise.all(
        approvalResponses.map((response) =>
          connection.getTxReceiptOrThrow(response),
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
        connection.provider,
      );
      const txRequest = await routingContract.populateTransaction[
        "onChainSwap(address,uint256,address,address,uint256,bytes16)"
      ](
        fromTokenAddress,
        humanDecimalToAtomicString(
          fromTokenData.value,
          fromTokenSpec,
          fromTokenData.ecosystemId,
        ),
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
      const evmReceipt = await connection.getTxReceiptOrThrow(txResponse);
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

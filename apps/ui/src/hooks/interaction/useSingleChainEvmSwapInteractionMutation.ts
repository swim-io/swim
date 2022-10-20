import { EVM_ECOSYSTEMS, isEvmEcosystemId } from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import { useMutation } from "react-query";

import { getTokenDetailsForEcosystem } from "../../config";
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
  const { env } = useEnvironment();
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
      const routingContractAddress =
        EVM_ECOSYSTEMS[ecosystemId].chains[env]?.routingContractAddress ?? null;
      if (routingContractAddress === null) {
        throw new Error(`${ecosystemId} routing contract address not found`);
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
      const approveTxGenerator = client.generateErc20ApproveTxs({
        atomicAmount: inputAmountAtomicString,
        wallet,
        mintAddress: tokenDetails.address,
        spenderAddress: routingContractAddress,
      });

      for await (const result of approveTxGenerator) {
        updateInteractionState(interaction.id, (draft) => {
          if (
            draft.interactionType !== InteractionType.SwapV2 ||
            draft.swapType !== SwapType.SingleChainEvm
          ) {
            throw new Error("Interaction type mismatch");
          }
          draft.approvalTxIds.push(result.tx.id);
        });
      }

      const routingContract = Routing__factory.connect(
        routingContractAddress,
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
      const tx = await client.getTx(txResponse);
      updateInteractionState(interaction.id, (draft) => {
        if (
          draft.interactionType !== InteractionType.SwapV2 ||
          draft.swapType !== SwapType.SingleChainEvm
        ) {
          throw new Error("Interaction type mismatch");
        }
        draft.onChainSwapTxId = tx.id;
      });
    },
  );
};

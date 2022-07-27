import { EuiButton, EuiSpacer } from "@elastic/eui";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import { Env } from "@swim-io/core";
import type { FC } from "react";
import { useEffect } from "react";
import { useMutation } from "react-query";

import { useEnvironment } from "../../../core/store";
import {
  ADD_INTERACTION_STATE_ETHEREUM_COMPLETED,
  ADD_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS,
  ADD_INTERACTION_STATE_ETHEREUM_INIT,
  ADD_INTERACTION_STATE_SOLANA_COMPLETED,
  ADD_INTERACTION_STATE_SOLANA_COMPLETED_WITH_APPROVALS,
  ADD_INTERACTION_STATE_SOLANA_CREATED_SPL_TOKEN_ACCOUNTS,
  ADD_INTERACTION_STATE_SOLANA_EXISTING_SPL_TOKEN_ACCOUNTS,
  ADD_INTERACTION_STATE_SOLANA_INIT,
  CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED,
  CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED_WITH_APPROVALS,
  CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT,
  CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER,
  CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_COMPLETED,
  CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS,
  CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS,
  CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_INIT,
  CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_POST_VAA_COMPLETED,
  CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER_COMPLETED,
  CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_COMPLETED,
  CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS,
  CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS,
  CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_INIT,
  CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER_COMPLETED,
  REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_COMPLETED,
  REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS,
  REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_INIT,
  REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_COMPLETED,
  REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS,
  REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_INIT,
  REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_COMPLETED,
  REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS,
  REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_INIT,
  REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_COMPLETED,
  REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_COMPLETED_WITH_APPROVALS,
  REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_CREATED_SPL_TOKEN_ACCOUNTS,
  REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_EXISTING_SPL_TOKEN_ACCOUNTS,
  REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_INIT,
  SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPETED_WITH_APPROVALS,
  SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED,
  SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT,
  SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_COMPLETED,
  SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS,
  SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS,
  SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
} from "../../../fixtures/swim/interactionStateV2";
import { INTERACTION_MUTATION_KEY_V2 } from "../../../hooks";
import { sleep } from "../../../utils";

import { InteractionStateComponentV2 } from "./InteractionStateComponentV2";

// TODO eventually remove when tokens are available in mainnet?
const EnvSwitcher: FC<any> = ({ children }) => {
  const { env, setEnv, setCustomIp } = useEnvironment();

  useEffect(() => {
    if (env !== Env.Devnet) {
      setCustomIp("12.12.14.1");
      setEnv(Env.Devnet);
    }
  }, [env, setEnv, setCustomIp]);

  if (env !== Env.Devnet) return <p>Please wait while we switch to Devnet</p>;

  return children;
};

const Meta: ComponentMeta<typeof InteractionStateComponentV2> = {
  component: InteractionStateComponentV2,
  decorators: [(story) => <EnvSwitcher>{story()}</EnvSwitcher>],
};
export default Meta;

const Template: ComponentStory<typeof InteractionStateComponentV2> = (args) => {
  const {
    interaction: { id },
  } = SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_COMPLETED;
  const { mutate } = useMutation(
    async (interactionId: string) => {
      await sleep(5000);
    },
    {
      mutationKey: INTERACTION_MUTATION_KEY_V2,
    },
  );

  return (
    <>
      <InteractionStateComponentV2 {...args} />
      <EuiSpacer />
      <EuiButton size="s" onClick={() => mutate(id)}>
        Trigger Loading
      </EuiButton>
    </>
  );
};

export const SingleChainSolanaInit = Template.bind({});
SingleChainSolanaInit.args = {
  interactionState: SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
};

export const SingleChainSolanaExistingSplTokenAccounts = Template.bind({});
SingleChainSolanaExistingSplTokenAccounts.args = {
  interactionState:
    SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS,
};

export const SingleChainSolanaCreatedSplTokenAccounts = Template.bind({});
SingleChainSolanaCreatedSplTokenAccounts.args = {
  interactionState:
    SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS,
};

export const SingleChainSolanaCompleted = Template.bind({});
SingleChainSolanaCompleted.args = {
  interactionState: SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_COMPLETED,
};

export const SingleChainEvmInit = Template.bind({});
SingleChainEvmInit.args = {
  interactionState: SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT,
};

export const SingleChainEvmCompleted = Template.bind({});
SingleChainEvmCompleted.args = {
  interactionState: SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED,
};

export const SingleChainEvmCompletedWithApprovals = Template.bind({});
SingleChainEvmCompletedWithApprovals.args = {
  interactionState:
    SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPETED_WITH_APPROVALS,
};

export const CrossChainEvmSwapInit = Template.bind({});
CrossChainEvmSwapInit.args = {
  interactionState: CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT,
};

export const CrossChainEvmSwapSwapAndTransferCompleted = Template.bind({});
CrossChainEvmSwapSwapAndTransferCompleted.args = {
  interactionState: CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER,
};

export const CrossChainEvmSwapCompleted = Template.bind({});
CrossChainEvmSwapCompleted.args = {
  interactionState: CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED,
};

export const CrossChainEvmSwapCompletedWithApproval = Template.bind({});
CrossChainEvmSwapCompletedWithApproval.args = {
  interactionState:
    CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED_WITH_APPROVALS,
};

export const CrossChainSolanaToEvmSwapInit = Template.bind({});
CrossChainSolanaToEvmSwapInit.args = {
  interactionState: CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_INIT,
};

export const CrossChainSolanaToEvmSwapExistingSplTokenAccounts = Template.bind(
  {},
);
CrossChainSolanaToEvmSwapExistingSplTokenAccounts.args = {
  interactionState:
    CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS,
};

export const CrossChainSolanaToEvmSwapCreatedSplTokenAccounts = Template.bind(
  {},
);
CrossChainSolanaToEvmSwapCreatedSplTokenAccounts.args = {
  interactionState:
    CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS,
};

export const CrossChainSolanaToEvmSwapSwapAndTransferCompleted = Template.bind(
  {},
);
CrossChainSolanaToEvmSwapSwapAndTransferCompleted.args = {
  interactionState:
    CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER_COMPLETED,
};

export const CrossChainSolanaToEvmSwapCompleted = Template.bind({});
CrossChainSolanaToEvmSwapCompleted.args = {
  interactionState: CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_COMPLETED,
};

export const CrossChainEvmToSolanaSwapInit = Template.bind({});
CrossChainEvmToSolanaSwapInit.args = {
  interactionState: CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_INIT,
};

export const CrossChainEvmToSolanaSwapExistingSplTokenAccounts = Template.bind(
  {},
);
CrossChainEvmToSolanaSwapExistingSplTokenAccounts.args = {
  interactionState:
    CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS,
};

export const CrossChainEvmToSolanaSwapCreatedSplTokenAccounts = Template.bind(
  {},
);
CrossChainEvmToSolanaSwapCreatedSplTokenAccounts.args = {
  interactionState:
    CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS,
};

export const CrossChainEvmToSolanaSwapSwapAndTransferCompleted = Template.bind(
  {},
);
CrossChainEvmToSolanaSwapSwapAndTransferCompleted.args = {
  interactionState:
    CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER_COMPLETED,
};

export const CrossChainEvmToSolanaSwapPostVaaCompleted = Template.bind({});
CrossChainEvmToSolanaSwapPostVaaCompleted.args = {
  interactionState:
    CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_POST_VAA_COMPLETED,
};

export const CrossChainEvmToSolanaSwapCompleted = Template.bind({});
CrossChainEvmToSolanaSwapCompleted.args = {
  interactionState: CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_COMPLETED,
};

export const AddInteractionSolanaInit = Template.bind({});
AddInteractionSolanaInit.args = {
  interactionState: ADD_INTERACTION_STATE_SOLANA_INIT,
};

export const AddInteractionSolanaExistingSplTokenAccounts = Template.bind({});
AddInteractionSolanaExistingSplTokenAccounts.args = {
  interactionState: ADD_INTERACTION_STATE_SOLANA_EXISTING_SPL_TOKEN_ACCOUNTS,
};

export const AddInteractionSolanaCreatedSplTokenAccounts = Template.bind({});
AddInteractionSolanaCreatedSplTokenAccounts.args = {
  interactionState: ADD_INTERACTION_STATE_SOLANA_CREATED_SPL_TOKEN_ACCOUNTS,
};

export const AddInteractionSolanaCompleted = Template.bind({});
AddInteractionSolanaCompleted.args = {
  interactionState: ADD_INTERACTION_STATE_SOLANA_COMPLETED,
};

export const AddInteractionSolanaCompletedWithApprovals = Template.bind({});
AddInteractionSolanaCompletedWithApprovals.args = {
  interactionState: ADD_INTERACTION_STATE_SOLANA_COMPLETED_WITH_APPROVALS,
};

export const AddInteractionEthereumInit = Template.bind({});
AddInteractionEthereumInit.args = {
  interactionState: ADD_INTERACTION_STATE_ETHEREUM_INIT,
};

export const AddInteractionEthereumCompleted = Template.bind({});
AddInteractionEthereumCompleted.args = {
  interactionState: ADD_INTERACTION_STATE_ETHEREUM_COMPLETED,
};

export const AddInteractionEthereumCompletedWithApprovals = Template.bind({});
AddInteractionEthereumCompletedWithApprovals.args = {
  interactionState: ADD_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS,
};

export const RemoveUniformInteractionSolanaInit = Template.bind({});
RemoveUniformInteractionSolanaInit.args = {
  interactionState: REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_INIT,
};

export const RemoveUniformInteractionSolanaExistingSplTokenAccounts =
  Template.bind({});
RemoveUniformInteractionSolanaExistingSplTokenAccounts.args = {
  interactionState:
    REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_EXISTING_SPL_TOKEN_ACCOUNTS,
};

export const RemoveUniformInteractionSolanaCreatedSplAccounts = Template.bind(
  {},
);
RemoveUniformInteractionSolanaCreatedSplAccounts.args = {
  interactionState:
    REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_CREATED_SPL_TOKEN_ACCOUNTS,
};

export const RemoveUniformInteractionSolanaCompleted = Template.bind({});
RemoveUniformInteractionSolanaCompleted.args = {
  interactionState: REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_COMPLETED,
};

export const RemoveUniformInteractionSolanaCompletedWithApprovals =
  Template.bind({});
RemoveUniformInteractionSolanaCompletedWithApprovals.args = {
  interactionState:
    REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_COMPLETED_WITH_APPROVALS,
};

export const RemoveUniformInteractionEthereumInit = Template.bind({});
RemoveUniformInteractionEthereumInit.args = {
  interactionState: REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_INIT,
};

export const RemoveUniformInteractionEthereumCompleted = Template.bind({});
RemoveUniformInteractionEthereumCompleted.args = {
  interactionState: REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_COMPLETED,
};

export const RemoveUniformInteractionEthereumCompletedWithApprovals =
  Template.bind({});
RemoveUniformInteractionEthereumCompletedWithApprovals.args = {
  interactionState:
    REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS,
};

export const RemoveExactBurnInteractionEthereumInit = Template.bind({});
RemoveExactBurnInteractionEthereumInit.args = {
  interactionState: REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_INIT,
};

export const RemoveExactBurnInteractionEthereumCompleted = Template.bind({});
RemoveExactBurnInteractionEthereumCompleted.args = {
  interactionState: REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_COMPLETED,
};

export const RemoveExactBurnInteractionEthereumCompletedWithApprovals =
  Template.bind({});
RemoveExactBurnInteractionEthereumCompletedWithApprovals.args = {
  interactionState:
    REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS,
};

export const RemoveExactOutoutInteractionEthereumInit = Template.bind({});
RemoveExactOutoutInteractionEthereumInit.args = {
  interactionState: REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_INIT,
};

export const RemoveExactOutoutInteractionEthereumCompleted = Template.bind({});
RemoveExactOutoutInteractionEthereumCompleted.args = {
  interactionState: REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_COMPLETED,
};

export const RemoveExactOutoutInteractionEthereumCompletedWithApprovals =
  Template.bind({});
RemoveExactOutoutInteractionEthereumCompletedWithApprovals.args = {
  interactionState:
    REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS,
};

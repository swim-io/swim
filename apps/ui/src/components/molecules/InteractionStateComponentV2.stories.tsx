import { EuiButton, EuiSpacer } from "@elastic/eui";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import type { FC } from "react";
import { useEffect } from "react";
import { useMutation } from "react-query";

import { Env, useEnvironment } from "../../core/store";
import {
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
  SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPETED_WITH_APPROVALS,
  SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED,
  SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT,
  SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_COMPLETED,
  SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS,
  SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS,
  SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
} from "../../fixtures/swim/interactionStateV2";
import { INTERACTION_MUTATION_KEY_V2 } from "../../hooks";
import { sleep } from "../../utils";

import { InteractionStateComponentV2 } from "./InteractionStateComponentV2";

// TODO eventually remove when tokens are available in mainnet?
const EnvSwitcher: FC<any> = ({ children }) => {
  const { env, setEnv, setCustomLocalnetIp } = useEnvironment();

  useEffect(() => {
    if (env !== Env.Devnet) {
      setCustomLocalnetIp("12.12.14.1");
      setEnv(Env.Devnet);
    }
  }, [env, setEnv, setCustomLocalnetIp]);

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

import { EuiButton, EuiSpacer } from "@elastic/eui";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import { useMutation } from "react-query";

import { MOCK_INTERACTION_STATE } from "../../fixtures/swim/interactionState";
import { INTERACTION_MUTATION_KEY } from "../../hooks/interaction";
import type { InteractionState } from "../../models";
import { sleep } from "../../utils";

import { InteractionStateComponent } from "./InteractionStateComponent";

const Meta: ComponentMeta<typeof InteractionStateComponent> = {
  component: InteractionStateComponent,
};
export default Meta;

const Template: ComponentStory<typeof InteractionStateComponent> = (args) => {
  const {
    interaction: { id },
  } = MOCK_INTERACTION_STATE;
  const { mutate } = useMutation(
    async (interactionId: string) => {
      await sleep(5000);
    },
    {
      mutationKey: INTERACTION_MUTATION_KEY,
    },
  );

  return (
    <>
      <InteractionStateComponent {...args} />
      <EuiSpacer />
      <EuiButton size="s" onClick={() => mutate(id)}>
        Trigger Loading
      </EuiButton>
    </>
  );
};

export const Init = Template.bind({});
Init.args = {
  interactionState: MOCK_INTERACTION_STATE,
};

const stateWithExistingSplTokenAccounts: InteractionState = {
  ...MOCK_INTERACTION_STATE,
  requiredSplTokenAccounts: {
    mint1: { isExistingAccount: true, account: null, txId: null },
    mint2: { isExistingAccount: true, account: null, txId: null },
  },
};
export const ExistingSplTokenAccounts = Template.bind({});
ExistingSplTokenAccounts.args = {
  interactionState: stateWithExistingSplTokenAccounts,
};

const stateWithCreatedSplTokenAccounts: InteractionState = {
  ...MOCK_INTERACTION_STATE,
  requiredSplTokenAccounts: {
    mint1: {
      isExistingAccount: false,
      account: null,
      txId: "createSplTokenAccountTxId1",
    },
    mint2: {
      isExistingAccount: false,
      account: null,
      txId: "createSplTokenAccountTxId2",
    },
  },
};
export const CreatedSplTokenAccounts = Template.bind({});
CreatedSplTokenAccounts.args = {
  interactionState: stateWithCreatedSplTokenAccounts,
};

const stateWithTransferToSolanaInProgress: InteractionState = {
  ...stateWithExistingSplTokenAccounts,
  toSolanaTransfers: [
    {
      ...stateWithExistingSplTokenAccounts.toSolanaTransfers[0],
      txIds: {
        approveAndTransferEvmToken: ["approveEvmTxId", "transferEvmTxId"],
        postVaaOnSolana: ["postVaaSolanaTxId"],
        claimTokenOnSolana: null,
      },
    },
  ],
};
export const TransferToSolanaInProgress = Template.bind({});
TransferToSolanaInProgress.args = {
  interactionState: stateWithTransferToSolanaInProgress,
};

const stateWithTransferToSolanaCompleted: InteractionState = {
  ...stateWithExistingSplTokenAccounts,
  toSolanaTransfers: [
    {
      ...stateWithExistingSplTokenAccounts.toSolanaTransfers[0],
      txIds: {
        approveAndTransferEvmToken: ["approveEvmTxId", "transferEvmTxId"],
        postVaaOnSolana: ["postVaaSolanaTxId"],
        claimTokenOnSolana: "claimTokenOnSolanaTxId",
      },
    },
  ],
};
export const TransferToSolanaCompleted = Template.bind({});
TransferToSolanaCompleted.args = {
  interactionState: stateWithTransferToSolanaCompleted,
};

const stateWithPoolOperationCompleted: InteractionState = {
  ...stateWithTransferToSolanaCompleted,
  solanaPoolOperations: [
    {
      ...stateWithTransferToSolanaCompleted.solanaPoolOperations[0],
      txId: "poolOperationTxId",
    },
  ],
};
export const PoolOperationsCompleted = Template.bind({});
PoolOperationsCompleted.args = {
  interactionState: stateWithPoolOperationCompleted,
};

const stateWithTransferFromSolanaInProgress: InteractionState = {
  ...stateWithPoolOperationCompleted,
  fromSolanaTransfers: [
    {
      ...stateWithPoolOperationCompleted.fromSolanaTransfers[0],
      txIds: {
        transferSplToken: "transferSplTokenTxId",
        claimTokenOnEvm: null,
      },
    },
  ],
};
export const TransferFromSolanaInProgress = Template.bind({});
TransferFromSolanaInProgress.args = {
  interactionState: stateWithTransferFromSolanaInProgress,
};

const stateWithTransferFromSolanaCompleted: InteractionState = {
  ...stateWithPoolOperationCompleted,
  fromSolanaTransfers: [
    {
      ...stateWithPoolOperationCompleted.fromSolanaTransfers[0],
      txIds: {
        transferSplToken: "transferSplTokenTxId",
        claimTokenOnEvm: "claimTokenOnEvmTxId",
      },
    },
  ],
};
export const Completed = Template.bind({});
Completed.args = {
  interactionState: stateWithTransferFromSolanaCompleted,
};

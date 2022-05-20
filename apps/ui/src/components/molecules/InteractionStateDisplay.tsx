import {
  EuiListGroup,
  EuiSpacer,
  EuiSteps,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import moment from "moment";
import type React from "react";

import { ecosystems } from "../../config";
import { useInteraction } from "../../hooks/interaction";
import type {
  InteractionState,
  WormholeFromSolanaTransferState,
  WormholeToSolanaTransferState,
} from "../../hooks/interaction/useInteractionState";
import { useInteractionState } from "../../hooks/interaction/useInteractionState";
import type { Interaction } from "../../models";
import { isNotNull } from "../../utils";

import { InteractionTitle } from "./InteractionTitle";
import { TxListItem } from "./TxListItem";

interface InteractionStateContentProps {
  readonly interaction: Interaction;
  readonly interactionState: InteractionState;
}

const WormholeToSolanaTransfer: React.FC<{
  readonly state: WormholeToSolanaTransferState;
}> = ({ state }) => {
  const { token, txs } = state;
  const fromEcosystem = ecosystems[token.nativeEcosystem].displayName;
  const { approveAndTransferToken, postVaaOnSolana, claimTokenOnSolana } = txs;
  const completedTxs = [
    ...(approveAndTransferToken ?? []),
    ...(postVaaOnSolana ?? []),
    claimTokenOnSolana,
  ].filter(isNotNull);
  return (
    <EuiText size="m">
      <span>{`Transfer ${token.displayName} from ${fromEcosystem} to Solana`}</span>
      {/* <span>{!isComplete && mutation?.isIdle ? " (pending)" : null}</span> */}
      <br />
      <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
        {completedTxs.map((tx) => (
          <TxListItem key={tx.txId} {...tx} />
        ))}
      </EuiListGroup>
    </EuiText>
  );
};

const WormholeFromSolanaTransfer: React.FC<{
  readonly state: WormholeFromSolanaTransferState;
}> = ({ state }) => {
  const { token, txs } = state;
  const toEcosystem = ecosystems[token.nativeEcosystem].displayName;
  const completedTxs = [txs.transferSplToken, txs.claimTokenOnEvm].filter(
    isNotNull,
  );
  return (
    <EuiText size="m">
      <span>{`Transfer ${token.displayName} from Solana to ${toEcosystem}`}</span>
      {/* <span>{!isComplete && mutation?.isIdle ? " (pending)" : null}</span> */}
      <br />
      <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
        {completedTxs.map((tx) => (
          <TxListItem key={tx.txId} {...tx} />
        ))}
      </EuiListGroup>
    </EuiText>
  );
};

const InteractionStateContent: React.FC<InteractionStateContentProps> = ({
  interaction,
  interactionState,
}) => {
  const {
    prepareSplTokenAccountsState,
    wormholeToSolanaTransfers,
    solanaPoolOperations,
    wormholeFromSolanaTransfers,
  } = interactionState;

  return (
    <EuiSteps
      titleSize="xs"
      className="actionSteps"
      steps={[
        // {
        //   title: "Prepare Solana accounts",
        //   status: "incomplete",
        //   children: null,
        // },
        {
          title: "Bridge tokens to Solana",
          status: "incomplete",
          children: wormholeToSolanaTransfers.map((state) => (
            <WormholeToSolanaTransfer key={state.token.id} state={state} />
          )),
        },
        {
          title: "Perform pool operation(s) on Solana",
          status: "incomplete",
          children: null,
        },
        {
          title: "Bridge tokens from Solana",
          status: "incomplete",
          children: wormholeFromSolanaTransfers.map((state) => (
            <WormholeFromSolanaTransfer key={state.token.id} state={state} />
          )),
        },
      ]}
    />
  );
};

export const InteractionStateDisplay: React.FC<{ readonly id: string }> = ({
  id,
}) => {
  const interaction = useInteraction(id);
  const state = useInteractionState(id);

  return (
    <>
      <EuiTitle size="xs">
        <h3>
          <InteractionTitle interaction={interaction} />
        </h3>
      </EuiTitle>
      <EuiText size="s">{moment(interaction.submittedAt).fromNow()}</EuiText>
      <EuiSpacer />
      <InteractionStateContent
        interaction={interaction}
        interactionState={state}
      />
    </>
  );
};

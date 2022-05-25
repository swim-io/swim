import {
  EuiAccordion,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { Fragment } from "react";

import { useInteractionState } from "../core/store";
import { useSplTokenAccountsQuery, useWallets } from "../hooks";
import { InteractionType } from "../models";

import { MultiConnectButton } from "./ConnectButton";
import { InteractionStateComponent } from "./molecules/InteractionStateComponent";

export interface RecentInteractionsProps {
  readonly title: string;
}

export const RecentSwaps = ({
  title,
}: RecentInteractionsProps): ReactElement => {
  const { isSuccess: didLoadSplTokenAccounts } = useSplTokenAccountsQuery();
  const wallets = useWallets();
  // Don’t display current interaction
  const { recentInteractionId, interactionStates } = useInteractionState();
  const recentSwaps = interactionStates
    .filter(({ interaction }) => interaction.type === InteractionType.Swap)
    .filter(({ interaction }) => interaction.id !== recentInteractionId)
    .sort((a, b) => b.interaction.submittedAt - a.interaction.submittedAt);

  const recentInteractionState = interactionStates.find(
    ({ interaction }) => interaction.id === recentInteractionId,
  );

  return (
    <>
      {recentInteractionState && (
        <InteractionStateComponent interactionState={recentInteractionState} />
      )}
      <EuiSpacer />
      <EuiAccordion
        id="recent-interactions"
        buttonContent={`${title} (${recentSwaps.length})`}
        extraAction={<MultiConnectButton size="s" fullWidth />}
      >
        <EuiSpacer />
        <EuiPanel color="subdued">
          {!wallets.solana.connected
            ? "Connect your wallets to see recent interactions."
            : !didLoadSplTokenAccounts
            ? "Loading..."
            : interactionStates.length === 0
            ? "Interactions are stored per browser. If you used incognito mode, they will not show up here."
            : recentSwaps.map((interactionState, i) => {
                return (
                  <Fragment key={interactionState.interaction.id}>
                    {i === 0 || <EuiHorizontalRule />}
                    <InteractionStateComponent
                      interactionState={interactionState}
                    />
                  </Fragment>
                );
              })}
        </EuiPanel>
      </EuiAccordion>
    </>
  );
};

import { EuiAccordion, EuiHorizontalRule, EuiPanel } from "@elastic/eui";
import type { ReactElement } from "react";
import { Fragment } from "react";

import { useInteractionStateStore } from "../core/store/useInteractionStateStore";
import { useSplTokenAccountsQuery, useWallets } from "../hooks";
import { useInteractionMutation } from "../hooks/interaction/useInteractionMutation";

import { MultiConnectButton } from "./ConnectButton";
import { InteractionStateComponent } from "./molecules/InteractionStateComponent";

export interface RecentSwapsProps {
  readonly title: string;
}

export const RecentSwaps = ({ title }: RecentSwapsProps): ReactElement => {
  const { isSuccess: didLoadSplTokenAccounts } = useSplTokenAccountsQuery();
  const wallets = useWallets();
  const { interactionStateStore } = useInteractionStateStore();
  const { isLoading: hasActiveInteraction, variables: activeInteraction } =
    useInteractionMutation();
  const recentSwaps = hasActiveInteraction
    ? interactionStateStore.filter(
        ({ interaction }) =>
          interaction.id === activeInteraction?.interaction.id,
      )
    : interactionStateStore;
  const count = recentSwaps.length;

  return (
    <>
      {activeInteraction && (
        <InteractionStateComponent interactionState={activeInteraction} />
      )}
      <EuiAccordion
        id="recent-interactions"
        buttonContent={`${title} (${count})`}
        extraAction={<MultiConnectButton size="s" fullWidth />}
      >
        <EuiPanel color="subdued">
          {!wallets.solana.connected
            ? "Connect your wallets to see recent interactions."
            : !didLoadSplTokenAccounts
            ? "Loading..."
            : count === 0
            ? "Interactions are stored per browser. If you used incognito mode, they will not show up here."
            : recentSwaps.map((interactionState, i) => (
                <Fragment key={interactionState.interaction.id}>
                  {i === 0 || <EuiHorizontalRule />}
                  <InteractionStateComponent
                    interactionState={interactionState}
                  />
                </Fragment>
              ))}
        </EuiPanel>
      </EuiAccordion>
    </>
  );
};

import {
  EuiAccordion,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { Fragment, useEffect } from "react";

import { useEnvironment, useInteractionState } from "../core/store";
import {
  isEveryAddressConnected,
  useSplTokenAccountsQuery,
  useWallets,
} from "../hooks";
import type { InteractionType } from "../models";

import { MultiConnectButton } from "./ConnectButton";
import { ConnectedWallets } from "./ConnectedWallets";
import { InteractionStateComponent } from "./molecules/InteractionStateComponent";

export interface RecentInteractionsProps {
  readonly title: string;
  readonly interactionTypes: ReadonlySet<InteractionType>;
}

export const RecentInteractions = ({
  title,
  interactionTypes,
}: RecentInteractionsProps): ReactElement => {
  const env = useEnvironment((state) => state.env);
  const loadInteractionStatesFromIDB = useInteractionState(
    (state) => state.loadInteractionStatesFromIDB,
  );
  useEffect(() => {
    loadInteractionStatesFromIDB(env);
  }, [env, loadInteractionStatesFromIDB]);

  const { isSuccess: didLoadSplTokenAccounts } = useSplTokenAccountsQuery();
  const wallets = useWallets();
  // Don’t display current interaction
  const { recentInteractionId, interactionStates } = useInteractionState();
  const recentInteractions = interactionStates
    .filter(({ interaction }) => interactionTypes.has(interaction.type))
    .filter(({ interaction }) => interaction.id !== recentInteractionId);

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
        buttonContent={`${title} (${recentInteractions.length})`}
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
            : recentInteractions.map((interactionState, i) => {
                return (
                  <Fragment key={interactionState.interaction.id}>
                    {i === 0 || <EuiHorizontalRule />}
                    {isEveryAddressConnected(
                      interactionState.interaction.connectedWallets,
                      wallets,
                    ) ? (
                      <InteractionStateComponent
                        interactionState={interactionState}
                      />
                    ) : (
                      <ConnectedWallets
                        walletAddresses={
                          interactionState.interaction.connectedWallets
                        }
                      />
                    )}
                  </Fragment>
                );
              })}
        </EuiPanel>
      </EuiAccordion>
    </>
  );
};

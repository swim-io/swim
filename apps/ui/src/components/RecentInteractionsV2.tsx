import {
  EuiAccordion,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { Fragment, useEffect } from "react";

import { useEnvironment, useInteractionStateV2 } from "../core/store";
import { useSplTokenAccountsQuery, useWallets } from "../hooks";
import { isEveryAddressConnected } from "../models";
import type { InteractionType } from "../models";

import { MultiConnectButton } from "./ConnectButton";
import { ConnectedWallets } from "./ConnectedWallets";
import { InteractionStateComponentV2 } from "./molecules/InteractionStateComponentV2";

export interface RecentInteractionsProps {
  readonly title: string;
  readonly interactionTypes: ReadonlySet<InteractionType>;
}

export const RecentInteractionsV2 = ({
  title,
  interactionTypes,
}: RecentInteractionsProps): ReactElement => {
  const env = useEnvironment((state) => state.env);
  const loadInteractionStatesFromIDB = useInteractionStateV2(
    (state) => state.loadInteractionStatesFromIDB,
  );
  useEffect(() => {
    loadInteractionStatesFromIDB(env);
  }, [env, loadInteractionStatesFromIDB]);

  const { isSuccess: didLoadSplTokenAccounts } = useSplTokenAccountsQuery();
  const wallets = useWallets();
  // Don’t display current interaction
  const { recentInteractionId, interactionStates } = useInteractionStateV2();
  const recentInteractions = interactionStates
    .filter(({ interaction }) => interactionTypes.has(interaction.type))
    .filter(({ interaction }) => interaction.id !== recentInteractionId);

  const recentInteractionState = interactionStates.find(
    ({ interaction }) => interaction.id === recentInteractionId,
  );

  return (
    <>
      {recentInteractionState && (
        <InteractionStateComponentV2
          interactionState={recentInteractionState}
        />
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
                      <InteractionStateComponentV2
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

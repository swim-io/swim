import {
  EuiAccordion,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useEnvironment, useInteractionState } from "../core/store";
import { useSplTokenAccountsQuery, useWallets } from "../hooks";
import { isEveryAddressConnected } from "../models";
import type { InteractionType } from "../models";

import { ConnectedWallets } from "./ConnectedWallets";
import { InteractionStateComponent } from "./molecules/InteractionStateComponent";

interface Props {
  readonly title: string;
  readonly interactionTypes: ReadonlySet<InteractionType>;
}

export const RecentInteractions = ({
  title,
  interactionTypes,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const env = useEnvironment((state) => state.env);
  const loadInteractionStatesFromIdb = useInteractionState(
    (state) => state.loadInteractionStatesFromIdb,
  );
  useEffect(() => {
    loadInteractionStatesFromIdb(env).catch(console.error);
  }, [env, loadInteractionStatesFromIdb]);

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
      >
        <EuiSpacer />
        <EuiPanel color="subdued">
          {!wallets.solana.connected
            ? t("recent_interactions.disconnected_with_wallet")
            : !didLoadSplTokenAccounts
            ? t("recent_interactions.loading")
            : interactionStates.length === 0
            ? t("recent_interactions.interactions_not_found")
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

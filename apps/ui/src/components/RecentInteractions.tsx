import {
  EuiAccordion,
  EuiButton,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import moment from "moment";
import type { ReactElement } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import {
  isEveryAddressConnected,
  usePoolMaths,
  useRecentInteractions,
  useSplTokenAccountsQuery,
  useStepsReducer,
  useWallets,
} from "../hooks";
import { InteractionType, Status, getCurrentState } from "../models";
import type { Interaction, State, Tx } from "../models";
import { isEachNotNull } from "../utils";

import { MultiConnectButton } from "./ConnectButton";
import { ConnectedWallets } from "./ConnectedWallets";
import { StepsDisplay } from "./StepsDisplay";
import { InteractionTitle } from "./molecules/InteractionTitle";

export interface ActiveInteractionProps {
  readonly interaction: Interaction;
  readonly existingState: State;
}

export const ActiveInteraction = ({
  interaction,
  existingState,
}: ActiveInteractionProps): ReactElement => {
  const {
    resumeInteraction,
    retryInteraction,
    state: { status, steps },
    mutations,
  } = useStepsReducer(existingState);
  const [didResume, setDidResume] = useState(false);

  useEffect(() => {
    if (didResume) {
      return;
    }
    setDidResume(true);
    // NOTE: Errors are handled
    void resumeInteraction();
  }, [didResume, resumeInteraction]);

  return steps === null ? (
    // This interaction was never initiated. This should never reach this point because it won't have been persisted.
    <></>
  ) : (
    <StepsDisplay
      retryInteraction={retryInteraction}
      interaction={interaction}
      steps={steps}
      status={status}
      mutations={mutations}
    />
  );
};

export interface RecentInteractionProps {
  readonly interaction: Interaction;
  readonly txs: readonly Tx[] | null;
  readonly splTokenAccounts: readonly TokenAccountInfo[];
}

export const RecentInteraction = ({
  interaction,
  txs,
  splTokenAccounts,
}: RecentInteractionProps): ReactElement => {
  const config = useEnvironment(selectConfig, shallow);
  const [isActive, setIsActive] = useState(false);
  const wallets = useWallets();
  const { isInteractionInProgress } = useStepsReducer();
  const poolMaths = usePoolMaths(interaction.poolIds);
  const currentState = useMemo(
    () =>
      isEachNotNull(poolMaths)
        ? getCurrentState(
            config,
            interaction,
            poolMaths,
            splTokenAccounts,
            txs ?? [],
          )
        : null,
    [config, interaction, splTokenAccounts, poolMaths, txs],
  );

  const prettyTimestamp = moment(interaction.submittedAt).fromNow();

  const content = useMemo(() => {
    if (!isEveryAddressConnected(interaction.connectedWallets, wallets)) {
      return (
        <ConnectedWallets walletAddresses={interaction.connectedWallets} />
      );
    }
    if (txs === null) {
      return "Fetching transaction status...";
    }

    if (currentState === null || currentState.steps === null) {
      return "Loading...";
    }

    if (isActive) {
      return (
        <ActiveInteraction
          existingState={currentState}
          interaction={interaction}
        />
      );
    }

    return (
      <>
        <StepsDisplay
          retryInteraction={() => setIsActive(true)}
          interaction={interaction}
          steps={currentState.steps}
          status={currentState.status}
        />
        {currentState.status !== Status.Done && (
          <>
            <EuiButton
              iconType="refresh"
              onClick={() => setIsActive(true)}
              size="s"
              isLoading={isActive}
              isDisabled={isInteractionInProgress}
            >
              Resume
            </EuiButton>
            &nbsp;&nbsp;
            <EuiButton
              href="/help"
              onClick={(e) => {
                e.preventDefault();
                window.open("/help", "_blank");
              }}
              color="warning"
              iconType="popout"
              iconSide="right"
              size="s"
            >
              Get help
            </EuiButton>
          </>
        )}
      </>
    );
  }, [
    currentState,
    interaction,
    txs,
    isActive,
    isInteractionInProgress,
    wallets,
  ]);

  return (
    <>
      <EuiTitle size="xs">
        <h3>
          <InteractionTitle interaction={interaction} />
        </h3>
      </EuiTitle>
      <EuiText size="s">{prettyTimestamp}</EuiText>
      <EuiSpacer />

      {content}
    </>
  );
};

export interface RecentInteractionsProps {
  readonly title: string;
  readonly currentInteraction: string | null;
  /** Set to null to indicate we are on the Swap page */
  readonly poolId: string | null;
}

export const RecentInteractions = ({
  title,
  currentInteraction,
  poolId,
}: RecentInteractionsProps): ReactElement => {
  const { data: splTokenAccounts = [], isSuccess: didLoadSplTokenAccounts } =
    useSplTokenAccountsQuery();
  const wallets = useWallets();
  // Don’t display current interaction
  const { [currentInteraction ?? ""]: _, ...interactionsWithTxs } =
    useRecentInteractions();

  const recentInteractions = Object.values(interactionsWithTxs).filter(
    (interactionWithTxs) => {
      if (interactionWithTxs === undefined) {
        return false;
      }
      if (interactionWithTxs.interaction.type === InteractionType.Swap) {
        return poolId === null;
      }
      return poolId === interactionWithTxs.interaction.poolId;
    },
  );
  const numberOfRecentInteractions =
    currentInteraction === null
      ? recentInteractions.length
      : Math.max(0, recentInteractions.length - 1);

  return (
    <>
      <EuiAccordion
        id="recent-interactions"
        buttonContent={`${title} (${numberOfRecentInteractions})`}
        extraAction={<MultiConnectButton size="s" fullWidth />}
      >
        <EuiPanel color="subdued">
          {!wallets.solana.connected
            ? "Connect your wallets to see recent interactions."
            : !didLoadSplTokenAccounts
            ? "Loading..."
            : recentInteractions.length === 0
            ? "Interactions are stored per browser. If you used incognito mode, they will not show up here."
            : recentInteractions.map((interactionWithTxs, i) => {
                if (interactionWithTxs === undefined) {
                  return "Loading...";
                }
                return (
                  <Fragment key={interactionWithTxs.interaction.id}>
                    {i === 0 || <EuiHorizontalRule />}
                    <RecentInteraction
                      interaction={interactionWithTxs.interaction}
                      txs={interactionWithTxs.txs}
                      splTokenAccounts={splTokenAccounts}
                    />
                  </Fragment>
                );
              })}
        </EuiPanel>
      </EuiAccordion>
    </>
  );
};

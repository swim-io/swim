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

import { EcosystemId } from "../config";
import { useConfig } from "../contexts";
import {
  isEveryAddressConnected,
  useRecentInteractions,
  useSplTokenAccountsQuery,
  useStepsReducer,
  useWallets,
} from "../hooks";
import { InteractionType, Status, getCurrentState } from "../models";
import type { Interaction, State, Tx, WithOperations } from "../models";

import { MultiConnectButton } from "./ConnectButton";
import { ConnectedWallets } from "./ConnectedWallets";
import { StepsDisplay } from "./StepsDisplay";
import {
  AmountWithTokenIcon,
  AmountsWithTokenIcons,
  NativeTokenIcon,
} from "./TokenIcon";

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
  readonly interaction: WithOperations<Interaction>;
  readonly txs: readonly Tx[] | null;
  readonly splTokenAccounts: readonly TokenAccountInfo[];
}

export const RecentInteraction = ({
  interaction,
  txs,
  splTokenAccounts,
}: RecentInteractionProps): ReactElement => {
  const config = useConfig();
  const [isActive, setIsActive] = useState(false);
  const wallets = useWallets();
  const { isInteractionInProgress } = useStepsReducer();
  const currentState = useMemo(
    () => getCurrentState(config, interaction, splTokenAccounts, txs ?? []),
    [config, interaction, splTokenAccounts, txs],
  );

  const title = useMemo(() => {
    switch (interaction.type) {
      case InteractionType.Add: {
        const { inputAmounts } = interaction.params;
        const nonZeroInputAmounts = [...inputAmounts.values()].filter(
          (amount) => !amount.isZero(),
        );
        return (
          <>
            <span>Add&nbsp;</span>
            <AmountsWithTokenIcons amounts={nonZeroInputAmounts} />
          </>
        );
      }
      case InteractionType.Swap: {
        const { exactInputAmount } = interaction.params;
        return (
          <>
            <span>Swap</span>{" "}
            <AmountWithTokenIcon
              amount={exactInputAmount}
              ecosystem={EcosystemId.Solana}
            />{" "}
            <span>for</span>{" "}
            <NativeTokenIcon
              {...interaction.params.minimumOutputAmount.tokenSpec}
            />
          </>
        );
      }
      case InteractionType.RemoveUniform: {
        const { minimumOutputAmounts } = interaction.params;
        const nonZeroOutputAmounts = [...minimumOutputAmounts.values()].filter(
          (amount) => !amount.isZero(),
        );
        return (
          <>
            <span>Remove&nbsp;</span>
            <AmountsWithTokenIcons amounts={nonZeroOutputAmounts} />
          </>
        );
      }
      case InteractionType.RemoveExactBurn: {
        const { minimumOutputAmount } = interaction.params;
        return (
          <>
            <span>Remove</span>{" "}
            <AmountWithTokenIcon
              amount={minimumOutputAmount}
              ecosystem={minimumOutputAmount.tokenSpec.nativeEcosystem}
            />
            <span>.</span>
          </>
        );
      }
      case InteractionType.RemoveExactOutput: {
        const { exactOutputAmounts } = interaction.params;
        const nonZeroOutputAmounts = [...exactOutputAmounts.values()].filter(
          (amount) => !amount.isZero(),
        );
        return (
          <>
            <span>Remove&nbsp;</span>
            <AmountsWithTokenIcons amounts={nonZeroOutputAmounts} />
          </>
        );
      }
      default: {
        return "Unknown interaction type";
      }
    }
  }, [interaction]);

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

    if (currentState.steps === null) {
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
        <h3>{title}</h3>
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
  /** Set to null to include interactions for all pools */
  readonly poolId: string | null;
}

export const RecentInteractions = ({
  title,
  currentInteraction,
}: RecentInteractionsProps): ReactElement => {
  const { data: splTokenAccounts = [], isSuccess: didLoadSplTokenAccounts } =
    useSplTokenAccountsQuery();
  const wallets = useWallets();
  // Don’t display current interaction
  const { [currentInteraction ?? ""]: _, ...interactionsWithTxs } =
    useRecentInteractions();

  const recentInteractions = useMemo(
    () =>
      Object.values(interactionsWithTxs).filter(
        (interactionWithTxs) => !!interactionWithTxs,
        // TODO: perform this check again
        // && (poolId === null || poolId === interactionWithTxs.interaction.poolId),
      ),
    [interactionsWithTxs],
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

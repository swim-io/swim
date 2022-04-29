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
  usePool,
  useRecentInteractions,
  useSplTokenAccountsQuery,
  useStepsReducer,
  useWallets,
} from "../hooks";
import { Status, SwimDefiInstruction, getCurrentState } from "../models";
import type { Interaction, State, Tx } from "../models";
import { findOrThrow } from "../utils";

import { ActionSteps } from "./ActionSteps";
import { MultiConnectButton } from "./ConnectButton";
import { ConnectedWallets } from "./ConnectedWallets";
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
  } = useStepsReducer(interaction.poolId, existingState);
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
    <ActionSteps
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
  const config = useConfig();
  const { tokens, lpToken } = usePool(interaction.poolId);
  const [isActive, setIsActive] = useState(false);
  const wallets = useWallets();
  const { isInteractionInProgress } = useStepsReducer(interaction.poolId);
  const currentState = useMemo(
    () =>
      getCurrentState(
        config,
        splTokenAccounts,
        tokens,
        lpToken,
        interaction,
        txs ?? [],
      ),
    [config, splTokenAccounts, tokens, lpToken, interaction, txs],
  );

  const title = useMemo(() => {
    switch (interaction.instruction) {
      case SwimDefiInstruction.Add: {
        const nonZeroInputAmounts = interaction.params.inputAmounts.filter(
          (amount) => !amount.isZero(),
        );
        return (
          <>
            <span>Add&nbsp;</span>
            <AmountsWithTokenIcons amounts={nonZeroInputAmounts} />
          </>
        );
      }
      case SwimDefiInstruction.Swap: {
        const inputAmount = findOrThrow(
          interaction.params.exactInputAmounts,
          (amount) => !amount.isZero(),
        );
        return (
          <>
            <span>Swap</span>{" "}
            <AmountWithTokenIcon
              amount={inputAmount}
              ecosystem={EcosystemId.Solana}
            />{" "}
            <span>for</span>{" "}
            <NativeTokenIcon
              {...interaction.params.minimumOutputAmount.tokenSpec}
            />
          </>
        );
      }
      case SwimDefiInstruction.RemoveUniform: {
        const { minimumOutputAmounts } = interaction.params;
        const nonZeroOutputAmounts = minimumOutputAmounts.filter(
          (amount) => !amount.isZero(),
        );
        return (
          <>
            <span>Remove&nbsp;</span>
            <AmountsWithTokenIcons amounts={nonZeroOutputAmounts} />
          </>
        );
      }
      case SwimDefiInstruction.RemoveExactBurn: {
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
      case SwimDefiInstruction.RemoveExactOutput: {
        const { exactOutputAmounts } = interaction.params;
        const nonZeroOutputAmounts = exactOutputAmounts.filter(
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
        <ActionSteps
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
  readonly instructions?: readonly SwimDefiInstruction[];
}

export const RecentInteractions = ({
  title,
  currentInteraction,
  poolId,
  instructions = [
    SwimDefiInstruction.Swap,
    SwimDefiInstruction.Add,
    SwimDefiInstruction.RemoveUniform,
    SwimDefiInstruction.RemoveExactBurn,
    SwimDefiInstruction.RemoveExactOutput,
  ],
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
        (interactionWithTxs) =>
          interactionWithTxs &&
          (poolId === null ||
            poolId === interactionWithTxs.interaction.poolId) &&
          instructions.includes(interactionWithTxs.interaction.instruction),
      ),
    [interactionsWithTxs, instructions, poolId],
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

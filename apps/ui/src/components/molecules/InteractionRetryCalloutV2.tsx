import { EuiButton, EuiCallOut, EuiSpacer } from "@elastic/eui";
import type React from "react";

import { selectInteractionError } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import { formatErrorJsx } from "../../errors";
import { useWallets } from "../../hooks";
import {
  InteractionStatusV2,
  useHasActiveInteraction,
  useInteractionStatusV2,
  useResumeInteraction,
} from "../../hooks/interaction";
import { isEveryAddressConnected } from "../../models";
import type { InteractionStateV2 } from "../../models/swim/interactionStateV2";

interface Props {
  readonly interactionState: InteractionStateV2;
}

const RetryOrResumeButton = ({
  title,
  onClick,
  disabled,
}: {
  readonly title: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
}) => (
  <>
    <EuiButton
      iconType="refresh"
      onClick={onClick}
      size="s"
      isDisabled={disabled}
    >
      {title}
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
);

export const InteractionRetryCalloutV2: React.FC<Props> = ({
  interactionState,
}) => {
  const { interaction } = interactionState;
  const error = useInteractionState((state) =>
    selectInteractionError(state, interaction.id),
  );
  const resumeInteraction = useResumeInteraction();
  const hasActiveInteraction = useHasActiveInteraction();
  const interactionStatus = useInteractionStatusV2(interactionState);
  const wallets = useWallets();
  const disabled =
    hasActiveInteraction ||
    !isEveryAddressConnected(interaction.connectedWallets, wallets);

  if (
    interactionStatus === InteractionStatusV2.Completed
    // || interactionStatus === InteractionStatusV2.Active
  ) {
    return null;
  }

  if (error) {
    return (
      <EuiCallOut
        title="Sorry, there was an error"
        color="danger"
        iconType="alert"
        style={{ wordBreak: "break-word" }} // break long transaction IDs
      >
        {formatErrorJsx(error)}
        <EuiSpacer />
        <RetryOrResumeButton
          title={"Retry"}
          disabled={disabled}
          onClick={() => resumeInteraction(interaction.id)}
        />
      </EuiCallOut>
    );
  }

  return (
    <RetryOrResumeButton
      title={"Resume"}
      disabled={disabled}
      onClick={() => resumeInteraction(interaction.id)}
    />
  );
};

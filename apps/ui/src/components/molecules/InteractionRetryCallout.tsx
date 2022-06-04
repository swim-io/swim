import { EuiButton, EuiCallOut, EuiSpacer } from "@elastic/eui";
import type React from "react";

import { selectInteractionError } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import { formatErrorJsx } from "../../errors";
import {
  InteractionStatus,
  useHasActiveInteraction,
  useInteractionStatus,
  useResumeInteraction,
} from "../../hooks/interaction";
import type { InteractionState } from "../../models";

interface Props {
  readonly interactionState: InteractionState;
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

export const InteractionRetryCallout: React.FC<Props> = ({
  interactionState,
}) => {
  const { interaction } = interactionState;
  const error = useInteractionState((state) =>
    selectInteractionError(state, interaction.id),
  );
  const resumeInteraction = useResumeInteraction();
  const hasActiveInteraction = useHasActiveInteraction();
  const interactionStatus = useInteractionStatus(interactionState);

  if (
    interactionStatus === InteractionStatus.Completed ||
    interactionStatus === InteractionStatus.Active
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
          disabled={hasActiveInteraction}
          onClick={() => resumeInteraction(interaction.id)}
        />
      </EuiCallOut>
    );
  }

  return (
    <RetryOrResumeButton
      title={"Resume"}
      disabled={hasActiveInteraction}
      onClick={() => resumeInteraction(interaction.id)}
    />
  );
};

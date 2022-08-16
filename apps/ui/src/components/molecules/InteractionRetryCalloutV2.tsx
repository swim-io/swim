import { EuiButton, EuiCallOut, EuiSpacer } from "@elastic/eui";
import type { VFC } from "react";
import { useTranslation } from "react-i18next";

import { selectInteractionError } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import { formatErrorJsx } from "../../errors";
import {
  useHasActiveInteraction,
  useInteractionStatusV2,
  useResumeInteraction,
  useWallets,
} from "../../hooks";
import { InteractionStatusV2, isEveryAddressConnected } from "../../models";
import type { InteractionStateV2 } from "../../models";

interface Props {
  readonly interactionState: InteractionStateV2;
}

interface RetryOrResumeButtonProps {
  readonly title: string;
  readonly onClick: VoidFunction;
  readonly disabled: boolean;
}

const RetryOrResumeButton: VFC<RetryOrResumeButtonProps> = ({
  title,
  onClick,
  disabled,
}) => {
  const { t } = useTranslation();
  return (
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
        {t("general.get_help_button")}
      </EuiButton>
    </>
  );
};

export const InteractionRetryCalloutV2: VFC<Props> = ({ interactionState }) => {
  const { t } = useTranslation();
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
    interactionStatus === InteractionStatusV2.Completed ||
    interactionStatus === InteractionStatusV2.Active
  ) {
    return null;
  }

  if (error) {
    return (
      <EuiCallOut
        title={t("recent_interactions.error_title")}
        color="danger"
        iconType="alert"
        style={{ wordBreak: "break-word" }} // break long transaction IDs
      >
        {formatErrorJsx(error)}
        <EuiSpacer />
        <RetryOrResumeButton
          title={t("recent_interactions.retry_button")}
          disabled={disabled}
          onClick={() => resumeInteraction(interaction.id)}
        />
      </EuiCallOut>
    );
  }

  return (
    <RetryOrResumeButton
      title={t("recent_interactions.resume_button")}
      disabled={disabled}
      onClick={() => resumeInteraction(interaction.id)}
    />
  );
};

import {
  EuiBadge,
  EuiButton,
  EuiSpacer,
  EuiSteps,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import { isNotNull } from "@swim-io/utils";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useIntlDateTimeFormatter,
  useIntlRelativeTimeFromNow,
} from "../../../hooks";
import { useInteractionStatus } from "../../../hooks/interaction";
import { useReloadInteractionStateMutation } from "../../../hooks/interaction/useReloadInteractionStateMutation";
import type { InteractionState } from "../../../models";
import { InteractionStatus } from "../../../models";
import { InteractionRetryCallout } from "../InteractionRetryCallout";
import { InteractionTitle } from "../InteractionTitle";

import { buildEuiStepsForInteraction } from "./buildEuiStepsForInteraction";

interface Props {
  readonly interactionState: InteractionState;
}

export const InteractionStateComponent: React.FC<Props> = ({
  interactionState,
}) => {
  const { t } = useTranslation();
  const dateTimeFormatter = useIntlDateTimeFormatter({
    dateStyle: "full",
    timeStyle: "full",
  });
  const relativeTimeFromNow = useIntlRelativeTimeFromNow();

  const { interaction } = interactionState;
  const interactionStatus = useInteractionStatus(interactionState);
  const steps = buildEuiStepsForInteraction(
    interactionState,
    interactionStatus,
  );
  const { mutate: reloadInteractionState } =
    useReloadInteractionStateMutation();
  const [needReload, setNeedReload] = useState(
    interactionStatus === InteractionStatus.Incomplete,
  );

  useEffect(() => {
    if (needReload) {
      reloadInteractionState(interaction.id, {
        onSettled: () => setNeedReload(false),
      });
    }
  }, [interaction.id, needReload, reloadInteractionState]);

  return (
    <>
      <EuiTitle size="xs">
        <h3>
          <InteractionTitle interaction={interaction} />
        </h3>
      </EuiTitle>
      <EuiText
        size="s"
        title={dateTimeFormatter.format(interaction.submittedAt)}
      >
        {relativeTimeFromNow(interaction.submittedAt)}
      </EuiText>
      <EuiSpacer />
      <EuiSteps
        titleSize="xs"
        className="actionSteps"
        steps={steps.filter(isNotNull)}
      />
      {needReload ? (
        <EuiButton size="s" isLoading={true}>
          {t("recent_interactions.reload_interaction_state")}
        </EuiButton>
      ) : (
        <InteractionRetryCallout interactionState={interactionState} />
      )}
      {interactionStatus === InteractionStatus.Completed && (
        <EuiBadge color="success" iconType="check">
          {t("recent_interactions.completed_interaction_state")}
        </EuiBadge>
      )}
    </>
  );
};

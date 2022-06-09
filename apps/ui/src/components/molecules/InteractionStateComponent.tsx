import { EuiBadge, EuiSpacer, EuiSteps, EuiText, EuiTitle } from "@elastic/eui";
import moment from "moment";
import type React from "react";

import {
  InteractionStatus,
  useInteractionStatus,
} from "../../hooks/interaction";
import { useEuiStepPropsForInteraction } from "../../hooks/interaction/useEuiStepPropsForInteraction";
import type { InteractionState } from "../../models";
import { isNotNull } from "../../utils";

import { InteractionRetryCallout } from "./InteractionRetryCallout";
import { InteractionTitle } from "./InteractionTitle";

interface Props {
  readonly interactionState: InteractionState;
}

export const InteractionStateComponent: React.FC<Props> = ({
  interactionState,
}) => {
  const { interaction } = interactionState;
  const interactionStatus = useInteractionStatus(interactionState);
  const steps = useEuiStepPropsForInteraction(interactionState);
  return (
    <>
      <EuiTitle size="xs">
        <h3>
          <InteractionTitle interaction={interaction} />
        </h3>
      </EuiTitle>
      <EuiText size="s">{moment(interaction.submittedAt).fromNow()}</EuiText>
      <EuiSpacer />
      <EuiSteps
        titleSize="xs"
        className="actionSteps"
        steps={steps.filter(isNotNull)}
      />
      <InteractionRetryCallout interactionState={interactionState} />
      {interactionStatus === InteractionStatus.Completed && (
        <EuiBadge color="success" iconType="check">
          Completed
        </EuiBadge>
      )}
    </>
  );
};

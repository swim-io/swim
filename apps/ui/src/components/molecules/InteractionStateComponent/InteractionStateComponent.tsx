import {
  EuiBadge,
  EuiButton,
  EuiSpacer,
  EuiSteps,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import moment from "moment";
import type React from "react";
import { useEffect, useState } from "react";

import { useInteractionStatus } from "../../../hooks/interaction";
import { useReloadInteractionStateMutation } from "../../../hooks/interaction/useReloadInteractionStateMutation";
import type { InteractionState } from "../../../models";
import { InteractionStatus } from "../../../models";
import { isNotNull } from "../../../utils";
import { InteractionRetryCallout } from "../InteractionRetryCallout";
import { InteractionTitle } from "../InteractionTitle";

import { buildEuiStepsForInteraction } from "./buildEuiStepsForInteraction";

interface Props {
  readonly interactionState: InteractionState;
}

export const InteractionStateComponent: React.FC<Props> = ({
  interactionState,
}) => {
  const { interaction } = interactionState;
  const interactionStatus = useInteractionStatus(interactionState);
  const steps = buildEuiStepsForInteraction(
    interactionState,
    interactionStatus,
  );
  const timeInMoment = moment(interaction.submittedAt);
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
      <EuiText size="s" title={timeInMoment.toLocaleString()}>
        {timeInMoment.fromNow()}
      </EuiText>
      <EuiSpacer />
      <EuiSteps
        titleSize="xs"
        className="actionSteps"
        steps={steps.filter(isNotNull)}
      />
      {needReload ? (
        <EuiButton size="s" isLoading={true}>
          Loading
        </EuiButton>
      ) : (
        <InteractionRetryCallout interactionState={interactionState} />
      )}
      {interactionStatus === InteractionStatus.Completed && (
        <EuiBadge color="success" iconType="check">
          Completed
        </EuiBadge>
      )}
    </>
  );
};

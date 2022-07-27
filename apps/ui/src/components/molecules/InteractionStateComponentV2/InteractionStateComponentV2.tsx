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
import { useCallback, useEffect, useState } from "react";

import { useEnvironment } from "../../../core/store";
import { useInteractionStatusV2 } from "../../../hooks";
import type { InteractionStateV2 } from "../../../models";
import { InteractionStatusV2 } from "../../../models";
import { isNotNull } from "../../../utils";
import { InteractionRetryCalloutV2 } from "../InteractionRetryCalloutV2";
import { InteractionTitleV2 } from "../InteractionTitleV2";

import { buildEuiStepsForInteraction } from "./buildEuiStepsForInteraction";

interface Props {
  readonly interactionState: InteractionStateV2;
}

export const InteractionStateComponentV2: React.FC<Props> = ({
  interactionState,
}) => {
  const { interaction } = interactionState;
  const { env } = useEnvironment();
  const interactionStatus = useInteractionStatusV2(interactionState);
  const steps = buildEuiStepsForInteraction(
    interactionState,
    interactionStatus,
    env,
  );
  const timeInMoment = moment(interaction.submittedAt);

  // TODO: make a V2 of reload state
  const reloadInteractionState = useCallback(
    (
      id: string,
      option: {
        readonly onSettled: () => void;
      },
    ) => option.onSettled(),
    [],
  );

  const [needReload, setNeedReload] = useState(
    interactionStatus === InteractionStatusV2.Incomplete,
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
          <InteractionTitleV2 interaction={interaction} />
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
        <InteractionRetryCalloutV2 interactionState={interactionState} />
      )}
      {interactionStatus === InteractionStatusV2.Completed && (
        <EuiBadge color="success" iconType="check">
          Completed
        </EuiBadge>
      )}
    </>
  );
};

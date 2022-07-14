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

import {
  InteractionStatusV2,
  useEuiStepPropsForInteractionV2,
  useInteractionStatusV2,
  useReloadInteractionStateMutation,
} from "../../hooks";
import type { InteractionStateV2 } from "../../models";
import { isNotNull } from "../../utils";

import { InteractionRetryCalloutV2 } from "./InteractionRetryCalloutV2";
import { InteractionTitleV2 } from "./InteractionTitleV2";

interface Props {
  readonly interactionState: InteractionStateV2;
}

export const InteractionStateComponentV2: React.FC<Props> = ({
  interactionState,
}) => {
  const { interaction } = interactionState;
  const interactionStatus = useInteractionStatusV2(interactionState);
  const steps = useEuiStepPropsForInteractionV2(interactionState);
  const timeInMoment = moment(interaction.submittedAt);
  const { mutate: reloadInteractionState } =
    useReloadInteractionStateMutation();
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

import {
  EuiButtonGroup,
  EuiButtonIcon,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiPopover,
  EuiSpacer,
  EuiText,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { ChangeEvent, ReactElement } from "react";
import { useMemo, useState } from "react";

import { isValidSlippageFraction } from "../models";
import { defaultIfError } from "../utils";

const SLIPPAGE_PRESETS = [
  {
    id: `slippagePreset1`,
    label: "0.1%",
    value: 0.1,
  },
  {
    id: `slippagePreset2`,
    label: "0.5%",
    value: 0.5,
  },
  {
    id: `slippagePreset3`,
    label: "1%",
    value: 1.0,
  },
];

export const SlippageButton = ({
  slippagePercent,
  setSlippagePercent,
}: {
  readonly slippagePercent: string;
  readonly setSlippagePercent: (value: string) => void;
}): ReactElement => {
  const [isCogOpen, setIsCogOpen] = useState(false);

  const selectedSlippagePreset = useMemo(
    () =>
      SLIPPAGE_PRESETS.find(
        (preset) => preset.value === parseFloat(slippagePercent),
      )?.id ?? "",
    [slippagePercent],
  );

  const [formErrors, setFormErrors] = useState<readonly string[]>([]);

  const onChangeSlippage = (event: ChangeEvent<HTMLInputElement>): void => {
    setSlippagePercent(event.target.value);
  };

  const onCustomSlippageBlur = (): void => {
    const slippageFraction = defaultIfError(
      () => new Decimal(slippagePercent).div(100),
      null,
    );

    if (!isValidSlippageFraction(slippageFraction)) {
      setFormErrors(["Invalid slippage"]);
    } else {
      setFormErrors([]);
    }
  };

  const onChangeSlippagePreset = (optionId: string, value: string): void => {
    setSlippagePercent(value);
  };

  const cogButton = (
    <EuiButtonIcon
      iconType="gear"
      aria-label="Settings"
      onClick={() => {
        setIsCogOpen(!isCogOpen);
      }}
    />
  );

  const cogForm = (
    <EuiForm>
      <EuiText>
        <h5>Slippage tolerance</h5>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFlexGroup responsive={false}>
        <EuiFlexItem grow={true}>
          <EuiButtonGroup
            name="slippagePresets"
            legend="Presets to set slippage tolerance"
            options={SLIPPAGE_PRESETS}
            idSelected={selectedSlippagePreset}
            onChange={onChangeSlippagePreset}
            buttonSize="m"
            color="primary"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFieldText
            name="slippageNumeric"
            value={slippagePercent}
            onChange={onChangeSlippage}
            append="%"
            style={{ maxWidth: "50px" }}
            onBlur={onCustomSlippageBlur}
            isInvalid={formErrors.length > 0}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiForm>
  );

  return (
    <EuiPopover
      button={cogButton}
      isOpen={isCogOpen}
      closePopover={() => {
        setIsCogOpen(false);
      }}
      initialFocus="[name='slippageNumeric']"
    >
      <div>{cogForm}</div>
    </EuiPopover>
  );
};

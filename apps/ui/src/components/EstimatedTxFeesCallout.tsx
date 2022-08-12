import { EuiCallOut, EuiLoadingSpinner, EuiSpacer } from "@elastic/eui";
import type Decimal from "decimal.js";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import type { EcosystemId } from "../config";
import { ECOSYSTEM_IDS } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { useIntlNumberFormatter } from "../hooks";
import type { FeesEstimation } from "../models";

interface Props {
  readonly feesEstimation: Partial<FeesEstimation> | null;
}

export const EstimatedTxFeesCallout: FC<Props> = ({ feesEstimation }) => {
  const { t } = useTranslation();
  const numberFormatter = useIntlNumberFormatter({
    maximumSignificantDigits: 4,
  });
  const config = useEnvironment(selectConfig, shallow);
  if (feesEstimation === null) {
    return (
      <>
        <EuiCallOut iconType="visGauge" size="s" style={{ paddingLeft: 12 }}>
          <EuiLoadingSpinner size="m" />
          <span className="euiCallOutHeader__title" style={{ marginLeft: 8 }}>
            {t("general.estimating_transaction_fees")}
          </span>
        </EuiCallOut>
        <EuiSpacer />
      </>
    );
  }
  const txFeeArray = ECOSYSTEM_IDS.map((ecosystemId) => {
    return {
      ecosystemId,
      txFee: feesEstimation[ecosystemId],
    };
  }).filter(
    (
      txFeeObj,
    ): txFeeObj is {
      readonly ecosystemId: EcosystemId;
      readonly txFee: Decimal;
    } => {
      return txFeeObj.txFee !== undefined && !txFeeObj.txFee.isZero();
    },
  );

  return (
    <>
      <EuiCallOut
        size="s"
        iconType="visGauge"
        title={t("general.estimated_transaction_fees")}
        style={{ paddingLeft: 12 }}
      >
        <ul>
          {txFeeArray.map(({ ecosystemId, txFee }) => {
            const { displayName, nativeTokenSymbol } =
              config.ecosystems[ecosystemId];
            return (
              <li key={ecosystemId}>
                {displayName}
                {": ~"}
                {numberFormatter.format(txFee.toNumber())} {nativeTokenSymbol}
              </li>
            );
          })}
        </ul>
      </EuiCallOut>
      <EuiSpacer />
    </>
  );
};

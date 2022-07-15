import { EuiCallOut, EuiLoadingSpinner, EuiSpacer } from "@elastic/eui";
import type { FC } from "react";
import shallow from "zustand/shallow.js";

import { decimalRemoveTrailingZero } from "../amounts";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import type { FeesEstimation } from "../models";

interface Props {
  readonly feesEstimation: FeesEstimation | null;
}

export const EstimatedTxFeesCallout: FC<Props> = ({ feesEstimation }) => {
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  if (feesEstimation === null) {
    return (
      <>
        <EuiCallOut iconType="visGauge" size="s" style={{ paddingLeft: 12 }}>
          <EuiLoadingSpinner size="m" />
          <span className="euiCallOutHeader__title" style={{ marginLeft: 8 }}>
            Estimating Transaction Fees...
          </span>
        </EuiCallOut>
        <EuiSpacer />
      </>
    );
  }

  const txFeeArray = ecosystems
    .map((ecosystem) => {
      return {
        ecosystem: ecosystem,
        txFee: feesEstimation[ecosystem.id],
      };
    })
    .filter(({ txFee }) => !txFee.isZero());

  return (
    <>
      <EuiCallOut
        size="s"
        iconType="visGauge"
        title={`Estimated Transaction Fees`}
        style={{ paddingLeft: 12 }}
      >
        <ul>
          {txFeeArray.map(({ ecosystem, txFee }) => {
            const { displayName, gasToken } = ecosystem;
            return (
              <li key={ecosystem.id}>
                {displayName}
                {": ~"}
                {decimalRemoveTrailingZero(txFee)} {gasToken.symbol}
              </li>
            );
          })}
        </ul>
      </EuiCallOut>
      <EuiSpacer />
    </>
  );
};

import { EuiCallOut, EuiLoadingSpinner, EuiSpacer } from "@elastic/eui";
import type { FC } from "react";

import { decimalRemoveTrailingZero } from "../amounts";
import type { EvmEcosystemId } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironmentStore } from "../core/store";
import type { FeesEstimation } from "../models";

interface Props {
  readonly feesEstimation: FeesEstimation | null;
}

export const EstimatedTxFeesCallout: FC<Props> = ({ feesEstimation }) => {
  const config = useEnvironmentStore(selectConfig);
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
  const txFeeArray = Object.keys(feesEstimation)
    .map((ecosystemId) => {
      return {
        ecosystemId,
        txFee: feesEstimation[ecosystemId as EvmEcosystemId],
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
          {txFeeArray.map(({ ecosystemId, txFee }) => {
            const { displayName, nativeTokenSymbol } =
              config.ecosystems[ecosystemId as EvmEcosystemId];
            return (
              <li key={ecosystemId}>
                {displayName}
                {": ~"}
                {decimalRemoveTrailingZero(txFee)} {nativeTokenSymbol}
              </li>
            );
          })}
        </ul>
      </EuiCallOut>
      <EuiSpacer />
    </>
  );
};

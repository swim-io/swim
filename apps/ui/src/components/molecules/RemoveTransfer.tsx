import { EuiLoadingSpinner, EuiText } from "@elastic/eui";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { filterMap } from "@swim-io/utils";
import type { VFC } from "react";
import { useTranslation } from "react-i18next";

import type { EcosystemId, TokenConfig } from "../../config";
import { useIntlListFormatter } from "../../hooks";
import type { Amount } from "../../models";

import { TxEcosystemList } from "./TxList";

interface Props {
  readonly ecosystemId: EcosystemId;
  readonly fromToken: TokenConfig;
  readonly toAmounts: readonly Amount[];
  readonly isLoading: boolean;
  readonly transaction: string | null;
}

export const RemoveTransfer: VFC<Props> = ({
  ecosystemId,
  fromToken,
  toAmounts,
  isLoading,
  transaction,
}) => {
  const { t } = useTranslation();
  const listFormatter = useIntlListFormatter();
  const nonZeroOutputTokens = filterMap(
    (amount: Amount) => !amount.isZero(),
    (amount) => TOKEN_PROJECTS_BY_ID[amount.tokenConfig.projectId].symbol,
    toAmounts,
  );
  const outputTokenNames = listFormatter.format(nonZeroOutputTokens);
  const inputTokenName = TOKEN_PROJECTS_BY_ID[fromToken.projectId].symbol;

  return (
    <EuiText size="m">
      <span style={{ display: "flex", alignItems: "center" }}>
        {isLoading && <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />}
        <span>
          {t("recent_interactions.remove_x_get_y", {
            inputTokenName,
            outputTokenNames,
          })}
        </span>
      </span>
      {transaction && (
        <TxEcosystemList
          transactions={[transaction]}
          ecosystemId={ecosystemId}
        />
      )}
    </EuiText>
  );
};

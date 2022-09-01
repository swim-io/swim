import { EuiLoadingSpinner, EuiText } from "@elastic/eui";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { VFC } from "react";
import { useTranslation } from "react-i18next";

import type { EcosystemId, TokenConfig } from "../../config";
import { ECOSYSTEMS } from "../../config";

import { TxEcosystemList } from "./TxList";

interface Props {
  readonly ecosystemId: EcosystemId;
  readonly fromToken: TokenConfig;
  readonly toToken: TokenConfig;
  readonly isLoading: boolean;
  readonly transactions: readonly string[];
}

export const SwapTransfer: VFC<Props> = ({
  ecosystemId,
  fromToken,
  toToken,
  isLoading,
  transactions,
}) => {
  const { t } = useTranslation();
  return (
    <EuiText size="m">
      <span style={{ display: "flex", alignItems: "center" }}>
        {isLoading && <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />}
        <span>
          {t("recent_interactions.swap_token_from_x_to_y", {
            fromTokenName:
              TOKEN_PROJECTS_BY_ID[fromToken.projectId].displayName,
            toTokenName: TOKEN_PROJECTS_BY_ID[toToken.projectId].displayName,
            ecosystemName: ECOSYSTEMS[ecosystemId].displayName,
          })}
        </span>
      </span>
      <TxEcosystemList transactions={transactions} ecosystemId={ecosystemId} />
    </EuiText>
  );
};

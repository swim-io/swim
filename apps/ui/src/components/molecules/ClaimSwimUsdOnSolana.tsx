import { EuiLoadingSpinner, EuiText } from "@elastic/eui";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { VFC } from "react";
import { useTranslation } from "react-i18next";

import { useSwimUsd } from "../../hooks";

import { TxEcosystemList } from "./TxList";

interface Props {
  readonly isLoading: boolean;
  readonly transactions: readonly string[];
}

export const ClaimSwimUsdOnSolana: VFC<Props> = ({
  isLoading,
  transactions,
}) => {
  const { t } = useTranslation();
  const swimUsd = useSwimUsd();

  if (swimUsd === null) {
    return null;
  }

  return (
    <EuiText size="m">
      <span style={{ display: "flex", alignItems: "center" }}>
        {isLoading && <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />}
        <span>
          {t("recent_interactions.claim_token_on_solana", {
            tokenName: TOKEN_PROJECTS_BY_ID[swimUsd.projectId].displayName,
          })}
        </span>
      </span>
      <TxEcosystemList
        transactions={transactions}
        ecosystemId={SOLANA_ECOSYSTEM_ID}
      />
    </EuiText>
  );
};

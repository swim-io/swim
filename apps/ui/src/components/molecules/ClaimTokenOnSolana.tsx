import { EuiLoadingSpinner, EuiText } from "@elastic/eui";
import type { TokenConfig } from "@swim-io/core/types";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { VFC } from "react";
import { useTranslation } from "react-i18next";

import { TxEcosystemList } from "./TxList";

interface Props {
  readonly isLoading: boolean;
  readonly tokenConfig: TokenConfig;
  readonly transactions: readonly string[];
}

export const ClaimTokenOnSolana: VFC<Props> = ({
  isLoading,
  tokenConfig,
  transactions,
}) => {
  const { t } = useTranslation();
  return (
    <EuiText size="m">
      <span style={{ display: "flex", alignItems: "center" }}>
        {isLoading && <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />}
        <span>
          {t("recent_interactions.claim_token_on_solana", {
            tokenName: TOKEN_PROJECTS_BY_ID[tokenConfig.projectId].displayName,
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

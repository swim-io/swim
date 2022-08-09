import { EuiLoadingSpinner, EuiText } from "@elastic/eui";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { VFC } from "react";
import { useTranslation } from "react-i18next";

import type { EcosystemId, TokenSpec } from "../../../config";
import { ECOSYSTEMS } from "../../../config";
import { TxList } from "../TxList";

interface Props {
  readonly token: TokenSpec;
  readonly from: EcosystemId;
  readonly to: EcosystemId;
  readonly isLoading: boolean;
  readonly transactions: readonly {
    readonly txId: string;
    readonly ecosystem: EcosystemId;
  }[];
}

export const Transfer: VFC<Props> = ({
  token,
  from,
  to,
  isLoading,
  transactions,
}) => {
  const { t } = useTranslation();
  return (
    <EuiText size="m">
      <span style={{ display: "flex", alignItems: "center" }}>
        {isLoading && <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />}
        <span>
          {t("recent_interactions.transfer_token_from_x_to_y", {
            tokenName: TOKEN_PROJECTS_BY_ID[token.projectId].displayName,
            fromEcosystemName: ECOSYSTEMS[from].displayName,
            toEcosystemName: ECOSYSTEMS[to].displayName,
          })}
        </span>
      </span>
      <TxList transactions={transactions} />
    </EuiText>
  );
};

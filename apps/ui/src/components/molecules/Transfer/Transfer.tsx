import { EuiLoadingSpinner, EuiText } from "@elastic/eui";
import type { VFC } from "react";
import { useTranslation } from "react-i18next";

import type { EcosystemId, TokenConfig } from "../../../config";
import { ECOSYSTEMS, getTokenProject } from "../../../config";
import { TxList } from "../TxList";

interface Props {
  readonly token: TokenConfig;
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
            tokenName: getTokenProject(token.projectId).displayName,
            fromEcosystemName: ECOSYSTEMS[from].displayName,
            toEcosystemName: ECOSYSTEMS[to].displayName,
          })}
        </span>
      </span>
      <TxList transactions={transactions} />
    </EuiText>
  );
};

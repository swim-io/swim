import {
  EuiEmptyPrompt,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";

import { PoolPageInner } from "./PoolPage";

interface Props {
  readonly poolId: string;
}

const StakePage = ({ poolId }: Props): ReactElement => {
  const { t } = useTranslation();
  const { pools } = useEnvironment(selectConfig, shallow);
  const poolSpec = pools.find((pool) => pool.id === poolId) ?? null;
  return (
    <EuiPage className="stakePage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            {poolSpec ? (
              <PoolPageInner poolSpec={poolSpec} />
            ) : (
              <EuiEmptyPrompt
                iconType="alert"
                title={<h2>{t("general.error_cannot_found_pool")}</h2>}
                titleSize="xs"
                body={t("general.action_on_error_cannot_found_pool")}
              />
            )}
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default StakePage;

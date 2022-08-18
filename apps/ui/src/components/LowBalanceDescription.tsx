import { EvmEcosystemId } from "@swim-io/evm";
import type { FC, ReactElement } from "react";
import { useTranslation } from "react-i18next";

import type { Ecosystem, EcosystemId } from "../config";
import { ECOSYSTEMS } from "../config";

const ecosystemIdToDoc = new Map<EcosystemId, string>([
  [
    EvmEcosystemId.Acala,
    "https://wiki.acala.network/get-started/acala-network/acala-account#existential-deposit",
  ],
  [
    EvmEcosystemId.Karura,
    "https://wiki.acala.network/get-started/get-started/karura-account#existential-deposit",
  ],
]);

const createListItem = (ecosystem: Ecosystem): ReactElement => {
  if (ecosystemIdToDoc.has(ecosystem.id)) {
    return (
      <li key={ecosystem.displayName}>
        <a href={ecosystemIdToDoc.get(ecosystem.id)}>
          {`${ecosystem.displayName}*`}
        </a>
      </li>
    );
  }
  return <li key={ecosystem.id}>{ecosystem.displayName}</li>;
};

interface Props {
  readonly lowBalanceWallets: readonly EcosystemId[];
}

interface LowPolkadotBalanceWarningProps {
  readonly isVisible: boolean;
}

const LowPolkadotBalanceWarning = ({
  isVisible,
}: LowPolkadotBalanceWarningProps): ReactElement | null => {
  const { t } = useTranslation();
  if (!isVisible) {
    return null;
  }
  return <>{t("general.low_polkadot_balance_warning")}</>;
};

export const LowBalanceDescription: FC<Props> = ({ lowBalanceWallets }) => {
  const { t } = useTranslation();
  const isLowPolkadotBalance = lowBalanceWallets.some((ecosystemId) =>
    ecosystemIdToDoc.has(ecosystemId),
  );
  const lowBalanceEcosystems = lowBalanceWallets.map((ecosystemId) => {
    return ECOSYSTEMS[ecosystemId];
  });
  return (
    <p>
      <span>{t("general.low_balance_in_following_wallets")}</span>
      <ul>
        {lowBalanceEcosystems.map((ecosystem) => createListItem(ecosystem))}
      </ul>
      <LowPolkadotBalanceWarning isVisible={isLowPolkadotBalance} />
    </p>
  );
};

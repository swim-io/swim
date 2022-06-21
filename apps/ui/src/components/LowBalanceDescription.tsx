import type { FC, ReactElement } from "react";

import { EcosystemId, ecosystems } from "../config";

const EXSISTENTIAL_DEPOSIT_LINK =
  "https://support.polkadot.network/support/solutions/articles/65000168651-what-is-the-existential-deposit";

interface Props {
  readonly lowBalanceWallets: readonly EcosystemId[];
}

interface LowPolygonBalanceWarningProps {
  readonly isVisible: boolean;
}

const LowPolygonBalanceWarning = ({
  isVisible,
}: LowPolygonBalanceWarningProps): ReactElement | null => {
  if (!isVisible) {
    return null;
  }
  return (
    <span>
      <span>
        *Polygon chains require a minimum balance in order not to be deactivated
        according to
      </span>
      <a href={EXSISTENTIAL_DEPOSIT_LINK}>Existential Deposit</a>
      <span>&nbsp;requirements</span>
    </span>
  );
};

export const LowBalanceDescription: FC<Props> = ({ lowBalanceWallets }) => {
  let isLowPolygonBalance = false;
  const walletNames = lowBalanceWallets.map((ecosystemId) => {
    if ([EcosystemId.Acala, EcosystemId.Karura].includes(ecosystemId)) {
      isLowPolygonBalance = true;
      return ecosystems[ecosystemId].displayName + "*";
    } else {
      return ecosystems[ecosystemId].displayName;
    }
  });
  return (
    <p>
      <span>
        You have a low balance in the following wallets, and may not be able to
        cover all of the required transaction fees:
      </span>
      <ul>
        {walletNames.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <LowPolygonBalanceWarning isVisible={isLowPolygonBalance} />
    </p>
  );
};

import type { FC, ReactElement } from "react";

import { EcosystemId, ecosystems } from "../config";

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
      *Polygon chains require a minimium balance to not be deactivated from
      Exsistential Deposit requirements
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

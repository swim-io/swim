import type { FC, ReactElement } from "react";

import { EcosystemId, ecosystems } from "../config";

const EXISTENTIAL_DEPOSIT_LINK =
  "https://support.polkadot.network/support/solutions/articles/65000168651-what-is-the-existential-deposit";

interface Props {
  readonly lowBalanceWallets: readonly EcosystemId[];
}

interface LowPolkadotBalanceWarningProps {
  readonly isVisible: boolean;
}

const LowPolkadotBalanceWarning = ({
  isVisible,
}: LowPolkadotBalanceWarningProps): ReactElement | null => {
  if (!isVisible) {
    return null;
  }
  return (
    <span>
      <span>
        *Polkadot chains require a minimum balance in order not to be
        deactivated according to
      </span>
      <a href={EXISTENTIAL_DEPOSIT_LINK}> Existential Deposit</a>
      <span> requirements</span>
    </span>
  );
};

export const LowBalanceDescription: FC<Props> = ({ lowBalanceWallets }) => {
  let isLowPolkadotBalance = false;
  const walletNames = lowBalanceWallets.map((ecosystemId) => {
    if ([EcosystemId.Acala, EcosystemId.Karura].includes(ecosystemId)) {
      isLowPolkadotBalance = true;
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
      <LowPolkadotBalanceWarning isVisible={isLowPolkadotBalance} />
    </p>
  );
};

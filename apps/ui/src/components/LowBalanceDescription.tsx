import type { FC, ReactElement } from "react";

import { EcosystemId, ecosystems } from "../config";

const ACALA_EXISTENTIAL_DEPOSIT_LINK =
  "https://wiki.acala.network/get-started/acala-network/acala-account#existential-deposit";
const KARURA_EXISTENTIAL_DEPOSIT_LINK =
  "https://wiki.acala.network/get-started/get-started/karura-account#existential-deposit";

interface Props {
  readonly lowBalanceWallets: readonly EcosystemId[];
}

interface LowPolkadotBalanceWarningProps {
  readonly isVisibleAndAcala: null | boolean;
}

const LowPolkadotBalanceWarning = ({
  isVisibleAndAcala,
}: LowPolkadotBalanceWarningProps): ReactElement | null => {
  if (isVisibleAndAcala === null) {
    return null;
  }
  return (
    <span>
      <span>
        *Polkadot chains require a minimum balance in order not to be
        deactivated according to
      </span>
      <a
        href={
          isVisibleAndAcala
            ? ACALA_EXISTENTIAL_DEPOSIT_LINK
            : KARURA_EXISTENTIAL_DEPOSIT_LINK
        }
      >
        {" "}
        Existential Deposit
      </a>
      <span> requirements</span>
    </span>
  );
};

export const LowBalanceDescription: FC<Props> = ({ lowBalanceWallets }) => {
  let isPolkadotLowBalanceAndIsAcala: null | boolean = null;
  const walletNames = lowBalanceWallets.map((ecosystemId) => {
    if ([EcosystemId.Acala, EcosystemId.Karura].includes(ecosystemId)) {
      isPolkadotLowBalanceAndIsAcala = ecosystemId === EcosystemId.Acala;
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
      <LowPolkadotBalanceWarning
        isVisibleAndAcala={isPolkadotLowBalanceAndIsAcala}
      />
    </p>
  );
};

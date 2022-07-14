import shallow from "zustand/shallow.js";

import type { FC, ReactElement } from "react";

import type { EcosystemConfig } from "@swim-io/core-types";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { EcosystemId, UiEcosystemConfig } from "../config";
import { ACALA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-acala";
import { KARURA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-karura";

const ecosystemIdToDoc = new Map([
  [
    ACALA_ECOSYSTEM_ID,
    "https://wiki.acala.network/get-started/acala-network/acala-account#existential-deposit",
  ],
  [
    KARURA_ECOSYSTEM_ID,
    "https://wiki.acala.network/get-started/get-started/karura-account#existential-deposit",
  ],
]);

const createListItem = (ecosystem: UiEcosystemConfig): ReactElement => {
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
  if (!isVisible) {
    return null;
  }
  return (
    <>
      *Polkadot chains require a minimum balance in order not to be deactivated
      according to Existential Deposit requirements.
    </>
  );
};

export const LowBalanceDescription: FC<Props> = ({ lowBalanceWallets }) => {
  const isLowPolkadotBalance = lowBalanceWallets.some((ecosystemId) =>
    ecosystemIdToDoc.has(ecosystemId),
  );
  const lowBalanceEcosystems = lowBalanceWallets.map((ecosystemId) => {
    const { ecosystems } = useEnvironment(selectConfig, shallow);
    return ecosystems[ecosystemId];
  });
  return (
    <p>
      <span>
        You have a low balance in the following wallets, and may not be able to
        cover all of the required transaction fees:
      </span>
      <ul>
        {lowBalanceEcosystems.map((ecosystem) => createListItem(ecosystem))}
      </ul>
      <LowPolkadotBalanceWarning isVisible={isLowPolkadotBalance} />
    </p>
  );
};

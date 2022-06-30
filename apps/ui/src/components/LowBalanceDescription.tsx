import type { FC } from "react";

import type { EcosystemId } from "../config";
import { ECOSYSTEMS } from "../config";

interface Props {
  readonly lowBalanceWallets: readonly EcosystemId[];
}

export const LowBalanceDescription: FC<Props> = ({ lowBalanceWallets }) => {
  const walletNames = lowBalanceWallets.map(
    (ecosystemId) => ECOSYSTEMS[ecosystemId].displayName,
  );
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
    </p>
  );
};

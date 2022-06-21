import { EuiFormRow, EuiSpacer } from "@elastic/eui";
import type React from "react";

import { EcosystemId } from "../../config";
import { useSolanaWallet } from "../../hooks";
import { ConnectButton } from "../ConnectButton";

interface Props {
  readonly fromEcosystem: EcosystemId;
  readonly toEcosystem: EcosystemId;
}

// If a swap to/from Ethereum/BSC is desired, we still need a Solana wallet
export const SwapFormSolanaConnectButton: React.FC<Props> = ({
  fromEcosystem,
  toEcosystem,
}) => {
  const { connected } = useSolanaWallet();
  if (
    connected ||
    fromEcosystem === EcosystemId.Solana ||
    toEcosystem === EcosystemId.Solana
  ) {
    return null;
  }

  return (
    <>
      <EuiFormRow
        fullWidth
        helpText="This swap will route through Solana, so you need to connect a Solana wallet with SOL to pay for transaction fees."
      >
        <ConnectButton ecosystemId={EcosystemId.Solana} fullWidth />
      </EuiFormRow>
      <EuiSpacer />
    </>
  );
};

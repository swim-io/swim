import { EuiButton, EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
import { EcosystemId } from "config";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import type { TokenConfig } from "../../config";

import { TokenAddressWithEcosystemIcon, TokenConfigIcon } from "../TokenIcon";
import { WormholeTokenModal } from "./WormholeTokenModal";

interface Props {
  readonly onSelectToken: (token: TokenConfig) => void;
  readonly tokenOptionIds: readonly string[];
  readonly token: TokenConfig;
  readonly tokenAddress: string;
  readonly selectedEcosystemId: EcosystemId;
  readonly onSelectEcosystemId: (id: EcosystemId) => void;
  readonly onChangeTokenAddress: (address: string) => void;
}

export const WormholeTokenSelect = ({
  onSelectToken,
  tokenOptionIds,
  token,
  tokenAddress,
  selectedEcosystemId,
  onChangeTokenAddress,
  onSelectEcosystemId,
}: Props): ReactElement => {
  const [showModal, setShowModal] = useState(false);

  const openModal = useCallback(() => setShowModal(true), [setShowModal]);
  const closeModal = useCallback(() => setShowModal(false), [setShowModal]);

  return (
    <>
      <EuiButton
        iconType="arrowDown"
        iconSide="right"
        onClick={openModal}
        fullWidth
      >
        <EuiFlexGroup alignItems="center" justifyContent="center">
          <EuiFlexItem>
            {tokenAddress ? (
              <TokenAddressWithEcosystemIcon
                tokenAddress={tokenAddress}
                ecosystemId={selectedEcosystemId}
              />
            ) : (
              <TokenConfigIcon token={token} />
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiButton>
      {showModal && (
        <WormholeTokenModal
          handleClose={closeModal}
          handleSelectToken={onSelectToken}
          handleSelectEcosystem={onSelectEcosystemId}
          handleTokenAddress={onChangeTokenAddress}
          selectedEcosystemId={selectedEcosystemId}
          tokenOptionIds={tokenOptionIds}
          tokenAddress={tokenAddress}
        />
      )}
    </>
  );
};

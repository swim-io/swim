import { EuiButton, EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import { Ecosystem, ECOSYSTEMS } from "../config";
import { NetworkModal } from "./NetworkModal";

import { NetworkConfigIcon } from "./TokenIcon";

interface Props {
  readonly onSelectNetwork: (networkId: string) => void;
  readonly network: Ecosystem;
}

export const NetworkSelect = ({
  onSelectNetwork,
  network,
}: Props): ReactElement => {
  const [showModal, setShowModal] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState(
    ECOSYSTEMS.solana.id,
  );

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
            <NetworkConfigIcon network={network} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiButton>
      {showModal && (
        <NetworkModal
          handleClose={closeModal}
          handleSelectNetwork={onSelectNetwork}
          selectedNetworkId={selectedNetworkId}
        />
      )}
    </>
  );
};

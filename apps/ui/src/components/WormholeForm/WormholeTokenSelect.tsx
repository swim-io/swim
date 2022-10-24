import { EuiButton } from "@elastic/eui";
import type { WormholeToken } from "models";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import { WormholeTokenIcon } from "../TokenIcon";

import { WormholeTokenModal } from "./WormholeTokenModal";

interface Props {
  readonly onSelectToken: (token: WormholeToken) => void;
  readonly tokens: readonly WormholeToken[];
  readonly selectedToken: WormholeToken;
}

export const WormholeTokenSelect = ({
  onSelectToken,
  selectedToken,
  tokens,
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
        <WormholeTokenIcon token={selectedToken} showFullName={false} />
      </EuiButton>
      {showModal && (
        <WormholeTokenModal
          handleClose={closeModal}
          handleSelectToken={onSelectToken}
          tokens={tokens}
        />
      )}
    </>
  );
};

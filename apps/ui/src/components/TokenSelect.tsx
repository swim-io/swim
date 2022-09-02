import { EuiButton, EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import type { TokenConfig } from "../config";

import { TokenConfigIcon } from "./TokenIcon";
import { TokenSearchModal } from "./TokenSearchModal";

interface Props {
  readonly onSelectToken: (token: TokenConfig) => void;
  readonly tokenOptionIds: readonly string[];
  readonly token: TokenConfig;
}

export const TokenSelect = ({
  onSelectToken,
  tokenOptionIds,
  token,
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
            <TokenConfigIcon token={token} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiButton>
      {showModal && (
        <TokenSearchModal
          handleClose={closeModal}
          handleSelectToken={onSelectToken}
          tokenOptionIds={tokenOptionIds}
        />
      )}
    </>
  );
};

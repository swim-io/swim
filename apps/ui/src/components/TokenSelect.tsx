import { EuiButton } from "@elastic/eui";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import type { TokenSpec } from "../config";

import { TokenSpecIcon } from "./TokenIcon";
import { TokenSearchModal } from "./TokenSearchModal";

interface Props {
  readonly onSelectToken: (token: TokenSpec) => void;
  readonly tokenOptionIds: readonly string[];
  readonly token: TokenSpec;
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
      <EuiButton onClick={openModal} fullWidth>
        <TokenSpecIcon token={token} />
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

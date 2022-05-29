import { EuiButton } from "@elastic/eui";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import type { TokenSpec } from "../config";

import { NativeTokenIcon } from "./TokenIcon";
import { TokenSearchModal } from "./TokenSearchModal";

export interface TokenSelectProps {
  readonly onSelectToken: (tokenId: string) => void;
  readonly tokenOptionIds: ReadonlyArray<string>;
  readonly token: TokenSpec;
}

export const TokenSelect = ({
  onSelectToken,
  tokenOptionIds,
  token,
}: TokenSelectProps): ReactElement => {
  const [showModal, setShowModal] = useState(false);

  const openModal = useCallback(() => setShowModal(true), [setShowModal]);
  const onCloseModal = useCallback(() => setShowModal(false), [setShowModal]);

  return (
    <>
      <EuiButton onClick={openModal} fullWidth>
        <NativeTokenIcon {...token} />
      </EuiButton>
      {showModal && (
        <TokenSearchModal
          handleClose={onCloseModal}
          handleSelectToken={onSelectToken}
          tokenOptionIds={tokenOptionIds}
        />
      )}
    </>
  );
};

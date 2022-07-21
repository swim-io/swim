import { EuiButton } from "@elastic/eui";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import type { TokenOption } from "../models";

import { TokenOptionIcon } from "./TokenIcon";
import { TokenSearchModalV2 } from "./TokenSearchModalV2";

export interface TokenSelectProps {
  readonly onSelectTokenOption: (tokenOption: TokenOption) => void;
  readonly tokenOptions: readonly TokenOption[];
  readonly selectedTokenOption: TokenOption;
}

export const TokenSelectV2 = ({
  onSelectTokenOption,
  tokenOptions,
  selectedTokenOption,
}: TokenSelectProps): ReactElement => {
  const [showModal, setShowModal] = useState(false);

  const openModal = useCallback(() => setShowModal(true), [setShowModal]);
  const closeModal = useCallback(() => setShowModal(false), [setShowModal]);

  return (
    <>
      <EuiButton onClick={openModal} fullWidth>
        <TokenOptionIcon tokenOption={selectedTokenOption} />
      </EuiButton>
      {showModal && (
        <TokenSearchModalV2
          handleClose={closeModal}
          handleSelectTokenOption={onSelectTokenOption}
          tokenOptions={tokenOptions}
        />
      )}
    </>
  );
};

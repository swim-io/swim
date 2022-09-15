import { EuiButton } from "@elastic/eui";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import type { TokenOption } from "../models";

import { TokenConfigIcon } from "./TokenIcon";
import { TokenSearchModalV2 } from "./TokenSearchModalV2";

interface Props {
  readonly onSelectTokenOption: (tokenOption: TokenOption) => void;
  readonly tokenOptions: readonly TokenOption[];
  readonly selectedTokenOption: TokenOption;
}

export const TokenSelectV2 = ({
  onSelectTokenOption,
  tokenOptions,
  selectedTokenOption,
}: Props): ReactElement => {
  const [showModal, setShowModal] = useState(false);

  const openModal = useCallback(() => setShowModal(true), [setShowModal]);
  const closeModal = useCallback(() => setShowModal(false), [setShowModal]);

  return (
    <>
      <EuiButton onClick={openModal} fullWidth>
        <TokenConfigIcon
          token={selectedTokenOption.tokenConfig}
          ecosystem={selectedTokenOption.ecosystemId}
        />
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

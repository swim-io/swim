import { EuiButton, EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";

import type { TokenConfig } from "../config";
import type { TokenOption } from "../models";

import { TokenConfigIcon } from "./TokenIcon";
import { TokenSearchModal } from "./TokenSearchModal";

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
  const [selectedEcosystemId, setSelectedEcosystemId] = useState(
    selectedTokenOption.ecosystemId,
  );

  const tokenOptionIds = useMemo(
    () => tokenOptions.map(({ tokenConfig }) => tokenConfig.id),
    [tokenOptions],
  );

  const handleSelectToken = useCallback(
    (tokenConfig: TokenConfig) =>
      onSelectTokenOption({
        tokenConfig,
        ecosystemId: selectedEcosystemId,
      }),
    [onSelectTokenOption, selectedEcosystemId],
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
            <TokenConfigIcon
              token={selectedTokenOption.tokenConfig}
              ecosystem={selectedTokenOption.ecosystemId}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiButton>
      {showModal && (
        <TokenSearchModal
          handleClose={closeModal}
          handleSelectToken={handleSelectToken}
          handleSelectEcosystem={setSelectedEcosystemId}
          selectedEcosystemId={selectedEcosystemId}
          tokenOptionIds={tokenOptionIds}
          showSwimUsd
        />
      )}
    </>
  );
};

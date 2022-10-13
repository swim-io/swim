import { EuiButton, EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
import type { EcosystemId } from "config";
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

  const idKeywords = token.id.split("-");
  const isWrapppedToken = idKeywords.includes("wrapped");

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
              <TokenConfigIcon
                token={token}
                ecosystem={
                  isWrapppedToken
                    ? (idKeywords[idKeywords.length - 1] as EcosystemId)
                    : token.nativeEcosystemId
                }
              />
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

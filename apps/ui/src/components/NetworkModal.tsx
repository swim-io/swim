import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiText,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Ecosystem, ECOSYSTEM_LIST, isEcosystemEnabled } from "../config";
import { CustomModal } from "./CustomModal";

import "./TokenSearchModal.scss";

interface Props {
  readonly handleClose: () => void;
  readonly handleSelectNetwork: (networkId: string) => void;
  readonly selectedNetworkId: string;
}

export const NetworkModal = ({
  handleClose,
  handleSelectNetwork,
  selectedNetworkId,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const onSelectNetwork = useCallback(
    (networkId: string) => {
      handleSelectNetwork(networkId);
      handleClose();
    },
    [handleSelectNetwork, handleClose],
  );

  return (
    <CustomModal
      initialFocus="#token-search"
      onClose={handleClose}
      className="modal"
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>{t("network_select_modal.title")}</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody className="networkModalBody">
        <EuiFlexGroup gutterSize="s" className="chainGroup">
          {ECOSYSTEM_LIST.map(
            (ecosystem: Ecosystem) =>
              isEcosystemEnabled(ecosystem.id) && (
                <EuiFlexItem grow={true} key={ecosystem.id}>
                  <EuiButton
                    color={"primary"}
                    fill={ecosystem.id === selectedNetworkId}
                    isDisabled={false}
                    size="m"
                    onClick={() => onSelectNetwork(ecosystem.id)}
                  >
                    <EuiIcon
                      size="l"
                      type={ecosystem.logo}
                      style={{ marginRight: "10px" }}
                    />
                    <EuiText size="m">{ecosystem.displayName}</EuiText>
                  </EuiButton>
                </EuiFlexItem>
              ),
          )}
        </EuiFlexGroup>
      </EuiModalBody>
    </CustomModal>
  );
};

import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGrid,
  EuiFlexItem,
  EuiIcon,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPopover,
  EuiSpacer,
  EuiTitle,
} from "@elastic/eui";
import { filterMap, findOrThrow, groupBy, truncate } from "@swim-io/utils";
import type { ReactElement } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ECOSYSTEMS,
  PROTOCOL_NAMES,
  Protocol,
  getEcosystemsForProtocol,
  isEcosystemEnabled,
} from "../../config";
import { selectSelectedServiceByProtocol } from "../../core/selectors";
import { useWalletAdapter } from "../../core/store";
import { useEvmWallet, useSolanaWallet, useWalletService } from "../../hooks";
import EVM_SVG from "../../images/ecosystems/ethereum-color.svg";
import SOLANA_SVG from "../../images/ecosystems/solana.svg";
import type { WalletServiceId } from "../../models";
import { WALLET_SERVICES } from "../../models";
import { isUserOnMobileDevice } from "../../utils";
import { CustomModal } from "../CustomModal";
import { MobileDeviceDisclaimer } from "../MobileDeviceDisclaimer";
import { PlainConnectButton } from "../PlainConnectButton";

import "./MultiWalletModal.scss";

interface ProtocolWalletOptionsListProps {
  readonly icon: string;
  readonly protocol: Protocol;
}

const ProtocolWalletOptionsList = ({
  icon,
  protocol,
}: ProtocolWalletOptionsListProps): ReactElement => {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const selectedServiceByProtocol = useWalletAdapter(
    selectSelectedServiceByProtocol,
  );
  const { connectService, disconnectService } = useWalletService();
  const evm = useEvmWallet();
  const solana = useSolanaWallet();
  const selectedServiceId = selectedServiceByProtocol[protocol];
  const wallets = {
    [Protocol.Evm]: evm,
    [Protocol.Solana]: solana,
  };
  const protocolWallet = wallets[protocol];

  const ecosystemIds = getEcosystemsForProtocol(protocol);
  const protocolWalletServices = ecosystemIds.flatMap(
    (ecosystemId) => WALLET_SERVICES[ecosystemId],
  );
  const protocolWalletServicesByServiceId = groupBy(
    protocolWalletServices,
    (protocolWalletService) => protocolWalletService.id,
  );

  const disconnect = (): void => {
    void disconnectService({ protocol });
  };

  const connect = (serviceId: WalletServiceId) => {
    void connectService({ serviceId, protocol });
  };

  const handleButtonClick = () => setIsPopoverOpen((prev: boolean) => !prev);
  const handlePopoverClose = () => setIsPopoverOpen(false);

  const infoButton = (
    <EuiButtonIcon
      onClick={handleButtonClick}
      iconType="questionInCircle"
      aria-label={t("multi_wallet_modal.see_supported_chains_for_protocol", {
        protocolName: PROTOCOL_NAMES[protocol],
      })}
      style={{ marginLeft: 10 }}
    />
  );

  const popover = (
    <EuiPopover
      button={infoButton}
      isOpen={isPopoverOpen}
      closePopover={handlePopoverClose}
    >
      {ecosystemIds.length > 1 && (
        <ul className="protocolWalletOptionsList__ecosystems">
          {filterMap(
            isEcosystemEnabled,
            (ecosystemId) => (
              <li key={ecosystemId}>
                <EuiIcon type={ECOSYSTEMS[ecosystemId].logo} size="m" />
                {ECOSYSTEMS[ecosystemId].displayName}
              </li>
            ),
            ecosystemIds,
          )}
        </ul>
      )}
    </EuiPopover>
  );

  return (
    <EuiFlexItem className="protocolWalletOptionsList">
      <EuiTitle size="xs">
        <h2 style={{ whiteSpace: "nowrap" }}>
          <EuiIcon type={icon} size="l" style={{ marginRight: "8px" }} />
          {PROTOCOL_NAMES[protocol]}
          {ecosystemIds.length > 1 ? <span>{popover}</span> : null}
        </h2>
      </EuiTitle>
      <EuiSpacer size="s" />
      {Object.keys(protocolWalletServicesByServiceId).map((serviceId) => {
        const service = findOrThrow(
          protocolWalletServices,
          (walletService) => walletService.id === serviceId,
        );

        const connectedServiceWallet =
          protocolWallet.connected && serviceId === selectedServiceId
            ? protocolWallet
            : null;

        return (
          <PlainConnectButton
            key={`${protocol}:${serviceId}`}
            onClick={
              connectedServiceWallet ? disconnect : () => connect(service.id)
            }
            color={connectedServiceWallet ? "success" : "primary"}
            iconType={service.info.icon}
            ButtonComponent={EuiButtonEmpty}
            connected={!!connectedServiceWallet}
            helpText={service.info.helpText}
          >
            {connectedServiceWallet && connectedServiceWallet.address
              ? truncate(connectedServiceWallet.address)
              : service.info.name}
          </PlainConnectButton>
        );
      })}
    </EuiFlexItem>
  );
};

interface Props {
  readonly handleClose: () => void;
}

export const MultiWalletModal = ({ handleClose }: Props): ReactElement => {
  const { t } = useTranslation();
  return (
    <CustomModal onClose={handleClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>{t("multi_wallet_modal.title")}</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {isUserOnMobileDevice() ? <MobileDeviceDisclaimer /> : ""}
        <EuiSpacer />
        <EuiFlexGrid columns={2} gutterSize="xl">
          <ProtocolWalletOptionsList
            icon={SOLANA_SVG}
            protocol={Protocol.Solana}
          />
          <ProtocolWalletOptionsList icon={EVM_SVG} protocol={Protocol.Evm} />
        </EuiFlexGrid>
      </EuiModalBody>
    </CustomModal>
  );
};

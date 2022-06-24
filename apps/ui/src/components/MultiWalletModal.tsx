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
import type { ReactElement } from "react";
import { useState } from "react";

import {
  Protocol,
  ecosystems,
  getEcosystemsForProtocol,
  isEcosystemEnabled,
  protocolNames,
} from "../config";
import { selectSelectedServiceByProtocol } from "../core/selectors";
import { useWalletAdapter } from "../core/store";
import { useEvmWallet, useSolanaWallet, useWalletService } from "../hooks";
import EVM_SVG from "../images/ecosystems/ethereum-color.svg";
import SOLANA_SVG from "../images/ecosystems/solana.svg";
import type { WalletServiceId } from "../models";
import { WALLET_SERVICES } from "../models";
import {
  filterMap,
  findOrThrow,
  groupBy,
  isUserOnMobileDevice,
  shortenAddress,
} from "../utils";

import { CustomModal } from "./CustomModal";
import { MobileDeviceDisclaimer } from "./MobileDeviceDisclaimer";
import { PlainConnectButton } from "./PlainConnectButton";

import "./MultiWalletModal.scss";

interface ProtocolWalletOptionsListProps {
  readonly icon: string;
  readonly protocol: Protocol;
}

const ProtocolWalletOptionsList = ({
  icon,
  protocol,
}: ProtocolWalletOptionsListProps): ReactElement => {
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
      aria-label={`See the supported chains of the ${protocolNames[protocol]} protocol`}
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
                <EuiIcon type={ecosystems[ecosystemId].logo} size="m" />
                {ecosystems[ecosystemId].displayName}
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
          {protocolNames[protocol]}
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
              ? shortenAddress(connectedServiceWallet.address)
              : service.info.name}
          </PlainConnectButton>
        );
      })}
    </EuiFlexItem>
  );
};

export interface MultiWalletModalProps {
  readonly handleClose: () => void;
}

export const MultiWalletModal = ({
  handleClose,
}: MultiWalletModalProps): ReactElement => {
  return (
    <CustomModal onClose={handleClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Connect Wallets</h1>
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

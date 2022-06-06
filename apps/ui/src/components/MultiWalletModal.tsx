import {
  EuiButtonEmpty,
  EuiFlexGrid,
  EuiFlexItem,
  EuiIcon,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiTitle,
} from "@elastic/eui";
import type { ReactElement } from "react";

import type { Ecosystem } from "../config";
import { Protocol, getEcosystemsForProtocol, protocolNames } from "../config";
import { useWalletService, useWallets } from "../hooks";
import EVM_SVG from "../images/ecosystems/ethereum-color.svg";
import SOLANA_SVG from "../images/ecosystems/solana.svg";
import { WALLET_SERVICES } from "../models";
import type { WalletService } from "../models";
import {
  findOrThrow,
  groupBy,
  isUserOnMobileDevice,
  shortenAddress,
} from "../utils";

import { CustomModal } from "./CustomModal";
import { MobileDeviceDisclaimer } from "./MobileDeviceDisclaimer";
import { PlainConnectButton } from "./PlainConnectButton";

import "./MultiWalletModal.scss";

interface WalletServiceButtonProps<W extends WalletService = WalletService> {
  readonly service: W;
  readonly onClick: () => void;
  readonly disconnect: () => void;
  readonly serviceConnected: boolean;
  readonly address: string | null;
  readonly ecosystems: ReadonlyArray<Ecosystem>;
}

const WalletServiceButton = <W extends WalletService = WalletService>({
  service,
  disconnect,
  onClick,
  serviceConnected,
  address,
  ecosystems,
}: WalletServiceButtonProps<W>): ReactElement => {
  const {
    info: { icon, name, helpText },
  } = service;
  return (
    <span className="walletServiceButton">
      <PlainConnectButton
        onClick={serviceConnected ? disconnect : onClick}
        color={serviceConnected ? "success" : "primary"}
        iconType={icon}
        ButtonComponent={EuiButtonEmpty}
        connected={serviceConnected}
        helpText={helpText}
      >
        {serviceConnected && address ? shortenAddress(address) : name}
      </PlainConnectButton>
      {ecosystems.length > 1 && (
        <ul className="walletServiceButton__ecosystems">
          {ecosystems.map((ecosystem) => (
            <li key={ecosystem.displayName}>
              <EuiIcon type={ecosystem.logo} size="m" />
              {ecosystem.displayName}
            </li>
          ))}
        </ul>
      )}
    </span>
  );
};

interface ProtocolWalletOptionsListProps {
  readonly icon: string;
  readonly protocol: Protocol;
}

const ProtocolWalletOptionsList = ({
  icon,
  protocol,
}: ProtocolWalletOptionsListProps): ReactElement => {
  const wallets = useWallets();
  const { connectService, disconnectService } = useWalletService();
  const ecosystemIds = getEcosystemsForProtocol(protocol);
  const protocolWalletServices = ecosystemIds.flatMap(
    (ecosystemId) => WALLET_SERVICES[ecosystemId],
  );
  const protocolWalletServicesByServiceId = groupBy(
    protocolWalletServices,
    (protocolWalletService) => protocolWalletService.id,
  );
  const protocolWallets = ecosystemIds.map(
    (ecosystemId) => wallets[ecosystemId],
  );

  const connectedWallets = protocolWallets.filter((wallet) => wallet.connected);

  const disconnect = (): void => {
    void disconnectService(protocol);
  };

  const connect = (serviceId: string) => {
    void connectService(serviceId, protocol);

    protocolWalletServicesByServiceId[serviceId].forEach((walletService) => {
      const ecosystemId = walletService.info.ecosystem.id;
      const wallet = wallets[ecosystemId];

      if (wallet.setServiceId) {
        wallet.setServiceId(serviceId);
      }
    });
  };

  return (
    <EuiFlexItem style={{ minWidth: "180px" }}>
      <EuiTitle size="xs">
        <h2 style={{ whiteSpace: "nowrap" }}>
          <EuiIcon type={icon} size="l" style={{ marginRight: "8px" }} />
          {protocolNames[protocol]}
        </h2>
      </EuiTitle>
      <EuiSpacer size="s" />
      {Object.entries(protocolWalletServicesByServiceId).map(
        ([serviceId, serviceWalletServices]) => {
          const service = findOrThrow(
            protocolWalletServices,
            (walletService) => walletService.id === serviceId,
          );

          const ecosystems = serviceWalletServices.map(
            (walletService) => walletService.info.ecosystem,
          );

          const connectedWallet =
            connectedWallets.find(
              (wallet) => wallet.service?.id === serviceId,
            ) ?? null;

          return (
            <WalletServiceButton
              key={`${protocol}:${serviceId}`}
              service={service}
              ecosystems={ecosystems}
              serviceConnected={!!connectedWallet}
              address={connectedWallet ? connectedWallet.address : null}
              disconnect={() => disconnect()}
              onClick={() => connect(service.id)}
            />
          );
        },
      )}
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
        <EuiFlexGrid columns={3} gutterSize="xl">
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

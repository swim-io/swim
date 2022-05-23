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
import { Fragment } from "react";

import { EcosystemId } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { useWallets } from "../hooks";
import AVALANCHE_SVG from "../images/ecosystems/avalanche.svg";
import BSC_SVG from "../images/ecosystems/bsc.svg";
import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
import POLYGON_SVG from "../images/ecosystems/polygon.svg";
import SOLANA_SVG from "../images/ecosystems/solana.svg";
import {
  AVALANCHE_WALLET_SERVICES,
  BSC_WALLET_SERVICES,
  ETHEREUM_WALLET_SERVICES,
  POLYGON_WALLET_SERVICES,
  SOLANA_WALLET_SERVICES,
} from "../models";
import type { WalletService } from "../models";
import { isUserOnMobileDevice, shortenAddress } from "../utils";

import { CustomModal } from "./CustomModal";
import { MobileDeviceDisclaimer } from "./MobileDeviceDisclaimer";

import "./ConnectButton.scss";

interface WalletServiceButtonProps<W extends WalletService = WalletService> {
  readonly service: W;
  readonly onClick: () => void;
  readonly disconnect: () => void;
  readonly serviceConnected: boolean;
  readonly address: string | null;
}

const WalletServiceButton = <W extends WalletService = WalletService>({
  service,
  disconnect,
  onClick,
  serviceConnected,
  address,
}: WalletServiceButtonProps<W>): ReactElement => {
  const {
    info: { icon, name, helpText },
  } = service;
  return (
    <span className="eui-textNoWrap">
      <EuiButtonEmpty
        className={`connect-button ${
          serviceConnected ? "connected connected-service" : ""
        }`}
        onClick={serviceConnected ? disconnect : onClick}
        color={serviceConnected ? "success" : "primary"}
        iconType={icon}
      >
        <span>
          {serviceConnected && address ? shortenAddress(address) : name}
        </span>
        {helpText && <>{helpText}</>}
        <EuiIcon className="exit-icon" type="crossInACircleFilled" size="m" />
      </EuiButtonEmpty>
    </span>
  );
};

interface EcosystemWalletOptionsListProps<
  W extends WalletService = WalletService,
> {
  readonly address: string | null;
  readonly connected: boolean;
  readonly icon: string;
  readonly ecosystemName: string;
  readonly walletServices: readonly W[];
  readonly ecosystemId: EcosystemId;
  readonly createServiceClickHandler: (service: W) => () => void;
}

const EcosystemWalletOptionsList = <W extends WalletService = WalletService>({
  address,
  icon,
  connected,
  ecosystemName,
  walletServices,
  ecosystemId,
  createServiceClickHandler,
}: EcosystemWalletOptionsListProps<W>): ReactElement => {
  // needed for wallet extraction to work
  if (ecosystemId === EcosystemId.Terra) {
    throw new Error("Unsupported ecosystem");
  }
  const wallets = useWallets();
  const { wallet, service: currentService } = wallets[ecosystemId];

  const disconnect = (): void => {
    void wallet?.disconnect();
  };

  return (
    <EuiFlexItem style={{ minWidth: "180px" }}>
      <EuiTitle size="xs">
        <h2 style={{ whiteSpace: "nowrap" }}>
          <EuiIcon type={icon} size="l" style={{ marginRight: "8px" }} />
          {ecosystemName}
        </h2>
      </EuiTitle>
      <EuiSpacer size="s" />
      {walletServices.map((service) => {
        return (
          <Fragment key={`${ecosystemName}:${service.info.name}`}>
            <WalletServiceButton
              service={service}
              serviceConnected={
                connected && currentService?.info.name === service.info.name
              }
              address={address}
              disconnect={disconnect}
              onClick={createServiceClickHandler(service)}
            />
          </Fragment>
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
  const { solana, ethereum, bsc, avalanche, polygon } = useWallets();

  const { ecosystems } = useEnvironment(selectConfig);
  const solanaEcosystem = ecosystems[EcosystemId.Solana];
  const ethereumEcosystem = ecosystems[EcosystemId.Ethereum];
  const bscEcosystem = ecosystems[EcosystemId.Bsc];
  const avalancheEcosystem = ecosystems[EcosystemId.Avalanche];
  const polygonEcosystem = ecosystems[EcosystemId.Polygon];

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
          <EcosystemWalletOptionsList
            address={solana.address}
            connected={solana.connected}
            icon={SOLANA_SVG}
            ecosystemName={solanaEcosystem.displayName}
            walletServices={SOLANA_WALLET_SERVICES}
            ecosystemId={EcosystemId.Solana}
            createServiceClickHandler={solana.createServiceClickHandler}
          />
          <EcosystemWalletOptionsList
            address={ethereum.address}
            connected={ethereum.connected}
            icon={ETHEREUM_SVG}
            ecosystemName={ethereumEcosystem.displayName}
            walletServices={ETHEREUM_WALLET_SERVICES}
            ecosystemId={EcosystemId.Ethereum}
            createServiceClickHandler={ethereum.createServiceClickHandler}
          />
          <EcosystemWalletOptionsList
            address={bsc.address}
            connected={bsc.connected}
            icon={BSC_SVG}
            ecosystemName={bscEcosystem.displayName}
            walletServices={BSC_WALLET_SERVICES}
            ecosystemId={EcosystemId.Bsc}
            createServiceClickHandler={bsc.createServiceClickHandler}
          />
          <EcosystemWalletOptionsList
            address={avalanche.address}
            connected={avalanche.connected}
            icon={AVALANCHE_SVG}
            ecosystemName={avalancheEcosystem.displayName}
            walletServices={AVALANCHE_WALLET_SERVICES}
            ecosystemId={EcosystemId.Avalanche}
            createServiceClickHandler={avalanche.createServiceClickHandler}
          />
          <EcosystemWalletOptionsList
            address={polygon.address}
            connected={polygon.connected}
            icon={POLYGON_SVG}
            ecosystemName={polygonEcosystem.displayName}
            walletServices={POLYGON_WALLET_SERVICES}
            ecosystemId={EcosystemId.Polygon}
            createServiceClickHandler={polygon.createServiceClickHandler}
          />
        </EuiFlexGrid>
      </EuiModalBody>
    </CustomModal>
  );
};

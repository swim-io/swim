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
import shallow from "zustand/shallow.js";

import {
  ECOSYSTEM_IDS,
  EcosystemId,
  isEcosystemEnabled,
  isEvmEcosystemId,
} from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { useWallets } from "../hooks";
import ACALA_SVG from "../images/ecosystems/acala.svg";
import AURORA_SVG from "../images/ecosystems/aurora.svg";
import AVALANCHE_SVG from "../images/ecosystems/avalanche.svg";
import BSC_SVG from "../images/ecosystems/bsc.svg";
import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
import FANTOM_SVG from "../images/ecosystems/fantom.svg";
import KARURA_SVG from "../images/ecosystems/karura.svg";
import POLYGON_SVG from "../images/ecosystems/polygon.svg";
import SOLANA_SVG from "../images/ecosystems/solana.svg";
import { WALLET_SERVICES } from "../models";
import type { WalletService } from "../models";
import type { ReadonlyRecord } from "../utils";
import { isNotNull, isUserOnMobileDevice, shortenAddress } from "../utils";

import { CustomModal } from "./CustomModal";
import { MobileDeviceDisclaimer } from "./MobileDeviceDisclaimer";

import "./ConnectButton.scss";

const ICONS: ReadonlyRecord<EcosystemId, string> = {
  [EcosystemId.Solana]: SOLANA_SVG,
  [EcosystemId.Ethereum]: ETHEREUM_SVG,
  [EcosystemId.Terra]: "",
  [EcosystemId.Bsc]: BSC_SVG,
  [EcosystemId.Avalanche]: AVALANCHE_SVG,
  [EcosystemId.Polygon]: POLYGON_SVG,
  [EcosystemId.Aurora]: AURORA_SVG,
  [EcosystemId.Fantom]: FANTOM_SVG,
  [EcosystemId.Karura]: KARURA_SVG,
  [EcosystemId.Acala]: ACALA_SVG,
};

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
  const wallets = useWallets();
  const { ecosystems } = useEnvironment(selectConfig, shallow);

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
          {ECOSYSTEM_IDS.filter(isEcosystemEnabled)
            .map((ecosystemId) =>
              ecosystemId === EcosystemId.Solana ||
              isEvmEcosystemId(ecosystemId) ? (
                <EcosystemWalletOptionsList
                  key={ecosystemId}
                  ecosystemId={ecosystemId}
                  ecosystemName={ecosystems[ecosystemId].displayName}
                  address={wallets[ecosystemId].address}
                  connected={wallets[ecosystemId].connected}
                  icon={ICONS[ecosystemId]}
                  walletServices={WALLET_SERVICES[EcosystemId.Solana]}
                  createServiceClickHandler={
                    wallets[ecosystemId].createServiceClickHandler
                  }
                />
              ) : null,
            )
            .filter(isNotNull)}
        </EuiFlexGrid>
      </EuiModalBody>
    </CustomModal>
  );
};

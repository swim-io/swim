import type { EuiButtonProps, PropsForButton } from "@elastic/eui";
import { EuiButton, EuiHideFor, EuiIcon, EuiShowFor } from "@elastic/eui";
import type { ReactElement } from "react";
import { useState } from "react";
import shallow from "zustand/shallow.js";

import { EcosystemId } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment, useWalletAdapter } from "../core/store";
import { useWallets } from "../hooks";
import AVALANCHE_SVG from "../images/ecosystems/avalanche.svg";
import BSC_SVG from "../images/ecosystems/bsc.svg";
import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
import POLYGON_SVG from "../images/ecosystems/polygon.svg";
import SOLANA_SVG from "../images/ecosystems/solana.svg";
import { shortenAddress } from "../utils";

import { MultiWalletModal } from "./MultiWalletModal";

import "./ConnectButton.scss";

export interface ConnectButtonProps extends PropsForButton<EuiButtonProps> {
  readonly ecosystemId: EcosystemId;
}

export const ConnectButton = ({
  children,
  ecosystemId,
  ...rest
}: ConnectButtonProps): ReactElement => {
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  const { disconnectService } = useWalletAdapter();
  if (ecosystemId === EcosystemId.Terra) {
    throw new Error("Unsupported ecosystem");
  }
  const ecosystem = ecosystems[ecosystemId];
  const wallets = useWallets();
  const { connected, select, address } = wallets[ecosystemId];

  const disconnect = (): void => {
    void disconnectService(ecosystem.protocol);
  };

  const handleClick = connected ? disconnect : select;

  return (
    <EuiButton
      {...rest}
      className={`connect-button ${connected ? "connected" : ""}`} // used for hover effect, see css
      onClick={handleClick}
      iconType={ecosystem.logo}
      iconSide="left"
    >
      <span>
        {connected ? (
          children ? (
            children
          ) : address ? (
            shortenAddress(address)
          ) : (
            ""
          )
        ) : (
          <>
            <EuiShowFor sizes={["xs"]}>Connect</EuiShowFor>
            <EuiHideFor sizes={["xs"]}>
              Connect {ecosystem.displayName}
            </EuiHideFor>
          </>
        )}
      </span>
      <EuiIcon className="exit-icon" type="crossInACircleFilled" size="m" />
    </EuiButton>
  );
};

export const MultiConnectButton = ({
  ...rest
}: PropsForButton<EuiButtonProps>): ReactElement => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const closeModal = (): void => setIsWalletModalOpen(false);
  const openModal = (): void => setIsWalletModalOpen(true);

  const {
    solana: { connected: isSolanaConnected },
    ethereum: { connected: isEthereumConnected },
    bsc: { connected: isBscConnected },
    avalanche: { connected: isAvalancheConnected },
    polygon: { connected: isPolygonConnected },
  } = useWallets();
  const connectedStatuses = [
    isSolanaConnected,
    isEthereumConnected,
    isBscConnected,
    isAvalancheConnected,
    isPolygonConnected,
  ];
  const nConnected = connectedStatuses.filter(Boolean).length;

  const label =
    nConnected > 0 ? (
      <>
        {isSolanaConnected && <EuiIcon type={SOLANA_SVG} size="l" />}
        {isEthereumConnected && <EuiIcon type={ETHEREUM_SVG} size="l" />}
        {isBscConnected && <EuiIcon type={BSC_SVG} size="l" />}
        {isAvalancheConnected && <EuiIcon type={AVALANCHE_SVG} size="l" />}
        {isPolygonConnected && <EuiIcon type={POLYGON_SVG} size="l" />}
        &nbsp;{nConnected}
        <span>&nbsp;connected</span>
      </>
    ) : (
      <>
        <EuiIcon type={SOLANA_SVG} size="l" />
        <EuiIcon type={ETHEREUM_SVG} size="l" />
        <EuiIcon type={BSC_SVG} size="l" />
        {/* TODO: Consider adding these:
        <EuiIcon type={AVALANCHE_SVG} size="l" />
        <EuiIcon type={POLYGON_SVG} size="l" /> */}
        &nbsp;
        <EuiShowFor sizes={["xs"]}>Connect</EuiShowFor>
        <EuiHideFor sizes={["xs"]}>Connect Wallets</EuiHideFor>
      </>
    );

  return (
    <>
      <EuiButton
        onClick={openModal}
        {...rest}
        className={`multiConnectButton ${rest.className ?? ""}`}
      >
        {label}
      </EuiButton>
      {isWalletModalOpen && <MultiWalletModal handleClose={closeModal} />}
    </>
  );
};

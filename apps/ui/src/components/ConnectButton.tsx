import type { EuiButtonProps, PropsForButton } from "@elastic/eui";
import { EuiButton, EuiHideFor, EuiIcon, EuiShowFor } from "@elastic/eui";
import type { ReactElement } from "react";
import { useState } from "react";

import { EcosystemId } from "../config";
import { useConfig } from "../contexts";
import { useWallets } from "../hooks";
import BSC_SVG from "../images/bsc.svg";
import ETHEREUM_SVG from "../images/ethereum.svg";
import SOLANA_SVG from "../images/solana.svg";
import { shortenAddress } from "../utils";

import { MultiWalletModal } from "./MultiWalletModal";

import "./ConnectButton.scss";

export const LABEL_MAP: Record<EcosystemId, string> = {
  [EcosystemId.Solana]: "Connect Solana",
  [EcosystemId.Ethereum]: "Connect Ethereum",
  [EcosystemId.Terra]: "Connect Terra",
  [EcosystemId.Bsc]: "Connect BNB Chain",
  [EcosystemId.Avalanche]: "Connect Avalanche",
  [EcosystemId.Polygon]: "Connect Polygon",
};

export interface ConnectButtonProps extends PropsForButton<EuiButtonProps> {
  readonly ecosystemId: EcosystemId;
}

export const ConnectButton = ({
  children,
  ecosystemId,
  ...rest
}: ConnectButtonProps): ReactElement => {
  const { ecosystems } = useConfig();
  if (ecosystemId === EcosystemId.Terra) {
    throw new Error("Unsupported ecosystem");
  }
  const ecosystem = ecosystems[ecosystemId];
  const wallets = useWallets();
  const { connected, select, address, wallet } = wallets[ecosystemId];

  const disconnect = (): void => {
    wallet?.disconnect();
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
            <EuiHideFor sizes={["xs"]}>{LABEL_MAP[ecosystemId]}</EuiHideFor>
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
  } = useWallets();
  const connectedStatuses = [
    isSolanaConnected,
    isEthereumConnected,
    isBscConnected,
  ];
  const nConnected = connectedStatuses.filter(Boolean).length;

  const label =
    nConnected > 0 ? (
      <>
        {isSolanaConnected && <EuiIcon type={SOLANA_SVG} size="l" />}
        {isEthereumConnected && <EuiIcon type={ETHEREUM_SVG} size="l" />}
        {isBscConnected && <EuiIcon type={BSC_SVG} size="l" />}
        &nbsp;{nConnected}
        <span>&nbsp;connected</span>
      </>
    ) : (
      <>
        <EuiIcon type={SOLANA_SVG} size="l" />
        <EuiIcon type={ETHEREUM_SVG} size="l" />
        <EuiIcon type={BSC_SVG} size="l" />
        &nbsp;
        <EuiShowFor sizes={["xs"]}>Connect</EuiShowFor>
        <EuiHideFor sizes={["xs"]}>Connect Wallets</EuiHideFor>
      </>
    );

  return (
    <>
      <EuiButton onClick={openModal} {...rest}>
        {label}
      </EuiButton>
      {isWalletModalOpen && <MultiWalletModal handleClose={closeModal} />}
    </>
  );
};

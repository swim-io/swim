import type { EuiButtonProps, PropsForButton } from "@elastic/eui";
import { EuiButton, EuiHideFor, EuiIcon, EuiShowFor } from "@elastic/eui";
import type { ReactElement } from "react";
import { useState } from "react";
import shallow from "zustand/shallow.js";

import { EcosystemId } from "../config";
import { selectConfig, selectWalletAdapterApi } from "../core/selectors";
import { useEnvironment, useWalletAdapter } from "../core/store";
import { useWallets } from "../hooks";
import type { WalletService } from "../models";
import { deduplicate, isNotNull, shortenAddress } from "../utils";

import { MultiWalletModal } from "./MultiWalletModal";
import type { PlainConnectButtonProps } from "./PlainConnectButton";
import { PlainConnectButton } from "./PlainConnectButton";

import "./ConnectButton.scss";

export type ConnectButtonProps = Omit<
  PlainConnectButtonProps,
  "children" | "connected" | "onClick"
> & {
  readonly ecosystemId: EcosystemId;
};

export const ConnectButton = ({
  ecosystemId,
  ...rest
}: ConnectButtonProps): ReactElement => {
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  const { disconnectService } = useWalletAdapter(
    selectWalletAdapterApi,
    shallow,
  );
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
    <PlainConnectButton
      {...rest}
      connected={connected}
      onClick={handleClick}
      iconType={ecosystem.logo}
    >
      {connected && address ? (
        shortenAddress(address)
      ) : (
        <>
          <EuiShowFor sizes={["xs"]}>Connect</EuiShowFor>
          <EuiHideFor sizes={["xs"]}>
            Connect {ecosystem.displayName}
          </EuiHideFor>
        </>
      )}
    </PlainConnectButton>
  );
};

export const MultiConnectButton = ({
  ...rest
}: PropsForButton<EuiButtonProps>): ReactElement => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const closeModal = (): void => setIsWalletModalOpen(false);
  const openModal = (): void => setIsWalletModalOpen(true);

  const {
    solana: { connected: isSolanaConnected, service: solanaService },
    ethereum: { connected: isEthereumConnected, service: ethereumService },
    bsc: { connected: isBscConnected, service: bscService },
    avalanche: { connected: isAvalancheConnected, service: avalanceService },
    polygon: { connected: isPolygonConnected, service: polygonService },
    aurora: { connected: isAuroraConnected, service: auroraService },
    fantom: { connected: isFantomConnected, service: fantomService },
    karura: { connected: isKaruraConnected, service: karuraService },
    acala: { connected: isAcalaConnected, service: acalaService },
  } = useWallets();
  const connectedServices = [
    isSolanaConnected ? solanaService : null,
    isEthereumConnected ? ethereumService : null,
    isBscConnected ? bscService : null,
    isAvalancheConnected ? avalanceService : null,
    isPolygonConnected ? polygonService : null,
    isAuroraConnected ? auroraService : null,
    isFantomConnected ? fantomService : null,
    isKaruraConnected ? karuraService : null,
    isAcalaConnected ? acalaService : null,
  ].filter(isNotNull);

  const uniqueServices = deduplicate<string, WalletService>(
    (walletService) => walletService.id,
    connectedServices,
  );
  const nConnected = uniqueServices.length;

  const label =
    nConnected > 0 ? (
      <>
        {uniqueServices.map((walletService) => (
          <EuiIcon
            key={walletService.id}
            type={walletService.info.icon}
            size="l"
          />
        ))}
        &nbsp;{nConnected}
        <span>&nbsp;connected</span>
      </>
    ) : (
      <>
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

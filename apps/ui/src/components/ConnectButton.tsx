import type { EuiButtonProps, PropsForButton } from "@elastic/eui";
import { EuiButton, EuiHideFor, EuiIcon, EuiShowFor } from "@elastic/eui";
import { EVM_PROTOCOL } from "@swim-io/evm-types";
import { SOLANA_PROTOCOL } from "@swim-io/plugin-ecosystem-solana";
import type { ReactElement } from "react";
import { useState } from "react";
import shallow from "zustand/shallow.js";

import type { EcosystemId } from "../config";
import {
  selectConfig,
  selectSelectedServiceByProtocol,
} from "../core/selectors";
import { useEnvironment, useWalletAdapter } from "../core/store";
import {
  useEvmWallet,
  useSolanaWallet,
  useWalletService,
  useWallets,
} from "../hooks";
import { useHasActiveInteraction } from "../hooks/interaction";
import type { WalletServiceId } from "../models";
import { WALLET_SERVICES, walletServiceInfo } from "../models";
import { deduplicate, isNotNull, shortenAddress } from "../utils";

import { MultiWalletModal } from "./MultiWalletModal";
import type { PlainConnectButtonProps } from "./PlainConnectButton";
import { PlainConnectButton } from "./PlainConnectButton";
import { SingleWalletModal } from "./SingleWalletModal";

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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  const { disconnectService } = useWalletService();
  const selectedServiceByProtocol = useWalletAdapter(
    selectSelectedServiceByProtocol,
  );
  const hasActiveInteraction = useHasActiveInteraction();
  const ecosystem = ecosystems[ecosystemId];
  const protocol = ecosystem.protocol;
  const wallets = useWallets();
  const { connected, address } = wallets[ecosystemId];

  const disconnect = (): void => {
    void disconnectService({ protocol: ecosystem.protocol });
  };

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);
  const handleClick = connected ? disconnect : openModal;

  return (
    <>
      <PlainConnectButton
        {...rest}
        connected={connected}
        onClick={handleClick}
        iconType={"xxx"}
        isDisabled={hasActiveInteraction}
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
      {isModalVisible && (
        <SingleWalletModal
          currentService={selectedServiceByProtocol[protocol]}
          protocol={protocol}
          services={WALLET_SERVICES[ecosystemId]}
          handleClose={closeModal}
        />
      )}
    </>
  );
};

export const MultiConnectButton = ({
  ...rest
}: PropsForButton<EuiButtonProps>): ReactElement => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const closeModal = (): void => setIsWalletModalOpen(false);
  const openModal = (): void => setIsWalletModalOpen(true);
  const selectedServiceByProtocol = useWalletAdapter(
    selectSelectedServiceByProtocol,
  );
  const evm = useEvmWallet();
  const solana = useSolanaWallet();
  const hasActiveInteraction = useHasActiveInteraction();

  const connectedWalletServiceIds: ReadonlyArray<WalletServiceId> = deduplicate<
    WalletServiceId,
    WalletServiceId
  >(
    (walletServiceId) => walletServiceId,
    [
      evm.connected ? selectedServiceByProtocol[EVM_PROTOCOL] : null,
      solana.connected ? selectedServiceByProtocol[SOLANA_PROTOCOL] : null,
    ].filter(isNotNull),
  );

  const connectedServices = connectedWalletServiceIds.map(
    (walletServiceId) => walletServiceInfo[walletServiceId],
  );

  const nConnected = connectedServices.length;

  const label =
    nConnected > 0 ? (
      <>
        {connectedServices.map((walletService) => (
          <EuiIcon
            key={walletService.name}
            type={walletService.icon}
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
        isDisabled={hasActiveInteraction}
        className={`multiConnectButton ${rest.className ?? ""}`}
      >
        {label}
      </EuiButton>
      {isWalletModalOpen && <MultiWalletModal handleClose={closeModal} />}
    </>
  );
};

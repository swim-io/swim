import type { EuiButtonProps, PropsForButton } from "@elastic/eui";
import { EuiButton, EuiHideFor, EuiIcon, EuiShowFor } from "@elastic/eui";
import { deduplicate, isNotNull, truncate } from "@swim-io/utils";
import type { ReactElement } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import type { EcosystemId } from "../../config";
import { Protocol } from "../../config";
import {
  selectConfig,
  selectSelectedServiceByProtocol,
} from "../../core/selectors";
import { useEnvironment, useWalletAdapter } from "../../core/store";
import {
  useEvmWallet,
  useSolanaWallet,
  useWalletService,
  useWallets,
} from "../../hooks";
import { useHasActiveInteraction } from "../../hooks/interaction";
import type { WalletServiceId } from "../../models";
import { WALLET_SERVICES, walletServiceInfo } from "../../models";
import { MultiWalletModal } from "../MultiWalletModal";
import type { PlainConnectButtonProps } from "../PlainConnectButton";
import { PlainConnectButton } from "../PlainConnectButton";
import { SingleWalletModal } from "../SingleWalletModal";

import "./ConnectButton.scss";

type Props = Omit<
  PlainConnectButtonProps,
  "children" | "connected" | "onClick"
> & {
  readonly ecosystemId: EcosystemId;
};

export const ConnectButton = ({
  ecosystemId,
  ...rest
}: Props): ReactElement => {
  const { t } = useTranslation();
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
        iconType={ecosystem.logo}
        isDisabled={hasActiveInteraction}
      >
        {connected && address ? (
          truncate(address)
        ) : (
          <>
            <EuiShowFor sizes={["xs"]}>
              {t("connect_button.connect_wallet_button_mobile")}
            </EuiShowFor>
            <EuiHideFor sizes={["xs"]}>
              {t("connect_button.connect_wallet_button_desktop", {
                ecosystemName: ecosystem.displayName,
              })}
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
  const { t } = useTranslation();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const closeModal = (): void => setIsWalletModalOpen(false);
  const openModal = (): void => setIsWalletModalOpen(true);
  const selectedServiceByProtocol = useWalletAdapter(
    selectSelectedServiceByProtocol,
  );
  const evm = useEvmWallet();
  const solana = useSolanaWallet();
  const hasActiveInteraction = useHasActiveInteraction();

  const connectedWalletServiceIds: readonly WalletServiceId[] = deduplicate<
    WalletServiceId,
    WalletServiceId
  >(
    (walletServiceId) => walletServiceId,
    [
      evm.connected ? selectedServiceByProtocol[Protocol.Evm] : null,
      solana.connected ? selectedServiceByProtocol[Protocol.Solana] : null,
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
        <span>
          &nbsp;
          {t("connect_button.number_of_wallets_connected", {
            numberOfWallets: nConnected,
          })}
        </span>
      </>
    ) : (
      <>
        <EuiShowFor sizes={["xs"]}>
          {t("connect_button.connect_wallets_button_mobile")}
        </EuiShowFor>
        <EuiHideFor sizes={["xs"]}>
          {t("connect_button.connect_wallets_button_desktop")}
        </EuiHideFor>
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

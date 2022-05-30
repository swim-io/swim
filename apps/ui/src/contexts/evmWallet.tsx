import type { ReactElement, ReactNode } from "react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as React from "react";

import { SingleWalletModal } from "../components/SingleWalletModal";
import type { EvmEcosystemId } from "../config";
import { EcosystemId, Protocol } from "../config";
import { useWalletAdapter } from "../core/store";
import { useLocalStorageState } from "../hooks/browser";
import type { EvmWalletAdapter, WalletService } from "../models";
import {
  ACALA_WALLET_SERVICES,
  AURORA_WALLET_SERVICES,
  AVALANCHE_WALLET_SERVICES,
  BSC_WALLET_SERVICES,
  ETHEREUM_WALLET_SERVICES,
  FANTOM_WALLET_SERVICES,
  KARURA_WALLET_SERVICES,
  POLYGON_WALLET_SERVICES,
} from "../models";
import type { ReadonlyRecord } from "../utils";

const ecosystemToWalletServices: ReadonlyRecord<
  EvmEcosystemId,
  readonly WalletService<EvmWalletAdapter>[]
> = {
  [EcosystemId.Ethereum]: ETHEREUM_WALLET_SERVICES,
  [EcosystemId.Bsc]: BSC_WALLET_SERVICES,
  [EcosystemId.Avalanche]: AVALANCHE_WALLET_SERVICES,
  [EcosystemId.Polygon]: POLYGON_WALLET_SERVICES,
  [EcosystemId.Aurora]: AURORA_WALLET_SERVICES,
  [EcosystemId.Fantom]: FANTOM_WALLET_SERVICES,
  [EcosystemId.Karura]: KARURA_WALLET_SERVICES,
  [EcosystemId.Acala]: ACALA_WALLET_SERVICES,
};

const ecosystemToLocalStorageKey: ReadonlyRecord<EvmEcosystemId, string> = {
  [EcosystemId.Ethereum]: "ethereumWalletService",
  [EcosystemId.Bsc]: "bscWalletService",
  [EcosystemId.Avalanche]: "avalancheWalletService",
  [EcosystemId.Polygon]: "polygonWalletService",
  [EcosystemId.Aurora]: "auroraWalletService",
  [EcosystemId.Fantom]: "fantomWalletService",
  [EcosystemId.Karura]: "karuraWalletService",
  [EcosystemId.Acala]: "acalaWalletService",
};

export interface EvmWalletContextInterface {
  readonly wallet: EvmWalletAdapter | null;
  readonly address: string | null;
  readonly connected: boolean;
  readonly select: () => void;
  readonly service: WalletService<EvmWalletAdapter> | null;
  readonly setServiceId: (serviceId: WalletService["id"]) => void;
}

const defaultEvmWalletContext: EvmWalletContextInterface = {
  wallet: null,
  address: null,
  connected: false,
  service: null,
  select: () => {},
  setServiceId: () => {},
};

const [
  EthereumWalletContext,
  BscWalletContext,
  AvalancheWalletContext,
  PolygonWalletContext,
  AuroraWalletContext,
  FantomWalletContext,
  KaruraWalletContext,
  AcalaWalletContext,
] = [
  EcosystemId.Ethereum,
  EcosystemId.Bsc,
  EcosystemId.Avalanche,
  EcosystemId.Polygon,
  EcosystemId.Aurora,
  EcosystemId.Fantom,
  EcosystemId.Karura,
  EcosystemId.Acala,
].map((_) =>
  React.createContext<EvmWalletContextInterface>(defaultEvmWalletContext),
);
const ecosystemToContext: ReadonlyRecord<
  EvmEcosystemId,
  React.Context<EvmWalletContextInterface>
> = {
  [EcosystemId.Ethereum]: EthereumWalletContext,
  [EcosystemId.Bsc]: BscWalletContext,
  [EcosystemId.Avalanche]: AvalancheWalletContext,
  [EcosystemId.Polygon]: PolygonWalletContext,
  [EcosystemId.Aurora]: AuroraWalletContext,
  [EcosystemId.Fantom]: FantomWalletContext,
  [EcosystemId.Karura]: KaruraWalletContext,
  [EcosystemId.Acala]: AcalaWalletContext,
};

interface EvmWalletProviderProps {
  readonly ecosystemId: EvmEcosystemId;
  readonly children?: ReactNode;
}

export const EvmWalletProvider = ({
  ecosystemId,
  children,
}: EvmWalletProviderProps): ReactElement => {
  const [connected, setConnected] = useState(false);
  const [serviceId, setServiceId] = useLocalStorageState<string>(
    ecosystemToLocalStorageKey[ecosystemId],
  );

  const services = ecosystemToWalletServices[ecosystemId];
  const service = useMemo(
    () => services.find(({ id }) => id === serviceId) ?? null,
    [serviceId, services],
  );

  const { evm } = useWalletAdapter();

  const wallet: EvmWalletAdapter | null = (service && evm) || null;
  const address = wallet?.address ?? null;

  useEffect(() => {
    if (wallet) {
      const handleConnect = (): void => {
        setConnected(true);
      };

      const handleDisconnect = (): void => {
        setConnected(false);
      };

      wallet.on("connect", handleConnect);
      wallet.on("disconnect", handleDisconnect);

      return () => {
        wallet.removeListener("connect", handleConnect);
        wallet.removeListener("disconnect", handleDisconnect);
      };
    }

    return () => {
      setConnected(false);
    };
  }, [wallet]);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const select = useCallback(() => setIsModalVisible(true), []);
  const closeModal = useCallback(() => setIsModalVisible(false), []);

  const EvmWalletContext = ecosystemToContext[ecosystemId];

  return (
    <EvmWalletContext.Provider
      value={{
        wallet,
        address,
        connected,
        select,
        service,
        setServiceId,
      }}
    >
      {children}
      {isModalVisible && (
        <SingleWalletModal
          currentService={serviceId}
          protocol={Protocol.Evm}
          services={services}
          handleClose={closeModal}
          setServiceId={setServiceId}
        />
      )}
    </EvmWalletContext.Provider>
  );
};

export const useEvmWallet = (
  ecosystemId: EvmEcosystemId,
): EvmWalletContextInterface => {
  const ecosystemToWalletContext: ReadonlyRecord<
    EvmEcosystemId,
    EvmWalletContextInterface
  > = {
    [EcosystemId.Ethereum]: useContext(EthereumWalletContext),
    [EcosystemId.Bsc]: useContext(BscWalletContext),
    [EcosystemId.Avalanche]: useContext(AvalancheWalletContext),
    [EcosystemId.Polygon]: useContext(PolygonWalletContext),
    [EcosystemId.Aurora]: useContext(AuroraWalletContext),
    [EcosystemId.Fantom]: useContext(FantomWalletContext),
    [EcosystemId.Karura]: useContext(KaruraWalletContext),
    [EcosystemId.Acala]: useContext(AcalaWalletContext),
  };
  return ecosystemToWalletContext[ecosystemId];
};

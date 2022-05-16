import type { ReactElement, ReactNode } from "react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as React from "react";

import { SingleWalletModal } from "../components/SingleWalletModal";
import type { EvmEcosystemId } from "../config";
import { EcosystemId, Env, EvmChainId } from "../config";
import { selectNotify } from "../core/selectors";
import { useNotificationStore } from "../core/store";
import { useLocalStorageState } from "../hooks/browser";
import type { EvmWalletAdapter, WalletService } from "../models";
import {
  AVALANCHE_WALLET_SERVICES,
  BSC_WALLET_SERVICES,
  ETHEREUM_WALLET_SERVICES,
  POLYGON_WALLET_SERVICES,
} from "../models";
import type { ReadonlyRecord } from "../utils";
import { shortenAddress } from "../utils";

import { useEnvironment } from "./environment";

const envToEcosystemToChainId: ReadonlyRecord<
  Env,
  ReadonlyRecord<EvmEcosystemId, EvmChainId>
> = {
  [Env.Mainnet]: {
    [EcosystemId.Ethereum]: EvmChainId.EthereumMainnet,
    [EcosystemId.Bsc]: EvmChainId.BscMainnet,
    [EcosystemId.Avalanche]: EvmChainId.AvalancheMainnet,
    [EcosystemId.Polygon]: EvmChainId.PolygonMainnet,
  },
  [Env.Devnet]: {
    [EcosystemId.Ethereum]: EvmChainId.EthereumGoerli,
    [EcosystemId.Bsc]: EvmChainId.BscTestnet,
    [EcosystemId.Avalanche]: EvmChainId.AvalancheTestnet,
    [EcosystemId.Polygon]: EvmChainId.PolygonTestnet,
  },
  [Env.Localnet]: {
    [EcosystemId.Ethereum]: EvmChainId.EthereumLocalnet,
    [EcosystemId.Bsc]: EvmChainId.BscLocalnet,
    [EcosystemId.Avalanche]: EvmChainId.AvalancheLocalnet,
    [EcosystemId.Polygon]: EvmChainId.PolygonLocalnet,
  },
  [Env.CustomLocalnet]: {
    [EcosystemId.Ethereum]: EvmChainId.EthereumLocalnet,
    [EcosystemId.Bsc]: EvmChainId.BscLocalnet,
    [EcosystemId.Avalanche]: EvmChainId.AvalancheLocalnet,
    [EcosystemId.Polygon]: EvmChainId.PolygonLocalnet,
  },
};

const ecosystemToWalletServices: ReadonlyRecord<
  EvmEcosystemId,
  readonly WalletService<EvmWalletAdapter>[]
> = {
  [EcosystemId.Ethereum]: ETHEREUM_WALLET_SERVICES,
  [EcosystemId.Bsc]: BSC_WALLET_SERVICES,
  [EcosystemId.Avalanche]: AVALANCHE_WALLET_SERVICES,
  [EcosystemId.Polygon]: POLYGON_WALLET_SERVICES,
};

const ecosystemToLocalStorageKey: ReadonlyRecord<EvmEcosystemId, string> = {
  [EcosystemId.Ethereum]: "ethereumWalletService",
  [EcosystemId.Bsc]: "bscWalletService",
  [EcosystemId.Avalanche]: "avalancheWalletService",
  [EcosystemId.Polygon]: "polygonWalletService",
};

export interface EvmWalletContextInterface {
  readonly wallet: EvmWalletAdapter | null;
  readonly address: string | null;
  readonly connected: boolean;
  readonly select: () => void;
  readonly service: WalletService<EvmWalletAdapter> | null;
  readonly createServiceClickHandler: (service: WalletService) => () => void;
}

const defaultEvmWalletContext: EvmWalletContextInterface = {
  wallet: null,
  address: null,
  connected: false,
  service: null,
  select: () => {},
  createServiceClickHandler: () => () => {},
};

const EthereumWalletContext = React.createContext<EvmWalletContextInterface>(
  defaultEvmWalletContext,
);
const BscWalletContext = React.createContext<EvmWalletContextInterface>(
  defaultEvmWalletContext,
);
const AvalancheWalletContext = React.createContext<EvmWalletContextInterface>(
  defaultEvmWalletContext,
);
const PolygonWalletContext = React.createContext<EvmWalletContextInterface>(
  defaultEvmWalletContext,
);
const ecosystemToContext: ReadonlyRecord<
  EvmEcosystemId,
  React.Context<EvmWalletContextInterface>
> = {
  [EcosystemId.Ethereum]: EthereumWalletContext,
  [EcosystemId.Bsc]: BscWalletContext,
  [EcosystemId.Avalanche]: AvalancheWalletContext,
  [EcosystemId.Polygon]: PolygonWalletContext,
};

interface EvmWalletProviderProps {
  readonly ecosystemId: EvmEcosystemId;
  readonly children?: ReactNode;
}

export const EvmWalletProvider = ({
  ecosystemId,
  children,
}: EvmWalletProviderProps): ReactElement => {
  const notify = useNotificationStore(selectNotify);

  const { env } = useEnvironment();
  const [connected, setConnected] = useState(false);
  const [autoConnect, setAutoConnect] = useState(false);

  const [serviceId, setServiceId] = useLocalStorageState<string>(
    ecosystemToLocalStorageKey[ecosystemId],
  );

  const chainId = envToEcosystemToChainId[env][ecosystemId];
  const services = ecosystemToWalletServices[ecosystemId];
  const service = useMemo(
    () => services.find(({ id }) => id === serviceId) ?? null,
    [serviceId, services],
  );
  const wallet = useMemo(() => {
    if (!service?.adapter) {
      return null;
    }

    return new service.adapter(chainId);
  }, [chainId, service]);
  const previousWalletRef = useRef(wallet);
  const address = wallet?.address ?? null;

  useEffect(() => {
    const previousWallet = previousWalletRef.current;
    if (wallet) {
      if (wallet !== previousWallet) {
        previousWallet?.disconnect().catch(console.error);
        setConnected(false);
        // eslint-disable-next-line functional/immutable-data
        previousWalletRef.current = wallet;
      }

      const handleConnect = (): void => {
        if (wallet.address) {
          setConnected(true);
          notify(
            "Wallet update",
            `Connected to wallet ${shortenAddress(wallet.address)}`,
            "info",
            7000,
          );
        }
      };
      const handleDisconnect = (): void => {
        setConnected(false);
        notify("Wallet update", "Disconnected from wallet", "warning");
      };
      const handleError = (title: string, description: string): void => {
        notify(title, description, "error");
      };

      wallet.on("connect", handleConnect);
      wallet.on("disconnect", handleDisconnect);
      wallet.on("error", handleError);

      return () => {
        wallet.removeListener("connect", handleConnect);
        wallet.removeListener("disconnect", handleDisconnect);
        wallet.removeListener("error", handleError);
      };
    }

    return () => {
      setConnected(false);
      // eslint-disable-next-line functional/immutable-data
      previousWalletRef.current = wallet;
    };
  }, [wallet]);

  useEffect(() => {
    if (wallet && autoConnect) {
      wallet.connect().catch(console.error);
      setAutoConnect(false);
    }
  }, [wallet, autoConnect]);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const select = useCallback(() => setIsModalVisible(true), []);
  const closeModal = useCallback(() => setIsModalVisible(false), []);
  const createServiceClickHandler =
    ({ id }: WalletService, callback?: () => any) =>
    (): void => {
      setServiceId(id);
      setAutoConnect(true);
      callback?.();
    };

  const EvmWalletContext = ecosystemToContext[ecosystemId];

  return (
    <EvmWalletContext.Provider
      value={{
        wallet,
        address,
        connected,
        select,
        service,
        createServiceClickHandler,
      }}
    >
      {children}
      {isModalVisible && (
        <SingleWalletModal
          currentService={serviceId}
          services={services}
          handleClose={closeModal}
          createServiceClickHandler={createServiceClickHandler}
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
  };
  return ecosystemToWalletContext[ecosystemId];
};

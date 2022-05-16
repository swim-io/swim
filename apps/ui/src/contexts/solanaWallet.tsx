import Wallet from "@project-serum/sol-wallet-adapter";
import type { ReactElement, ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SingleWalletModal } from "../components/SingleWalletModal";
import { Protocol } from "../config";
import { selectNotify } from "../core/selectors";
import { useNotificationStore } from "../core/store";
import { useLocalStorageState } from "../hooks/browser";
import type { SolanaWalletAdapter, SolanaWalletService } from "../models";
import { SOLANA_WALLET_SERVICES } from "../models";
import { shortenAddress } from "../utils";

import { useConfig } from "./environment";

export interface SolanaWalletContextInterface {
  readonly wallet: SolanaWalletAdapter | null;
  readonly address: string | null;
  readonly connected: boolean;
  readonly select: () => void;
  readonly service: SolanaWalletService<SolanaWalletAdapter> | null;
  readonly createServiceClickHandler: (
    service: SolanaWalletService,
  ) => () => void;
}

const defaultSolanaWalletContext: SolanaWalletContextInterface = {
  wallet: null,
  address: null,
  connected: false,
  select() {},
  service: null,
  createServiceClickHandler: () => () => {},
};

const SolanaWalletContext = createContext<SolanaWalletContextInterface>(
  defaultSolanaWalletContext,
);

interface SolanaWalletProviderProps {
  readonly children?: ReactNode;
}

export const SolanaWalletProvider = ({
  children,
}: SolanaWalletProviderProps): ReactElement => {
  const { chains } = useConfig();
  const [{ endpoint }] = chains[Protocol.Solana];
  const sendNotification = useNotificationStore(selectNotify);

  const [connected, setConnected] = useState(false);
  const [autoConnect, setAutoConnect] = useState(false);
  const [serviceId, setServiceId] = useLocalStorageState<string>(
    "solanaWalletService",
  );

  const service = useMemo(
    () => SOLANA_WALLET_SERVICES.find(({ id }) => id === serviceId) ?? null,
    [serviceId],
  );

  const wallet = useMemo(() => {
    if (!service) {
      return null;
    }
    return service.adapter
      ? new service.adapter()
      : new Wallet(service.info.url, endpoint);
  }, [service, endpoint]);
  const previousWalletRef = useRef(wallet);
  const address = wallet?.publicKey?.toBase58() ?? null;

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
        const { publicKey } = wallet;
        if (publicKey) {
          setConnected(true);
          sendNotification(
            "Wallet update",
            `Connected to wallet ${shortenAddress(publicKey.toBase58())}`,
            "info",
            7000,
          );
        }
      };
      const handleDisconnect = (): void => {
        setConnected(false);
        sendNotification(
          "Wallet update",
          "Disconnected from wallet",
          "warning",
        );
      };
      const handleError = (title: string, description: string): void => {
        sendNotification(title, description, "error");
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
  }, [wallet, sendNotification]);

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
    ({ id }: SolanaWalletService, callback?: () => any) =>
    (): void => {
      setServiceId(id);
      setAutoConnect(true);
      callback?.();
    };

  return (
    <SolanaWalletContext.Provider
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
          services={SOLANA_WALLET_SERVICES}
          handleClose={closeModal}
          createServiceClickHandler={createServiceClickHandler}
        />
      )}
    </SolanaWalletContext.Provider>
  );
};

export const useSolanaWallet = (): SolanaWalletContextInterface =>
  useContext(SolanaWalletContext);

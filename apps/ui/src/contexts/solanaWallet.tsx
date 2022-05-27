import type { ReactElement, ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SingleWalletModal } from "../components/SingleWalletModal";
import { Protocol } from "../config";
import { useWalletService } from "../core/store";
import { useLocalStorageState } from "../hooks/browser";
import type {
  SolanaWalletAdapter,
  SolanaWalletService,
  WalletService,
} from "../models";
import { SOLANA_WALLET_SERVICES } from "../models";

export interface SolanaWalletContextInterface {
  readonly wallet: SolanaWalletAdapter | null;
  readonly address: string | null;
  readonly connected: boolean;
  readonly select: () => void;
  readonly service: SolanaWalletService<SolanaWalletAdapter> | null;
  readonly setServiceId: (serviceId: WalletService["id"]) => void;
}

const defaultSolanaWalletContext: SolanaWalletContextInterface = {
  wallet: null,
  address: null,
  connected: false,
  select() {},
  service: null,
  setServiceId: () => {},
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
  const [connected, setConnected] = useState(false);
  const [serviceId, setServiceId] = useLocalStorageState<string>(
    "solanaWalletService",
  );

  const service = useMemo(
    () => SOLANA_WALLET_SERVICES.find(({ id }) => id === serviceId) ?? null,
    [serviceId],
  );

  const { solana } = useWalletService();

  const wallet: SolanaWalletAdapter | null =
    (service && solana[service.id]) || null;
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

  return (
    <SolanaWalletContext.Provider
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
          protocol={Protocol.Solana}
          services={SOLANA_WALLET_SERVICES}
          handleClose={closeModal}
          setServiceId={setServiceId}
        />
      )}
    </SolanaWalletContext.Provider>
  );
};

export const useSolanaWallet = (): SolanaWalletContextInterface =>
  useContext(SolanaWalletContext);

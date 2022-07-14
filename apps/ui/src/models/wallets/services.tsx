import { EuiButtonIcon } from "@elastic/eui";
import type { ReactElement } from "react";

import type { Ecosystem, Protocol } from "../../config";
import {
  ECOSYSTEMS,
  EcosystemId,
  getEcosystemsForProtocol,
} from "../../config";
import LEDGER_ICON from "../../images/wallets/ledger.svg";
import MATHWALLET_ICON from "../../images/wallets/mathwallet.svg";
import METAMASK_ICON from "../../images/wallets/metamask.svg";
import PHANTOM_ICON from "../../images/wallets/phantom.svg";
import type { ReadonlyRecord } from "../../utils";
import { findOrThrow } from "../../utils";

import type {
  EvmWalletAdapter,
  SolanaWalletAdapter,
  WalletAdapter,
} from "./adapters";
import { adapters } from "./adapters";

export enum WalletServiceId {
  MetaMask = "metamask",
  Phantom = "phantom",
  Sollet = "sollet",
  Solong = "solong",
  MathWallet = "mathwallet",
  Solflare = "solflare",
  Ledger = "ledger",
}

export const isWalletServiceId = (value: unknown): value is WalletServiceId => {
  return (
    typeof value === "string" &&
    Object.values(WalletServiceId).includes(value as WalletServiceId)
  );
};

export interface WalletServiceInfo {
  readonly name: string;
  readonly url: string;
  readonly icon: string;
  readonly helpText?: ReactElement;
  readonly ecosystem: Ecosystem;
}

export interface WalletService<T extends WalletAdapter = WalletAdapter> {
  readonly id: WalletServiceId;
  readonly info: WalletServiceInfo;
  readonly adapter?: new () => T;
}

export interface SolanaWalletService<
  T extends SolanaWalletAdapter = SolanaWalletAdapter,
> extends WalletService<T> {
  readonly adapter?: new () => T;
}

const OYSTER_ASSETS_URL =
  "https://raw.githubusercontent.com/solana-labs/oyster/main/assets/wallets/";

const solletInfo: WalletServiceInfo = {
  name: "Sollet",
  url: "https://www.sollet.io",
  icon: `${OYSTER_ASSETS_URL}sollet.svg`,
  ecosystem: ECOSYSTEMS[SOLANA_ECOSYSTEM_ID],
};
const solongInfo: WalletServiceInfo = {
  name: "Solong",
  url: "https://solongwallet.com",
  icon: `${OYSTER_ASSETS_URL}solong.png`,
  ecosystem: ECOSYSTEMS[SOLANA_ECOSYSTEM_ID],
};
const solflareInfo: WalletServiceInfo = {
  name: "Solflare",
  url: "https://solflare.com/access-wallet",
  icon: `${OYSTER_ASSETS_URL}solflare.svg`,
  ecosystem: ECOSYSTEMS[SOLANA_ECOSYSTEM_ID],
};
const mathWalletInfo: WalletServiceInfo = {
  name: "MathWallet",
  url: "https://www.mathwallet.org",
  icon: MATHWALLET_ICON,
  ecosystem: ECOSYSTEMS[SOLANA_ECOSYSTEM_ID],
};
const ledgerInfo: WalletServiceInfo = {
  name: "Ledger",
  url: "https://www.ledger.com",
  icon: LEDGER_ICON,
  ecosystem: ECOSYSTEMS[SOLANA_ECOSYSTEM_ID],
};
const phantomInfo: WalletServiceInfo = {
  name: "Phantom",
  url: "https://phantom.app",
  icon: PHANTOM_ICON,
  ecosystem: ECOSYSTEMS[SOLANA_ECOSYSTEM_ID],
};

const metaMaskInfo: Omit<WalletServiceInfo, "ecosystem"> = {
  name: "Metamask",
  url: "https://metamask.io",
  icon: METAMASK_ICON,
};

const addMetaMaskEcosystemInfo = (
  info: Omit<WalletServiceInfo, "ecosystem">,
  ecosystem: Ecosystem,
  url: string,
): WalletServiceInfo => {
  const title = `How to add ${ecosystem.displayName} to Metamask`;
  return {
    ...info,
    ecosystem,
    helpText: (
      <EuiButtonIcon
        iconType="questionInCircle"
        aria-label={title}
        title={title}
        href={url}
        target="_blank"
        iconSize="m"
      />
    ),
  };
};

const ethereumMetaMaskInfo: WalletServiceInfo = {
  ...metaMaskInfo,
  ecosystem: ECOSYSTEMS[ETHEREUM_ECOSYSTEM_ID],
};

const bnbMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ECOSYSTEMS[BNB_ECOSYSTEM_ID],
  "https://academy.binance.com/en/articles/connecting-metamask-to-binance-smart-chain",
);
const avalancheMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ECOSYSTEMS[EcosystemId.Avalanche],
  "https://support.avax.network/en/articles/4626956-how-do-i-set-up-metamask-on-avalanche",
);
const polygonMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ECOSYSTEMS[EcosystemId.Polygon],
  "https://docs.polygon.technology/docs/develop/metamask/config-polygon-on-metamask/",
);
const auroraMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ECOSYSTEMS[EcosystemId.Aurora],
  "https://doc.aurora.dev/interact/metamask/",
);
const fantomMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ECOSYSTEMS[EcosystemId.Fantom],
  "https://docs.fantom.foundation/tutorials/set-up-metamask",
);
const karuraMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ECOSYSTEMS[EcosystemId.Karura],
  "https://evmdocs.acala.network/tooling/metamask/connect-to-the-network",
);
const acalaMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ECOSYSTEMS[EcosystemId.Acala],
  "https://evmdocs.acala.network/tooling/metamask/connect-to-the-network",
);

const {
  acala,
  aurora,
  avalanche,
  bnb,
  ethereum,
  fantom,
  karura,
  polygon,
  solana,
} = adapters;

export const ETHEREUM_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: WalletServiceId.MetaMask,
      info: ethereumMetaMaskInfo,
      adapter: ethereum.MetaMaskAdapter,
    },
  ];
export const BNB_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] = [
  {
    id: WalletServiceId.MetaMask,
    info: bnbMetaMaskInfo,
    adapter: bnb.MetaMaskAdapter,
  },
];
export const AVALANCHE_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: WalletServiceId.MetaMask,
      info: avalancheMetaMaskInfo,
      adapter: avalanche.MetaMaskAdapter,
    },
  ];
export const POLYGON_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: WalletServiceId.MetaMask,
      info: polygonMetaMaskInfo,
      adapter: polygon.MetaMaskAdapter,
    },
  ];
export const AURORA_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: WalletServiceId.MetaMask,
      info: auroraMetaMaskInfo,
      adapter: aurora.MetaMaskAdapter,
    },
  ];
export const FANTOM_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: WalletServiceId.MetaMask,
      info: fantomMetaMaskInfo,
      adapter: fantom.MetaMaskAdapter,
    },
  ];
export const KARURA_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: WalletServiceId.MetaMask,
      info: karuraMetaMaskInfo,
      adapter: karura.MetaMaskAdapter,
    },
  ];
export const ACALA_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: WalletServiceId.MetaMask,
      info: acalaMetaMaskInfo,
      adapter: acala.MetaMaskAdapter,
    },
  ];

export const SOLANA_WALLET_SERVICES: readonly SolanaWalletService<SolanaWalletAdapter>[] =
  [
    {
      id: WalletServiceId.Phantom,
      info: phantomInfo,
      adapter: solana.PhantomAdapter,
    },
    { id: WalletServiceId.Sollet, info: solletInfo },
    {
      id: WalletServiceId.Solong,
      info: solongInfo,
      adapter: solana.SolongAdapter,
    },
    {
      id: WalletServiceId.MathWallet,
      info: mathWalletInfo,
      adapter: solana.MathWalletAdapter,
    },
    { id: WalletServiceId.Solflare, info: solflareInfo },
    {
      id: WalletServiceId.Ledger,
      info: ledgerInfo,
      adapter: solana.LedgerWalletAdapter,
    },
  ];

export const WALLET_SERVICES: Record<EcosystemId, readonly WalletService[]> = {
  [SOLANA_ECOSYSTEM_ID]: SOLANA_WALLET_SERVICES,
  [ETHEREUM_ECOSYSTEM_ID]: ETHEREUM_WALLET_SERVICES,
  [BNB_ECOSYSTEM_ID]: BNB_WALLET_SERVICES,
  [EcosystemId.Avalanche]: AVALANCHE_WALLET_SERVICES,
  [EcosystemId.Polygon]: POLYGON_WALLET_SERVICES,
  [EcosystemId.Aurora]: AURORA_WALLET_SERVICES,
  [EcosystemId.Fantom]: FANTOM_WALLET_SERVICES,
  [EcosystemId.Karura]: KARURA_WALLET_SERVICES,
  [EcosystemId.Acala]: ACALA_WALLET_SERVICES,
};

const findServiceForProtocol = (
  serviceId: WalletServiceId,
  protocol: Protocol,
): WalletService => {
  const ecosystemIds = getEcosystemsForProtocol(protocol);
  const protocolWalletServices = ecosystemIds.flatMap(
    (ecosystemId) => WALLET_SERVICES[ecosystemId],
  );
  return findOrThrow(
    protocolWalletServices,
    (service) => service.id === serviceId,
  );
};

export const createAdapter = (
  serviceId: WalletServiceId,
  protocol: Protocol,
  solanaEndpoint: string,
): WalletAdapter => {
  const service = findServiceForProtocol(serviceId, protocol);

  switch (protocol) {
    case EVM_PROTOCOL: {
      if (!service.adapter)
        throw new Error(`Adapter is required for protocol ${protocol}`);
      return new service.adapter();
    }
    case SOLANA_PROTOCOL: {
      if (service.adapter) {
        return new service.adapter();
      } else {
        return new adapters.solana.SolanaDefaultWalletAdapter(
          service.info.url,
          solanaEndpoint,
        );
      }
    }
  }
};

export const walletServiceInfo: ReadonlyRecord<
  WalletServiceId,
  Omit<WalletServiceInfo, "ecosystem" | "helpText">
> = {
  [WalletServiceId.Ledger]: ledgerInfo,
  [WalletServiceId.MathWallet]: mathWalletInfo,
  [WalletServiceId.MetaMask]: metaMaskInfo,
  [WalletServiceId.Phantom]: phantomInfo,
  [WalletServiceId.Solflare]: solflareInfo,
  [WalletServiceId.Sollet]: solletInfo,
  [WalletServiceId.Solong]: solongInfo,
};

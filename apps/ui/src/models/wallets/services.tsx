import { EuiButtonIcon } from "@elastic/eui";
import type { ReactElement } from "react";

import type { Ecosystem } from "../../config";
import {
  EcosystemId,
  Protocol,
  ecosystems,
  getEcosystemsForProtocol,
} from "../../config";
import LEDGER_ICON from "../../images/wallets/ledger.svg";
import MATHWALLET_ICON from "../../images/wallets/mathwallet.svg";
import METAMASK_ICON from "../../images/wallets/metamask.svg";
import PHANTOM_ICON from "../../images/wallets/phantom.svg";
import { findOrThrow } from "../../utils";

import type {
  EvmWalletAdapter,
  SolanaWalletAdapter,
  WalletAdapter,
} from "./adapters";
import { adapters } from "./adapters";

export interface WalletServiceInfo {
  readonly name: string;
  readonly url: string;
  readonly icon: string;
  readonly helpText?: ReactElement;
  readonly ecosystem: Ecosystem;
}

export interface WalletService<T extends WalletAdapter = WalletAdapter> {
  readonly id: string;
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
  ecosystem: ecosystems[EcosystemId.Solana],
};
const solongInfo: WalletServiceInfo = {
  name: "Solong",
  url: "https://solongwallet.com",
  icon: `${OYSTER_ASSETS_URL}solong.png`,
  ecosystem: ecosystems[EcosystemId.Solana],
};
const solflareInfo: WalletServiceInfo = {
  name: "Solflare",
  url: "https://solflare.com/access-wallet",
  icon: `${OYSTER_ASSETS_URL}solflare.svg`,
  ecosystem: ecosystems[EcosystemId.Solana],
};
const mathWalletInfo: WalletServiceInfo = {
  name: "MathWallet",
  url: "https://www.mathwallet.org",
  icon: MATHWALLET_ICON,
  ecosystem: ecosystems[EcosystemId.Solana],
};
const ledgerInfo: WalletServiceInfo = {
  name: "Ledger",
  url: "https://www.ledger.com",
  icon: LEDGER_ICON,
  ecosystem: ecosystems[EcosystemId.Solana],
};
const phantomInfo: WalletServiceInfo = {
  name: "Phantom",
  url: "https://phantom.app",
  icon: PHANTOM_ICON,
  ecosystem: ecosystems[EcosystemId.Solana],
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
  ecosystem: ecosystems[EcosystemId.Ethereum],
};

const bscMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ecosystems[EcosystemId.Bsc],
  "https://academy.binance.com/en/articles/connecting-metamask-to-binance-smart-chain",
);
const avalancheMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ecosystems[EcosystemId.Avalanche],
  "https://support.avax.network/en/articles/4626956-how-do-i-set-up-metamask-on-avalanche",
);
const polygonMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ecosystems[EcosystemId.Polygon],
  "https://docs.polygon.technology/docs/develop/metamask/config-polygon-on-metamask/",
);
const auroraMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ecosystems[EcosystemId.Aurora],
  "https://doc.aurora.dev/interact/metamask/",
);
const fantomMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ecosystems[EcosystemId.Fantom],
  "https://docs.fantom.foundation/tutorials/set-up-metamask",
);
const karuraMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ecosystems[EcosystemId.Karura],
  "https://evmdocs.acala.network/tooling/metamask/connect-to-the-network/karura",
);
const acalaMetaMaskInfo = addMetaMaskEcosystemInfo(
  metaMaskInfo,
  ecosystems[EcosystemId.Acala],
  "https://evmdocs.acala.network/tooling/metamask/connect-to-the-network/acala",
);

const {
  acala,
  aurora,
  avalanche,
  bsc,
  ethereum,
  fantom,
  karura,
  polygon,
  solana,
} = adapters;

export const ETHEREUM_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: "metamask",
      info: ethereumMetaMaskInfo,
      adapter: ethereum.MetaMaskAdapter,
    },
  ];
export const BSC_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] = [
  {
    id: "metamask",
    info: bscMetaMaskInfo,
    adapter: bsc.MetaMaskAdapter,
  },
];
export const AVALANCHE_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: "metamask",
      info: avalancheMetaMaskInfo,
      adapter: avalanche.MetaMaskAdapter,
    },
  ];
export const POLYGON_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: "metamask",
      info: polygonMetaMaskInfo,
      adapter: polygon.MetaMaskAdapter,
    },
  ];
export const AURORA_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: "metamask",
      info: auroraMetaMaskInfo,
      adapter: aurora.MetaMaskAdapter,
    },
  ];
export const FANTOM_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: "metamask",
      info: fantomMetaMaskInfo,
      adapter: fantom.MetaMaskAdapter,
    },
  ];
export const KARURA_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: "metamask",
      info: karuraMetaMaskInfo,
      adapter: karura.MetaMaskAdapter,
    },
  ];
export const ACALA_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    {
      id: "metamask",
      info: acalaMetaMaskInfo,
      adapter: acala.MetaMaskAdapter,
    },
  ];

export const SOLANA_WALLET_SERVICES: readonly SolanaWalletService<SolanaWalletAdapter>[] =
  [
    { id: "phantom", info: phantomInfo, adapter: solana.PhantomAdapter },
    { id: "sollet", info: solletInfo },
    { id: "solong", info: solongInfo, adapter: solana.SolongAdapter },
    {
      id: "mathwallet",
      info: mathWalletInfo,
      adapter: solana.MathWalletAdapter,
    },
    { id: "solflare", info: solflareInfo },
    { id: "ledger", info: ledgerInfo, adapter: solana.LedgerWalletAdapter },
  ];

export const WALLET_SERVICES: Record<EcosystemId, readonly WalletService[]> = {
  [EcosystemId.Solana]: SOLANA_WALLET_SERVICES,
  [EcosystemId.Ethereum]: ETHEREUM_WALLET_SERVICES,
  [EcosystemId.Bsc]: BSC_WALLET_SERVICES,
  [EcosystemId.Avalanche]: AVALANCHE_WALLET_SERVICES,
  [EcosystemId.Polygon]: POLYGON_WALLET_SERVICES,
  [EcosystemId.Aurora]: AURORA_WALLET_SERVICES,
  [EcosystemId.Fantom]: FANTOM_WALLET_SERVICES,
  [EcosystemId.Karura]: KARURA_WALLET_SERVICES,
  [EcosystemId.Acala]: ACALA_WALLET_SERVICES,
};

const findServiceForProtocol = (
  serviceId: string,
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
  serviceId: WalletService["id"],
  protocol: Protocol,
  solanaEndpoint: string,
): WalletAdapter => {
  const service = findServiceForProtocol(serviceId, protocol);

  switch (protocol) {
    case Protocol.Evm: {
      if (!service.adapter)
        throw new Error(`Adapter is required for protocol ${protocol}`);
      return new service.adapter();
    }
    case Protocol.Solana: {
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

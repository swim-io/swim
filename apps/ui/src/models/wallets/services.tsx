import { EuiButtonIcon } from "@elastic/eui";
import type { ReactElement } from "react";

import { EcosystemId } from "../../config";
import LEDGER_ICON from "../../images/wallets/ledger.svg";
import MATHWALLET_ICON from "../../images/wallets/mathwallet.svg";
import METAMASK_ICON from "../../images/wallets/metamask.svg";
import PHANTOM_ICON from "../../images/wallets/phantom.svg";

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
}

export interface WalletService<T extends WalletAdapter = WalletAdapter> {
  readonly id: string;
  readonly info: WalletServiceInfo;
  readonly adapter?: new (chainId: number) => T;
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
};
const solongInfo: WalletServiceInfo = {
  name: "Solong",
  url: "https://solongwallet.com",
  icon: `${OYSTER_ASSETS_URL}solong.png`,
};
const solflareInfo: WalletServiceInfo = {
  name: "Solflare",
  url: "https://solflare.com/access-wallet",
  icon: `${OYSTER_ASSETS_URL}solflare.svg`,
};
const mathWalletInfo: WalletServiceInfo = {
  name: "MathWallet",
  url: "https://www.mathwallet.org",
  icon: MATHWALLET_ICON,
};
const ledgerInfo: WalletServiceInfo = {
  name: "Ledger",
  url: "https://www.ledger.com",
  icon: LEDGER_ICON,
};
const phantomInfo: WalletServiceInfo = {
  name: "Phantom",
  url: "https://phantom.app",
  icon: PHANTOM_ICON,
};

const metaMaskInfo: WalletServiceInfo = {
  name: "Metamask",
  url: "https://metamask.io",
  icon: METAMASK_ICON,
};

const bscMetaMaskInfo = Object.assign(
  {
    helpText: (
      <EuiButtonIcon
        iconType="questionInCircle"
        aria-label="How to add BNB Chain to Metamask"
        title="How to add BNB Chain to Metamask"
        href="https://academy.binance.com/en/articles/connecting-metamask-to-binance-smart-chain"
        target="_blank"
        iconSize="m"
      />
    ),
  },
  metaMaskInfo,
);

const { bsc, ethereum, solana } = adapters;

export const BSC_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] = [
  {
    id: "metamask",
    info: bscMetaMaskInfo,
    adapter: bsc.MetaMaskAdapter,
  },
  // {
  //   id: "mathwallet",
  //   info: mathWalletInfo,
  //   adapter: bsc.MathWalletAdapter,
  // },
];

export const ETHEREUM_WALLET_SERVICES: readonly WalletService<EvmWalletAdapter>[] =
  [
    { id: "metamask", info: metaMaskInfo, adapter: ethereum.MetaMaskAdapter },
    // {
    //   id: "mathwallet",
    //   info: mathWalletInfo,
    //   adapter: ethereum.MathWalletAdapter,
    // },
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
  [EcosystemId.Terra]: [],
  [EcosystemId.Bsc]: BSC_WALLET_SERVICES,
  [EcosystemId.Avalanche]: [],
  [EcosystemId.Polygon]: [],
};

import type { ExternalProvider } from "@ethersproject/providers";

declare global {
  interface Window {
    readonly ethereum?: ExternalProvider & {
      readonly isMathWallet?: boolean;

      /** All the methods in `_metamask` are considered experimental/unstable */
      readonly _metamask?: {
        readonly isUnlocked?: () => Promise<boolean>;
      };
    };
    readonly phantom?: Record<string, unknown>;
    readonly solana?: {
      readonly isMathWallet?: boolean;
      readonly isPhantom?: boolean;
    };
    readonly solong?: {
      readonly selectAccount: () => Promise<string>;
    };
  }
}

export {};

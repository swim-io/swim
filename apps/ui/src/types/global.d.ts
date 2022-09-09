import type { ExternalProvider } from "@ethersproject/providers";

declare global {
  interface Window {
    readonly ethereum?: ExternalProvider & {
      /** All the methods in `_metamask` are considered experimental/unstable */
      readonly _metamask?: {
        readonly isUnlocked?: () => Promise<boolean>;
      };
    };
    readonly phantom?: Record<string, unknown>;
    readonly solana?: {
      readonly isPhantom?: boolean;
    };
    readonly solong?: {
      readonly selectAccount: () => Promise<string>;
    };
  }
}

export {};

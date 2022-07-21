/* eslint-disable functional/prefer-readonly-type */

import type { ExternalProvider } from "@ethersproject/providers";

declare global {
  interface Window {
    ethereum?: ExternalProvider & {
      isMathWallet?: boolean;

      /* all the methods in `_metamask` are considered experimental/unstable */
      _metamask?: {
        isUnlocked?: () => Promise<boolean>;
      };
    };
    phantom?: Record<string, unknown>;
    solana?: {
      isMathWallet?: boolean;
      isPhantom?: boolean;
    };
    solong?: {
      selectAccount: () => Promise<string>;
    };
  }
}

export {};

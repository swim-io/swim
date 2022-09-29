declare global {
  interface Window {
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

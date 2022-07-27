import { SolanaWeb3WalletAdapter } from "./SolanaWalletAdapter";

const getSolongService = (): any => {
  const { solong } = window;
  if (!solong) {
    return null;
  }
  return {
    ...solong,
    getAccount: solong.selectAccount,
  };
};

export class SolongAdapter extends SolanaWeb3WalletAdapter {
  constructor() {
    super("Solong", "https://solongwallet.com", getSolongService);
  }
}

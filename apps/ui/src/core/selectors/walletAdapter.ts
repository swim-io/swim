import type { WalletAdapterState } from "../store";

export const selectWalletAdapterApi = (state: WalletAdapterState) => ({
  connectService: state.connectService,
  disconnectService: state.disconnectService,
});

export const selectEvmAdapter = (state: WalletAdapterState) => state.evm;

export const selectSolanaAdapter = (state: WalletAdapterState) => state.solana;

export const selectSelectedServiceByProtocol = (state: WalletAdapterState) =>
  state.selectedServiceByProtocol;

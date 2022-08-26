import { PublicKey } from "@solana/web3.js";
import { EvmWeb3WalletAdapter } from "@swim-io/evm";
import { act, renderHook } from "@testing-library/react-hooks";

import { Protocol } from "../../../config";
import type { WalletAdapter } from "../../../models";
import { WalletServiceId } from "../../../models";
import { PhantomAdapter } from "../../../models/wallets/adapters/solana/PhantomAdapter";
import { useNotification as notificationStore } from "../useNotification";
import type { WalletAdapterState } from "../useWalletAdapter";
import { useWalletAdapter } from "../useWalletAdapter";

const getProtocolAdapter = (state: WalletAdapterState, protocol: Protocol) =>
  protocol === Protocol.Evm ? state.evm : state.solana;

const createWalletAdapter = (protocol: Protocol) =>
  protocol === Protocol.Evm
    ? new EvmWeb3WalletAdapter("serviceName", "serviceUrl", () => null)
    : new PhantomAdapter();

describe("useWalletAdapter", () => {
  it("initially returns empty adapters for EVM and Solana", () => {
    const { result } = renderHook(() => useWalletAdapter());
    expect(result.current.evm).toBeNull();
    expect(result.current.solana).toBeNull();
  });

  [Protocol.Evm, Protocol.Solana].forEach((protocol) => {
    describe(`Protocol ${protocol}`, () => {
      const serviceId =
        protocol === Protocol.Evm
          ? WalletServiceId.MetaMask
          : WalletServiceId.Phantom;

      describe("connectService", () => {
        it("connects to a service/protocol and stores the service id for the protocol", async () => {
          const { result } = renderHook(() => useWalletAdapter());

          const adapter = createWalletAdapter(protocol);
          const connectSpy = jest
            .spyOn(adapter, "connect")
            .mockImplementation(
              createMockConnectImplementation(adapter, protocol),
            );

          await act(() =>
            result.current.connectService({ protocol, serviceId, adapter }),
          );

          expect(getProtocolAdapter(result.current, protocol)).toEqual(adapter);
          expect(result.current.selectedServiceByProtocol[protocol]).toEqual(
            serviceId,
          );
          expect(connectSpy).toHaveBeenCalledTimes(1);

          expect(notificationStore.getState().toasts).toHaveLength(1);
          expect(notificationStore.getState().toasts[0].title).toEqual(
            "Wallet update",
          );
          expect(notificationStore.getState().toasts[0].text).toMatch(
            "Connected to wallet",
          );
        });

        it("connects to a service/protocol and disconnects the existing adapter", async () => {
          const { result } = renderHook(() => useWalletAdapter());

          const adapter = createWalletAdapter(protocol);
          jest
            .spyOn(adapter, "connect")
            .mockImplementation(
              createMockConnectImplementation(adapter, protocol),
            );
          const disconnectSpy = jest
            .spyOn(adapter, "disconnect")
            .mockImplementation(() => Promise.resolve());

          await act(() =>
            result.current.connectService({ protocol, serviceId, adapter }),
          );

          const secondAdapter = createWalletAdapter(protocol);
          jest
            .spyOn(adapter, "connect")
            .mockImplementation(() => Promise.resolve());

          await act(() =>
            result.current.connectService({
              protocol,
              serviceId,
              adapter: secondAdapter,
            }),
          );

          expect(getProtocolAdapter(result.current, protocol)).toEqual(
            secondAdapter,
          );
          expect(disconnectSpy).toHaveBeenCalledTimes(1);
        });

        it("connects to a service/protocol and passes connectArgs to adapter's connect call", async () => {
          const { result } = renderHook(() => useWalletAdapter());

          const adapter = createWalletAdapter(protocol);
          const connectSpy = jest
            .spyOn(adapter, "connect")
            .mockImplementation(
              createMockConnectImplementation(adapter, protocol),
            );

          const connectArgs = { onlyIfTrusted: true as const };

          await act(() =>
            result.current.connectService({
              protocol,
              serviceId,
              adapter,
              options: { connectArgs },
            }),
          );

          expect(connectSpy).toHaveBeenCalledTimes(1);
          expect(connectSpy).toHaveBeenCalledWith(connectArgs);
        });

        it("connects to a service/protocol and silences error during connect", async () => {
          const { result } = renderHook(() => useWalletAdapter());

          const adapter = createWalletAdapter(protocol);
          const connectSpy = jest
            .spyOn(adapter, "connect")
            .mockImplementation(() => {
              adapter.emit("error", "error title", "error message");
              return Promise.resolve();
            });

          await act(() =>
            result.current.connectService({
              protocol,
              serviceId,
              adapter,
              options: { silentError: true },
            }),
          );

          expect(connectSpy).toHaveBeenCalledTimes(1);
          expect(notificationStore.getState().toasts).toHaveLength(0);
        });
      });

      describe("disconnectService", () => {
        it("disconnects the protocol's adapter", async () => {
          const { result } = renderHook(() => useWalletAdapter());

          const adapter = createWalletAdapter(protocol);
          jest
            .spyOn(adapter, "connect")
            .mockImplementation(
              createMockConnectImplementation(adapter, protocol),
            );

          const disconnectSpy = jest
            .spyOn(adapter, "disconnect")
            .mockImplementation(
              createMockDisconnectImplementation(adapter, protocol),
            );

          await act(() =>
            result.current.connectService({ protocol, serviceId, adapter }),
          );

          await act(() => result.current.disconnectService({ protocol }));

          expect(getProtocolAdapter(result.current, protocol)).toBeNull();
          expect(result.current.selectedServiceByProtocol[protocol]).toBeNull();
          expect(disconnectSpy).toHaveBeenCalledTimes(1);

          expect(notificationStore.getState().toasts).toHaveLength(2);
          expect(notificationStore.getState().toasts[1].title).toEqual(
            "Wallet update",
          );
          expect(notificationStore.getState().toasts[1].text).toEqual(
            "Disconnected from wallet",
          );
        });

        it("disconnects the protocol's adapter silently", async () => {
          const { result } = renderHook(() => useWalletAdapter());

          const adapter = createWalletAdapter(protocol);
          jest
            .spyOn(adapter, "connect")
            .mockImplementation(
              createMockConnectImplementation(adapter, protocol),
            );

          const disconnectSpy = jest
            .spyOn(adapter, "disconnect")
            .mockImplementation(
              createMockDisconnectImplementation(adapter, protocol),
            );

          await act(() =>
            result.current.connectService({ protocol, serviceId, adapter }),
          );

          await act(() =>
            result.current.disconnectService({
              protocol,
              options: { silently: true },
            }),
          );

          expect(getProtocolAdapter(result.current, protocol)).toBeNull();
          expect(result.current.selectedServiceByProtocol[protocol]).toBeNull();
          expect(disconnectSpy).toHaveBeenCalledTimes(1);
          expect(notificationStore.getState().toasts).toHaveLength(1);
        });
      });
    });
  });
});

const createMockConnectImplementation = (
  adapter: WalletAdapter,
  protocol: Protocol,
) => {
  return async () => {
    let address: string | null = null;

    switch (protocol) {
      case Protocol.Evm: {
        address = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";
        Object.assign(adapter, { address });
        break;
      }
      case Protocol.Solana: {
        address = "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J";
        Object.assign(adapter, { publicKey: new PublicKey(address) });
        break;
      }
    }

    adapter.emit("connect", address);
    return Promise.resolve();
  };
};

const createMockDisconnectImplementation = (
  adapter: WalletAdapter,
  protocol: Protocol,
) => {
  return async () => {
    switch (protocol) {
      case Protocol.Evm: {
        Object.assign(adapter, { address: null });
        break;
      }
      case Protocol.Solana: {
        Object.assign(adapter, { publicKey: null });
        break;
      }
    }

    adapter.emit("disconnect");
    return Promise.resolve();
  };
};

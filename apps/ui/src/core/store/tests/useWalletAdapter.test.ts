import { act, renderHook } from "@testing-library/react-hooks";

import { useWalletAdapter } from "..";
import { Protocol } from "../../../config";
import { EvmWeb3WalletAdapter } from "../../../models/wallets/adapters/evm";
import { PhantomAdapter } from "../../../models/wallets/adapters/solana/PhantomAdapter";
import type { WalletAdapterState } from "../useWalletAdapter";

const getProtocolAdapter = (state: WalletAdapterState, protocol: Protocol) =>
  protocol === Protocol.Evm ? state.evm : state.solana;

const createWalletAdapter = (protocol: Protocol) =>
  protocol === Protocol.Evm
    ? new EvmWeb3WalletAdapter("serviceName", "serviceUrl", () => null)
    : new PhantomAdapter();

describe("useWalletAdapter", () => {
  it("initially returns empty adapters for EVM and Solana", async () => {
    const { result } = renderHook(() => useWalletAdapter());
    expect(result.current.evm).toBeNull();
    expect(result.current.solana).toBeNull();
  });

  [Protocol.Evm, Protocol.Solana].forEach((protocol) => {
    describe(`Protocol ${protocol}`, () => {
      it("connects to a service/protocol", async () => {
        const { result } = renderHook(() => useWalletAdapter());

        const service = "metamask";
        const adapter = createWalletAdapter(protocol);
        const connectSpy = jest
          .spyOn(adapter, "connect")
          .mockImplementation(() => Promise.resolve());
        const createAdapter = jest.fn().mockImplementation(() => adapter);

        await act(() =>
          result.current.connectService(service, protocol, createAdapter),
        );

        expect(getProtocolAdapter(result.current, protocol)).toEqual(adapter);
        expect(connectSpy).toHaveBeenCalledTimes(1);
        expect(createAdapter).toHaveBeenCalledTimes(1);
        expect(createAdapter).toHaveBeenCalledWith(service, protocol);
      });

      it("connects to a service/protocol and disconnects the existing adapter", async () => {
        const { result } = renderHook(() => useWalletAdapter());

        const service = "metamask";
        const adapter = createWalletAdapter(protocol);
        jest
          .spyOn(adapter, "connect")
          .mockImplementation(() => Promise.resolve());
        const disconnectSpy = jest
          .spyOn(adapter, "disconnect")
          .mockImplementation(() => Promise.resolve());
        const createAdapter = jest.fn().mockImplementation(() => adapter);

        await act(() =>
          result.current.connectService(service, protocol, createAdapter),
        );

        const secondAdapter = createWalletAdapter(protocol);
        jest
          .spyOn(adapter, "connect")
          .mockImplementation(() => Promise.resolve());

        const createSecondAdapter = jest
          .fn()
          .mockImplementation(() => secondAdapter);

        await act(() =>
          result.current.connectService(service, protocol, createSecondAdapter),
        );

        expect(getProtocolAdapter(result.current, protocol)).toEqual(
          secondAdapter,
        );
        expect(disconnectSpy).toHaveBeenCalledTimes(1);
      });

      it("disconnects the protocol's adapter", async () => {
        const { result } = renderHook(() => useWalletAdapter());

        const service = "metamask";
        const adapter = createWalletAdapter(protocol);
        jest
          .spyOn(adapter, "connect")
          .mockImplementation(() => Promise.resolve());

        const disconnectSpy = jest
          .spyOn(adapter, "disconnect")
          .mockImplementation(() => Promise.resolve());
        const createAdapter = jest.fn().mockImplementation(() => adapter);

        await act(() =>
          result.current.connectService(service, protocol, createAdapter),
        );

        await act(() => result.current.disconnectService(protocol));

        expect(getProtocolAdapter(result.current, protocol)).toBeNull();
        expect(disconnectSpy).toHaveBeenCalledTimes(1);
      });

      it("throws if there is no adapter to disconnect", async () => {
        const { result } = renderHook(() => useWalletAdapter());

        await act(async () => {
          try {
            await result.current.disconnectService(protocol);
          } catch (e) {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(e).toEqual(
              Error(
                `disconnectService called but no adapter found for protocol ${protocol}`,
              ),
            );
          }
        });
      });
    });
  });
});

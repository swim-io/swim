import { act, renderHook } from "@testing-library/react-hooks";

import { useNotification, useWalletAdapter } from "../../../core/store";
import { EvmWeb3WalletAdapter } from "../../../models/wallets/adapters/evm";
import { mockOf } from "../../../testUtils";
import { useWalletsMonitor } from "../useWalletsMonitor";

jest.mock("../../../core/store", () => ({
  useNotification: jest.fn(),
  useWalletAdapter: jest.fn(),
}));

// Make typescript happy with jest
const useNotificationMock = mockOf(useNotification);
const useWalletAdapterMock = mockOf(useWalletAdapter);

describe("useWalletsMonitor", () => {
  it("should notify on every event", () => {
    const notify = jest.fn();
    useNotificationMock.mockReturnValue({ notify });

    const adapter = new EvmWeb3WalletAdapter(
      "serviceName",
      "serviceUrl",
      () => null,
    );
    // we use the address in the connect notification
    adapter.address = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";

    useWalletAdapterMock.mockReturnValue({ evm: adapter, solana: null });

    renderHook(() => useWalletsMonitor());

    act(() => {
      adapter.emit("connect");
    });

    expect(notify).toBeCalledTimes(1);
    expect(notify.mock.calls[0]).toEqual([
      "Wallet update",
      expect.stringContaining("Connected to wallet"),
      "info",
      7000,
    ]);

    act(() => {
      adapter.emit("disconnect");
    });

    expect(notify).toBeCalledTimes(2);
    expect(notify.mock.calls[1]).toEqual([
      "Wallet update",
      "Disconnected from wallet",
      "warning",
    ]);

    const errorTitle = "error title";
    const errorDescription = "error description";

    act(() => {
      adapter.emit("error", errorTitle, errorDescription);
    });

    expect(notify).toBeCalledTimes(3);
    expect(notify.mock.calls[2]).toEqual([
      "error title",
      "error description",
      "error",
    ]);
  });

  it("should not notify when wallet adapter is stale", () => {
    const notify = jest.fn();
    useNotificationMock.mockReturnValue({ notify });

    const adapter = new EvmWeb3WalletAdapter(
      "serviceName",
      "serviceUrl",
      () => null,
    );

    useWalletAdapterMock.mockReturnValue({ evm: adapter, solana: null });

    const { rerender } = renderHook(() => useWalletsMonitor());

    useWalletAdapterMock.mockReturnValue({ evm: null, solana: null });

    rerender();

    act(() => {
      adapter.emit("disconnect");
    });

    expect(notify).not.toHaveBeenCalled();
  });
});

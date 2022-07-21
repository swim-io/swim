// import { waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";

import { Protocol } from "../../../config";
import { useWalletAdapter as walletAdapterStore } from "../../../core/store";
import { WalletServiceId, createAdapter } from "../../../models";
import { mockOf } from "../../../testUtils";
import { useWalletAutoConnect } from "../useWalletAutoConnect";

jest.mock("../../../models", () => ({
  ...jest.requireActual("../../../models"),
  createAdapter: jest.fn(),
}));

const createAdapterMock = mockOf(createAdapter);

const WAIT_FOR_NEXT_UPDATE_OPTIONS = { timeout: 50 };

describe("useWalletAutoConnect", () => {
  it("should not call connect to any wallet when none is stored", async () => {
    const { waitForNextUpdate } = renderHook(() => useWalletAutoConnect());

    // timeout here means no state update took place, thus no adapter was set/connected
    await expect(
      waitForNextUpdate(WAIT_FOR_NEXT_UPDATE_OPTIONS),
    ).rejects.toThrow(/Timed out/);
  });

  describe("MetaMask support", () => {
    beforeEach(() =>
      walletAdapterStore.setState({
        selectedServiceByProtocol: {
          [Protocol.Evm]: WalletServiceId.MetaMask,
          [Protocol.Solana]: null,
        },
      }),
    );

    it("should call connect when it's unlocked and has connected before", async () => {
      const connect = jest.fn().mockImplementation(() => Promise.resolve());
      createAdapterMock.mockReturnValue({
        isUnlocked: () => Promise.resolve(true),
        hasConnectedBefore: () => Promise.resolve(true),
        protocol: Protocol.Evm,
        on: jest.fn(),
        connect,
      });

      const { waitForNextUpdate } = renderHook(() => useWalletAutoConnect());
      await waitForNextUpdate(WAIT_FOR_NEXT_UPDATE_OPTIONS);

      expect(connect).toHaveBeenCalledTimes(1);
    });

    it("should not call connect when it's locked", async () => {
      const connect = jest.fn().mockImplementation(() => Promise.resolve());
      createAdapterMock.mockReturnValue({
        isUnlocked: () => Promise.resolve(false),
        hasConnectedBefore: () => Promise.resolve(true),
        protocol: Protocol.Evm,
        on: jest.fn(),
        connect,
      });

      const { waitForNextUpdate } = renderHook(() => useWalletAutoConnect());

      // timeout here means no state update took place, thus no adapter was set/connected
      await expect(
        waitForNextUpdate(WAIT_FOR_NEXT_UPDATE_OPTIONS),
      ).rejects.toThrow(/Timed out/);
    });

    it("should not call connect when it hasn't connected before", async () => {
      const connect = jest.fn().mockImplementation(() => Promise.resolve());
      createAdapterMock.mockReturnValue({
        isUnlocked: () => Promise.resolve(true),
        hasConnectedBefore: () => Promise.resolve(false),
        protocol: Protocol.Evm,
        on: jest.fn(),
        connect,
      });

      const { waitForNextUpdate } = renderHook(() => useWalletAutoConnect());

      // timeout here means no state update took place, thus no adapter was set/connected
      await expect(
        waitForNextUpdate(WAIT_FOR_NEXT_UPDATE_OPTIONS),
      ).rejects.toThrow(/Timed out/);
    });
  });

  describe("Phantom support", () => {
    beforeAll(() => (window.phantom = {}));
    beforeEach(() =>
      walletAdapterStore.setState({
        selectedServiceByProtocol: {
          [Protocol.Evm]: null,
          [Protocol.Solana]: WalletServiceId.Phantom,
        },
      }),
    );
    afterAll(() => delete window.phantom);

    it("should call connect when phantom is selected and present", async () => {
      const connect = jest.fn().mockImplementation(() => Promise.resolve());
      createAdapterMock.mockReturnValue({
        on: jest.fn(),
        connect,
        protocol: Protocol.Solana,
      });

      const { waitForNextUpdate } = renderHook(() => useWalletAutoConnect());
      await waitForNextUpdate(WAIT_FOR_NEXT_UPDATE_OPTIONS);

      expect(connect).toHaveBeenCalledTimes(1);
    });
  });

  describe("Solong support", () => {
    beforeAll(
      () =>
        (window.solong = {
          selectAccount: () =>
            Promise.resolve("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
        }),
    );
    beforeEach(() =>
      walletAdapterStore.setState({
        selectedServiceByProtocol: {
          [Protocol.Evm]: null,
          [Protocol.Solana]: WalletServiceId.Solong,
        },
      }),
    );
    afterAll(() => delete window.solong);

    it("should call connect when solong is selected and present", async () => {
      const connect = jest.fn().mockImplementation(() => Promise.resolve());
      createAdapterMock.mockReturnValue({
        connect,
        on: jest.fn(),
        protocol: Protocol.Solana,
      });

      const { waitForNextUpdate } = renderHook(() => useWalletAutoConnect());
      await waitForNextUpdate(WAIT_FOR_NEXT_UPDATE_OPTIONS);

      expect(connect).toHaveBeenCalledTimes(1);
    });
  });
});

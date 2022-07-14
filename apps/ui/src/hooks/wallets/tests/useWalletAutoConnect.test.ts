// import { waitFor } from "@testing-library/react";

import { EVM_PROTOCOL } from "@swim-io/evm-types";
import { SOLANA_PROTOCOL } from "@swim-io/plugin-ecosystem-solana";
import { renderHook } from "@testing-library/react-hooks";

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
          [EVM_PROTOCOL]: WalletServiceId.MetaMask,
          [SOLANA_PROTOCOL]: null,
        },
      }),
    );

    it("should call connect when it's unlocked and has connected before", async () => {
      const connect = jest.fn().mockImplementation(() => Promise.resolve());
      createAdapterMock.mockReturnValue({
        isUnlocked: () => Promise.resolve(true),
        hasConnectedBefore: () => Promise.resolve(true),
        protocol: EVM_PROTOCOL,
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
        protocol: EVM_PROTOCOL,
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
        protocol: EVM_PROTOCOL,
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
    beforeAll(() => ((window as any).phantom = {}));
    beforeEach(() =>
      walletAdapterStore.setState({
        selectedServiceByProtocol: {
          [EVM_PROTOCOL]: null,
          [SOLANA_PROTOCOL]: WalletServiceId.Phantom,
        },
      }),
    );
    afterAll(() => delete (window as any).phantom);

    it("should call connect when phantom is selected and present", async () => {
      const connect = jest.fn().mockImplementation(() => Promise.resolve());
      createAdapterMock.mockReturnValue({
        on: jest.fn(),
        connect,
        protocol: SOLANA_PROTOCOL,
      });

      const { waitForNextUpdate } = renderHook(() => useWalletAutoConnect());
      await waitForNextUpdate(WAIT_FOR_NEXT_UPDATE_OPTIONS);

      expect(connect).toHaveBeenCalledTimes(1);
    });
  });

  describe("Solong support", () => {
    beforeAll(
      () =>
        ((window as any).solong = {
          selectAccount: () =>
            Promise.resolve("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
        }),
    );
    beforeEach(() =>
      walletAdapterStore.setState({
        selectedServiceByProtocol: {
          [EVM_PROTOCOL]: null,
          [SOLANA_PROTOCOL]: WalletServiceId.Solong,
        },
      }),
    );
    afterAll(() => delete (window as any).solong);

    it("should call connect when solong is selected and present", async () => {
      const connect = jest.fn().mockImplementation(() => Promise.resolve());
      createAdapterMock.mockReturnValue({
        connect,
        on: jest.fn(),
        protocol: SOLANA_PROTOCOL,
      });

      const { waitForNextUpdate } = renderHook(() => useWalletAutoConnect());
      await waitForNextUpdate(WAIT_FOR_NEXT_UPDATE_OPTIONS);

      expect(connect).toHaveBeenCalledTimes(1);
    });
  });
});

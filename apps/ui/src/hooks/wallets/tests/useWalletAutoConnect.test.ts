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

describe("useWalletAutoConnect", () => {
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
      await waitForNextUpdate();

      expect(connect).toHaveBeenCalledTimes(1);
    });
  });

  describe("Phantom support", () => {
    beforeAll(() => ((window as any).phantom = {}));
    beforeEach(() =>
      walletAdapterStore.setState({
        selectedServiceByProtocol: {
          [Protocol.Evm]: null,
          [Protocol.Solana]: WalletServiceId.Phantom,
        },
      }),
    );
    afterAll(() => delete (window as any).phantom);

    it("should call connect when phantom is selected and present", async () => {
      const connect = jest.fn().mockImplementation(() => Promise.resolve());
      createAdapterMock.mockReturnValue({
        on: jest.fn(),
        connect,
        protocol: Protocol.Solana,
      });

      const { waitForNextUpdate } = renderHook(() => useWalletAutoConnect());
      await waitForNextUpdate();

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
          [Protocol.Evm]: null,
          [Protocol.Solana]: WalletServiceId.Solong,
        },
      }),
    );
    afterAll(() => delete (window as any).solong);

    it("should call connect when solong is selected and present", async () => {
      const connect = jest.fn().mockImplementation(() => Promise.resolve());
      createAdapterMock.mockReturnValue({
        connect,
        on: jest.fn(),
        protocol: Protocol.Solana,
      });

      const { waitForNextUpdate } = renderHook(() => useWalletAutoConnect());
      await waitForNextUpdate();

      expect(connect).toHaveBeenCalledTimes(1);
    });
  });
});

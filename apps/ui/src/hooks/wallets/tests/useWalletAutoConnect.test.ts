// import { waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";

import { Protocol } from "../../../config";
import { useWalletAdapter } from "../../../core/store";
import { WalletServiceId, createAdapter } from "../../../models";
import { mockOf } from "../../../testUtils";
import { useWalletAutoConnect } from "../useWalletAutoConnect";

jest.mock("../../../core/store", () => ({
  ...jest.requireActual("../../../core/store"),
  useWalletAdapter: jest.fn(),
}));

jest.mock("../../../models", () => ({
  ...jest.requireActual("../../../models"),
  createAdapter: jest.fn(),
}));

const useWalletAdapterMock = mockOf(useWalletAdapter);
const createAdapterMock = mockOf(createAdapter);

describe("useWalletAutoConnect", () => {
  describe("MetaMask support", () => {
    it("should call connectService when it's unlocked and has connected before", async () => {
      const connectService = jest
        .fn()
        .mockImplementation(() => Promise.resolve());
      useWalletAdapterMock.mockReturnValue({
        connectService,
        selectedServiceByProtocol: {
          [Protocol.Evm]: WalletServiceId.MetaMask,
          [Protocol.Solana]: null,
        },
      });
      createAdapterMock.mockReturnValue({
        isUnlocked: () => Promise.resolve(true),
        hasConnectedBefore: () => Promise.resolve(true),
        protocol: Protocol.Evm,
      });

      const { waitFor } = renderHook(() => useWalletAutoConnect());

      await waitFor(() => expect(connectService).toHaveBeenCalledTimes(1));
    });
  });

  describe("Phantom support", () => {
    beforeAll(() => ((window as any).phantom = {}));
    afterAll(() => delete (window as any).phantom);

    it("should call connectService when phantom is selected and present", async () => {
      const connectService = jest
        .fn()
        .mockImplementation(() => Promise.resolve());
      useWalletAdapterMock.mockReturnValue({
        connectService,
        selectedServiceByProtocol: {
          [Protocol.Evm]: null,
          [Protocol.Solana]: WalletServiceId.Phantom,
        },
      });
      createAdapterMock.mockReturnValue({});

      const { waitFor } = renderHook(() => useWalletAutoConnect());

      await waitFor(() => expect(connectService).toHaveBeenCalledTimes(1));
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
    afterAll(() => delete (window as any).solong);

    it("should call connectService when solong is selected and present", async () => {
      const connectService = jest
        .fn()
        .mockImplementation(() => Promise.resolve());
      useWalletAdapterMock.mockReturnValue({
        connectService,
        selectedServiceByProtocol: {
          [Protocol.Evm]: null,
          [Protocol.Solana]: WalletServiceId.Solong,
        },
      });
      createAdapterMock.mockReturnValue({});

      const { waitFor } = renderHook(() => useWalletAutoConnect());

      await waitFor(() => expect(connectService).toHaveBeenCalledTimes(1));
    });
  });
});

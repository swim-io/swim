import { Env } from "@swim-io/core";
import { act, renderHook } from "@testing-library/react-hooks";

import { CONFIGS, Protocol } from "../../../config";
import { useEnvironment, useWalletAdapter } from "../../../core/store";
import {
  WalletServiceId,
  createAdapter,
} from "../../../models/wallets/services";
import { mockOf } from "../../../testUtils";
import { useWalletService } from "../useWalletService";

jest.mock("../../../core/store", () => ({
  ...jest.requireActual("../../../core/store"),
  useEnvironment: jest.fn(),
  useWalletAdapter: jest.fn(),
}));

jest.mock("../../../models/wallets/services", () => ({
  ...jest.requireActual("../../../models/wallets/services"),
  createAdapter: jest.fn(),
}));

// Make typescript happy with jest
const useEnvironmentMock = mockOf(useEnvironment);
const useWalletAdapterMock = mockOf(useWalletAdapter);
const createAdapterMock = mockOf(createAdapter);

describe("useWalletService", () => {
  beforeEach(() => {
    useEnvironmentMock.mockReturnValue(CONFIGS[Env.Local]);
  });

  it("should call useWalletAdapter connectService with the correct createAdapter", async () => {
    const config = CONFIGS[Env.Local];
    const [{ publicRpcUrls }] = config.chains[Protocol.Solana];

    const connectServiceMock = jest.fn();
    const disconnectServiceMock = jest.fn();
    useWalletAdapterMock.mockReturnValue({
      connectService: connectServiceMock,
      disconnectService: disconnectServiceMock,
    });
    const serviceId = WalletServiceId.MetaMask;
    const protocol = Protocol.Evm;
    const mockAdapter = {};
    createAdapterMock.mockReturnValue(mockAdapter);

    const { result } = renderHook(() => useWalletService());

    await act(async () => {
      await result.current.connectService({ serviceId, protocol });
    });

    expect(connectServiceMock).toBeCalledTimes(1);
    expect(connectServiceMock).toBeCalledWith({
      protocol,
      serviceId,
      adapter: mockAdapter,
    });
    expect(createAdapterMock).toBeCalledTimes(1);
    expect(createAdapterMock).toHaveBeenCalledWith(
      "metamask",
      Protocol.Evm,
      publicRpcUrls[0],
    );
  });

  it("should call useWalletAdapter disconnectService", async () => {
    const connectServiceMock = jest.fn();
    const disconnectServiceMock = jest.fn();
    useWalletAdapterMock.mockReturnValue({
      connectService: connectServiceMock,
      disconnectService: disconnectServiceMock,
    });
    const protocol = Protocol.Evm;

    const { result } = renderHook(() => useWalletService());

    await act(async () => {
      await result.current.disconnectService({ protocol });
    });

    expect(disconnectServiceMock).toBeCalledTimes(1);
    expect(disconnectServiceMock).toBeCalledWith({ protocol });
  });
});

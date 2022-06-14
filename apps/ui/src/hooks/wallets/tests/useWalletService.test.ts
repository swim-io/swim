import { act, renderHook } from "@testing-library/react-hooks";

import { Protocol, configs } from "../../../config";
import { Env, useEnvironment, useWalletAdapter } from "../../../core/store";
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
    useEnvironmentMock.mockReturnValue(configs[Env.Localnet]);
  });

  it("should call useWalletAdapter connectService with the correct createAdapter", async () => {
    const config = configs[Env.Localnet];
    const [{ endpoint }] = config.chains[Protocol.Solana];

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
      await result.current.connectService(serviceId, protocol);
    });

    expect(connectServiceMock).toBeCalledTimes(1);
    expect(connectServiceMock).toBeCalledWith(protocol, mockAdapter);
    expect(createAdapterMock).toBeCalledTimes(1);
    expect(createAdapterMock).toHaveBeenCalledWith(
      "metamask",
      Protocol.Evm,
      endpoint,
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
      await result.current.disconnectService(protocol);
    });

    expect(disconnectServiceMock).toBeCalledTimes(1);
    expect(disconnectServiceMock).toBeCalledWith(protocol);
  });
});

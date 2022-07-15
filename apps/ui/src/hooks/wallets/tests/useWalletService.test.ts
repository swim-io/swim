import { Env } from "@swim-io/core-types";
import { EVM_PROTOCOL } from "@swim-io/evm-types";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import { act, renderHook } from "@testing-library/react-hooks";

import { CONFIGS } from "../../../config";
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
    const [{ endpoint }] = config.ecosystems[SOLANA_ECOSYSTEM_ID].chains;

    const connectServiceMock = jest.fn();
    const disconnectServiceMock = jest.fn();
    useWalletAdapterMock.mockReturnValue({
      connectService: connectServiceMock,
      disconnectService: disconnectServiceMock,
    });
    const serviceId = WalletServiceId.MetaMask;
    const protocol = EVM_PROTOCOL;
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
      EVM_PROTOCOL,
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
    const protocol = EVM_PROTOCOL;

    const { result } = renderHook(() => useWalletService());

    await act(async () => {
      await result.current.disconnectService({ protocol });
    });

    expect(disconnectServiceMock).toBeCalledTimes(1);
    expect(disconnectServiceMock).toBeCalledWith({ protocol });
  });
});

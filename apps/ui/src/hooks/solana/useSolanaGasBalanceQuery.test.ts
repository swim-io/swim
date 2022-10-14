import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { CustomConnection } from "@swim-io/solana";
import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaGasBalanceQuery } from "./useSolanaGasBalanceQuery";
import { useSolanaWallet } from "./useSolanaWallet";

jest.mock("./useSolanaClient", () => ({
  ...jest.requireActual("./useSolanaClient"),
  useSolanaClient: jest.fn(),
}));

jest.mock("./useSolanaWallet", () => ({
  ...jest.requireActual(".."),
  useSolanaWallet: jest.fn(),
}));

// Make typescript happy with jest
const useSolanaWalletMock = mockOf(useSolanaWallet);
const useSolanaClientMock = mockOf(useSolanaClient);

describe("useSolanaGasBalanceQuery", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
  });

  it("should return 0 when no address", async () => {
    useSolanaWalletMock.mockReturnValue({ address: null });
    useSolanaClientMock.mockReturnValue({
      connection: {
        // eslint-disable-next-line @typescript-eslint/require-await
        getBalance: async () => 999,
        onAccountChange: jest.fn(),
        removeAccountChangeListener: jest.fn(async () => {}),
      } as Partial<CustomConnection> as unknown as CustomConnection,
    });
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSolanaGasBalanceQuery(),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toEqual(new Decimal("0"));
  });

  it("should return wallet balance for valid address", async () => {
    useSolanaWalletMock.mockReturnValue({
      address: "9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b",
    });
    useSolanaClientMock.mockReturnValue({
      connection: {
        // eslint-disable-next-line @typescript-eslint/require-await
        getBalance: async () => 123 * LAMPORTS_PER_SOL,
        onAccountChange: jest.fn(),
        removeAccountChangeListener: jest.fn(async () => {}),
      } as Partial<CustomConnection> as unknown as CustomConnection,
    });
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSolanaGasBalanceQuery(),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toEqual(new Decimal("123"));
  });

  it("should return 0 when getBalance throws an error", async () => {
    useSolanaWalletMock.mockReturnValue({
      address: "9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b",
    });
    useSolanaClientMock.mockReturnValue({
      connection: {
        // eslint-disable-next-line @typescript-eslint/require-await
        getBalance: async () => {
          throw new Error("Something went wrong");
        },
        onAccountChange: jest.fn(),
        removeAccountChangeListener: jest.fn(async () => {}),
      } as Partial<CustomConnection> as unknown as CustomConnection,
    });
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSolanaGasBalanceQuery(),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toEqual(new Decimal("0"));
  });
});

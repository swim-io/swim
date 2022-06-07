import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import { useSolanaConnection, useSolanaWallet } from "../../contexts";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useSolBalanceQuery } from "./useSolBalanceQuery";

jest.mock("../../contexts", () => ({
  ...jest.requireActual("../../contexts"),
  useSolanaWallet: jest.fn(),
  useSolanaConnection: jest.fn(),
}));

// Make typescript happy with jest
const useSolanaWalletMock = mockOf(useSolanaWallet);
const useSolanaConnectionMock = mockOf(useSolanaConnection);

describe("useSolBalanceQuery", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
  });

  it("should return 0 when no address", async () => {
    useSolanaWalletMock.mockReturnValue({ address: null });
    useSolanaConnectionMock.mockReturnValue({
      getBalance: async () => Promise.resolve(999),
    });
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSolBalanceQuery(),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toEqual(new Decimal("0"));
  });

  it("should return wallet balance for valid address", async () => {
    useSolanaWalletMock.mockReturnValue({
      address: "9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b",
    });
    useSolanaConnectionMock.mockReturnValue({
      getBalance: async () => Promise.resolve(123 * LAMPORTS_PER_SOL),
    });
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSolBalanceQuery(),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toEqual(new Decimal("123"));
  });

  it("should return 0 when getBalance throws an error", async () => {
    useSolanaWalletMock.mockReturnValue({
      address: "9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b",
    });
    useSolanaConnectionMock.mockReturnValue({
      getBalance: () => {
        throw new Error("Something went wrong");
      },
    });
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSolBalanceQuery(),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toEqual(new Decimal("0"));
  });
});

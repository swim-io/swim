import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { act, renderHook } from "@testing-library/react-hooks";
import { useQueryClient } from "react-query";

import type { SolanaWalletInterface } from "..";
import { useSolanaConnection, useSolanaWallet } from "..";
import { selectGetInteractionState } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import { MOCK_SOL_WALLET } from "../../fixtures";
import { MOCK_INTERACTION_STATE } from "../../fixtures/swim/interactionState";
import { createSplTokenAccount } from "../../models";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { usePrepareSplTokenAccountMutation } from "./usePrepareSplTokenAccountMutation";

jest.mock("../solana", () => ({
  ...jest.requireActual("../solana"),
  useSolanaConnection: jest.fn(),
  useSolanaWallet: jest.fn(),
}));

jest.mock("../../models", () => ({
  ...jest.requireActual("../../models"),
  createSplTokenAccount: jest.fn(),
}));

// Make typescript happy with jest
const useSolanaConnectionMock = mockOf(useSolanaConnection);
const useSolanaWalletMock = mockOf(useSolanaWallet);
const createSplTokenAccountMock = mockOf(createSplTokenAccount);

describe("usePrepareSplTokenAccountMutation", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());

    // Add interaction
    const { result } = renderHook(() => useInteractionState());
    act(() => {
      result.current.addInteractionState(MOCK_INTERACTION_STATE);
    });
  });

  it("should create token account for all mints and patch interactionState with txId", async () => {
    createSplTokenAccountMock.mockImplementation((connection, wallet, mint) =>
      Promise.resolve(`TX_ID_FOR_${mint}`),
    );
    useSolanaConnectionMock.mockReturnValue({
      confirmTx: jest.fn(),
      getTokenAccountWithRetry: jest.fn((mint) =>
        Promise.resolve({
          mint,
        } as unknown as TokenAccount),
      ),
    });
    useSolanaWalletMock.mockReturnValue({
      wallet: MOCK_SOL_WALLET,
    } as SolanaWalletInterface);

    const { result } = renderHookWithAppContext(() => {
      const { mutateAsync } = usePrepareSplTokenAccountMutation();
      const getInteractionState = useInteractionState(
        selectGetInteractionState,
      );
      return {
        mutateAsync,
        getInteractionState,
      };
    });

    const { id } = MOCK_INTERACTION_STATE.interaction;
    await act(() => result.current.mutateAsync(id));

    const updatedState = result.current.getInteractionState(id);
    expect(updatedState.requiredSplTokenAccounts).toEqual({
      "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr": {
        isExistingAccount: false,
        account: {
          mint: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
        },
        txId: "TX_ID_FOR_9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
      },
      Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: {
        isExistingAccount: false,
        account: {
          mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
        },
        txId: "TX_ID_FOR_Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
      },
    });
  });
});

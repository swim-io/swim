import type { TokenAccount } from "@swim-io/solana";
import { act, renderHook } from "@testing-library/react-hooks";
import { useQueryClient } from "react-query";

import { selectGetInteractionState } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import { MOCK_SOL_WALLET } from "../../fixtures";
import { MOCK_INTERACTION_STATE } from "../../fixtures/swim/interactionState";
import type { SolanaWalletInterface } from "../../models";
import { mockOf, renderHookWithAppContext } from "../../testUtils";
import { useSolanaConnection, useSolanaWallet } from "../solana";

import { usePrepareSplTokenAccountMutation } from "./usePrepareSplTokenAccountMutation";

jest.mock("../../core/store/idb");
jest.mock("../../contexts", () => ({
  ...jest.requireActual("../../contexts"),
  useSolanaConnection: jest.fn(),
}));

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
    useSolanaConnectionMock.mockReturnValue({
      confirmTx: jest.fn(),
      createSplTokenAccount: jest.fn((wallet, mint) =>
        Promise.resolve(`TX_ID_FOR_${mint}`),
      ),
      getTokenAccount: jest.fn((mint) =>
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
        txId: "TX_ID_FOR_9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
      },
      Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: {
        isExistingAccount: false,
        txId: "TX_ID_FOR_Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
      },
    });
  });
});

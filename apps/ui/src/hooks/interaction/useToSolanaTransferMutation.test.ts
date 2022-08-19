import { PublicKey } from "@solana/web3.js";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { act, renderHook } from "@testing-library/react-hooks";
import { useQueryClient } from "react-query";

import { selectGetInteractionState } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import { MOCK_SOL_WALLET } from "../../fixtures";
import { MOCK_INTERACTION_STATE } from "../../fixtures/swim/interactionState";
import {
  generateUnlockSplTokenTxIds,
  lockEvmToken,
  TokenAccount,
} from "../../models";
import type { Wallets } from "../../models";
import { mockOf, renderHookWithAppContext } from "../../testUtils";
import { useWallets } from "../crossEcosystem";
import { useEvmConnections } from "../evm";
import { useSolanaConnection, useSplTokenAccountsQuery } from "../solana";

import { useToSolanaTransferMutation } from "./useToSolanaTransferMutation";

jest.mock("../../core/store/idb");
jest.mock("@certusone/wormhole-sdk");
jest.mock("../evm", () => ({
  ...jest.requireActual("../evm"),
  useEvmConnections: jest.fn(),
}));
const useSolanaConnectionMock = mockOf(useSolanaConnection);
const useEvmConnectionsMock = mockOf(useEvmConnections);

jest.mock("../crossEcosystem", () => ({
  ...jest.requireActual("../crossEcosystem"),
  useWallets: jest.fn(),
}));
const useWalletsMock = mockOf(useWallets);

jest.mock("../../models", () => ({
  ...jest.requireActual("../../models"),
  lockEvmToken: jest.fn(),
  generateUnlockSplTokenTxIds: jest.fn(),
}));
const lockEvmTokenMock = mockOf(lockEvmToken);
const generateUnlockSplTokenTxIdsMock = mockOf(generateUnlockSplTokenTxIds);

jest.mock("../solana", () => ({
  ...jest.requireActual("../solana"),
  useSolanaConnection: jest.fn(),
  useSplTokenAccountsQuery: jest.fn(),
}));
const useSplTokenAccountsQueryMock = mockOf(useSplTokenAccountsQuery);

describe("useToSolanaTransferMutation", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());

    // Add interaction
    const { result } = renderHook(() => useInteractionState());
    act(() => {
      result.current.addInteractionState(MOCK_INTERACTION_STATE);
    });
  });

  it("should handle the transfer and patch interactionState with txIds", async () => {
    useSplTokenAccountsQueryMock.mockReturnValue({
      data: [
        {
          mint: new PublicKey("9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr"),
          address: new PublicKey("TP6DaXSavPoCHKrKb5dcwtAkxM9b4Dwh4isd7fQ8hCb"),
        } as TokenAccount,
      ],
    });
    useSolanaConnectionMock.mockReturnValue({
      confirmTx: jest.fn(),
      getTokenAccountWithRetry: jest.fn((mint) =>
        Promise.resolve({
          mint,
        } as unknown as TokenAccount),
      ),
    });
    useWalletsMock.mockReturnValue({
      [EvmEcosystemId.Bnb]: {
        wallet: {},
      },
      [SOLANA_ECOSYSTEM_ID]: {
        wallet: MOCK_SOL_WALLET,
      },
    } as Wallets);

    lockEvmTokenMock.mockReturnValue({
      approvalResponses: [],
      transferResponse: {
        hash: "0xd528c49eedda9d5a5a7f04a00355b7b124a30502b46532503cc83891844715b9",
      },
    } as any);
    useEvmConnectionsMock.mockReturnValue({
      [EvmEcosystemId.Bnb]: {
        txReceiptCache: {},
        getTxReceiptOrThrow: jest.fn(({ hash }) =>
          Promise.resolve({
            transactionHash: hash,
          }),
        ),
        provider: {
          getTransaction: jest.fn(() =>
            Promise.resolve({
              hash: "0xd528c49eedda9d5a5a7f04a00355b7b124a30502b46532503cc83891844715b9",
            }),
          ),
        },
      },
    } as any);
    generateUnlockSplTokenTxIdsMock.mockReturnValue([
      Promise.resolve(
        "3o1NH8sMDs5m9DMoVcqD5eZRny2JrrFBohn9TwEKHXhX4Xxg6uQV7JrupVuDJcwaHBuP8fCZhv1HWBYicMixsSPg",
      ),
      Promise.resolve(
        "3ok2VJpHqZ2EqoDGVMyugENdKawTjNbmM4sm4tHpsoF6T8BHx78fk5vZBXH7KRpgX7P43vhnMnN5zb5NSogUfCsj",
      ),
      Promise.resolve(
        "5rYoqeehFL7j5MbMqzE8NruiUeBaRVhwFpCKsdXUnuAr6NNcPiX3XUxq72SA2MtPhtEhEDU2ZPVP9m4rmkHgy2cC",
      ),
    ] as Partial<AsyncGenerator<string>>);

    const { result } = renderHookWithAppContext(() => {
      const { mutateAsync } = useToSolanaTransferMutation();
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
    expect(updatedState.toSolanaTransfers[0].txIds).toEqual({
      approveAndTransferEvmToken: [
        "0xd528c49eedda9d5a5a7f04a00355b7b124a30502b46532503cc83891844715b9",
      ],
      postVaaOnSolana: [
        "3o1NH8sMDs5m9DMoVcqD5eZRny2JrrFBohn9TwEKHXhX4Xxg6uQV7JrupVuDJcwaHBuP8fCZhv1HWBYicMixsSPg",
        "3ok2VJpHqZ2EqoDGVMyugENdKawTjNbmM4sm4tHpsoF6T8BHx78fk5vZBXH7KRpgX7P43vhnMnN5zb5NSogUfCsj",
      ],
      claimTokenOnSolana:
        "5rYoqeehFL7j5MbMqzE8NruiUeBaRVhwFpCKsdXUnuAr6NNcPiX3XUxq72SA2MtPhtEhEDU2ZPVP9m4rmkHgy2cC",
    });
  });
});

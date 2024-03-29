import { PublicKey } from "@solana/web3.js";
import { EvmEcosystemId, EvmTxType } from "@swim-io/evm";
import type { SolanaTx, TokenAccount } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID, SolanaTxType } from "@swim-io/solana";
import { act, renderHook } from "@testing-library/react-hooks";
import { useQueryClient } from "react-query";

import { selectGetInteractionState } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import { MOCK_SOL_WALLET } from "../../fixtures";
import { MOCK_INTERACTION_STATE } from "../../fixtures/swim/interactionState";
import { getSignedVaaWithRetry } from "../../models";
import type { Wallets } from "../../models";
import { mockOf, renderHookWithAppContext } from "../../testUtils";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient, useUserSolanaTokenAccountsQuery } from "../solana";

import { useToSolanaTransferMutation } from "./useToSolanaTransferMutation";

jest.mock("@certusone/wormhole-sdk");
jest.mock("../../core/store/idb");

jest.mock("../evm", () => ({
  ...jest.requireActual("../evm"),
  useGetEvmClient: jest.fn(),
}));
const useGetEvmClientMock = mockOf(useGetEvmClient);

jest.mock("../crossEcosystem", () => ({
  ...jest.requireActual("../crossEcosystem"),
  useWallets: jest.fn(),
}));
const useWalletsMock = mockOf(useWallets);

jest.mock("../../models", () => ({
  ...jest.requireActual("../../models"),
  getSignedVaaWithRetry: jest.fn(),
}));
const getSignedVaaWithRetryMock = mockOf(getSignedVaaWithRetry);

jest.mock("../solana", () => ({
  ...jest.requireActual("../solana"),
  useSolanaClient: jest.fn(),
  useUserSolanaTokenAccountsQuery: jest.fn(),
}));
const useSolanaClientMock = mockOf(useSolanaClient);
const useUserSolanaTokenAccountsQueryMock = mockOf(
  useUserSolanaTokenAccountsQuery,
);

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
    useUserSolanaTokenAccountsQueryMock.mockReturnValue({
      data: [
        {
          mint: new PublicKey("9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr"),
          address: new PublicKey("9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm"),
        } as TokenAccount,
      ],
    });
    useSolanaClientMock.mockReturnValue({
      confirmTx: jest.fn(),
      getTokenAccountWithRetry: jest.fn((mint) =>
        Promise.resolve({
          mint,
        } as unknown as TokenAccount),
      ),
      generateCompletePortalTransferTxs: jest.fn().mockReturnValue([
        Promise.resolve({
          tx: {
            id: "3o1NH8sMDs5m9DMoVcqD5eZRny2JrrFBohn9TwEKHXhX4Xxg6uQV7JrupVuDJcwaHBuP8fCZhv1HWBYicMixsSPg",
          },
          type: SolanaTxType.WormholeVerifySignatures,
        }),
        Promise.resolve({
          tx: {
            id: "3ok2VJpHqZ2EqoDGVMyugENdKawTjNbmM4sm4tHpsoF6T8BHx78fk5vZBXH7KRpgX7P43vhnMnN5zb5NSogUfCsj",
          },
          type: SolanaTxType.WormholePostVaa,
        }),
        Promise.resolve({
          tx: {
            id: "5rYoqeehFL7j5MbMqzE8NruiUeBaRVhwFpCKsdXUnuAr6NNcPiX3XUxq72SA2MtPhtEhEDU2ZPVP9m4rmkHgy2cC",
          },
          type: SolanaTxType.PortalRedeem,
        }),
      ] as Partial<AsyncGenerator<SolanaTx>>),
    });
    useWalletsMock.mockReturnValue({
      [EvmEcosystemId.Bnb]: {
        wallet: {},
      },
      [SOLANA_ECOSYSTEM_ID]: {
        wallet: MOCK_SOL_WALLET,
      },
    } as Wallets);

    getSignedVaaWithRetryMock.mockReturnValue({
      vaaBytes: new Uint8Array(),
    } as any);
    useGetEvmClientMock.mockReturnValue(() => {
      return {
        txReceiptCache: {},
        getTx: jest.fn(({ hash }) =>
          Promise.resolve({
            id: hash,
          }),
        ),
        generateInitiatePortalTransferTxs: jest.fn().mockReturnValue([
          Promise.resolve({
            tx: {
              id: "0xd528c49eedda9d5a5a7f04a00355b7b124a30502b46532503cc83891844715b9",
            },
            type: EvmTxType.PortalTransferTokens,
          }),
        ]),
        provider: {
          getTransaction: jest.fn(() =>
            Promise.resolve({
              hash: "0xd528c49eedda9d5a5a7f04a00355b7b124a30502b46532503cc83891844715b9",
            }),
          ),
        },
      };
    });

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

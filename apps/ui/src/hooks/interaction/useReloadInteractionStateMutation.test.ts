import { PublicKey } from "@solana/web3.js";
import { Env } from "@swim-io/core";
import type { TokenAccount } from "@swim-io/solana";
import { act, renderHook } from "@testing-library/react-hooks";
import { useQueryClient } from "react-query";

import { selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import {
  EVM_TXS_FOR_RELOAD_INTERACTION,
  MOCK_INTERACTION_STATE_FOR_RELOAD_INTERACTION,
  SOLANA_TXS_FOR_RELOAD_INTERACTION,
} from "../../fixtures/tx/useReloadInteractionStateMutationFixture";
import {
  fetchEvmTxsForInteractionId,
  fetchSolanaTxsForInteractionId,
} from "../../models";
import { mockOf, renderHookWithAppContext } from "../../testUtils";
import { useEvmWallet } from "../evm";
import { useSolanaWallet, useUserSolanaTokenAccountsQuery } from "../solana";

import { useReloadInteractionStateMutation } from "./useReloadInteractionStateMutation";

jest.mock("../../core/store/idb");
jest.mock("@certusone/wormhole-sdk");

jest.mock("../evm", () => ({
  ...jest.requireActual("../evm"),
  useEvmWallet: jest.fn(),
}));
const useEvmWalletMock = mockOf(useEvmWallet);

jest.mock("../solana", () => ({
  ...jest.requireActual("../solana"),
  useSolanaWallet: jest.fn(),
  useUserSolanaTokenAccountsQuery: jest.fn(),
}));
const useSolanaWalletMock = mockOf(useSolanaWallet);
const useUserSolanaTokenAccountsQueryMock = mockOf(
  useUserSolanaTokenAccountsQuery,
);

jest.mock("../../models", () => ({
  ...jest.requireActual("../../models"),
  fetchEvmTxsForInteractionId: jest.fn(),
  fetchSolanaTxsForInteractionId: jest.fn(),
  EvmConnection: jest.fn(),
}));
const fetchEvmTxsForInteractionIdMock = mockOf(fetchEvmTxsForInteractionId);
const fetchSolanaTxsForInteractionIdMock = mockOf(
  fetchSolanaTxsForInteractionId,
);

describe("useReloadInteractionStateMutation", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
    const { result } = renderHook(() => ({
      envStore: useEnvironment(),
      interactionStore: useInteractionState(),
    }));

    act(() => {
      result.current.envStore.setCustomIp("127.0.0.1");
      result.current.envStore.setEnv(Env.Testnet);
      result.current.interactionStore.addInteractionState(
        MOCK_INTERACTION_STATE_FOR_RELOAD_INTERACTION,
      );
    });
  });

  it("should reload recent tx and recover interaction state", async () => {
    useUserSolanaTokenAccountsQueryMock.mockReturnValue({
      data: [
        {
          mint: new PublicKey("7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf"),
          address: new PublicKey(
            "CGqaoanoKzAywATev1NrMQZCA6ApRGTnDCf6P4oN55NK",
          ),
        } as TokenAccount,
        {
          mint: new PublicKey("2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka"),
          address: new PublicKey(
            "65baNxhhAAiZHx2PRnf4iNZDcX3QT4z3kjaUn11kVRg8",
          ),
        } as TokenAccount,
      ],
    });
    useSolanaWalletMock.mockReturnValue({
      address: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    });
    useEvmWalletMock.mockReturnValue({
      address: "0xb0a05611328d1068c91f58e2c83ab4048de8cd7f",
    });
    fetchEvmTxsForInteractionIdMock.mockReturnValue(
      Promise.resolve(EVM_TXS_FOR_RELOAD_INTERACTION),
    );
    fetchSolanaTxsForInteractionIdMock.mockReturnValue(
      Promise.resolve(SOLANA_TXS_FOR_RELOAD_INTERACTION),
    );

    const { result } = renderHookWithAppContext(() => {
      const { mutateAsync } = useReloadInteractionStateMutation();
      const getInteractionState = useInteractionState(
        selectGetInteractionState,
      );
      return {
        mutateAsync,
        getInteractionState,
      };
    });

    const { id } = MOCK_INTERACTION_STATE_FOR_RELOAD_INTERACTION.interaction;
    await act(() => result.current.mutateAsync(id));

    const updatedState = result.current.getInteractionState(id);
    expect(updatedState.toSolanaTransfers[0].txIds).toEqual({
      approveAndTransferEvmToken: [
        "0xdacf9f474992e86e079b588573eff53542f1722386280c55aa71057e5771732f",
      ],
      claimTokenOnSolana:
        "5UfH9wni8vGP8Ch2KQp2JjoPKyWssFjePVpxAduFErWQVFEfF7Av3iCK9wA7CyQTWUkHZtr6ThoWxZXjr73dVQqF",
      postVaaOnSolana: [
        "reEurpv1vonjzLPpqoMWvcNV5bbJmhJwfPPM7d7PEEVcb8mN6DzZTqPtYMLcenJ6VLMa3naXe4gPzPkxurjQy4e",
        "61FvZ4bp3Ua2ED6cv32rqZnLnW5hGDYMf6racBeoZXJaxzVUVZzEEqtut29aqeBoGwxk3Dhr7mbXY6ziVpCDiHTT",
      ],
    });
    expect(
      updatedState.solanaPoolOperations.map((operation) => operation.txId),
    ).toEqual([
      "4LCZusMofy5oPLZe5cX5VCn4T1n6qgGsxCRhbwTVAcKSvZRvQLdeEWXJef2m5sD9u6XfRgRNRcBHJBwB48tun2eQ",
      "53mCCVJEvoERa1anMkJxm5JD3doRcMBoQVyw8ZgtJ5sMuDZsw1QaW8worMbsbWBqAhwAheURKNKA7xrafSHyDEjA",
    ]);
    expect(updatedState.fromSolanaTransfers[0].txIds).toEqual({
      claimTokenOnEvm:
        "0x5ddfb1925096babf7939393b62970700a4db183a5dd9ae36dfd2fc9c5d7da302",
      transferSplToken:
        "53PBEMpqPraH1KFGSQfGn8JR62kndfU6iv6XqeJdDtpuEyD9FLkGjtnUZUB6TPv4H8A7kVxk2WiyEJPY7bLCNQGC",
    });
  });
});

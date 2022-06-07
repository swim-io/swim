import crypto from "crypto";

import { act, renderHook } from "@testing-library/react-hooks";
import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import { usePoolMathByPoolIds, useSplTokenAccountsQuery, useWallets } from "..";
import { Env } from "../../config";
import { useSolanaWallet } from "../../contexts";
import { useEnvironment } from "../../core/store";
import {
  BSC_USDT,
  ETHEREUM_USDC,
  MOCK_POOL_MATHS_BY_ID,
  MOCK_TOKEN_ACCOUNTS,
  MOCK_WALLETS,
  SOLANA_USDC,
} from "../../fixtures";
import { Amount, InteractionType } from "../../models";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useCreateInteractionState } from "./useCreateInteractionState";

Object.defineProperty(global.self, "crypto", {
  value: {
    getRandomValues: (arr: string | readonly any[]) =>
      crypto.randomBytes(arr.length),
  },
});

jest.mock("../../contexts", () => ({
  ...jest.requireActual("../../contexts"),
  useConfig: jest.fn(),
  useSolanaWallet: jest.fn(),
}));

jest.mock("..", () => ({
  ...jest.requireActual(".."),
  usePoolMathByPoolIds: jest.fn(),
  useSplTokenAccountsQuery: jest.fn(),
  useWallets: jest.fn(),
}));

// Make typescript happy with jest
const useSolanaWalletMock = mockOf(useSolanaWallet);
const usePoolMathByPoolIdsMock = mockOf(usePoolMathByPoolIds);
const useSplTokenAccountsQueryMock = mockOf(useSplTokenAccountsQuery);
const useWalletsMock = mockOf(useWallets);

describe("useCreateInteractionState", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
    const { result: envStore } = renderHook(() => useEnvironment());
    act(() => {
      envStore.current.setCustomLocalnetIp("127.0.0.1");
      envStore.current.setEnv(Env.Localnet);
    });
    useSolanaWalletMock.mockReturnValue({
      address: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    });
    usePoolMathByPoolIdsMock.mockReturnValue(MOCK_POOL_MATHS_BY_ID);
    useSplTokenAccountsQueryMock.mockReturnValue({ data: MOCK_TOKEN_ACCOUNTS });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    useWalletsMock.mockReturnValue(MOCK_WALLETS);
  });

  it("should create state from ETHEREUM USDC to SOLANA USDC", async () => {
    const { result } = renderHookWithAppContext(() =>
      useCreateInteractionState(),
    );
    const createInteractionState = result.current;
    const interactionState = createInteractionState({
      type: InteractionType.Swap,
      params: {
        exactInputAmount: Amount.fromHuman(ETHEREUM_USDC, new Decimal(1001)),
        minimumOutputAmount: Amount.fromHuman(
          SOLANA_USDC,
          new Decimal(995.624615),
        ),
      },
    });

    const {
      requiredSplTokenAccounts,
      toSolanaTransfers,
      solanaPoolOperations,
      fromSolanaTransfers,
    } = interactionState;

    // Found all existing account
    const foundAllExistingAccount = Object.values(
      requiredSplTokenAccounts,
    ).every((state) => state.isExistingAccount);
    expect(foundAllExistingAccount).toEqual(true);

    expect(toSolanaTransfers.length).toEqual(1);
    expect(toSolanaTransfers[0].token).toEqual(ETHEREUM_USDC);
    expect(toSolanaTransfers[0].value).toEqual(new Decimal(1001));
    expect(solanaPoolOperations.length).toEqual(1);
    expect(fromSolanaTransfers.length).toEqual(0);
  });

  it("create state from SOLANA USDC to ETHEREUM USDC", async () => {
    useSplTokenAccountsQueryMock.mockReturnValue({ data: [] });
    const { result } = renderHookWithAppContext(() =>
      useCreateInteractionState(),
    );
    const createInteractionState = result.current;
    const interactionState = createInteractionState({
      type: InteractionType.Swap,
      params: {
        exactInputAmount: Amount.fromHuman(SOLANA_USDC, new Decimal(1001)),
        minimumOutputAmount: Amount.fromHuman(
          ETHEREUM_USDC,
          new Decimal(995.624615),
        ),
      },
    });

    const {
      requiredSplTokenAccounts,
      toSolanaTransfers,
      solanaPoolOperations,
      fromSolanaTransfers,
    } = interactionState;

    // Found all existing account
    const foundAllExistingAccount = Object.values(
      requiredSplTokenAccounts,
    ).every((state) => state.isExistingAccount);
    expect(foundAllExistingAccount).toEqual(false);

    expect(toSolanaTransfers.length).toEqual(0);
    expect(solanaPoolOperations.length).toEqual(1);
    expect(fromSolanaTransfers.length).toEqual(1);
    expect(fromSolanaTransfers[0].token).toEqual(ETHEREUM_USDC);
    expect(fromSolanaTransfers[0].value).toEqual(null);
  });

  it("create state from BSC USDT to ETHEREUM USDC", async () => {
    useSplTokenAccountsQueryMock.mockReturnValue({ data: [] });
    const { result } = renderHookWithAppContext(() =>
      useCreateInteractionState(),
    );
    const createInteractionState = result.current;
    const interactionState = createInteractionState({
      type: InteractionType.Swap,
      params: {
        exactInputAmount: Amount.fromHuman(BSC_USDT, new Decimal(1001)),
        minimumOutputAmount: Amount.fromHuman(
          ETHEREUM_USDC,
          new Decimal(995.624615),
        ),
      },
    });

    const {
      requiredSplTokenAccounts,
      toSolanaTransfers,
      solanaPoolOperations,
      fromSolanaTransfers,
    } = interactionState;

    // Found all existing account
    const foundAllExistingAccount = Object.values(
      requiredSplTokenAccounts,
    ).every((state) => state.isExistingAccount);
    expect(foundAllExistingAccount).toEqual(false);

    expect(toSolanaTransfers.length).toEqual(1);
    expect(toSolanaTransfers[0].token).toEqual(BSC_USDT);
    expect(toSolanaTransfers[0].value).toEqual(new Decimal(1001));
    expect(solanaPoolOperations.length).toEqual(1);
    expect(fromSolanaTransfers.length).toEqual(1);
    expect(fromSolanaTransfers[0].token).toEqual(ETHEREUM_USDC);
    expect(fromSolanaTransfers[0].value).toEqual(null);
  });
});

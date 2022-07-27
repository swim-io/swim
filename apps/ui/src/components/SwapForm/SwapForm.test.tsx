import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { Env } from "@swim-io/core";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import Decimal from "decimal.js";
import type { FC } from "react";
import type { UseQueryResult } from "react-query";
import { MemoryRouter, Route, Routes } from "react-router";

import { EcosystemId } from "../../config";
import { useEnvironment as environmentStore } from "../../core/store";
import {
  useErc20BalanceQuery,
  useGetSwapFormErrors,
  useLiquidityQueries,
  useSolanaConnection,
  useSplTokenAccountsQuery,
  useSplUserBalance,
  useStartNewInteraction,
  useSwapFeesEstimationQuery,
  useUserNativeBalances,
} from "../../hooks";
import { mockOf, renderWithAppContext } from "../../testUtils";

import { SwapForm } from "./SwapForm";

// EuiSelectable uses EuiSelectableList which uses
// react-virtualized-auto-sizer and needs some dimensions mocking in
// order to render anything. See https://github.com/bvaughn/react-virtualized/issues/493
jest.mock(
  "react-virtualized-auto-sizer",
  (): FC<any> =>
    ({ children }) =>
      children({ height: 600, width: 600 }),
);

jest.mock("../../hooks/solana", () => ({
  ...jest.requireActual("../../hooks/solana"),
  useSplTokenAccountsQuery: jest.fn(),
  useSplUserBalance: jest.fn(),
  useLiquidityQueries: jest.fn(),
}));

jest.mock("../../hooks/solana/useSolanaConnection", () => ({
  ...jest.requireActual("../../hooks/solana/useSolanaConnection"),
  useSolanaConnection: jest.fn(),
}));

jest.mock("../../hooks/interaction", () => ({
  ...jest.requireActual("../../hooks/interaction"),
  useStartNewInteraction: jest.fn(),
}));

jest.mock("../../hooks/evm", () => ({
  ...jest.requireActual("../../hooks/evm"),
  useErc20BalanceQuery: jest.fn(),
}));

jest.mock("../../hooks", () => ({
  ...jest.requireActual("../../hooks"),
  useGetSwapFormErrors: jest.fn(),
  useSwapFeesEstimationQuery: jest.fn(),
  useUserNativeBalances: jest.fn(),
}));

const useGetSwapFormErrorsMock = mockOf(useGetSwapFormErrors);
const useSolanaConnectionMock = mockOf(useSolanaConnection);
const useSplTokenAccountsQueryMock = mockOf(useSplTokenAccountsQuery);
const useStartNewInteractionMock = mockOf(useStartNewInteraction);
const useSwapFeesEstimationQueryMock = mockOf(useSwapFeesEstimationQuery);
const useErc20BalanceQueryMock = mockOf(useErc20BalanceQuery);
const useUserNativeBalancesMock = mockOf(useUserNativeBalances);
const useSplUserBalanceMock = mockOf(useSplUserBalance);
const useLiquidityQueriesMock = mockOf(useLiquidityQueries);

const findFromTokenButton = () => screen.queryAllByRole("button")[0];
const findToTokenButton = () => screen.queryAllByRole("button")[4];

describe("SwapForm", () => {
  beforeEach(() => {
    useSolanaConnectionMock.mockReturnValue({
      getAccountInfo(publicKey, commitment?) {
        return Promise.resolve(null);
      },
    });
    useSplTokenAccountsQueryMock.mockReturnValue({
      data: [],
    });

    const zero = new Decimal(0);
    const balances = {
      [EcosystemId.Solana]: zero,
      [EcosystemId.Ethereum]: zero,
      [EcosystemId.Bnb]: zero,
      [EcosystemId.Avalanche]: zero,
      [EcosystemId.Polygon]: zero,
      [EcosystemId.Aurora]: zero,
      [EcosystemId.Fantom]: zero,
      [EcosystemId.Karura]: zero,
      [EcosystemId.Acala]: zero,
    };
    useUserNativeBalancesMock.mockReturnValue(balances);
    useStartNewInteractionMock.mockReturnValue(jest.fn());
    useSwapFeesEstimationQueryMock.mockReturnValue(null);
    useGetSwapFormErrorsMock.mockReturnValue(() => []);
    useErc20BalanceQueryMock.mockReturnValue({ data: zero });
    useSplUserBalanceMock.mockReturnValue(zero);
    useLiquidityQueriesMock.mockReturnValue([
      { data: [] },
    ] as unknown as readonly UseQueryResult<readonly TokenAccount[], Error>[]);
  });

  beforeEach(() => {
    // currently we can't change the env unless a custom IP is set
    environmentStore.getState().setCustomIp("122.122.122.12");
    environmentStore.getState().setEnv(Env.Mainnet);

    renderWithAppContext(
      <MemoryRouter initialEntries={["/swap"]}>
        <Routes>
          <Route
            path="swap"
            element={<SwapForm maxSlippageFraction={null} />}
          />
          <Route
            path="swap/:fromToken/to/:toToken"
            element={<SwapForm maxSlippageFraction={null} />}
          />
        </Routes>
      </MemoryRouter>,
    );
  });

  it("should update token options when env changes", () => {
    const { env, setEnv } = environmentStore.getState();

    expect(env).toBe(Env.Mainnet);
    expect(findFromTokenButton()).toHaveTextContent("USDC on Solana");

    act(() => setEnv(Env.Devnet));

    expect(environmentStore.getState().env).toBe(Env.Devnet);
    expect(findFromTokenButton()).toHaveTextContent("USDC on Ethereum");
  });

  it("should update toToken options when fromToken changes", async () => {
    expect(findToTokenButton()).toHaveTextContent("USDT on Solana");

    fireEvent.click(findFromTokenButton());

    await waitFor(() => {
      return screen.findByPlaceholderText("Search tokens");
    });

    fireEvent.click(screen.getByTitle("GST Green Satoshi Token BNB Chain"));

    expect(findToTokenButton()).toHaveTextContent("GST on Solana");
  });

  it("should update toToken options when fromToken is updated with toToken value", async () => {
    expect(findToTokenButton()).toHaveTextContent("USDT on Solana");

    fireEvent.click(findFromTokenButton());

    await waitFor(() => {
      return screen.findByPlaceholderText("Search tokens");
    });

    fireEvent.click(screen.getByTitle("USDT Tether USD Solana"));

    expect(findToTokenButton()).toHaveTextContent("USDC on Solana");
  });
});

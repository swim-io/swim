import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { act, screen } from "@testing-library/react";
import Decimal from "decimal.js";
import type { FC } from "react";
import type { UseQueryResult } from "react-query";

import { EcosystemId, Env } from "../config";
import { useEnvironment as environmentStore } from "../core/store";
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
} from "../hooks";
import { mockOf, renderWithAppContext } from "../testUtils";

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

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

jest.mock("../hooks/solana", () => ({
  ...jest.requireActual("../hooks/solana"),
  useSplTokenAccountsQuery: jest.fn(),
  useSplUserBalance: jest.fn(),
  useLiquidityQueries: jest.fn(),
}));

jest.mock("../hooks/solana/useSolanaConnection", () => ({
  ...jest.requireActual("../hooks/solana/useSolanaConnection"),
  useSolanaConnection: jest.fn(),
}));

jest.mock("../hooks/interaction", () => ({
  ...jest.requireActual("../hooks/interaction"),
  useStartNewInteraction: jest.fn(),
}));

jest.mock("../hooks/evm", () => ({
  ...jest.requireActual("../hooks/evm"),
  useErc20BalanceQuery: jest.fn(),
}));

jest.mock("../hooks", () => ({
  ...jest.requireActual("../hooks"),
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
    // currently we can't change the env unless a custom localnet ip is set
    environmentStore.getState().setCustomLocalnetIp("122.122.122.12");
    environmentStore.getState().setEnv(Env.Mainnet);

    renderWithAppContext(<SwapForm maxSlippageFraction={null} />);
  });

  it("should update token options when env changes", () => {
    const { env, setEnv } = environmentStore.getState();

    expect(env).toBe(Env.Mainnet);
    expect(findFromTokenButton()).toHaveTextContent("USDC on Solana");

    act(() => setEnv(Env.Devnet));

    expect(environmentStore.getState().env).toBe(Env.Devnet);
    expect(findFromTokenButton()).toHaveTextContent("USDC on Ethereum");
  });
});

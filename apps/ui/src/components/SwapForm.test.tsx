import { act, screen } from "@testing-library/react";

import { EcosystemId, Env } from "../config";
import { useEnvironment as environmentStore } from "../core/store";
import {
  useGetSwapFormErrors,
  useSwapFeesEstimationQuery,
  useSwapOutputAmountEstimate,
  useUserBalanceAmounts,
  useUserNativeBalances,
} from "../hooks";
import { mockOf, renderWithAppContext } from "../testUtils";

import { SwapForm } from "./SwapForm";

jest.mock("../hooks", () => ({
  ...jest.requireActual("../hooks"),
  useUserNativeBalances: jest.fn(),
  useUserBalanceAmounts: jest.fn(),
  useSwapOutputAmountEstimate: jest.fn(),
  useSwapFeesEstimationQuery: jest.fn(),
  useGetSwapFormErrors: jest.fn(),
}));

jest.mock("../hooks/interaction", () => ({
  ...jest.requireActual("../hooks/interaction"),
  useHasActiveInteraction: jest.fn(),
  useStartNewInteraction: jest.fn(),
}));

// Make typescript happy with jest
const useUserNativeBalancesMock = mockOf(useUserNativeBalances);
const useUserBalanceAmountsMock = mockOf(useUserBalanceAmounts);
const useSwapOutputAmountEstimateMock = mockOf(useSwapOutputAmountEstimate);
const useSwapFeesEstimationQueryMock = mockOf(useSwapFeesEstimationQuery);
const useGetSwapFormErrorsMock = mockOf(useGetSwapFormErrors);

describe("SwapForm", () => {
  beforeEach(() => {
    useUserBalanceAmountsMock.mockReturnValue({
      [EcosystemId.Acala]: null,
      [EcosystemId.Aurora]: null,
      [EcosystemId.Avalanche]: null,
      [EcosystemId.Bnb]: null,
      [EcosystemId.Ethereum]: null,
      [EcosystemId.Fantom]: null,
      [EcosystemId.Karura]: null,
      [EcosystemId.Polygon]: null,
      [EcosystemId.Solana]: null,
    });
    useUserNativeBalancesMock.mockReturnValue({});
    useSwapOutputAmountEstimateMock.mockReturnValue(null);
    useSwapFeesEstimationQueryMock.mockReturnValue(null);
    useGetSwapFormErrorsMock.mockReturnValue(() => []);

    // currently we can't change the env unless a custom localnet ip is set
    environmentStore.getState().setCustomLocalnetIp("122.122.122.12");
  });

  it("should update token options when env changes", () => {
    const { env, setEnv } = environmentStore.getState();

    renderWithAppContext(<SwapForm maxSlippageFraction={null} />);

    expect(env).toBe(Env.Mainnet);
    expect(screen.queryAllByRole("button")[0]).toHaveTextContent(
      "USDC on Solana",
    );

    act(() => setEnv(Env.Devnet));

    expect(environmentStore.getState().env).toBe(Env.Devnet);
    expect(screen.queryAllByRole("button")[0]).toHaveTextContent(
      "USDC on Ethereum",
    );
  });
});

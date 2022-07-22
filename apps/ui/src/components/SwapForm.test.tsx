import { act, screen } from "@testing-library/react";
import type { FC } from "react";

import { Env } from "../config";
import { useEnvironment as environmentStore } from "../core/store";
import { renderWithAppContext } from "../testUtils";

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

const findFromTokenButton = () => screen.queryAllByRole("button")[0];

describe("SwapForm", () => {
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

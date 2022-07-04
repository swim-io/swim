import { act, fireEvent, screen, waitFor } from "@testing-library/react";
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
    expect(screen.queryAllByRole("button")[0]).toHaveTextContent(
      "USDC on Solana",
    );

    act(() => setEnv(Env.Devnet));

    expect(environmentStore.getState().env).toBe(Env.Devnet);
    expect(screen.queryAllByRole("button")[0]).toHaveTextContent(
      "USDC on Ethereum",
    );
  });

  it("should update toToken options when fromToken changes", async () => {
    // assert initial value of toToken
    expect(screen.queryAllByRole("button")[3]).toHaveTextContent(
      "USDT on Solana",
    );

    // click toToken button
    fireEvent.click(screen.queryAllByRole("button")[0]);

    // wait for TokenSearchModal to render
    await waitFor(() => {
      return screen.findByPlaceholderText("Search tokens");
    });

    // Click on GST option
    fireEvent.click(screen.getByTitle("GST Green Satoshi Token BNB Chain"));

    // assert toToken has updated
    expect(screen.queryAllByRole("button")[3]).toHaveTextContent(
      "GST on Solana",
    );
  });

  it("should update toToken options when fromToken is updated with toToken value", async () => {
    // assert initial value of toToken
    expect(screen.queryAllByRole("button")[3]).toHaveTextContent(
      "USDT on Solana",
    );

    // click toToken button
    fireEvent.click(screen.queryAllByRole("button")[0]);

    // wait for TokenSearchModal to render
    await waitFor(() => {
      return screen.findByPlaceholderText("Search tokens");
    });

    // Click on GST option
    fireEvent.click(screen.getByTitle("USDT Tether USD Solana"));

    // assert toToken has updated
    expect(screen.queryAllByRole("button")[3]).toHaveTextContent(
      "USDC on Solana",
    );
  });
});

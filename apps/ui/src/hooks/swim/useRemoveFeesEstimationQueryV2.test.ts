import { Env } from "@swim-io/core";
import { waitFor } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react-hooks";
import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import { useEnvironment } from "../../core/store";
import { renderHookWithAppContext } from "../../testUtils";

import { useRemoveFeesEstimationQueryV2 } from "./useRemoveFeesEstimationQueryV2";

describe("useRemoveFeesEstimationQueryV2", () => {
  beforeEach(() => {
    const { result: envStore } = renderHook(() => useEnvironment());
    act(() => {
      envStore.current.setCustomIp("127.0.0.1");
      envStore.current.setEnv(Env.Devnet);
    });
    const { result: queryClient } = renderHookWithAppContext(() =>
      useQueryClient(),
    );
    queryClient.current.setQueryData(
      [Env.Devnet, "gasPrice", EcosystemId.Ethereum],
      new Decimal(7e-8),
    );
    queryClient.current.setQueryData(
      [Env.Devnet, "gasPrice", EcosystemId.Bnb],
      new Decimal(5e-9),
    );
  });

  it("should return valid estimation for removing from Solana pool", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRemoveFeesEstimationQueryV2(EcosystemId.Solana),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0.01));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0));
    expect(result.current.data?.bnb).toEqual(new Decimal(0));
  });

  it("should return ETH estimation for removing from Ethereum pool", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRemoveFeesEstimationQueryV2(EcosystemId.Ethereum),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0.0259));
    expect(result.current.data?.bnb).toEqual(new Decimal(0));
  });

  it("should return BNB estimation for removing from BNB pool", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRemoveFeesEstimationQueryV2(EcosystemId.Bnb),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0));
    expect(result.current.data?.bnb).toEqual(new Decimal(0.00185));
  });
});

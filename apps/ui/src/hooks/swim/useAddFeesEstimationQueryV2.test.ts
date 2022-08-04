import { Env } from "@swim-io/core";
import { waitFor } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react-hooks";
import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import { useEnvironment } from "../../core/store";
import {
  BNB_BUSD,
  BNB_USDT,
  ETHEREUM_USDC,
  ETHEREUM_USDT,
  SOLANA_USDC,
  SOLANA_USDT,
} from "../../fixtures";
import { Amount } from "../../models";
import { renderHookWithAppContext } from "../../testUtils";

import { useAddFeesEstimationQueryV2 } from "./useAddFeesEstimationQueryV2";

describe("useAddFeesEstimationQueryV2", () => {
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

  it("should return valid estimation for adding to Solana pool", async () => {
    const { result } = renderHookWithAppContext(() =>
      useAddFeesEstimationQueryV2(
        [
          Amount.fromHuman(SOLANA_USDC, new Decimal(99)),
          Amount.fromHuman(SOLANA_USDT, new Decimal(99)),
        ],
        EcosystemId.Solana,
      ),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0.01));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0));
    expect(result.current.data?.bnb).toEqual(new Decimal(0));
  });

  it("should return ETH estimation for adding to Ethereum pool", async () => {
    const { result } = renderHookWithAppContext(() =>
      useAddFeesEstimationQueryV2(
        [
          Amount.fromHuman(ETHEREUM_USDC, new Decimal(99)),
          Amount.fromHuman(ETHEREUM_USDT, new Decimal(0)),
        ],
        EcosystemId.Ethereum,
      ),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0.0133));
    expect(result.current.data?.bnb).toEqual(new Decimal(0));
  });

  it("should return more ETH estimation for adding more token to Ethereum pool", async () => {
    const { result } = renderHookWithAppContext(() =>
      useAddFeesEstimationQueryV2(
        [
          Amount.fromHuman(ETHEREUM_USDC, new Decimal(99)),
          Amount.fromHuman(ETHEREUM_USDT, new Decimal(99)),
        ],
        EcosystemId.Ethereum,
      ),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0.0182));
    expect(result.current.data?.bnb).toEqual(new Decimal(0));
  });

  it("should return BNB estimation for adding to BNB pool", async () => {
    const { result } = renderHookWithAppContext(() =>
      useAddFeesEstimationQueryV2(
        [
          Amount.fromHuman(BNB_BUSD, new Decimal(99)),
          Amount.fromHuman(BNB_USDT, new Decimal(99)),
        ],
        EcosystemId.Bnb,
      ),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0));
    expect(result.current.data?.bnb).toEqual(new Decimal(0.0013));
  });
});

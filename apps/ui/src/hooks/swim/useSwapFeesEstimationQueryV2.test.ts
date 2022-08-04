import { Env } from "@swim-io/core";
import { act, renderHook } from "@testing-library/react-hooks";
import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import { useEnvironment } from "../../core/store";
import { renderHookWithAppContext } from "../../testUtils";

import { useSwapFeesEstimationQueryV2 } from "./useSwapFeesEstimationQueryV2";

jest.mock("./useGasPriceQuery", () => ({
  useGasPriceQuery: jest.fn(),
}));

describe("useSwapFeesEstimationQueryV2", () => {
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

  it("should return fixed fee for Solana => Solana", async () => {
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSwapFeesEstimationQueryV2(
        {
          tokenId: "devnet-solana-usdt",
          ecosystemId: EcosystemId.Solana,
        },
        {
          tokenId: "devnet-solana-usdc",
          ecosystemId: EcosystemId.Solana,
        },
      ),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0.01));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0));
    expect(result.current.data?.bnb).toEqual(new Decimal(0));
  });

  it("should return fee for Solana => Ethereum", async () => {
    const { result, waitFor } = renderHookWithAppContext(() => {
      return useSwapFeesEstimationQueryV2(
        {
          tokenId: "devnet-solana-usdt",
          ecosystemId: EcosystemId.Solana,
        },
        {
          tokenId: "devnet-ethereum-usdt",
          ecosystemId: EcosystemId.Ethereum,
        },
      );
    });
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0.01));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0.021));
    expect(result.current.data?.bnb).toEqual(new Decimal(0));
  });

  it("should return fee for Solana => BNB", async () => {
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSwapFeesEstimationQueryV2(
        {
          tokenId: "devnet-solana-usdt",
          ecosystemId: EcosystemId.Solana,
        },
        {
          tokenId: "devnet-bnb-busd",
          ecosystemId: EcosystemId.Bnb,
        },
      ),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0.01));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0));
    expect(result.current.data?.bnb).toEqual(new Decimal(0.0015));
  });

  it("should return fee for Ethereum => Solana", async () => {
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSwapFeesEstimationQueryV2(
        {
          tokenId: "devnet-ethereum-usdt",
          ecosystemId: EcosystemId.Ethereum,
        },
        {
          tokenId: "devnet-solana-usdt",
          ecosystemId: EcosystemId.Solana,
        },
      ),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0.01));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0.0133));
    expect(result.current.data?.bnb).toEqual(new Decimal(0));
  });

  it("should return fee for Ethereum => BNB", async () => {
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSwapFeesEstimationQueryV2(
        {
          tokenId: "devnet-ethereum-usdt",
          ecosystemId: EcosystemId.Ethereum,
        },
        {
          tokenId: "devnet-bnb-busd",
          ecosystemId: EcosystemId.Bnb,
        },
      ),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0.0133));
    expect(result.current.data?.bnb).toEqual(new Decimal(0.0015));
  });

  it("should return fee for Ethereum => Ethereum", async () => {
    const { result, waitFor } = renderHookWithAppContext(() =>
      useSwapFeesEstimationQueryV2(
        {
          tokenId: "devnet-ethereum-usdt",
          ecosystemId: EcosystemId.Ethereum,
        },
        {
          tokenId: "devnet-ethereum-usdc",
          ecosystemId: EcosystemId.Ethereum,
        },
      ),
    );
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.solana).toEqual(new Decimal(0));
    expect(result.current.data?.ethereum).toEqual(new Decimal(0.0343));
    expect(result.current.data?.bnb).toEqual(new Decimal(0.0));
  });
});

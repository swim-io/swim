import { Env } from "@swim-io/core-types";
import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import { act, renderHook } from "@testing-library/react-hooks";
import Decimal from "decimal.js";

import { useSplTokenAccountsQuery, useWallets } from "..";
import {
  CONFIGS,
  DEVNET_POOLS,
  DEVNET_POOLS_FOR_RESTRUCTURE,
  DEVNET_SWIMUSD,
  findTokenById,
} from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { MOCK_TOKEN_ACCOUNTS, MOCK_WALLETS } from "../../fixtures";
import { Amount, InteractionType, generateId } from "../../models";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useCreateInteractionStateV2 } from "./useCreateInteractionStateV2";

const SOLANA_USDC = findTokenById("devnet-solana-usdc", Env.Devnet);
const SOLANA_USDT = findTokenById("devnet-solana-usdt", Env.Devnet);

Object.defineProperty(global.self, "crypto", {
  value: {
    getRandomValues: (arr: string | readonly any[]) => Buffer.alloc(arr.length),
  },
});

jest.mock("../../models", () => ({
  ...jest.requireActual("../../models"),
  generateId: jest.fn(),
}));

jest.mock("../../core/selectors", () => ({
  ...jest.requireActual("../../core/selectors"),
  selectConfig: jest.fn(),
}));

jest.mock("..", () => ({
  ...jest.requireActual(".."),
  useSplTokenAccountsQuery: jest.fn(),
  useWallets: jest.fn(),
}));

// Make typescript happy with jest
const generateIdMock = mockOf(generateId);
const selectConfigMock = mockOf(selectConfig);
const useSplTokenAccountsQueryMock = mockOf(useSplTokenAccountsQuery);
const useWalletsMock = mockOf(useWallets);

describe("useCreateInteractionStateV2", () => {
  beforeEach(() => {
    const { result: envStore } = renderHook(() => useEnvironment());
    act(() => {
      envStore.current.setCustomLocalnetIp("127.0.0.1");
      envStore.current.setEnv(Env.Devnet);
    });
    generateIdMock.mockReturnValue("11111111111111111111111111111111");
    useSplTokenAccountsQueryMock.mockReturnValue({ data: MOCK_TOKEN_ACCOUNTS });
    useWalletsMock.mockReturnValue(MOCK_WALLETS);
    selectConfigMock.mockReturnValue({
      ...CONFIGS[Env.Devnet],
      pools: [...DEVNET_POOLS, ...DEVNET_POOLS_FOR_RESTRUCTURE],
    });
    jest.spyOn(Date, "now").mockImplementation(() => 1657544558283);
  });

  it("should create state for Swap from SOLANA USDC to SOLANA USDT", async () => {
    const { result } = renderHookWithAppContext(() =>
      useCreateInteractionStateV2(),
    );
    const createInteractionState = result.current;
    const interactionState = createInteractionState({
      type: InteractionType.SwapV2,
      params: {
        fromTokenDetail: {
          tokenId: "devnet-solana-usdc",
          ecosystemId: SOLANA_ECOSYSTEM_ID,
          value: new Decimal("1000"),
        },
        toTokenDetail: {
          tokenId: "devnet-solana-usdt",
          ecosystemId: SOLANA_ECOSYSTEM_ID,
          value: new Decimal("1000"),
        },
      },
    });
    expect(interactionState).toMatchSnapshot();
  });

  it("should create state for Swap from ETHEREUM USDC to ETHEREUM USDT", async () => {
    const { result } = renderHookWithAppContext(() =>
      useCreateInteractionStateV2(),
    );
    const createInteractionState = result.current;
    const interactionState = createInteractionState({
      type: InteractionType.SwapV2,
      params: {
        fromTokenDetail: {
          tokenId: "devnet-ethereum-usdc",
          ecosystemId: ETHEREUM_ECOSYSTEM_ID,
          value: new Decimal("1000"),
        },
        toTokenDetail: {
          tokenId: "devnet-ethereum-usdt",
          ecosystemId: ETHEREUM_ECOSYSTEM_ID,
          value: new Decimal("1000"),
        },
      },
    });
    expect(interactionState).toMatchSnapshot();
  });

  it("should create state for Swap from SOLANA USDC to ETHEREUM USDC", async () => {
    const { result } = renderHookWithAppContext(() =>
      useCreateInteractionStateV2(),
    );
    const createInteractionState = result.current;
    const interactionState = createInteractionState({
      type: InteractionType.SwapV2,
      params: {
        fromTokenDetail: {
          tokenId: "devnet-solana-usdc",
          ecosystemId: SOLANA_ECOSYSTEM_ID,
          value: new Decimal("1000"),
        },
        toTokenDetail: {
          tokenId: "devnet-ethereum-usdc",
          ecosystemId: ETHEREUM_ECOSYSTEM_ID,
          value: new Decimal("1000"),
        },
      },
    });
    expect(interactionState).toMatchSnapshot();
  });

  it("should create state for Swap from ETHEREUM USDC to SOLANA USDC", async () => {
    const { result } = renderHookWithAppContext(() =>
      useCreateInteractionStateV2(),
    );
    const createInteractionState = result.current;
    const interactionState = createInteractionState({
      type: InteractionType.SwapV2,
      params: {
        fromTokenDetail: {
          tokenId: "devnet-ethereum-usdc",
          ecosystemId: ETHEREUM_ECOSYSTEM_ID,
          value: new Decimal("1000"),
        },
        toTokenDetail: {
          tokenId: "devnet-solana-usdc",
          ecosystemId: SOLANA_ECOSYSTEM_ID,
          value: new Decimal("1000"),
        },
      },
    });
    expect(interactionState).toMatchSnapshot();
  });

  it("should create state for Swap from ETHEREUM USDC to BNB USDT", async () => {
    const { result } = renderHookWithAppContext(() =>
      useCreateInteractionStateV2(),
    );
    const createInteractionState = result.current;
    const interactionState = createInteractionState({
      type: InteractionType.SwapV2,
      params: {
        fromTokenDetail: {
          tokenId: "devnet-ethereum-usdc",
          ecosystemId: ETHEREUM_ECOSYSTEM_ID,
          value: new Decimal("1000"),
        },
        toTokenDetail: {
          tokenId: "devnet-bnb-usdt",
          ecosystemId: BNB_ECOSYSTEM_ID,
          value: new Decimal("1000"),
        },
      },
    });
    expect(interactionState).toMatchSnapshot();
  });

  it("should create state for Add", async () => {
    const { result } = renderHookWithAppContext(() =>
      useCreateInteractionStateV2(),
    );
    const createInteractionState = result.current;
    const interactionState = createInteractionState({
      type: InteractionType.Add,
      poolId: "devnet-solana-usdc-usdt",
      params: {
        inputAmounts: [
          Amount.fromHuman(SOLANA_USDC, new Decimal("100")),
          Amount.fromHuman(SOLANA_USDT, new Decimal("10")),
        ],
        minimumMintAmount: Amount.fromHuman(DEVNET_SWIMUSD, new Decimal("110")),
      },
      lpTokenTargetEcosystem: SOLANA_ECOSYSTEM_ID,
    });
    expect(interactionState).toMatchSnapshot();
  });

  it("should create state for Remove", async () => {
    const { result } = renderHookWithAppContext(() =>
      useCreateInteractionStateV2(),
    );
    const createInteractionState = result.current;
    const interactionState = createInteractionState({
      type: InteractionType.RemoveExactOutput,
      poolId: "devnet-solana-usdc-usdt",
      params: {
        exactOutputAmounts: [
          Amount.fromHuman(SOLANA_USDC, new Decimal("100")),
          Amount.fromHuman(SOLANA_USDT, new Decimal("10")),
        ],
        maximumBurnAmount: Amount.fromHuman(DEVNET_SWIMUSD, new Decimal("110")),
      },
      lpTokenSourceEcosystem: SOLANA_ECOSYSTEM_ID,
    });
    expect(interactionState).toMatchSnapshot();
  });
});

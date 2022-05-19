import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import { Env, configs } from "../../config";
import { useConfig } from "../../contexts";
import {
  BSC_USDT_TO_ETH_USDC_SWAP,
  ETH_USDC_TO_SOL_USDC_SWAP,
} from "../../fixtures/swim/interactions";
import { Amount } from "../../models";
import {
  findLocalnetTokenById,
  mockOf,
  renderHookWithAppContext,
} from "../../testUtils";

import { useInteraction } from "./useInteraction";
import { useInteractionState } from "./useInteractionState";

const SOLANA_USDC = findLocalnetTokenById("localnet-solana-usdc");
const SOLANA_USDT = findLocalnetTokenById("localnet-solana-usdt");
const ETHEREUM_USDC = findLocalnetTokenById("localnet-ethereum-usdc");
const ETHEREUM_USDT = findLocalnetTokenById("localnet-ethereum-usdt");
const BSC_BUSD = findLocalnetTokenById("localnet-bsc-busd");
const BSC_USDT = findLocalnetTokenById("localnet-bsc-usdt");

jest.mock("../../contexts", () => ({
  ...jest.requireActual("../../contexts"),
  useConfig: jest.fn(),
}));
jest.mock("./useInteraction", () => ({
  ...jest.requireActual("./useInteraction"),
  useInteraction: jest.fn(),
}));

// Make typescript happy with jest
const useInteractionMock = mockOf(useInteraction);
const useConfigMock = mockOf(useConfig);

describe("useInteractionState", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
    useConfigMock.mockReturnValue(configs[Env.Localnet]);
  });

  it("should return initial state for ETH to SOL Swap", async () => {
    useInteractionMock.mockReturnValue(ETH_USDC_TO_SOL_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useInteractionState(ETH_USDC_TO_SOL_USDC_SWAP.id),
    );
    expect(result.current).toEqual({
      interactionId: "05c0e3ea832571ae4c64e80b2e2a12f9",
      prepareSplTokenAccountsState: {
        tokenAccountState: {
          Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: undefined,
          USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy: undefined,
        },
      },
      solanaPoolOperations: [
        {
          operation: {
            instruction: 1,
            interactionId: "05c0e3ea832571ae4c64e80b2e2a12f9",
            params: {
              exactInputAmounts: [
                Amount.fromHuman(SOLANA_USDC, new Decimal(0)),
                Amount.fromHuman(SOLANA_USDT, new Decimal(0)),
                Amount.fromHuman(ETHEREUM_USDC, new Decimal(1001)),
                Amount.fromHuman(ETHEREUM_USDT, new Decimal(0)),
                Amount.fromHuman(BSC_BUSD, new Decimal(0)),
                Amount.fromHuman(BSC_USDT, new Decimal(0)),
              ],
              minimumOutputAmount: Amount.fromHuman(
                SOLANA_USDC,
                new Decimal(995.624615),
              ),
              outputTokenIndex: 0,
            },
            poolId: "hexapool",
          },
          tx: null,
        },
      ],
      wormholeFromSolanaTransfers: [],
      wormholeToSolanaTransfers: [
        {
          fromEcosystem: "ethereum",
          id: "05c0e3ea832571ae4c64e80b2e2a12f9_ethereum_USDC_toSolana",
          interactionId: "05c0e3ea832571ae4c64e80b2e2a12f9",
          token: ETHEREUM_USDC,
          txs: {
            approveAndTransferToken: [],
            claimTokenOnSolana: null,
            postVaaOnSolana: null,
          },
          value: new Decimal(1001),
        },
      ],
    });
  });

  // it("should return required ecosystems for SOL to ETH Swap", async () => {
  //   useInteractionMock.mockReturnValue(SOL_USDC_TO_ETH_USDC_SWAP);
  //   const { result } = renderHookWithAppContext(() =>
  //     useInteractionState(SOL_USDC_TO_ETH_USDC_SWAP.id),
  //   );
  //   expect(result.current).toEqual({});
  // });

  // it("should return required ecosystems for SOL to SOL Swap", async () => {
  //   useInteractionMock.mockReturnValue(SOL_USDC_TO_SOL_USDT_SWAP);
  //   const { result } = renderHookWithAppContext(() =>
  //     useInteractionState(SOL_USDC_TO_SOL_USDT_SWAP.id),
  //   );
  //   expect(result.current).toEqual({});
  // });

  it("should return required ecosystems for BSC to ETH Swap", async () => {
    useInteractionMock.mockReturnValue(BSC_USDT_TO_ETH_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useInteractionState(BSC_USDT_TO_ETH_USDC_SWAP.id),
    );
    expect(result.current).toEqual({
      interactionId: "1e8cdbbb60f72e02f99e3c81f447b0a8",
      prepareSplTokenAccountsState: {
        tokenAccountState: {
          Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: undefined,
          "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr": undefined,
        },
      },
      solanaPoolOperations: [
        {
          operation: {
            instruction: 1,
            interactionId: "1e8cdbbb60f72e02f99e3c81f447b0a8",
            params: {
              exactInputAmounts: [
                Amount.fromHuman(SOLANA_USDC, new Decimal(0)),
                Amount.fromHuman(SOLANA_USDT, new Decimal(0)),
                Amount.fromHuman(ETHEREUM_USDC, new Decimal(0)),
                Amount.fromHuman(ETHEREUM_USDT, new Decimal(0)),
                Amount.fromHuman(BSC_BUSD, new Decimal(0)),
                Amount.fromHuman(BSC_USDT, new Decimal(1000)),
              ],
              minimumOutputAmount: Amount.fromHuman(
                ETHEREUM_USDC,
                new Decimal(994.574014),
              ),
              outputTokenIndex: 2,
            },
            poolId: "hexapool",
          },
          tx: null,
        },
      ],
      wormholeFromSolanaTransfers: [
        {
          toEcosystem: "ethereum",
          id: "1e8cdbbb60f72e02f99e3c81f447b0a8_ethereum_USDC_fromSolana",
          token: ETHEREUM_USDC,
          txs: {
            claimTokenOnEvm: null,
            transferSplToken: null,
          },
          value: null,
        },
      ],
      wormholeToSolanaTransfers: [
        {
          fromEcosystem: "bsc",
          id: "1e8cdbbb60f72e02f99e3c81f447b0a8_bsc_USDT_toSolana",
          interactionId: "1e8cdbbb60f72e02f99e3c81f447b0a8",
          token: BSC_USDT,
          txs: {
            approveAndTransferToken: [],
            claimTokenOnSolana: null,
            postVaaOnSolana: null,
          },
          value: new Decimal(1000),
        },
      ],
    });
  });
});

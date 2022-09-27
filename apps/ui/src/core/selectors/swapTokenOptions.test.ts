import {
  TESTNET_POOLS,
  TESTNET_POOLS_FOR_RESTRUCTURE,
  TESTNET_SWIMUSD,
  TESTNET_TOKENS,
  TESTNET_TOKENS_FOR_RESTRUCTURE,
} from "../../config";
import { mockOf } from "../../testUtils";
import { useEnvironment } from "../store";

import { selectConfig } from "./environment";
import { selectSwapTokenOptions } from "./swapTokenOptions";

jest.mock("./environment", () => ({
  ...jest.requireActual("./environment"),
  selectConfig: jest.fn(),
}));

const selectConfigMock = mockOf(selectConfig);

const DISABLED_POOLS = new Set([
  "testnet-acala-ausd",
  "testnet-karura-ausd",
  "testnet-aurora-usn",
]);
const MOCK_POOLS = [...TESTNET_POOLS, ...TESTNET_POOLS_FOR_RESTRUCTURE].filter(
  (pool) => !DISABLED_POOLS.has(pool.id),
);

describe("swapTokenOptions", () => {
  describe("selectSwapTokenOptions", () => {
    beforeEach(() => {
      selectConfigMock.mockReturnValue({
        pools: MOCK_POOLS,
        tokens: [
          ...TESTNET_TOKENS,
          TESTNET_SWIMUSD,
          ...TESTNET_TOKENS_FOR_RESTRUCTURE,
        ],
      });
    });

    it("should return swap options", () => {
      const options = selectSwapTokenOptions(useEnvironment.getState());
      expect(options).toMatchSnapshot();
    });
  });
});

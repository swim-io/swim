import {
  DEVNET_POOLS,
  DEVNET_POOLS_FOR_RESTRUCTURE,
  DEVNET_SWIMUSD,
  DEVNET_TOKENS,
  DEVNET_TOKENS_FOR_RESTRUCTURE,
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
  "devnet-acala-ausd",
  "devnet-karura-ausd",
  "devnet-aurora-usn",
]);
const MOCK_POOLS = [...DEVNET_POOLS, ...DEVNET_POOLS_FOR_RESTRUCTURE].filter(
  (pool) => !DISABLED_POOLS.has(pool.id),
);

describe("swapTokenOptions", () => {
  describe("selectSwapTokenOptions", () => {
    beforeEach(() => {
      selectConfigMock.mockReturnValue({
        pools: MOCK_POOLS,
        tokens: [
          ...DEVNET_TOKENS,
          DEVNET_SWIMUSD,
          ...DEVNET_TOKENS_FOR_RESTRUCTURE,
        ],
      });
    });

    it("should return swap options", () => {
      const options = selectSwapTokenOptions(useEnvironment.getState());
      expect(options).toMatchSnapshot();
    });
  });
});

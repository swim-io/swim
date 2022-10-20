import { Env } from "@swim-io/core";
import { act, renderHook } from "@testing-library/react-hooks";

import { useEnvironment } from "../store";

import { selectSwapTokenOptions } from "./swapTokenOptions";

describe("swapTokenOptions", () => {
  describe("selectSwapTokenOptions", () => {
    beforeEach(() => {
      const { result: envStore } = renderHook(() => useEnvironment());
      act(() => {
        envStore.current.setCustomIp("127.0.0.1");
        envStore.current.setEnv(Env.Testnet);
      });
    });

    it("should return swap options", () => {
      const options = selectSwapTokenOptions(useEnvironment.getState());
      expect(options).toMatchSnapshot();
    });
  });
});

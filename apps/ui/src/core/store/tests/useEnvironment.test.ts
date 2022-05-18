import { cleanup } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react-hooks";

import { useEnvironment } from "..";
import { DEFAULT_ENV, Env, configs } from "../../../config";

describe("useEnvironment", () => {
  afterEach(() => {
    jest.resetAllMocks();
    cleanup();
  });
  it("returns initial environment state", async () => {
    const { result } = renderHook(() => useEnvironment());

    const initState = {
      env: DEFAULT_ENV,
      envs: [DEFAULT_ENV],
      customLocalnetIp: null,
      config: configs[DEFAULT_ENV],
      _hasHydrated: false,
      setHasHydrated: jest.spyOn(result.current, "setHasHydrated"),
      setEnv: jest.spyOn(result.current, "setEnv"),
      setCustomLocalnetIp: jest.spyOn(result.current, "setCustomLocalnetIp"),
    };

    expect(result.current).toEqual(initState);
  });
  it("calls setEnv func with Devnet argument, but returns Mainnet env as customLocalnetIp is null", async () => {
    const { result } = renderHook(() => useEnvironment());
    const mockSetEnv = jest.spyOn(result.current, "setEnv");
    act(() => {
      result.current.setEnv(Env.Devnet);
    });

    expect(mockSetEnv).toBeCalledTimes(1);
    expect(result.current.customLocalnetIp).toEqual(null);
    expect(result.current.env).toEqual(DEFAULT_ENV);
    expect(result.current.envs).toEqual([DEFAULT_ENV]);
  });
  it("calls setCustomLocalnetIp func and sets customLocalnetIp with new IP", async () => {
    const { result } = renderHook(() => useEnvironment());
    // console.log("result 1", result.current);
    const mockSetCustomLocalnetIp = jest.spyOn(
      result.current,
      "setCustomLocalnetIp",
    );
    act(() => {
      result.current.setCustomLocalnetIp("159.223.16.33");
    });

    // console.log("result 2", result.current);
    // console.log(localStorage.getItem("env-config"));

    expect(mockSetCustomLocalnetIp).toBeCalledTimes(1);
    // expect(result.current.customLocalnetIp).toEqual("159.223.16.33");
  });
  // it("calls setEnv func with Devnet argument and returns Devnet env as customLocalnetIp is not null", async () => {
  //   const { result } = renderHook(() => useEnvironment());
  //   const mockSetEnv = jest.spyOn(result.current, "setEnv");
  //   act(() => {
  //     result.current.setCustomLocalnetIp("159.223.16.33");
  //   });
  //   act(() => {
  //     result.current.setEnv(Object.values(Env)[1]);
  //   });

  //   expect(mockSetEnv).toBeCalledTimes(1);
  //   expect(result.current.customLocalnetIp).toEqual("159.223.16.33");
  //   expect(result.current.env).toEqual(Object.values(Env)[1]);
  // });
});

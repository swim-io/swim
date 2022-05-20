import { cleanup } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react-hooks";

import { useEnvironment } from "..";
import { DEFAULT_ENV, Env, configs, overrideLocalnetIp } from "../../../config";

describe("useEnvironment", () => {
  const IP = "127.0.0.1";

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
    };

    expect(result.current).toEqual(expect.objectContaining(initState));
  });
  it("calls setEnv func with Devnet argument, but returns Mainnet env as customLocalnetIp is null", async () => {
    const { result: state } = renderHook(() => useEnvironment());

    act(() => {
      state.current.setEnv(Env.Devnet);
    });

    expect(state.current.customLocalnetIp).toEqual(null);
    expect(state.current.env).toEqual(DEFAULT_ENV);
    expect(state.current.envs).toEqual([DEFAULT_ENV]);
  });
  it("calls setCustomLocalnetIp func and sets customLocalnetIp with new IP", async () => {
    const { result: state } = renderHook(() => useEnvironment());

    act(() => {
      state.current.setCustomLocalnetIp(IP);
    });

    expect(state.current.customLocalnetIp).toEqual(IP);
    expect(state.current.config).toEqual(
      overrideLocalnetIp(configs[Env.Localnet], IP),
    );
    expect(state.current.envs).toEqual(Object.values(Env));
    expect(state.current.env).toEqual(useEnvironment.getState().env);
  });
  it("calls setCustomLocalnetIp func with null IP and keeps default values", async () => {
    const { result: state } = renderHook(() => useEnvironment());

    act(() => {
      state.current.setCustomLocalnetIp(null);
    });

    expect(state.current.customLocalnetIp).toEqual(null);
    expect(state.current.config).toEqual(configs[Env.Localnet]);
    expect(state.current.envs).toEqual([Env.Mainnet]);
    expect(state.current.env).toEqual(Env.Mainnet);
  });
  it("calls setEnv func with Devnet argument and returns Devnet env as customLocalnetIp is not null", async () => {
    const { result } = renderHook(() => useEnvironment());
    const mockSetEnv = jest.spyOn(result.current, "setEnv");

    act(() => {
      result.current.setCustomLocalnetIp(IP);
    });
    act(() => {
      result.current.setEnv(Env.Devnet);
    });

    expect(mockSetEnv).toBeCalledTimes(1);
    expect(result.current.customLocalnetIp).toEqual(IP);
    expect(result.current.env).toEqual(Env.Devnet);
    expect(result.current.envs).toEqual(Object.values(Env));
  });
  it("calls setHasHydrated and returns _hasHydrated true", () => {
    const { result: state } = renderHook(() => useEnvironment());
    const mockSetHydrated = jest.spyOn(state.current, "setHasHydrated");
    act(() => {
      state.current.setHasHydrated(true);
    });
    expect(mockSetHydrated).toBeCalledTimes(1);
    expect(state.current._hasHydrated).toBe(true);
  });
});

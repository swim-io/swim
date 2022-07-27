import { Env } from "@swim-io/core";
import { act, renderHook } from "@testing-library/react-hooks";

import { DEFAULT_ENV } from "../../selectors";
import { useEnvironment } from "../useEnvironment";

describe("useEnvironment", () => {
  const CUSTOM_IP = "123.4.5.6";
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  it("returns initial environment state", () => {
    const { result } = renderHook(() => useEnvironment());

    const initState = {
      env: DEFAULT_ENV,
      customIp: null,
    };

    expect(result.current).toEqual(expect.objectContaining(initState));
  });
  it("calls setEnv func with Devnet argument, but returns Mainnet env as customIp is null", () => {
    const { result: state } = renderHook(() => useEnvironment());

    act(() => {
      state.current.setEnv(Env.Devnet);
    });

    expect(state.current.customIp).toEqual(null);
    expect(state.current.env).toEqual(DEFAULT_ENV);
  });
  it("calls setCustomIp func and sets customIp with new IP", () => {
    const { result: state } = renderHook(() => useEnvironment());

    act(() => {
      state.current.setCustomIp(CUSTOM_IP);
    });
    const expected = {
      customIp: CUSTOM_IP,
      env: useEnvironment.getState().env,
    };

    expect(state.current).toEqual(expect.objectContaining(expected));
  });
  it("calls setCustomIp func with null IP and keeps default values", () => {
    const { result: state } = renderHook(() => useEnvironment());

    act(() => {
      state.current.setCustomIp(null);
    });

    expect(state.current.customIp).toEqual(null);
    expect(state.current.env).toEqual(Env.Mainnet);
  });
  it("calls setEnv func with Devnet argument and returns Devnet env as customIp is not null", () => {
    const { result } = renderHook(() => useEnvironment());

    act(() => {
      result.current.setCustomIp(CUSTOM_IP);
    });
    act(() => {
      result.current.setEnv(Env.Devnet);
    });
    expect(result.current.customIp).toEqual(CUSTOM_IP);
    expect(result.current.env).toEqual(Env.Devnet);
  });
});

import { act, renderHook } from "@testing-library/react-hooks";

import { DEFAULT_ENV, Env } from "../../../config";
import { useEnvironment } from "../useEnvironment";

describe("useEnvironment", () => {
  const CUSTOM_LOCALNET_IP = "123.4.5.6";
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
      customLocalnetIp: null,
    };

    expect(result.current).toEqual(expect.objectContaining(initState));
  });
  it("calls setEnv func with Devnet argument, but returns Mainnet env as customLocalnetIp is null", () => {
    const { result: state } = renderHook(() => useEnvironment());

    act(() => {
      state.current.setEnv(Env.Devnet);
    });

    expect(state.current.customLocalnetIp).toEqual(null);
    expect(state.current.env).toEqual(DEFAULT_ENV);
  });
  it("calls setCustomLocalnetIp func and sets customLocalnetIp with new IP", () => {
    const { result: state } = renderHook(() => useEnvironment());

    act(() => {
      state.current.setCustomLocalnetIp(CUSTOM_LOCALNET_IP);
    });
    const expected = {
      customLocalnetIp: CUSTOM_LOCALNET_IP,
      env: useEnvironment.getState().env,
    };

    expect(state.current).toEqual(expect.objectContaining(expected));
  });
  it("calls setCustomLocalnetIp func with null IP and keeps default values", () => {
    const { result: state } = renderHook(() => useEnvironment());

    act(() => {
      state.current.setCustomLocalnetIp(null);
    });

    expect(state.current.customLocalnetIp).toEqual(null);
    expect(state.current.env).toEqual(Env.Mainnet);
  });
  it("calls setEnv func with Devnet argument and returns Devnet env as customLocalnetIp is not null", () => {
    const { result } = renderHook(() => useEnvironment());

    act(() => {
      result.current.setCustomLocalnetIp(CUSTOM_LOCALNET_IP);
    });
    act(() => {
      result.current.setEnv(Env.Devnet);
    });
    expect(result.current.customLocalnetIp).toEqual(CUSTOM_LOCALNET_IP);
    expect(result.current.env).toEqual(Env.Devnet);
  });
});

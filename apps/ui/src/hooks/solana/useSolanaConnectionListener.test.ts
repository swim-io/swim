import EventEmitter from "events";

import type { AccountChangeCallback } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import type { CustomConnection } from "@swim-io/solana";
import { assertType } from "@swim-io/utils";

import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useSolanaClient } from "./useSolanaClient";
import type { SolanaAccountChangeListenerCallback } from "./useSolanaConnectionListener";
import { useSolanaAccountChangeListener } from "./useSolanaConnectionListener";

jest.mock("./useSolanaClient", () => ({
  ...jest.requireActual("./useSolanaClient"),
  useSolanaClient: jest.fn(),
}));

const useSolanaClientMock = mockOf(useSolanaClient);

const createSolanaMockConnection = () => {
  // event name is the public key in string format
  const accountChangeEventEmitter = new EventEmitter();

  let clientSubscriptionIdCount = 0;
  const accountChangeListenerMap = new Map<
    number,
    {
      readonly key: string;
      readonly callback: AccountChangeCallback;
    }
  >();

  const onAccountChange = jest.fn<
    ReturnType<InstanceType<typeof CustomConnection>["onAccountChange"]>,
    Parameters<InstanceType<typeof CustomConnection>["onAccountChange"]>
  >((publicKey, callback) => {
    clientSubscriptionIdCount += 1;
    const eventCallback: AccountChangeCallback = (...args) => callback(...args);
    accountChangeListenerMap.set(clientSubscriptionIdCount, {
      key: publicKey.toString(),
      callback: eventCallback,
    });

    accountChangeEventEmitter.addListener(publicKey.toString(), eventCallback);
    return clientSubscriptionIdCount;
  });

  const removeAccountChangeListener = jest.fn<
    ReturnType<
      InstanceType<typeof CustomConnection>["removeAccountChangeListener"]
    >,
    Parameters<
      InstanceType<typeof CustomConnection>["removeAccountChangeListener"]
    >
    // eslint-disable-next-line @typescript-eslint/require-await
  >(async (clientSubscriptionId) => {
    const listenerOption = accountChangeListenerMap.get(clientSubscriptionId);
    if (!listenerOption) return;
    accountChangeEventEmitter.removeListener(
      listenerOption.key,
      listenerOption.callback,
    );
  });

  return {
    connection: assertType<Partial<InstanceType<typeof CustomConnection>>>()({
      onAccountChange,
      removeAccountChangeListener,
    }),
    emitMockAccountChangeEvent: (
      key: string,
      args: Parameters<AccountChangeCallback>,
    ): void => {
      accountChangeEventEmitter.emit(key, ...args);
    },
  };
};

describe("useSolanaAccountChangeListener", () => {
  it("should add listener to keys", async () => {
    const { connection, emitMockAccountChangeEvent } =
      createSolanaMockConnection();

    useSolanaClientMock.mockReturnValue({
      connection:
        connection as Partial<CustomConnection> as unknown as CustomConnection,
    });

    const queryOptions = [
      { key: Keypair.generate().publicKey.toString() },
      { key: Keypair.generate().publicKey.toString() },
    ];
    const callback = jest.fn<
      ReturnType<SolanaAccountChangeListenerCallback>,
      Parameters<SolanaAccountChangeListenerCallback>
    >();
    const { waitFor } = renderHookWithAppContext(() => {
      return useSolanaAccountChangeListener(queryOptions, callback);
    });

    await waitFor(() => {
      expect(connection.onAccountChange).toHaveBeenCalledTimes(
        queryOptions.length,
      );
    });

    for (const index of queryOptions.keys()) {
      const lamports = (index + 1) * 100;

      emitMockAccountChangeEvent(queryOptions[index].key, [
        { lamports } as Partial<Parameters<AccountChangeCallback>[0]> as any,
        {} as Partial<Parameters<AccountChangeCallback>[1]> as any,
      ]);
      expect(callback).toHaveBeenCalledTimes(index + 1);
      expect(callback).toHaveBeenCalledWith(
        queryOptions[index].key,
        expect.objectContaining({ lamports }),
        expect.any(Object),
      );
    }
  });

  it("should not add listener when query option is disabled", async () => {
    const { connection, emitMockAccountChangeEvent } =
      createSolanaMockConnection();

    useSolanaClientMock.mockReturnValue({
      connection:
        connection as Partial<CustomConnection> as unknown as CustomConnection,
    });

    const queryOptions = [
      { key: Keypair.generate().publicKey.toString(), enabled: true },
      { key: Keypair.generate().publicKey.toString() },
      { key: Keypair.generate().publicKey.toString(), enabled: false },
    ];
    const callback = jest.fn<
      ReturnType<SolanaAccountChangeListenerCallback>,
      Parameters<SolanaAccountChangeListenerCallback>
    >();
    const { waitFor } = renderHookWithAppContext(() => {
      return useSolanaAccountChangeListener(queryOptions, callback);
    });

    await waitFor(() => {
      expect(connection.onAccountChange).toHaveBeenCalled();
    });

    // case for enabled=true
    emitMockAccountChangeEvent(queryOptions[0].key, [
      {} as Partial<Parameters<AccountChangeCallback>[0]> as any,
      {} as Partial<Parameters<AccountChangeCallback>[1]> as any,
    ]);
    expect(callback).toHaveBeenCalledWith(
      queryOptions[0].key,
      expect.any(Object),
      expect.any(Object),
    );

    // case for enabled=undefined
    emitMockAccountChangeEvent(queryOptions[1].key, [
      {} as Partial<Parameters<AccountChangeCallback>[0]> as any,
      {} as Partial<Parameters<AccountChangeCallback>[1]> as any,
    ]);
    expect(callback).toHaveBeenCalledWith(
      queryOptions[1].key,
      expect.any(Object),
      expect.any(Object),
    );

    // case for enabled=false
    emitMockAccountChangeEvent(queryOptions[2].key, [
      {} as Partial<Parameters<AccountChangeCallback>[0]> as any,
      {} as Partial<Parameters<AccountChangeCallback>[1]> as any,
    ]);
    expect(callback).not.toHaveBeenCalledWith(
      queryOptions[2].key,
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should ignore null/undefined keys", async () => {
    const { connection, emitMockAccountChangeEvent } =
      createSolanaMockConnection();

    useSolanaClientMock.mockReturnValue({
      connection:
        connection as Partial<CustomConnection> as unknown as CustomConnection,
    });

    const queryOptions = [
      { key: Keypair.generate().publicKey.toString() },
      { key: null },
      { key: undefined },
    ];
    const callback = jest.fn<
      ReturnType<SolanaAccountChangeListenerCallback>,
      Parameters<SolanaAccountChangeListenerCallback>
    >();
    const { waitFor } = renderHookWithAppContext(() => {
      return useSolanaAccountChangeListener(queryOptions, callback);
    });

    await waitFor(() => {
      expect(connection.onAccountChange).toHaveBeenCalled();
    });

    // case for normal
    if (queryOptions[0].key) {
      emitMockAccountChangeEvent(queryOptions[0].key, [
        {} as Partial<Parameters<AccountChangeCallback>[0]> as any,
        {} as Partial<Parameters<AccountChangeCallback>[1]> as any,
      ]);
    }
    expect(callback).toHaveBeenCalledWith(
      queryOptions[0].key,
      expect.any(Object),
      expect.any(Object),
    );

    // case for null
    if (queryOptions[1].key) {
      emitMockAccountChangeEvent(queryOptions[1].key, [
        {} as Partial<Parameters<AccountChangeCallback>[0]> as any,
        {} as Partial<Parameters<AccountChangeCallback>[1]> as any,
      ]);
    }
    expect(callback).not.toHaveBeenCalledWith(
      queryOptions[1].key,
      expect.any(Object),
      expect.any(Object),
    );

    // case for undefined
    if (queryOptions[2].key) {
      emitMockAccountChangeEvent(queryOptions[2].key, [
        {} as Partial<Parameters<AccountChangeCallback>[0]> as any,
        {} as Partial<Parameters<AccountChangeCallback>[1]> as any,
      ]);
    }
    expect(callback).not.toHaveBeenCalledWith(
      queryOptions[2].key,
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should allow all parameters to be a newly created reference without re-triggering the listeners", async () => {
    const { connection } = createSolanaMockConnection();

    useSolanaClientMock.mockReturnValue({
      connection:
        connection as Partial<CustomConnection> as unknown as CustomConnection,
    });

    const key = Keypair.generate().publicKey.toString();
    const { rerender, waitFor } = renderHookWithAppContext(() => {
      return useSolanaAccountChangeListener([{ key }], () => {});
    });

    await waitFor(() => {
      expect(connection.onAccountChange).toHaveBeenCalledTimes(1);
    });

    rerender();

    // should not register listener again
    // this test will fail if you remove the useRef/useMemo from the implementation
    expect(connection.onAccountChange).toHaveBeenCalledTimes(1);
  });

  it("should add new listeners when new keys are added", async () => {
    const { connection } = createSolanaMockConnection();

    useSolanaClientMock.mockReturnValue({
      connection:
        connection as Partial<CustomConnection> as unknown as CustomConnection,
    });

    let keys = [{ key: Keypair.generate().publicKey.toString() }];
    const callback = jest.fn<
      ReturnType<SolanaAccountChangeListenerCallback>,
      Parameters<SolanaAccountChangeListenerCallback>
    >();
    const { rerender, waitFor } = renderHookWithAppContext(() => {
      return useSolanaAccountChangeListener(keys, callback);
    });

    await waitFor(() => {
      expect(connection.onAccountChange).toHaveBeenCalledTimes(1);
    });

    // Mutating existing keys reference is not supported
    keys = [
      ...keys,
      {
        key: Keypair.generate().publicKey.toString(),
      },
    ];
    rerender();

    // existing keys will re-register via useEffect cycle, so it is 3 not 2
    expect(connection.onAccountChange).toHaveBeenCalledTimes(3);
  });

  it("should remove unused listeners when some keys are removed", async () => {
    const { connection } = createSolanaMockConnection();

    useSolanaClientMock.mockReturnValue({
      connection:
        connection as Partial<CustomConnection> as unknown as CustomConnection,
    });

    let keys = [
      { key: Keypair.generate().publicKey.toString() },
      { key: Keypair.generate().publicKey.toString() },
    ];
    const callback = jest.fn<
      ReturnType<SolanaAccountChangeListenerCallback>,
      Parameters<SolanaAccountChangeListenerCallback>
    >();
    const { rerender, waitFor } = renderHookWithAppContext(() => {
      return useSolanaAccountChangeListener(keys, callback);
    });

    await waitFor(() => {
      expect(connection.onAccountChange).toHaveBeenCalledTimes(2);
    });

    // Mutating existing keys reference is not supported
    keys = keys.slice(0, 1);
    rerender();

    // existing keys will re-register via useEffect cycle, so it is 3 not 2
    expect(connection.onAccountChange).toHaveBeenCalledTimes(3);
    // existing keys will unregister then re-register, so it is 2 not 1
    expect(connection.removeAccountChangeListener).toHaveBeenCalledTimes(2);
  });

  it("should remove all listeners of old solana connection when switching to new solana connection", async () => {
    const oldMock = createSolanaMockConnection();
    useSolanaClientMock.mockReturnValue({
      connection:
        oldMock.connection as Partial<CustomConnection> as unknown as CustomConnection,
    });

    const key = Keypair.generate().publicKey.toString();
    const callback = jest.fn<
      ReturnType<SolanaAccountChangeListenerCallback>,
      Parameters<SolanaAccountChangeListenerCallback>
    >();
    const { rerender, waitFor } = renderHookWithAppContext(() => {
      return useSolanaAccountChangeListener([{ key }], callback);
    });

    await waitFor(() => {
      expect(oldMock.connection.onAccountChange).toHaveBeenCalledTimes(1);
    });

    const newMock = createSolanaMockConnection();
    useSolanaClientMock.mockReturnValue({
      connection:
        newMock.connection as Partial<CustomConnection> as unknown as CustomConnection,
    });

    rerender();

    // should deregister old listener
    expect(
      oldMock.connection.removeAccountChangeListener,
    ).toHaveBeenCalledTimes(1);
    oldMock.emitMockAccountChangeEvent(key, [
      {} as Partial<Parameters<AccountChangeCallback>[0]> as any,
      {} as Partial<Parameters<AccountChangeCallback>[1]> as any,
    ]);
    expect(callback).not.toHaveBeenCalled();

    // then register new listener
    expect(newMock.connection.onAccountChange).toHaveBeenCalledTimes(1);
    newMock.emitMockAccountChangeEvent(key, [
      {} as Partial<Parameters<AccountChangeCallback>[0]> as any,
      {} as Partial<Parameters<AccountChangeCallback>[1]> as any,
    ]);
    expect(callback).toHaveBeenCalledWith(
      key,
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should remove all listeners when unmount", async () => {
    const { connection, emitMockAccountChangeEvent } =
      createSolanaMockConnection();

    useSolanaClientMock.mockReturnValue({
      connection:
        connection as Partial<CustomConnection> as unknown as CustomConnection,
    });

    const key = Keypair.generate().publicKey.toString();
    const callback = jest.fn<
      ReturnType<SolanaAccountChangeListenerCallback>,
      Parameters<SolanaAccountChangeListenerCallback>
    >();
    const { unmount, waitFor } = renderHookWithAppContext(() => {
      return useSolanaAccountChangeListener([{ key }], callback);
    });

    await waitFor(() => {
      expect(connection.onAccountChange).toHaveBeenCalledTimes(1);
    });

    const newMock = createSolanaMockConnection();
    useSolanaClientMock.mockReturnValue({
      connection:
        newMock.connection as Partial<CustomConnection> as unknown as CustomConnection,
    });

    unmount();

    // should deregister old listener
    expect(connection.removeAccountChangeListener).toHaveBeenCalledTimes(1);
    emitMockAccountChangeEvent(key, [
      {} as Partial<Parameters<AccountChangeCallback>[0]> as any,
      {} as Partial<Parameters<AccountChangeCallback>[1]> as any,
    ]);
    expect(callback).not.toHaveBeenCalled();
  });
});

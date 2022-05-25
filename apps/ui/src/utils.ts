export type ReadonlyRecord<K extends string | number | symbol, T> = Readonly<
  Record<K, T>
>;
export const getRecordKeys = <T extends string | number | symbol>(
  record: ReadonlyRecord<T, any>,
): readonly T[] => Object.keys(record) as unknown as readonly T[];

export function shortenAddress(address: string, chars = 5): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getUniqueSize = (items: readonly any[]): number =>
  new Set(items).size;

export const deduplicate = <Key, Value>(
  getKey: (item: Value) => Key,
  values: readonly Value[],
) => [
  ...new Map<Key, Value>(
    values.map((value) => [getKey(value), value]),
  ).values(),
];

export const findOrThrow = <T>(
  searchables: readonly T[],
  condition: (element: T, index: number, array: readonly T[]) => boolean,
): T => {
  const result = searchables.find(condition);
  if (result === undefined) {
    throw new Error("Not found");
  }
  return result;
};

export const isNotNull = <T>(value: T | null): value is T => value !== null;

export const isEachNotNull = <T>(
  array: readonly (T | null)[],
): array is readonly T[] => {
  return array.every((elem) => elem !== null);
};

export const defaultIfError = <T, U>(f: () => T, defaultValue: U): T | U => {
  try {
    return f();
  } catch {
    return defaultValue;
  }
};

export const chunks = <T>(
  array: readonly T[],
  size: number,
): readonly (readonly T[])[] =>
  // eslint-disable-next-line functional/prefer-readonly-type
  Array.apply<number, T[], readonly (readonly T[])[]>(
    0,
    new Array(Math.ceil(array.length / size)),
  ).map((_, index) => array.slice(index * size, (index + 1) * size));

export const groupBy = <T, K extends keyof any>(
  list: readonly T[],
  getKey: (item: T) => K,
  // eslint-disable-next-line functional/prefer-readonly-type
): Record<K, T[]> =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    // eslint-disable-next-line functional/immutable-data, @typescript-eslint/no-unnecessary-condition
    if (!previous[group]) previous[group] = [];
    // eslint-disable-next-line functional/immutable-data
    previous[group].push(currentItem);
    return previous;
    // eslint-disable-next-line functional/prefer-readonly-type
  }, {} as Record<K, T[]>);

export const filterMap = <
  Original,
  Mapped,
  Filtered extends Original = Original,
>(
  filter:
    | ((
        currentValue: Original,
        currentIndex: number,
        originalArray: readonly Original[],
      ) => boolean)
    | ((
        currentValue: Original,
        currentIndex: number,
      ) => currentValue is Filtered),
  // NOTE: we can’t pass an array into the map function because we don’t know it inside the reduce
  map: (currentValue: Filtered, currentIndex: number) => Mapped,
  items: readonly Original[],
): readonly Mapped[] =>
  items.reduce<readonly Mapped[]>(
    (previousValue, currentValue, currentIndex): readonly Mapped[] =>
      filter(currentValue, currentIndex, items)
        ? [...previousValue, map(currentValue, currentIndex)]
        : previousValue,
    [],
  );

export const isUserOnMobileDevice = (): boolean => {
  // device detection via regex on navigator.userAgent, source stackoverflow
  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
    navigator.userAgent,
  );
};

export const pluralize = (text: string, shouldPluralize = true): string =>
  shouldPluralize ? `${text}s` : text;

export type ReadonlyRecord<K extends string | number | symbol, T> = Readonly<
  Record<K, T>
>;

export const getRecordKeys = <T extends string | number | symbol>(
  record: ReadonlyRecord<T, any>,
): readonly T[] => Object.keys(record) as unknown as readonly T[];

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

export const chunks = <T>(
  array: readonly T[],
  size: number,
): readonly (readonly T[])[] =>
  // eslint-disable-next-line functional/prefer-readonly-type
  Array.apply<number, T[], readonly (readonly T[])[]>(
    0,
    // eslint-disable-next-line functional/prefer-readonly-type
    new Array(Math.ceil(array.length / size)) as T[],
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

export const sortBy = <T>(
  array: readonly T[],
  attribute: keyof T,
  transform: (value: T[keyof T]) => T[keyof T] = (value) => value,
): readonly T[] => {
  return array.slice().sort((a, b) => {
    const aValue = transform(a[attribute]);
    const bValue = transform(b[attribute]);

    if (aValue > bValue) return 1;
    if (aValue < bValue) return -1;
    return 0;
  });
};

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

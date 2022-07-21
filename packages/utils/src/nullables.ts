export const isNotNull = <T>(value: T | null): value is T => value !== null;

export const isEachNotNull = <T>(
  array: readonly (T | null)[],
): array is readonly T[] => {
  return array.every((elem) => elem !== null);
};

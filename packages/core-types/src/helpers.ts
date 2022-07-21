export type ReadonlyRecord<K extends string | number | symbol, T> = Readonly<
  Record<K, T>
>;

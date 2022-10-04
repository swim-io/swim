import type { ReadonlyRecord } from "./collections";

/** To keep the original type of the input while ensuring it conforms to a generic type */
export const assertType = <T>() => {
  return <U extends T>(input: U): U => input;
};

/** Get union type of object values */
export type ValueOf<T extends ReadonlyRecord<string, unknown>> = T[keyof T];

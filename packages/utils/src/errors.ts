export const defaultIfError = <T, U>(f: () => T, defaultValue: U): T | U => {
  try {
    return f();
  } catch {
    return defaultValue;
  }
};

export function assertIsError(error: unknown): asserts error is Error {
  if (!(error instanceof Error)) {
    throw error;
  }
}

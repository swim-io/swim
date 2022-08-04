export const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitFor = async (
  condition: () => boolean,
  timeoutInMs: number,
  intervalInMs = 100,
): Promise<boolean> => {
  const start = Date.now();

  return new Promise((resolve) => {
    const check = () => {
      if (condition()) {
        resolve(true);
      } else if (Date.now() - start > timeoutInMs) {
        resolve(false);
      } else {
        setTimeout(check, intervalInMs);
      }
    };
    check();
  });
};

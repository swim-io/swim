import { useReducer, useState } from "react";

// Roughly matches react-query’s UseMutationResult
export type UseAsyncGeneratorResult<Params, Result> = {
  readonly data?: readonly Result[];
  readonly error: Error | null;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly isSuccess: boolean;
  readonly isIdle: boolean;
  readonly generate: (params: Params) => Promise<void>;
  readonly reset: () => void;
};

const enum ActionType {
  Reset,
  AddResult,
}

type Action<Result> =
  | {
      readonly type: ActionType.Reset;
    }
  | {
      readonly type: ActionType.AddResult;
      readonly result: Result;
    };

export const useAsyncGenerator = <Params, Result>(
  createGenerator: (params: Params) => Promise<AsyncGenerator<Result>>,
): UseAsyncGeneratorResult<Params, Result> => {
  const [data, dispatch] = useReducer(
    (
      previousState: readonly Result[] | undefined,
      action: Action<Result>,
    ): readonly Result[] | undefined => {
      switch (action.type) {
        case ActionType.AddResult:
          return [...(previousState ?? []), action.result];
        case ActionType.Reset:
          return undefined;
        default:
          throw new Error("Invalid action type");
      }
    },
    undefined,
  );
  const [error, setError] = useState<Error | null>(null);
  const isError = error !== null;
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isIdle = !isLoading && !isSuccess && !isError;

  const reset = (): void => {
    dispatch({ type: ActionType.Reset });
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
  };

  const generate = async (params: Params): Promise<void> => {
    setError(null);
    setIsLoading(true);
    setIsSuccess(false);
    try {
      const generator = await createGenerator(params);
      for await (const result of generator) {
        dispatch({
          type: ActionType.AddResult,
          result,
        });
      }
      setIsLoading(false);
      setIsSuccess(true);
    } catch (err) {
      setIsLoading(false);
      setError(err);
    }
  };

  return {
    generate,
    data,
    error,
    isError,
    isLoading,
    isSuccess,
    isIdle,
    reset,
  };
};

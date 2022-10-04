import type { ReadonlyRecord } from "@swim-io/utils";

/** Polyfill `cause` as it is only supported by Chrome >= 93, Edge >= 93, Firefox >= 91, Safari >= 15 */
export class ErrorWithCause extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message);
    // Do not pass `ErrorOptions` to `super()` because it will not work in old browsers
    this.cause = options?.cause;
  }
}

/** Polyfill `AggregateError` as it is only supported by Chrome >= 85, Edge >= 85, Firefox >= 79, Safari >= 14 */
type IAggregateError = InstanceType<typeof globalThis.AggregateError>;
export class AggregateError extends ErrorWithCause implements IAggregateError {
  public constructor(
    // eslint-disable-next-line functional/prefer-readonly-type
    public readonly errors: any[],
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/** Error code format: `@swim-io/${packageName}/${errorCode}` */
export type SwimErrorCode = `@swim-io/${Lowercase<string>}/${string}`;

export type SwimErrorOptions<T extends SwimErrorCode> = {
  /** @see {@link SwimErrorCode} */
  readonly code: T;
  /**
   * Indicates the specific original cause of an error
   *
   * The original type is `unknown` but stricter here to avoid misuse
   * */
  readonly cause?: Error;
  /**
   * Indicates if the error is temporary and expected to be retried
   *
   * `null` indicates it is not decided yet
   */
  readonly isRetryable?: boolean | null;
};
export class SwimError<
  T extends SwimErrorCode = SwimErrorCode,
> extends ErrorWithCause {
  /** @see {@link SwimErrorOptions.cause} */
  public override readonly cause?: Error;
  /** @see {@link SwimErrorCode} */
  public readonly code: T;
  /** @see {@link SwimErrorOptions.isRetryable} */
  public readonly isRetryable: boolean | null;
  /** @see {@link isSwimError} */
  public readonly isSwimError: true;

  public constructor(
    /** Error message in English */
    public override readonly message: string,
    { code, cause, isRetryable }: SwimErrorOptions<T>,
  ) {
    super(message, { cause });
    this.code = code;
    this.isSwimError = true;
    this.isRetryable = isRetryable ?? null;
  }
}

export type SwimAggregateErrorOptions<T extends SwimErrorCode> = Omit<
  SwimErrorOptions<T>,
  "cause"
>;
export class SwimAggregateError<
  T extends SwimErrorCode = SwimErrorCode,
> extends AggregateError {
  /** Use {@link SwimAggregateError.errors} instead */
  public override readonly cause?: never;
  /** @see {@link SwimErrorCode} */
  public readonly code: T;
  /** @see {@link SwimAggregateErrorOptions.isRetryable} */
  public readonly isRetryable: boolean | null;
  /** @see {@link isSwimError} */
  public readonly isSwimError: true;

  public constructor(
    /**
     * Indicates the original causes of an error
     *
     * The original type is `any[]` but stricter here to avoid misuse
     */
    // eslint-disable-next-line functional/prefer-readonly-type
    public override readonly errors: Error[],
    /** Error message in English */
    public override readonly message: string,
    { code, isRetryable }: SwimAggregateErrorOptions<T>,
  ) {
    super(errors, message);
    this.code = code;
    this.isSwimError = true;
    this.isRetryable = isRetryable ?? null;
  }
}

/** A safe way to check if input is `SwimError` or `SwimAggregateError` despite different implementations across different version of swim SDKs */
export function isSwimError(input: unknown): input is SwimError {
  return (
    input instanceof Error &&
    // Do not check by `instanceof SwimError` or `instanceof SwimAggregateError` because there may be multiple implementations in user's node_modules
    (input as { readonly isSwimError?: boolean }).isSwimError === true
  );
}

/** Helper type for SDKs to define their own swim error mapping, expects to have a scoped `SwimErrorCode`, such as `@swim-io/sdk-name/${string}` */
export type SwimErrorMapping<T extends SwimErrorCode> = ReadonlyRecord<
  T,
  {
    /** @see {@link SwimError.message} */
    readonly message: string;
    /** @see {@link SwimErrorOptions.isRetryable} */
    readonly isRetryable?: boolean | null;
  }
>;

type PoolErrorMap = {
  readonly [hexErrorCode: string]: string;
};

// Error codes from the `pool` repository:
// https://github.com/swim-io/pool/blob/b417fb069b9859d479f406a24b9cbf79c4d20755/src/error.rs#L13-L66
// TODO: Generate TS enum from the Rust enum
const POOL_ERROR_CODES_TO_MESSAGES: PoolErrorMap = {
  // InvalidAmpFactorValue = 100 // 0x64
  "0x64": "Specified amp factor is out of bounds.",
  // InvalidAmpFactorTimestamp
  "0x65": "Amp factor adjustment window is too short.",
  // InvalidFeeInput
  "0x66": "Given fee is invalid.",
  // DuplicateAccount
  "0x67": "Can't pass the same account twice here.",
  // MintHasBalance
  "0x68": "LP token mint has a positive balance.",

  // InvalidMintAuthority
  "0x69": "Pool does not have mint authority of LP token mint.",
  // MintHasFreezeAuthority
  "0x6a": "LP token mint's freeze authority is set.",
  // TokenAccountHasBalance
  "0x6b": "Token account has a positive balance.",
  // TokenAccountHasDelegate
  "0x6c": "Token account's delegate is set.",
  // TokenAccountHasCloseAuthority
  "0x6d": "Token account's close authority is set.",

  // InvalidGovernanceAccount
  "0x6e": "Invalid governance account.",
  // InvalidGovernanceFeeAccount
  "0x6f": "Invalid governance fee account.",
  // InvalidPoolAuthorityAccount
  "0x70": "Invalid pool authority account.",
  // InvalidMintAccount
  "0x71": "Invalid mint account.",
  // InsufficientDelay
  "0x72": "Not enough time has passed since prepare instruction.",

  // InvalidEnact
  "0x73": "Nothing to enact",
  // PoolIsPaused
  "0x74": "Pool is temporarily paused. Please try again later.",
  // PoolTokenAccountExpected
  "0x75": "Expected a token account that belongs to the pool.",
  // OutsideSpecifiedLimits
  "0x76": "The instruction could not be completed within the specified limits.",
  // AddRequiresAllTokens
  "0x77": "Initial add to pool must include all tokens.",

  // ImpossibleRemove
  "0x78":
    "Remove can't be completed due to the approximative nature of fee math implementation.",
  // MaxDecimalDifferenceExceeded
  "0x79":
    "The maximum difference in decimals between tokens in the pool has been exceeded.",
};

const POOL_ERROR_CODES_REGEXP_UNION = Object.keys(
  POOL_ERROR_CODES_TO_MESSAGES,
).join("|");

// Compiles to:
// `custom program error: (?<poolErrorCode>(?:0x64|0x65|0x66|0x67|0x68|0x69|0x6a|0x6b|0x6c|0x6d|0x6e|0x6f|0x70|0x71|0x72|0x73|0x74|0x75|0x76|0x77|0x78|0x79))/`
// Regexp playground: https://regex101.com/r/H6S8Fp/1
const POOL_ERROR_CODES_REGEXP = new RegExp(
  `custom program error: (?<errorCode>(?:${POOL_ERROR_CODES_REGEXP_UNION}))`,
);

// Parse user-friendly `PoolError` from the Solana Program
// TODO: Return error code from Solana Program instead of parsing errors
export const extractSwimPoolError = (log: string): string | null => {
  const errorCode = POOL_ERROR_CODES_REGEXP.exec(log)?.groups?.errorCode;

  if (errorCode) {
    return POOL_ERROR_CODES_TO_MESSAGES[errorCode];
  }

  return;
};

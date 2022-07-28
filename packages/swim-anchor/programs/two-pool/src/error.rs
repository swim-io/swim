// pool_lib::generate_errors!();

use anchor_lang::prelude::*;

// Do we still need the offset?

//OFFSET is used to deal with technical debt imposed on us by SPL::ProgramError
// ProgramError uses the Custom variant to store other errors (such as spl token TokenError but also our PoolError)
// so to distinguish TokenErrors from PoolErrors, we're offsetting PoolErrors by 100 while TokenErrors start at 0
// const OFFSET: isize = 100;

#[error_code]
#[derive(Eq, PartialEq)]
pub enum PoolError {
  #[msg("Specified amp factor is out of bounds")]
  InvalidAmpFactorValue,
  #[msg("Amp factor adjustment window is too short")]
  InvalidAmpFactorTimestamp,
  #[msg("Given fee is invalid")]
  InvalidFeeInput,
  #[msg("Can't pass the same account twice here")]
  DuplicateAccount,
  #[msg("LP token mint has a positive balance")]
  MintHasBalance,

  // 105
  #[msg("Pool does not have mint authority of LP token mint")]
  InvalidMintAuthority,
  #[msg("LP token mint's freeze authority is set")]
  MintHasFreezeAuthority,
  #[msg("Token account has a positive balance")]
  TokenAccountHasBalance,
  #[msg("Token account's delegate is set")]
  TokenAccountHasDelegate,
  #[msg("Token account's close authority is set")]
  TokenAccountHasCloseAuthority,

  // 110
  #[msg("Invalid governance account")]
  InvalidGovernanceAccount,
  #[msg("Invalid governance fee account")]
  InvalidGovernanceFeeAccount,
  #[msg("Invalid pool authority account")]
  InvalidPoolAuthorityAccount,
  #[msg("Invalid mint account")]
  InvalidMintAccount,
  #[msg("Not enough time has passed since prepare instruction")]
  InsufficientDelay,

  //115
  #[msg("Nothing to enact")]
  InvalidEnact,
  #[msg("Pool is paused")]
  PoolIsPaused,
  #[msg("Expected a token account that belongs to the pool")]
  PoolTokenAccountExpected,
  #[msg("The instruction could not be completed within the specified limits")]
  OutsideSpecifiedLimits,
  #[msg("Initial add to pool must include all tokens")]
  InitialAddRequiresAllTokens,

  //120
  #[msg("Remove can't be completed due to the approximative nature of fee math implementation")]
  ImpossibleRemove,
  #[msg("The maximum difference in decimals between tokens in the pool has been exceeded")]
  MaxDecimalDifferenceExceeded,
  #[msg("Invalid timestamp from Clock sysvar")]
  InvalidTimestamp,
  #[msg("Add Requires at least one token")]
  AddRequiresAtLeastOneToken,
}

// impl From<PoolError> for ProgramError {
//     fn from(e: PoolError) -> Self {
//         ProgramError::Custom(e as u32)
//     }
// }

// This doesn't look to be used in the code anywhere
// pub fn to_error_msg(error: &ProgramError) -> String {
//     match error {
//         ProgramError::Custom(ec) if *ec < OFFSET as u32 => {
//             TokenError::from_u32(*ec).unwrap().to_string()
//         }
//         ProgramError::Custom(ec) => PoolError::from_u32(*ec).unwrap().to_string(),
//         e => e.to_string(),
//     }
// }

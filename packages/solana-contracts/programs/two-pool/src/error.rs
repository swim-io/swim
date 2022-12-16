use anchor_lang::prelude::*;

// custom anchor errors start at 6000
// https://www.anchor-lang.com/docs/errors

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

    #[msg("Remove can't be completed due to the approximative nature of fee math implementation")]
    ImpossibleRemove,
    #[msg("The maximum difference in decimals between tokens in the pool has been exceeded")]
    MaxDecimalDifferenceExceeded,
    #[msg("Invalid timestamp from Clock sysvar")]
    InvalidTimestamp,
    #[msg("Add Requires at least one token")]
    AddRequiresAtLeastOneToken,
    #[msg("Invalid parameters for Swap Exact Input")]
    InvalidSwapExactInputParameters,
    #[msg("Invalid parameters for Swap Exact Output")]
    InvalidSwapExactOutputParameters,
    #[msg("Invalid parameters for Remove Uniform")]
    InvalidRemoveUniformParameters,
    #[msg("Invalid parameters for Remove Exact Burn")]
    InvalidRemoveExactBurnParameters,
    #[msg("Invalid parameters for Remove Exact Output")]
    InvalidRemoveExactOutputParameters,
    #[msg("Invalid parameters for Remove Exact Output")]
    InsufficientPoolTokenAccountBalance,
    #[msg("Invalid Token Index")]
    InvalidTokenIndex,
    #[msg("Invalid Pause Key")]
    InvalidPauseKey,
    #[msg("Invalid New Pause Key")]
    InvalidNewPauseKey,
    #[msg("Not a valid Switchboard account")]
    InvalidSwitchboardAccount,
    #[msg("Switchboard feed has not been updated in 5 minutes")]
    StaleFeed,
    #[msg("Switchboard feed exceeded provided confidence interval")]
    ConfidenceIntervalExceeded,
    #[msg("Maximum decimals exceeded")]
    MaxDecimalsExceeded,
    #[msg("Conversion error")]
    ConversionError,
    #[msg("Burn amount exceeds lp total supply")]
    BurnAmountExceedsTotalSupply,
    #[msg("Invalid Upcoming Governance Key")]
    InvalidUpcomingGovernanceKey,
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

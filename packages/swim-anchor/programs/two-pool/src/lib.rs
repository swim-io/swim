use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::UnixTimestamp;
use anchor_spl::token::*;

use {
    crate::{
      amp_factor::AmpFactor,
      decimal::DecimalU64,
      // error::PoolError,
      instructions::*,
    //   // instructions::{
    //   //     DeFiInstruction, GovernanceInstruction, ProcessDefiInstruction,
    //   //     ProcessGovernanceInstruction, ProcessInit,
    //   // },
    //     invariant::{AmountT, Invariant},
      pool_fee::PoolFee,
      state::TwoPool,
      error::PoolError,
    },

    // common::{create_array, create_result_array},
    // solana_program::{
    //     account_info::AccountInfo,
    //     clock::UnixTimestamp,
    //     entrypoint::ProgramResult,
    //     program::{invoke, invoke_signed},
    //     program_error::ProgramError,
    //     program_option::COption,
    //     program_pack::{IsInitialized, Pack},
    //     pubkey::Pubkey,
    //     sysvar::{clock::Clock, rent::Rent, Sysvar},
    // },
    // spl_token::{
    //     error::TokenError,
    //     instruction::{burn, mint_to, transfer},
    //     state::Account as TokenState,
    //     state::Mint as MintState,
    //     ID as TOKEN_PROGRAM_ID,
    // },
    // std::cmp::{max, min},
};
// use pool_lib::error::PoolError;

pub mod amp_factor;
// pub mod common;
// pub mod decimal;
// pub mod error;
pub mod instructions;
// pub mod instructions_old;
// pub mod invariant;
pub mod pool_fee;
pub mod state;
pub mod error;
pub mod decimal;
pub mod invariant;
mod common;

//Note - using this b/c of not all bytes read error. found from using this - https://brson.github.io/2021/06/08/rust-on-solana
// use solana_program::borsh::try_from_slice_unchecked;
// const ENACT_DELAY: UnixTimestamp = 3 * 86400;
// const MAX_DECIMAL_DIFFERENCE: u8 = 8;
//
// type AtomicT = u64;
// type DecT = DecimalU64;

pub const TOKEN_COUNT: usize = 2;
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod two_pool {
  use super::*;

  #[access_control(Initialize::accounts(&ctx))]
  pub fn initialize(
    ctx: Context<Initialize>,
    amp_factor: DecimalU64Anchor,
    lp_fee: DecimalU64Anchor,
    governance_fee: DecimalU64Anchor,
  ) -> Result<()> {
    // if (false) {
    //   return err!(PoolError::InvalidAmpFactorValue);
    // }
    // Ok(())
    handle_initialize(
      ctx,
      amp_factor,
      lp_fee,
      governance_fee,
    )
  }

  #[access_control(Add::accounts(&ctx))]
  pub fn add(
    ctx: Context<Add>,
    pool_add_params: AddParams,
  ) -> Result<u64> {
    // if (false) {
    //   return err!(PoolError::InvalidAmpFactorValue);
    // }
    // Ok(())
    handle_add(
      ctx,
      pool_add_params,
    )
  }
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug)]
pub struct DecimalU64Anchor {
  pub value: u64,
  pub decimals: u8,
}

impl DecimalU64Anchor {
  pub const LEN: usize = 8 + 1;
  pub fn from_decimal_u64(v: DecimalU64) -> DecimalU64Anchor {
    DecimalU64Anchor {
      value: v.get_raw(),
      decimals: v.get_decimals(),
    }
  }

  pub fn to_decimal_u64(self) -> DecimalU64 {
    DecimalU64::new(self.value, self.decimals).unwrap()
  }
}

// //TODO: remove this/decimal class references
// #[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone, Default)]
// pub struct DecT {
//   value: u64,
//   decimals: u8
// }

// #[program]
// pub mod pool {
//     use super::*;
//
//     #[access_control(Initialize::accounts(&ctx))]
//     pub fn initialize(
//       ctx: Context<Initialize>,
//       amp_factor: DecT,
//       lp_fee: DecT,
//       governance_fee: DecT,
//     ) -> Result<()> {
//       Ok(())
//     }
//
//     // pub fn process_init(
//     //     ctx: Context<ProcessInit>,
//     //     nonce: u8,
//     //     amp_factor: DecT,
//     //     lp_fee: DecT,
//     //     governance_fee: DecT,
//     // ) -> ProgramResult {
//     //     if amp_factor == DecT::const_from(0) && TOKEN_COUNT != 2 {
//     //         //constant product invariant is only implemented for 2 token pools
//     //         return Err(PoolError::InvalidAmpFactorValue.into());
//     //     }
//     //
//     //     if lp_fee + governance_fee >= DecT::from(1) {
//     //         return Err(PoolError::InvalidFeeInput.into());
//     //     }
//     //
//     //     // let mut check_duplicate_and_get_next = {
//     //     //     let mut keys: Vec<&Pubkey> = vec![];
//     //     //     let mut account_info_iter = accounts.iter();
//     //     //     move || -> Result<&AccountInfo, ProgramError> {
//     //     //         let acc = next_account_info(&mut account_info_iter)?;
//     //     //         if *acc.key != Pubkey::default() {
//     //     //             if keys.contains(&acc.key) {
//     //     //                 return Err(PoolError::DuplicateAccount.into());
//     //     //             }
//     //     //             keys.push(acc.key);
//     //     //         }
//     //     //         Ok(acc)
//     //     //     }
//     //     // };
//     //
//     //     let pool_account = ctx.accounts.state;
//     //     //msg!("[DEV] TOKEN_COUNT: {}", TOKEN_COUNT);
//     //
//     //     //msg!("[DEV] check_and_deserialize_pool_state");
//     //     match check_and_deserialize_pool_state(&pool_account, &ctx.program_id) {
//     //         Err(ProgramError::UninitializedAccount) => (),
//     //         Err(e) => return Err(e),
//     //         Ok(_) => return Err(ProgramError::AccountAlreadyInitialized),
//     //     }
//     //     //msg!("[DEV] passed check_and_deserialize_pool_state");
//     //
//     //     //msg!("[DEV] checking get_authority_account");
//     //     let pool_authority_account = get_pool_authority(pool_account.key, nonce, ctx.program_id)?;
//     //     //msg!("[DEV] passed get_authority_account");
//     //
//     //     //msg!("[DEV] checking lp_mint_account");
//     //     let lp_mint_account = ctx.accounts.lp_mint;
//     //     let lp_mint_state = check_program_owner_and_unpack::<MintState>(lp_mint_account)?;
//     //     if lp_mint_state.supply != 0 {
//     //         return Err(PoolError::MintHasBalance.into());
//     //     }
//     //     if COption::Some(pool_authority_account) != lp_mint_state.mint_authority {
//     //         return Err(PoolError::InvalidMintAuthority.into());
//     //     }
//     //     if lp_mint_state.freeze_authority.is_some() {
//     //         return Err(PoolError::MintHasFreezeAuthority.into());
//     //     }
//     //
//     //     // let token_mint_accounts: [_; TOKEN_COUNT] = create_result_array(|_| check_duplicate_and_get_next())?;
//     //     // //msg!("[DEV] token_mint_accounts.len: {}", token_mint_accounts.len());
//     //     // let token_accounts: [_; TOKEN_COUNT] = create_result_array(|_| check_duplicate_and_get_next())?;
//     //     // //msg!("[DEV] token_accounts.len: {}", token_accounts.len());
//     //     let token_mint_accounts = [ctx.accounts.token_mint_one, ctx.accounts.token_mint_two];
//     //     let token_accounts = [
//     //         ctx.accounts.token_account_one,
//     //         ctx.accounts.token_account_two,
//     //     ];
//     //
//     //     let mut decimal_range_min = lp_mint_state.decimals;
//     //     let mut decimal_range_max = decimal_range_min;
//     //     //msg!("[DEV] passed lp_mint_account checks");
//     //     let token_decimals: [_; TOKEN_COUNT] =
//     //         create_result_array(|i| -> Result<_, ProgramError> {
//     //             let mint_decimals =
//     //                 check_program_owner_and_unpack::<MintState>(token_mint_accounts[i])?.decimals;
//     //             decimal_range_min = min(decimal_range_min, mint_decimals);
//     //             decimal_range_max = max(decimal_range_max, mint_decimals);
//     //             Ok(mint_decimals)
//     //         })?;
//     //
//     //     if decimal_range_max - decimal_range_min > MAX_DECIMAL_DIFFERENCE {
//     //         return Err(PoolError::MaxDecimalDifferenceExceeded.into());
//     //     }
//     //
//     //     for i in 0..TOKEN_COUNT {
//     //         let token_account = token_accounts[i];
//     //         //msg!("[DEV] checking token_state[{}]. Pubkey: {}", i, token_account.key);
//     //         let token_state = check_program_owner_and_unpack::<TokenState>(token_account)?;
//     //
//     //         if token_state.mint != *token_mint_accounts[i].key {
//     //             return Err(TokenError::MintMismatch.into());
//     //         }
//     //         if token_state.owner != pool_authority_account {
//     //             return Err(TokenError::OwnerMismatch.into());
//     //         }
//     //         if token_state.amount != 0 {
//     //             return Err(PoolError::TokenAccountHasBalance.into());
//     //         }
//     //         if token_state.delegate.is_some() {
//     //             return Err(PoolError::TokenAccountHasDelegate.into());
//     //         }
//     //         if token_state.close_authority.is_some() {
//     //             return Err(PoolError::TokenAccountHasCloseAuthority.into());
//     //         }
//     //         //msg!("[DEV] finished checking mint_state & token_state[{}]", i);
//     //     }
//     //
//     //     //msg!("[DEV] checking governance & governance_fee accounts");
//     //     let governance_account = ctx.accounts.governance_account;
//     //     let governance_fee_account = ctx.accounts.governance_fee_account;
//     //     if (governance_fee != DecT::from(0) || *governance_fee_account.key != Pubkey::default())
//     //         && check_program_owner_and_unpack::<TokenState>(governance_fee_account)?.mint
//     //             != *lp_mint_account.key
//     //     {
//     //         return Err(TokenError::MintMismatch.into());
//     //     }
//     //     //msg!("[DEV] passed checking governance & governance_fee accounts");
//     //
//     //     serialize_pool(
//     //         &PoolState {
//     //             nonce,
//     //             is_paused: false,
//     //             amp_factor: AmpFactor::new(amp_factor)?,
//     //             lp_fee: PoolFee::new(lp_fee)?,
//     //             governance_fee: PoolFee::new(governance_fee)?,
//     //             lp_mint_key: lp_mint_account.key.clone(),
//     //             lp_decimal_equalizer: decimal_range_max - lp_mint_state.decimals,
//     //             token_mint_keys: create_array(|i| token_mint_accounts[i].key.clone()),
//     //             token_decimal_equalizers: create_array(|i| decimal_range_max - token_decimals[i]),
//     //             token_keys: create_array(|i| token_accounts[i].key.clone()),
//     //             governance_key: governance_account.key.clone(),
//     //             governance_fee_key: governance_fee_account.key.clone(),
//     //             prepared_governance_key: Pubkey::default(),
//     //             governance_transition_ts: 0,
//     //             prepared_lp_fee: PoolFee::default(),
//     //             prepared_governance_fee: PoolFee::default(),
//     //             fee_transition_ts: 0,
//     //             previous_depth: 0,
//     //         },
//     //         &pool_account,
//     //     )
//     // }
//     //
//     // pub fn process_defi_instruction(
//     //     ctx: Context<ProcessDefiInstruction>,
//     //     defi_instruction: DeFiInstruction<TOKEN_COUNT>,
//     // ) -> ProgramResult {
//     //     //msg!("[DEV] processing defi ix\n");
//     //     let pool_account = ctx.accounts.state;
//     //     let mut pool_state = check_and_deserialize_pool_state(pool_account, &ctx.program_id)?;
//     //     //msg!("[DEV] checked & deserialized pool_state");
//     //
//     //     if pool_state.is_paused
//     //         && !matches!(defi_instruction, DeFiInstruction::RemoveUniform { .. })
//     //     {
//     //         return Err(PoolError::PoolIsPaused.into());
//     //     }
//     //
//     //     let pool_authority_account = &ctx.accounts.authority;
//     //     if *pool_authority_account.key
//     //         != get_pool_authority(pool_account.key, pool_state.nonce, ctx.program_id)?
//     //     {
//     //         return Err(PoolError::InvalidPoolAuthorityAccount.into());
//     //     }
//     //     //msg!("[DEV] checked pool authority");
//     //     // let pool_token_accounts: [_; TOKEN_COUNT] = {
//     //     //     let check_pool_token_account = |i| -> Result<_, ProgramError> {
//     //     //         let pool_token_account = next_account_info(&mut account_info_iter)?;
//     //     //         if *pool_token_account.key != pool_state.token_keys[i] {
//     //     //             return Err(PoolError::PoolTokenAccountExpected.into());
//     //     //         }
//     //     //         Ok(pool_token_account)
//     //     //     };
//     //     //     create_result_array(check_pool_token_account)?
//     //     // };
//     //     let pool_token_accounts = [
//     //         ctx.accounts.token_account_one,
//     //         ctx.accounts.token_account_two,
//     //     ];
//     //     //msg!("[DEV] checked pool token accounts");
//     //
//     //     let pool_balances: [_; TOKEN_COUNT] =
//     //         create_result_array(|i| -> Result<_, ProgramError> {
//     //             Ok(check_program_owner_and_unpack::<TokenState>(pool_token_accounts[i])?.amount)
//     //         })?;
//     //
//     //     //msg!("[DEV] Checked pool balances");
//     //     let lp_mint_account = ctx.accounts.lp_mint;
//     //     if *lp_mint_account.key != pool_state.lp_mint_key {
//     //         return Err(PoolError::InvalidMintAccount.into());
//     //     }
//     //     //msg!("[DEV] checked lp_mint_account");
//     //     let lp_total_supply = check_program_owner_and_unpack::<MintState>(lp_mint_account)?.supply;
//     //     let governance_fee_account = ctx.accounts.governance_fee_account;
//     //     //msg!("[DEV] checked governance_fee_account");
//     //
//     //     let user_authority_account = &ctx.accounts.user_authority_account;
//     //     //msg!("[DEV] checked user_authority_account");
//     //
//     //     // let user_token_accounts: [_; TOKEN_COUNT] =
//     //     //     create_result_array(|_| -> Result<_, ProgramError> { Ok(next_account_info(&mut account_info_iter)?) })?;
//     //     let user_token_accounts = [
//     //         ctx.accounts.user_token_account_one,
//     //         ctx.accounts.user_token_account_two,
//     //     ];
//     //     //msg!("[DEV] checked user_token_accounts");
//     //
//     //     //spl token program account must be included in the instruction's accounts so that the SPL token program CPIs
//     //     //work but the account itself is not actually used by the code itself because invoke does not require it
//     //     let _spl_token_program_account = ctx.accounts.token_program_account;
//     //
//     //     let to_equalized = |value, equalizer| {
//     //         if equalizer > 0 {
//     //             AmountT::from(value) * AmountT::ten_to_the(equalizer)
//     //         } else {
//     //             AmountT::from(value)
//     //         }
//     //     };
//     //     let from_equalized = |value: AmountT, equalizer| {
//     //         if equalizer > 0 {
//     //             ((value + AmountT::ten_to_the(equalizer - 1) * 5u64)
//     //                 / AmountT::ten_to_the(equalizer))
//     //             .as_u64()
//     //         } else {
//     //             value.as_u64()
//     //         }
//     //     };
//     //     let array_equalize = |amounts: &[AtomicT; TOKEN_COUNT]| -> [_; TOKEN_COUNT] {
//     //         create_array(|i| to_equalized(amounts[i], pool_state.token_decimal_equalizers[i]))
//     //     };
//     //     let result_from_equalized =
//     //         |(user_amount, governance_mint_amount, latest_depth): (_, _, AmountT),
//     //          user_equalizer| {
//     //             (
//     //                 from_equalized(user_amount, user_equalizer),
//     //                 from_equalized(governance_mint_amount, pool_state.lp_decimal_equalizer),
//     //                 latest_depth.as_u128(),
//     //             )
//     //         };
//     //
//     //     let (governance_mint_amount, latest_depth) = match defi_instruction {
//     //         DeFiInstruction::Add {
//     //             input_amounts,
//     //             minimum_mint_amount,
//     //         } => {
//     //             //msg!("[DEV] Processing Add ix");
//     //             if input_amounts.iter().all(|amount| *amount == 0) {
//     //                 return Err(ProgramError::InvalidInstructionData);
//     //             }
//     //
//     //             //check if the pool is currently empty
//     //             if lp_total_supply == 0 && input_amounts.iter().any(|amount| *amount == 0) {
//     //                 return Err(PoolError::AddRequiresAllTokens.into());
//     //             }
//     //
//     //             let user_lp_token_account = ctx.accounts.user_lp_token_account;
//     //
//     //             let (mint_amount, governance_mint_amount, latest_depth) = result_from_equalized(
//     //                 Invariant::<TOKEN_COUNT>::add(
//     //                     &array_equalize(&input_amounts),
//     //                     &array_equalize(&pool_balances),
//     //                     pool_state.amp_factor.get(get_current_ts()?),
//     //                     pool_state.lp_fee.get(),
//     //                     pool_state.governance_fee.get(),
//     //                     to_equalized(lp_total_supply, pool_state.lp_decimal_equalizer),
//     //                     pool_state.previous_depth.into(),
//     //                 )?,
//     //                 pool_state.lp_decimal_equalizer,
//     //             );
//     //
//     //             // msg!(
//     //             //     "[DEV] Add: {:?}, mint_amount: {:?}, governance_mint_amount: {:?}",
//     //             //     defi_instruction,
//     //             //     mint_amount,
//     //             //     governance_mint_amount
//     //             // );
//     //
//     //             if mint_amount < minimum_mint_amount {
//     //                 // msg!(
//     //                 //     "[DEV] Returning OutsideSpecifiedLimits for Add ix: {:?}",
//     //                 //     defi_instruction
//     //                 // );
//     //                 return Err(PoolError::OutsideSpecifiedLimits.into());
//     //             }
//     //
//     //             for i in 0..TOKEN_COUNT {
//     //                 if input_amounts[i] > 0 {
//     //                     // msg!("[DEV] transferring {} for i = {}", input_amounts[i], i);
//     //                     transfer_token(
//     //                         user_token_accounts[i],
//     //                         pool_token_accounts[i],
//     //                         input_amounts[i],
//     //                         user_authority_account,
//     //                     )?;
//     //                 }
//     //             }
//     //             mint_token(
//     //                 lp_mint_account,
//     //                 user_lp_token_account,
//     //                 mint_amount,
//     //                 pool_authority_account,
//     //                 pool_account,
//     //                 pool_state.nonce,
//     //             )?;
//     //
//     //             (governance_mint_amount, latest_depth)
//     //         }
//     //
//     //         DeFiInstruction::RemoveUniform {
//     //             exact_burn_amount,
//     //             minimum_output_amounts,
//     //         } => {
//     //             if exact_burn_amount == 0 || exact_burn_amount > lp_total_supply {
//     //                 return Err(ProgramError::InvalidInstructionData);
//     //             }
//     //
//     //             let user_lp_token_account = ctx.accounts.user_lp_token_account;
//     //             let user_share = DecT::from(exact_burn_amount) / lp_total_supply;
//     //             //u64 can store 19 decimals, previous_depth can theoretically go up to TOKEN_COUNT * u64::MAX
//     //             //hence, just to be safe, we allow for previous depth to have up to 20 decimals
//     //             //therefore we can only multiply with a number with at most 18 decimals to stay within
//     //             //the 38 max decimals range of u128
//     //             const DECIMAL_UPSHIFT: u32 = 18;
//     //             let user_depth = (pool_state.previous_depth
//     //                 * ((user_share * 10u64.pow(DECIMAL_UPSHIFT)).trunc() as u128))
//     //                 / 10u128.pow(DECIMAL_UPSHIFT);
//     //             let latest_depth = pool_state.previous_depth - user_depth;
//     //
//     //             for i in 0..TOKEN_COUNT {
//     //                 let output_amount = (pool_balances[i] * user_share).trunc();
//     //                 if output_amount < minimum_output_amounts[i] {
//     //                     return Err(PoolError::OutsideSpecifiedLimits.into());
//     //                 }
//     //                 transfer_pool_token(
//     //                     pool_token_accounts[i],
//     //                     user_token_accounts[i],
//     //                     output_amount,
//     //                     pool_authority_account,
//     //                     pool_account,
//     //                     pool_state.nonce,
//     //                 )?;
//     //             }
//     //
//     //             burn_token(
//     //                 user_lp_token_account,
//     //                 lp_mint_account,
//     //                 exact_burn_amount,
//     //                 user_authority_account,
//     //             )?;
//     //
//     //             (0, latest_depth)
//     //         }
//     //
//     //         DeFiInstruction::SwapExactInput {
//     //             exact_input_amounts,
//     //             output_token_index,
//     //             minimum_output_amount,
//     //         } => {
//     //             let output_token_index = output_token_index as usize;
//     //             if exact_input_amounts.iter().all(|amount| *amount == 0)
//     //                 || output_token_index >= TOKEN_COUNT
//     //                 || exact_input_amounts[output_token_index] != 0
//     //             {
//     //                 return Err(ProgramError::InvalidInstructionData);
//     //             }
//     //
//     //             let (output_amount, governance_mint_amount, latest_depth) = result_from_equalized(
//     //                 Invariant::<TOKEN_COUNT>::swap_exact_input(
//     //                     &array_equalize(&exact_input_amounts),
//     //                     output_token_index,
//     //                     &array_equalize(&pool_balances),
//     //                     pool_state.amp_factor.get(get_current_ts()?),
//     //                     pool_state.lp_fee.get(),
//     //                     pool_state.governance_fee.get(),
//     //                     to_equalized(lp_total_supply, pool_state.lp_decimal_equalizer),
//     //                     pool_state.previous_depth.into(),
//     //                 )?,
//     //                 pool_state.token_decimal_equalizers[output_token_index],
//     //             );
//     //
//     //             if output_amount < minimum_output_amount {
//     //                 return Err(PoolError::OutsideSpecifiedLimits.into());
//     //             }
//     //
//     //             for i in 0..TOKEN_COUNT {
//     //                 if exact_input_amounts[i] > 0 {
//     //                     transfer_token(
//     //                         user_token_accounts[i],
//     //                         pool_token_accounts[i],
//     //                         exact_input_amounts[i],
//     //                         user_authority_account,
//     //                     )?;
//     //                 }
//     //             }
//     //
//     //             transfer_pool_token(
//     //                 pool_token_accounts[output_token_index],
//     //                 user_token_accounts[output_token_index],
//     //                 output_amount,
//     //                 pool_authority_account,
//     //                 pool_account,
//     //                 pool_state.nonce,
//     //             )?;
//     //
//     //             (governance_mint_amount, latest_depth)
//     //         }
//     //
//     //         DeFiInstruction::SwapExactOutput {
//     //             maximum_input_amount,
//     //             input_token_index,
//     //             exact_output_amounts,
//     //         } => {
//     //             let input_token_index = input_token_index as usize;
//     //
//     //             if exact_output_amounts.iter().all(|amount| *amount == 0)
//     //                 || input_token_index >= TOKEN_COUNT
//     //                 || exact_output_amounts[input_token_index] != 0
//     //                 || exact_output_amounts
//     //                     .iter()
//     //                     .zip(pool_balances.iter())
//     //                     .any(|(output_amount, pool_balance)| *output_amount >= *pool_balance)
//     //             {
//     //                 return Err(ProgramError::InvalidInstructionData);
//     //             }
//     //
//     //             let (input_amount, governance_mint_amount, latest_depth) = result_from_equalized(
//     //                 Invariant::<TOKEN_COUNT>::swap_exact_output(
//     //                     input_token_index,
//     //                     &array_equalize(&exact_output_amounts),
//     //                     &array_equalize(&pool_balances),
//     //                     pool_state.amp_factor.get(get_current_ts()?),
//     //                     pool_state.lp_fee.get(),
//     //                     pool_state.governance_fee.get(),
//     //                     to_equalized(lp_total_supply, pool_state.lp_decimal_equalizer),
//     //                     pool_state.previous_depth.into(),
//     //                 )?,
//     //                 pool_state.token_decimal_equalizers[input_token_index],
//     //             );
//     //
//     //             if input_amount > maximum_input_amount {
//     //                 return Err(PoolError::OutsideSpecifiedLimits.into());
//     //             }
//     //
//     //             transfer_token(
//     //                 user_token_accounts[input_token_index],
//     //                 pool_token_accounts[input_token_index],
//     //                 input_amount,
//     //                 user_authority_account,
//     //             )?;
//     //
//     //             for i in 0..TOKEN_COUNT {
//     //                 if exact_output_amounts[i] > 0 {
//     //                     transfer_pool_token(
//     //                         pool_token_accounts[i],
//     //                         user_token_accounts[i],
//     //                         exact_output_amounts[i],
//     //                         pool_authority_account,
//     //                         pool_account,
//     //                         pool_state.nonce,
//     //                     )?;
//     //                 }
//     //             }
//     //
//     //             (governance_mint_amount, latest_depth)
//     //         }
//     //
//     //         DeFiInstruction::RemoveExactBurn {
//     //             exact_burn_amount,
//     //             output_token_index,
//     //             minimum_output_amount,
//     //         } => {
//     //             let output_token_index = output_token_index as usize;
//     //             if output_token_index >= TOKEN_COUNT
//     //                 || exact_burn_amount == 0
//     //                 || exact_burn_amount >= lp_total_supply
//     //             {
//     //                 return Err(ProgramError::InvalidInstructionData);
//     //             }
//     //
//     //             let user_lp_token_account = ctx.accounts.user_lp_token_account;
//     //
//     //             let (output_amount, governance_mint_amount, latest_depth) = result_from_equalized(
//     //                 Invariant::<TOKEN_COUNT>::remove_exact_burn(
//     //                     to_equalized(exact_burn_amount, pool_state.lp_decimal_equalizer),
//     //                     output_token_index,
//     //                     &array_equalize(&pool_balances),
//     //                     pool_state.amp_factor.get(get_current_ts()?),
//     //                     pool_state.lp_fee.get(),
//     //                     pool_state.governance_fee.get(),
//     //                     to_equalized(lp_total_supply, pool_state.lp_decimal_equalizer),
//     //                     pool_state.previous_depth.into(),
//     //                 )?,
//     //                 pool_state.token_decimal_equalizers[output_token_index],
//     //             );
//     //
//     //             if output_amount < minimum_output_amount {
//     //                 return Err(PoolError::OutsideSpecifiedLimits.into());
//     //             }
//     //
//     //             burn_token(
//     //                 user_lp_token_account,
//     //                 lp_mint_account,
//     //                 exact_burn_amount,
//     //                 user_authority_account,
//     //             )?;
//     //
//     //             transfer_pool_token(
//     //                 pool_token_accounts[output_token_index],
//     //                 user_token_accounts[output_token_index],
//     //                 output_amount,
//     //                 pool_authority_account,
//     //                 pool_account,
//     //                 pool_state.nonce,
//     //             )?;
//     //
//     //             (governance_mint_amount, latest_depth)
//     //         }
//     //
//     //         DeFiInstruction::RemoveExactOutput {
//     //             maximum_burn_amount,
//     //             exact_output_amounts,
//     //         } => {
//     //             if exact_output_amounts.iter().all(|amount| *amount == 0)
//     //                 || maximum_burn_amount == 0
//     //                 || exact_output_amounts
//     //                     .iter()
//     //                     .zip(pool_balances.iter())
//     //                     .any(|(output_amount, pool_balance)| *output_amount >= *pool_balance)
//     //             {
//     //                 return Err(ProgramError::InvalidInstructionData);
//     //             }
//     //
//     //             let user_lp_token_account = ctx.accounts.user_lp_token_account;
//     //
//     //             let (burn_amount, governance_mint_amount, latest_depth) = result_from_equalized(
//     //                 Invariant::<TOKEN_COUNT>::remove_exact_output(
//     //                     &array_equalize(&exact_output_amounts),
//     //                     &array_equalize(&pool_balances),
//     //                     pool_state.amp_factor.get(get_current_ts()?),
//     //                     pool_state.lp_fee.get(),
//     //                     pool_state.governance_fee.get(),
//     //                     to_equalized(lp_total_supply, pool_state.lp_decimal_equalizer),
//     //                     pool_state.previous_depth.into(),
//     //                 )?,
//     //                 pool_state.lp_decimal_equalizer,
//     //             );
//     //
//     //             if burn_amount > maximum_burn_amount {
//     //                 return Err(PoolError::OutsideSpecifiedLimits.into());
//     //             }
//     //
//     //             burn_token(
//     //                 user_lp_token_account,
//     //                 lp_mint_account,
//     //                 burn_amount,
//     //                 user_authority_account,
//     //             )?;
//     //
//     //             for i in 0..TOKEN_COUNT {
//     //                 if exact_output_amounts[i] > 0 {
//     //                     transfer_pool_token(
//     //                         pool_token_accounts[i],
//     //                         user_token_accounts[i],
//     //                         exact_output_amounts[i],
//     //                         pool_authority_account,
//     //                         pool_account,
//     //                         pool_state.nonce,
//     //                     )?;
//     //                 }
//     //             }
//     //
//     //             (governance_mint_amount, latest_depth)
//     //         }
//     //     };
//     //
//     //     if governance_mint_amount > 0 {
//     //         // msg!("[DEV] transferring {} as governance_fee", governance_mint_amount);
//     //         mint_token(
//     //             lp_mint_account,
//     //             governance_fee_account,
//     //             governance_mint_amount,
//     //             pool_authority_account,
//     //             pool_account,
//     //             pool_state.nonce,
//     //         )?;
//     //     }
//     //
//     //     pool_state.previous_depth = latest_depth;
//     //     serialize_pool(&pool_state, pool_account)
//     // }
//     //
//     // pub fn process_governance_instruction(
//     //     ctx: Context<ProcessGovernanceInstruction>,
//     //     governance_instruction: GovernanceInstruction<TOKEN_COUNT>,
//     // ) -> ProgramResult {
//     //     let pool_account = ctx.accounts.state;
//     //     let mut pool_state = check_and_deserialize_pool_state(&pool_account, &ctx.program_id)?;
//     //
//     //     verify_governance_signature(&ctx.accounts.governance_account, &pool_state)?;
//     //
//     //     match governance_instruction {
//     //         GovernanceInstruction::PrepareFeeChange {
//     //             lp_fee,
//     //             governance_fee,
//     //         } => {
//     //             if lp_fee + governance_fee >= DecT::from(1) {
//     //                 return Err(PoolError::InvalidFeeInput.into());
//     //             }
//     //
//     //             pool_state.prepared_lp_fee = PoolFee::new(lp_fee)?;
//     //             pool_state.prepared_governance_fee = PoolFee::new(governance_fee)?;
//     //             pool_state.fee_transition_ts = get_current_ts()? + ENACT_DELAY;
//     //         }
//     //
//     //         GovernanceInstruction::EnactFeeChange {} => {
//     //             if pool_state.fee_transition_ts == 0 {
//     //                 return Err(PoolError::InvalidEnact.into());
//     //             }
//     //
//     //             if pool_state.fee_transition_ts > get_current_ts()? {
//     //                 return Err(PoolError::InsufficientDelay.into());
//     //             }
//     //
//     //             if pool_state.prepared_governance_fee.get() > DecT::from(0)
//     //                 && pool_state.governance_fee_key == Pubkey::default()
//     //             {
//     //                 return Err(PoolError::InvalidGovernanceFeeAccount.into());
//     //             }
//     //
//     //             pool_state.lp_fee = pool_state.prepared_lp_fee;
//     //             pool_state.governance_fee = pool_state.prepared_governance_fee;
//     //             pool_state.prepared_lp_fee = PoolFee::default();
//     //             pool_state.prepared_governance_fee = PoolFee::default();
//     //             pool_state.fee_transition_ts = 0;
//     //         }
//     //
//     //         GovernanceInstruction::PrepareGovernanceTransition {
//     //             upcoming_governance_key,
//     //         } => {
//     //             pool_state.prepared_governance_key = upcoming_governance_key;
//     //             pool_state.governance_transition_ts = get_current_ts()? + ENACT_DELAY;
//     //         }
//     //
//     //         GovernanceInstruction::EnactGovernanceTransition {} => {
//     //             if pool_state.governance_transition_ts == 0 {
//     //                 return Err(PoolError::InvalidEnact.into());
//     //             }
//     //
//     //             if pool_state.governance_transition_ts > get_current_ts()? {
//     //                 return Err(PoolError::InsufficientDelay.into());
//     //             }
//     //
//     //             pool_state.governance_key = pool_state.prepared_governance_key;
//     //             pool_state.prepared_governance_key = Pubkey::default();
//     //             pool_state.governance_transition_ts = 0;
//     //         }
//     //
//     //         GovernanceInstruction::ChangeGovernanceFeeAccount { governance_fee_key } => {
//     //             if governance_fee_key != Pubkey::default() {
//     //                 let governance_fee_account = ctx.accounts.governance_fee_account;
//     //                 if *governance_fee_account.key != governance_fee_key {
//     //                     return Err(PoolError::InvalidGovernanceFeeAccount.into());
//     //                 }
//     //
//     //                 let governance_fee_state =
//     //                     check_program_owner_and_unpack::<TokenState>(governance_fee_account)?;
//     //                 if governance_fee_state.mint != pool_state.lp_mint_key {
//     //                     return Err(TokenError::MintMismatch.into());
//     //                 }
//     //             } else if pool_state.governance_fee.get() != DecT::from(0) {
//     //                 return Err(PoolError::InvalidGovernanceFeeAccount.into());
//     //             }
//     //
//     //             pool_state.governance_fee_key = governance_fee_key;
//     //         }
//     //
//     //         GovernanceInstruction::AdjustAmpFactor {
//     //             target_ts,
//     //             target_value,
//     //         } => {
//     //             pool_state
//     //                 .amp_factor
//     //                 .set_target(get_current_ts()?, target_value, target_ts)?;
//     //         }
//     //
//     //         GovernanceInstruction::SetPaused { paused } => {
//     //             pool_state.is_paused = paused;
//     //         }
//     //     }
//     //
//     //     serialize_pool(&pool_state, pool_account)
//     // }
// }

// -------------------------------- Helper Functions --------------------------------

// fn get_pool_authority(
//     pool_key: &Pubkey,
//     nonce: u8,
//     program_id: &Pubkey,
// ) -> Result<Pubkey, ProgramError> {
//     Pubkey::create_program_address(&[&pool_key.to_bytes(), &[nonce]], program_id)
//         .or(Err(ProgramError::IncorrectProgramId))
// }
//
// fn check_program_owner_and_unpack<T: Pack + IsInitialized>(
//     account: &AccountInfo,
// ) -> Result<T, ProgramError> {
//     spl_token::check_program_account(account.owner)?;
//     T::unpack(&account.data.borrow()).or(Err(ProgramError::InvalidAccountData))
// }
//
// fn check_and_deserialize_pool_state(
//     pool_account: &AccountInfo,
//     program_id: &Pubkey,
// ) -> Result<PoolState<TOKEN_COUNT>, ProgramError> {
//     if pool_account.owner != program_id {
//         return Err(ProgramError::IllegalOwner);
//     }
//
//     let pool_state =
//         PoolState::<TOKEN_COUNT>::deserialize(&mut &**pool_account.data.try_borrow_mut().unwrap())?;
//
//     if !pool_state.is_initialized() {
//         return Err(ProgramError::UninitializedAccount);
//     }
//
//     Ok(pool_state)
// }
//
// fn serialize_pool(
//     pool_state: &PoolState<TOKEN_COUNT>,
//     pool_account: &AccountInfo,
// ) -> ProgramResult {
//     pool_state
//         .serialize(&mut *pool_account.data.try_borrow_mut().unwrap())
//         .or(Err(ProgramError::AccountDataTooSmall))
// }
//
// fn verify_governance_signature(
//     governance_account: &AccountInfo,
//     pool_state: &PoolState<TOKEN_COUNT>,
// ) -> ProgramResult {
//     if *governance_account.key != pool_state.governance_key {
//         return Err(PoolError::InvalidGovernanceAccount.into());
//     }
//
//     if !governance_account.is_signer {
//         return Err(ProgramError::MissingRequiredSignature);
//     }
//
//     Ok(())
// }
//
// fn transfer_token<'a>(
//     sender_account: &AccountInfo<'a>,
//     recipient_account: &AccountInfo<'a>,
//     amount: AtomicT,
//     authority_account: &AccountInfo<'a>,
// ) -> ProgramResult {
//     let transfer_ix = transfer(
//         &TOKEN_PROGRAM_ID,
//         &sender_account.key,
//         &recipient_account.key,
//         &authority_account.key,
//         &[],
//         amount,
//     )?;
//
//     invoke(
//         &transfer_ix,
//         &[
//             sender_account.clone(),
//             recipient_account.clone(),
//             authority_account.clone(),
//         ],
//     )
// }
//
// fn transfer_pool_token<'a>(
//     pool_token_account: &AccountInfo<'a>,
//     recipient_account: &AccountInfo<'a>,
//     amount: AtomicT,
//     pool_authority_account: &AccountInfo<'a>,
//     pool_account: &AccountInfo,
//     nonce: u8,
// ) -> ProgramResult {
//     let transfer_ix = transfer(
//         &TOKEN_PROGRAM_ID,
//         &pool_token_account.key,
//         &recipient_account.key,
//         &pool_authority_account.key,
//         &[],
//         amount,
//     )?;
//
//     invoke_signed(
//         &transfer_ix,
//         &[
//             pool_token_account.clone(),
//             recipient_account.clone(),
//             pool_authority_account.clone(),
//         ],
//         &[&[&pool_account.key.to_bytes()[..32], &[nonce]][..]],
//     )
// }
//
// fn mint_token<'a>(
//     lp_mint_account: &AccountInfo<'a>,
//     recipient_account: &AccountInfo<'a>,
//     mint_amount: AtomicT,
//     pool_authority_account: &AccountInfo<'a>,
//     pool_account: &AccountInfo,
//     nonce: u8,
// ) -> ProgramResult {
//     let mint_ix = mint_to(
//         &TOKEN_PROGRAM_ID,
//         lp_mint_account.key,
//         recipient_account.key,
//         pool_authority_account.key,
//         &[],
//         mint_amount,
//     )?;
//
//     invoke_signed(
//         &mint_ix,
//         &[
//             lp_mint_account.clone(),
//             recipient_account.clone(),
//             pool_authority_account.clone(),
//         ],
//         &[&[&pool_account.key.to_bytes()[..32], &[nonce]][..]],
//     )
// }
//
// pub fn burn_token<'a>(
//     lp_account: &AccountInfo<'a>,
//     lp_mint_account: &AccountInfo<'a>,
//     burn_amount: AtomicT,
//     lp_authority: &AccountInfo<'a>,
// ) -> Result<(), ProgramError> {
//     let burn_ix = burn(
//         &TOKEN_PROGRAM_ID,
//         lp_account.key,
//         lp_mint_account.key,
//         lp_authority.key,
//         &[],
//         burn_amount,
//     )?;
//
//     invoke(
//         &burn_ix,
//         &[
//             lp_account.clone(),
//             lp_mint_account.clone(),
//             lp_authority.clone(),
//         ],
//     )
// }
//
// fn get_current_ts() -> Result<UnixTimestamp, ProgramError> {
//     let current_ts = Clock::get()?.unix_timestamp;
//     assert!(current_ts > 0);
//     Ok(current_ts)
// }

// use {
//     pool_lib::{error::to_error_msg, processor::processor},
//     solana_program::{
//         account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, msg, pubkey::Pubkey,
//     },
// };

// #[macro_export]
// macro_rules! define_pool {
//     ($token_count:expr, $pool_id:expr) => {
//         use solana_program::{
//             account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, msg, pubkey::Pubkey,
//         };

//         pub use pool_lib::{
//             amp_factor, common, decimal, error, instruction, invariant, pool_fee, state,
//         };

//         /// Export current solana-program types for downstream users who may also be
//         /// building with a different solana-program version
//         pub use solana_program;

//         pub const TOKEN_COUNT: usize = $token_count;
//         solana_program::declare_id!($pool_id);

//         use solana_security_txt::security_txt;

//         security_txt! {
//             // Required fields
//             name: "Swim.io",
//             project_url: "https://swim.io/",
//             contacts: "email:admin@swim.io",
//             policy: "https://swim.io/security",

//             // Optional fields
//             preferred_languages: "en",
//             encryption: "https://swim.io/pgp-key.txt",
//             expiry: "2026-04-28T05:00:00.000Z",
//             auditors: "Kudelski"
//         }
//     };
// }

// use {
//     crate::{error::*, Propeller, TOKEN_COUNT},
//     anchor_lang::prelude::*,
//     anchor_spl::{
//         token,
//         token::{Mint, Token, TokenAccount, Transfer},
//     },
//     rust_decimal::Decimal,
//     two_pool::{state::TwoPool, BorshDecimal},
// };

use {
    crate::{
        constants::LAMPORTS_PER_SOL_DECIMAL, deserialize_message_payload, error::*, get_message_data,
        get_token_bridge_mint_decimals, get_transfer_with_payload_from_message_account, hash_vaa,
        instructions::fee_tracker::FeeTracker, state::PropellerMessage, validate_marginal_prices_pool_accounts,
        Address, ChainID, ClaimData, MessageData, PayloadTransferWithPayload, PostVAAData, PostedMessageData,
        PostedVAAData, Propeller, TokenBridge, Wormhole, COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION, TOKEN_COUNT,
    },
    anchor_lang::{
        prelude::*,
        solana_program::{instruction::Instruction, program::invoke_signed, system_program, sysvar::SysvarId},
    },
    anchor_spl::{
        token,
        token::{Mint, Token, TokenAccount, Transfer},
    },
    byteorder::{BigEndian, ReadBytesExt, WriteBytesExt},
    num_traits::{FromPrimitive, ToPrimitive},
    primitive_types::U256,
    rust_decimal::Decimal,
    solana_program::program::invoke,
    switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID},
    two_pool::{state::TwoPool, BorshDecimal},
};
//
// #[derive(Accounts)]
// pub struct MarginalPricePool<'info> {
//     // not auto-deriving the address since seeds::program doesn't work for two_pool::ID
//     // and CPI call will verify the address seeds & program are correct anyways
//     // pub pool: Box<Account<'info, TwoPool>>,
//     /// CHECK: Using unchecked account here for anchor workaround since i can't use this `MarginalPricePool` as a composite
//     /// in structs in multiple files.
//     pub pool: UncheckedAccount<'info>,
//     // #[account(
//     // address = pool.token_keys[0],
//     // token::mint = pool.token_mint_keys[0]
//     // )]
//     pub pool_token_0_account: Box<Account<'info, TokenAccount>>,
//     // #[account(
//     // address = pool.token_keys[1],
//     // token::mint = pool.token_mint_keys[1]
//     // )]
//     pub pool_token_1_account: Box<Account<'info, TokenAccount>>,
//     // #[account(address = pool.lp_mint_key)]
//     pub lp_mint: Box<Account<'info, Mint>>,
// }
//
// // #[derive(Clone)]
// // pub struct TwoPoolProgram;
// // impl anchor_lang::Id for TwoPoolProgram {
// //     fn id() -> Pubkey {
// //         two_pool::two_pool::id()
// //     }
// // }
//
// impl<'info> MarginalPricePool<'info> {
//     pub fn get_intermediate_token_price_decimal(
//         &self,
//         marginal_pool_state: &TwoPool,
//         propeller: &Propeller,
//         two_pool_program: &AccountInfo<'info>,
//     ) -> Result<Decimal> {
//         let cpi_ctx = CpiContext::new(
//             two_pool_program.clone(),
//             two_pool::cpi::accounts::MarginalPrices {
//                 pool: self.pool.to_account_info(),
//                 pool_token_account_0: self.pool_token_0_account.to_account_info(),
//                 pool_token_account_1: self.pool_token_1_account.to_account_info(),
//                 lp_mint: self.lp_mint.to_account_info(),
//             },
//         );
//         let result = two_pool::cpi::marginal_prices(cpi_ctx)?;
//         // let marginal_prices = result.get().marginal_prices;
//         let marginal_prices = result.get();
//
//         msg!("marginal_prices: {:?}", marginal_prices);
//         let lp_mint_key = self.lp_mint.key();
//
//         let token_bridge_mint_key = propeller.token_bridge_mint;
//         self.get_marginal_price_decimal(&marginal_pool_state, &propeller, &marginal_prices, &token_bridge_mint_key)
//     }
//
//     pub fn validate_marginal_prices_pool_accounts(&self, propeller: &Propeller) -> Result<()> {
//         // Note: skipping auto-derive b/c of seeds::program not working with two_pool::ID
//         // and not validating b/c passing in pool as UnchckedAccount since anchor has issue when
//         // `MarginalPricePool` is used in a composite pattern across multiple files.
//         // let marginal_price_pool_pda = Pubkey::create_program_address(
//         //     &[
//         //         b"two_pool".as_ref(),
//         //         self.pool_token_0_account.mint.as_ref(),
//         //         self.pool_token_1_account.mint.as_ref(),
//         //         self.lp_mint.key().as_ref(),
//         //         &[self.pool.bump],
//         //     ],
//         //     &two_pool::id(),
//         // )
//         // .map_err(|_| PropellerError::InvalidMarginalPricePoolAccounts)?;
//         // require_keys_eq!(marginal_price_pool_pda, self.pool.key());
//         require_keys_eq!(self.pool.key(), propeller.marginal_price_pool);
//         let pool_token_index = propeller.marginal_price_pool_token_index as usize;
//         require_gt!(TOKEN_COUNT, pool_token_index, PropellerError::InvalidMarginalPricePoolAccounts);
//         require_keys_eq!(
//             self.pool.token_mint_keys[pool_token_index],
//             // marginal_price_pool_token_account_mints[pool_token_index],
//             propeller.marginal_price_pool_token_mint,
//         );
//         Ok(())
//     }
//
//     pub fn get_token_bridge_mint_decimals(
//         &self,
//         marginal_pool_state: &TwoPool,
//         token_bridge_mint: &Pubkey,
//     ) -> Result<u8> {
//         let marginal_price_pool_lp_mint = &self.lp_mint;
//         let marginal_price_pool_lp_mint_decimals = marginal_price_pool_lp_mint.decimals;
//         if *token_bridge_mint == marginal_pool_state.lp_mint_key {
//             Ok(marginal_price_pool_lp_mint_decimals)
//         } else if *token_bridge_mint == marginal_pool_state.token_mint_keys[0] {
//             Ok(marginal_price_pool_lp_mint_decimals + marginal_pool_state.token_decimal_equalizers[0])
//         } else if *token_bridge_mint == marginal_pool_state.token_mint_keys[1] {
//             Ok(marginal_price_pool_lp_mint_decimals + marginal_pool_state.token_decimal_equalizers[1])
//         } else {
//             return err!(PropellerError::UnableToRetrieveTokenBridgeMintDecimals);
//         }
//     }
//     pub fn get_marginal_price_decimal(
//         &self,
//         marginal_pool_state: &TwoPool,
//         propeller: &Propeller,
//         marginal_prices: &[BorshDecimal; TOKEN_COUNT],
//         token_bridge_mint_key: &Pubkey,
//     ) -> Result<Decimal> {
//         let marginal_price_pool_token_index = propeller.marginal_price_pool_token_index;
//         let marginal_price_pool_lp_mint = &self.lp_mint.key();
//         let mut marginal_price: Decimal = marginal_prices[marginal_price_pool_token_index as usize]
//             .try_into()
//             .map_err(|_| error!(PropellerError::ConversionError))?;
//         if *marginal_price_pool_lp_mint != *token_bridge_mint_key {
//             require_keys_eq!(
//                 marginal_pool_state.token_mint_keys[0],
//                 *token_bridge_mint_key,
//                 PropellerError::InvalidMetapoolTokenMint,
//             );
//             let token_bridge_mint_marginal_price: Decimal =
//                 marginal_prices[0].try_into().map_err(|_| error!(PropellerError::ConversionError))?;
//             marginal_price = marginal_price
//                 .checked_div(token_bridge_mint_marginal_price)
//                 .ok_or(error!(PropellerError::IntegerOverflow))?;
//         }
//         Ok(marginal_price)
//     }
// }

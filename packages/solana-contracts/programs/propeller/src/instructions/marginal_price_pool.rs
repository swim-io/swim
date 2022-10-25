use crate::{get_memo_as_utf8, validate_marginal_prices_pool_accounts, wormhole::SwimPayload, Fees};
use {
    crate::{
        constants::LAMPORTS_PER_SOL_DECIMAL, deserialize_message_payload, error::*, get_message_data,
        get_transfer_with_payload_from_message_account, hash_vaa, instructions::fee_tracker::FeeTracker,
        state::SwimPayloadMessage, Address, ChainID, ClaimData, MessageData, PayloadTransferWithPayload, PostVAAData,
        PostedVAAData, Propeller, TokenBridge, Wormhole, COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION, TOKEN_COUNT,
    },
    anchor_lang::{
        prelude::*,
        solana_program::{instruction::Instruction, program::invoke_signed, system_program, sysvar::SysvarId},
    },
    anchor_spl::{
        associated_token::get_associated_token_address,
        token,
        token::{Mint, Token, TokenAccount, Transfer},
    },
    byteorder::{BigEndian, ReadBytesExt, WriteBytesExt},
    num_traits::{FromPrimitive, ToPrimitive},
    // primitive_types::U256,
    rust_decimal::Decimal,
    solana_program::program::invoke,
    switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID},
    two_pool::{state::TwoPool, BorshDecimal},
};

#[derive(Accounts)]
pub struct MarginalPricePool<'info> {
    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    pool_token_0_account.mint.as_ref(),
    pool_token_1_account.mint.as_ref(),
    lp_mint.key().as_ref(),
    ],
    bump = pool.bump,
    seeds::program = two_pool_program.key()
    )]
    pub pool: Box<Account<'info, TwoPool>>,
    #[account(
    address = pool.token_keys[0],
    )]
    pub pool_token_0_account: Box<Account<'info, TokenAccount>>,
    #[account(
    address = pool.token_keys[1],
    )]
    pub pool_token_1_account: Box<Account<'info, TokenAccount>>,
    #[account(
    address = pool.lp_mint_key,
    )]
    pub lp_mint: Box<Account<'info, Mint>>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

impl<'info> MarginalPricePool<'info> {
    pub fn validate(&self, propeller: &Propeller) -> Result<()> {
        let marginal_price_pool = &self.pool;
        require_keys_eq!(
            marginal_price_pool.key(),
            propeller.marginal_price_pool,
            PropellerError::InvalidMarginalPricePool
        );
        let pool_token_index = propeller.marginal_price_pool_token_index as usize;
        let marginal_price_pool_token_accounts = [&self.pool_token_0_account, &self.pool_token_1_account];
        require_gt!(TOKEN_COUNT, pool_token_index, PropellerError::InvalidMarginalPricePoolAccounts);
        let pool_token_account = marginal_price_pool_token_accounts[pool_token_index];
        require_keys_eq!(pool_token_account.mint, propeller.marginal_price_pool_token_mint);
        require_keys_eq!(
            marginal_price_pool.token_mint_keys[pool_token_index],
            propeller.marginal_price_pool_token_mint
        );
        require_keys_eq!(pool_token_account.key(), marginal_price_pool_token_accounts[pool_token_index].key());
        msg!("finished marginal price pool validation");
        Ok(())
    }

    fn get_marginal_prices(&self) -> Result<[BorshDecimal; TOKEN_COUNT]> {
        let result = two_pool::cpi::marginal_prices(CpiContext::new(
            self.two_pool_program.to_account_info(),
            two_pool::cpi::accounts::MarginalPrices {
                pool: self.pool.to_account_info(),
                pool_token_account_0: self.pool_token_0_account.to_account_info(),
                pool_token_account_1: self.pool_token_1_account.to_account_info(),
                lp_mint: self.lp_mint.to_account_info(),
            },
        ))?;
        Ok(result.get())
    }

    pub fn get_marginal_price_decimal(&self, propeller: &Propeller) -> Result<Decimal> {
        let marginal_prices = self.get_marginal_prices()?;
        let marginal_price_pool = &self.pool;
        let marginal_price_pool_lp_mint = &self.lp_mint;
        let marginal_price_pool_token_index = propeller.marginal_price_pool_token_index;
        let swim_usd_mint = propeller.swim_usd_mint;
        let mut marginal_price: Decimal = marginal_prices[marginal_price_pool_token_index as usize]
            .try_into()
            .map_err(|_| error!(PropellerError::ConversionError))?;
        if marginal_price_pool_lp_mint.key() != swim_usd_mint {
            require_keys_eq!(
                marginal_price_pool.token_mint_keys[0],
                swim_usd_mint,
                PropellerError::InvalidMetapoolTokenMint,
            );
            let swim_usd_marginal_price: Decimal =
                marginal_prices[0].try_into().map_err(|_| error!(PropellerError::ConversionError))?;
            marginal_price =
                marginal_price.checked_div(swim_usd_marginal_price).ok_or(error!(PropellerError::IntegerOverflow))?;
        }
        Ok(marginal_price)
    }

    pub fn get_swim_usd_mint_decimals(&self, propeller: &Propeller) -> Result<u8> {
        let swim_usd_mint = propeller.swim_usd_mint;
        let marginal_price_pool = &self.pool;
        let marginal_price_pool_lp_mint = &self.lp_mint;
        if swim_usd_mint == marginal_price_pool_lp_mint.key() {
            return Ok(marginal_price_pool_lp_mint.decimals);
        }
        let marginal_price_pool_lp_mint_decimals = marginal_price_pool_lp_mint.decimals;
        if swim_usd_mint == marginal_price_pool.lp_mint_key {
            // Ok(marginal_price_pool_lp_mint_decimals)
            Ok(marginal_price_pool_lp_mint_decimals + marginal_price_pool.lp_decimal_equalizer)
        } else if swim_usd_mint == marginal_price_pool.token_mint_keys[0] {
            Ok(marginal_price_pool_lp_mint_decimals + marginal_price_pool.token_decimal_equalizers[0])
        } else if swim_usd_mint == marginal_price_pool.token_mint_keys[1] {
            Ok(marginal_price_pool_lp_mint_decimals + marginal_price_pool.token_decimal_equalizers[1])
        } else {
            return err!(PropellerError::UnableToRetrieveSwimUsdMintDecimals);
        }
    }
}

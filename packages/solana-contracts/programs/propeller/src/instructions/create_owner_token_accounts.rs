pub use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};
use {
    crate::{
        constants::{LAMPORTS_PER_SOL_DECIMAL, TOKEN_BRIDGE_PROGRAM_ID},
        convert_fees_to_swim_usd_atomic, deserialize_message_payload,
        error::*,
        get_lamports_intermediate_token_price, get_marginal_price_decimal, get_memo_as_utf8, get_message_data,
        get_swim_usd_mint_decimals, get_transfer_with_payload_from_message_account, hash_vaa,
        state::{SwimClaim, SwimPayloadMessage, *},
        token_bridge::TokenBridge,
        token_number_map::{ToTokenStep, TokenNumberMap},
        ClaimData, FeeTracker, Fees, PayloadTransferWithPayload, PostVAAData, PostedVAAData, Propeller, TOKEN_COUNT,
    },
    anchor_lang::{prelude::*, solana_program::program::invoke},
    anchor_spl::{
        associated_token::{get_associated_token_address, AssociatedToken},
        token::{self, Mint, Token, TokenAccount, Transfer},
    },
    num_traits::{FromPrimitive, ToPrimitive},
    rust_decimal::Decimal,
    solana_program::{instruction::Instruction, program::invoke_signed},
    std::{convert::TryInto, iter::zip},
    two_pool::{state::TwoPool, BorshDecimal},
};

#[derive(Accounts)]
pub struct PropellerCreateOwnerTokenAccounts<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = aggregator @ PropellerError::InvalidAggregator,
    has_one = marginal_price_pool @ PropellerError::InvalidMarginalPricePool,
    constraint = !propeller.is_paused @ PropellerError::IsPaused,
    )]
    pub propeller: Box<Account<'info, Propeller>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
    seeds = [ b"redeemer".as_ref()],
    bump = propeller.redeemer_bump
    )]
    /// this used to be "to_owner".
    /// redeemer will be PDA derived from ["redeemer"], seeds::program = propeller::id()
    /// will have to be signed when it invokes complete_transfer_with_payload
    /// if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to
    ///     (NOT the `to` account)
    pub redeemer: SystemAccount<'info>,
    #[account(
    mut,
    address = get_associated_token_address(&redeemer.key(), &propeller.swim_usd_mint)
    )]
    pub redeemer_escrow: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    address = get_associated_token_address(&propeller.key(), &propeller.swim_usd_mint)
    )]
    pub fee_vault: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    b"fee".as_ref(),
    propeller.swim_usd_mint.as_ref(),
    payer.key().as_ref()
    ],
    bump = fee_tracker.bump
    )]
    pub fee_tracker: Account<'info, FeeTracker>,

    #[account(
    seeds = [
    swim_payload_message.vaa_emitter_address.as_ref(),
    swim_payload_message.vaa_emitter_chain.to_be_bytes().as_ref(),
    swim_payload_message.vaa_sequence.to_be_bytes().as_ref(),
    ],
    bump,
    seeds::program = propeller.token_bridge().unwrap(),
    )]
    /// CHECK: WH Claim account
    pub claim: UncheckedAccount<'info>,

    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    b"swim_payload".as_ref(),
    claim.key().as_ref(),
    ],
    bump = swim_payload_message.bump,
    has_one = claim,
    )]
    pub swim_payload_message: Box<Account<'info, SwimPayloadMessage>>,

    #[account(
    seeds = [
    b"propeller".as_ref(),
    b"token_id".as_ref(),
    propeller.key().as_ref(),
    &swim_payload_message.target_token_id.to_le_bytes()
    ],
    bump = token_number_map.bump,
    has_one = pool @ PropellerError::InvalidTokenNumberMapPool,
    )]
    pub token_number_map: Box<Account<'info, TokenNumberMap>>,

    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    pool_token_0_mint.key().as_ref(),
    pool_token_1_mint.key().as_ref(),
    pool_lp_mint.key().as_ref(),
    ],
    bump = pool.bump,
    seeds::program = two_pool_program.key()
    )]
    pub pool: Box<Account<'info, TwoPool>>,
    #[account(address = pool.token_mint_keys[0])]
    pub pool_token_0_mint: Box<Account<'info, Mint>>,
    #[account(address = pool.token_mint_keys[1])]
    pub pool_token_1_mint: Box<Account<'info, Mint>>,
    #[account(address = pool.lp_mint_key)]
    pub pool_lp_mint: Box<Account<'info, Mint>>,

    #[account(address = swim_payload_message.owner)]
    pub user: SystemAccount<'info>,
    #[account(
    mut,
    address = get_associated_token_address(&user.key(), &pool_token_0_mint.key()),
    )]
    /// CHECK: may possibly need to initialize
    pub user_pool_token_0_account: UncheckedAccount<'info>,
    #[account(
    mut,
    address = get_associated_token_address(&user.key(), &pool_token_1_mint.key()),
    )]
    /// CHECK: may possibly need to initialize
    pub user_pool_token_1_account: UncheckedAccount<'info>,
    #[account(
    mut,
    address = get_associated_token_address(&user.key(), &pool_lp_mint.key()),
    )]
    /// CHECK: may possibly need to initialize
    pub user_lp_token_account: UncheckedAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

    /* for sol -> token_bridge_mint conversion */
    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,

    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    marginal_price_pool_token_0_account.mint.as_ref(),
    marginal_price_pool_token_1_account.mint.as_ref(),
    marginal_price_pool_lp_mint.key().as_ref(),
    ],
    bump = marginal_price_pool.bump,
    seeds::program = two_pool_program.key()
    )]
    pub marginal_price_pool: Box<Account<'info, TwoPool>>,
    #[account(address = marginal_price_pool.token_keys[0])]
    pub marginal_price_pool_token_0_account: Box<Account<'info, TokenAccount>>,
    #[account(address = marginal_price_pool.token_keys[1])]
    pub marginal_price_pool_token_1_account: Box<Account<'info, TokenAccount>>,
    #[account(address = marginal_price_pool.lp_mint_key)]
    pub marginal_price_pool_lp_mint: Box<Account<'info, Mint>>,

    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
}

impl<'info> PropellerCreateOwnerTokenAccounts<'info> {
    pub fn accounts(ctx: &Context<PropellerCreateOwnerTokenAccounts>) -> Result<()> {
        require_keys_eq!(ctx.accounts.user.key(), ctx.accounts.swim_payload_message.owner);
        require_keys_eq!(ctx.accounts.pool.key(), ctx.accounts.token_number_map.pool);
        let propeller = &ctx.accounts.propeller;
        validate_marginal_prices_pool_accounts(
            &propeller,
            &ctx.accounts.marginal_price_pool,
            &[&ctx.accounts.marginal_price_pool_token_0_account, &ctx.accounts.marginal_price_pool_token_1_account],
        )?;
        msg!("Passed PropellerCreateOwnerTokenAccounts::accounts() check");
        Ok(())
    }

    fn initialize_user_ata_and_get_fees(
        &self,
        user_unchecked_token_account: &UncheckedAccount<'info>,
        mint: &Account<'info, Mint>,
    ) -> Result<u64> {
        let ata_data_len = user_unchecked_token_account.data_len();

        let payer = &self.payer;
        let user = &self.user;
        let system_program = &self.system_program;
        let token_program = &self.token_program;

        if ata_data_len == TokenAccount::LEN {
            let token_account =
                TokenAccount::try_deserialize(&mut &**user_unchecked_token_account.data.try_borrow_mut().unwrap())?;
            require_keys_eq!(token_account.owner, user.key(), PropellerError::IncorrectOwnerForCreateTokenAccount);
            return Ok(0u64);
        } else if ata_data_len != 0 {
            //TODO: spl_token_2022?
            // panic!("data_len != 0 && != TokenAcount::LEN");
            return err!(PropellerError::InvalidTokenAccountDataLen);
        } else {
            let ix = spl_associated_token_account::instruction::create_associated_token_account(
                &payer.key(),
                &user.key(),
                &mint.key(),
            );
            invoke(
                &ix,
                &[
                    payer.to_account_info(),
                    user_unchecked_token_account.to_account_info(),
                    user.to_account_info(),
                    mint.to_account_info(),
                    system_program.to_account_info(),
                    token_program.to_account_info(),
                ],
            )?;
            let fees = Rent::get()?.minimum_balance(TokenAccount::LEN) + self.propeller.init_ata_fee;
            Ok(fees)
        }
    }

    fn log_memo(&self) -> Result<()> {
        let memo = self.swim_payload_message.memo;
        if memo != [0u8; 16] {
            let memo_ix = spl_memo::build_memo(get_memo_as_utf8(memo)?.as_ref(), &[]);
            invoke(&memo_ix, &[self.memo.to_account_info()])?;
        }
        Ok(())
    }
}

impl<'info> Fees<'info> for PropellerCreateOwnerTokenAccounts<'info> {
    fn calculate_fees_in_lamports(&self) -> Result<u64> {
        let mut create_owner_token_account_total_fees_in_lamports = 0u64;

        let init_token_account_0_fees =
            self.initialize_user_ata_and_get_fees(&self.user_pool_token_0_account, &self.pool_token_0_mint)?;
        let init_token_account_1_fees =
            self.initialize_user_ata_and_get_fees(&self.user_pool_token_1_account, &self.pool_token_1_mint)?;
        let init_lp_token_account_fees =
            self.initialize_user_ata_and_get_fees(&self.user_lp_token_account, &self.pool_lp_mint)?;
        create_owner_token_account_total_fees_in_lamports = init_token_account_0_fees
            .checked_add(init_token_account_1_fees)
            .and_then(|f| f.checked_add(init_lp_token_account_fees))
            .ok_or(PropellerError::IntegerOverflow)?;

        msg!(
            "
    {}(init_token_account_0_fees) +
    {}(init_token_account_1_fees) +
    {}(init_lp_token_account_fees)
    = {}(create_owner_token_account_total_fees_in_lamports)
    ",
            init_token_account_0_fees,
            init_token_account_1_fees,
            init_lp_token_account_fees,
            create_owner_token_account_total_fees_in_lamports
        );
        Ok(create_owner_token_account_total_fees_in_lamports)
    }

    fn get_marginal_prices(&self) -> Result<[BorshDecimal; TOKEN_COUNT]> {
        let result = two_pool::cpi::marginal_prices(CpiContext::new(
            self.two_pool_program.to_account_info(),
            two_pool::cpi::accounts::MarginalPrices {
                pool: self.marginal_price_pool.to_account_info(),
                pool_token_account_0: self.marginal_price_pool_token_0_account.to_account_info(),
                pool_token_account_1: self.marginal_price_pool_token_1_account.to_account_info(),
                lp_mint: self.marginal_price_pool_lp_mint.to_account_info(),
            },
        ))?;
        Ok(result.get())
    }

    fn convert_fees_to_swim_usd_atomic(&self, fee_in_lamports: u64) -> Result<u64> {
        msg!("fee_in_lamports: {:?}", fee_in_lamports);
        let marginal_price_pool_lp_mint = &self.marginal_price_pool_lp_mint;

        let propeller = &self.propeller;
        let max_staleness = propeller.max_staleness;
        let swim_usd_mint_key = propeller.swim_usd_mint;
        // let marginal_prices = get_marginal_prices(cpi_ctx)?;

        let intermediate_token_price_decimal: Decimal = get_marginal_price_decimal(
            &self.marginal_price_pool,
            &self.get_marginal_prices()?,
            propeller,
            &marginal_price_pool_lp_mint.key(),
        )?;

        msg!("intermediate_token_price_decimal: {:?}", intermediate_token_price_decimal);

        let fee_in_lamports_decimal = Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::ConversionError)?;
        msg!("fee_in_lamports(u64): {:?} fee_in_lamports_decimal: {:?}", fee_in_lamports, fee_in_lamports_decimal);

        let lamports_intermediate_token_price = get_lamports_intermediate_token_price(&self.aggregator, max_staleness)?;
        let fee_in_swim_usd_decimal = lamports_intermediate_token_price
            .checked_mul(fee_in_lamports_decimal)
            .and_then(|x| x.checked_div(intermediate_token_price_decimal))
            .ok_or(PropellerError::IntegerOverflow)?;

        let swim_usd_decimals =
            get_swim_usd_mint_decimals(&swim_usd_mint_key, &self.marginal_price_pool, &marginal_price_pool_lp_mint)?;
        msg!("swim_usd_decimals: {:?}", swim_usd_decimals);

        let ten_pow_decimals =
            Decimal::from_u64(10u64.pow(swim_usd_decimals as u32)).ok_or(PropellerError::IntegerOverflow)?;
        let fee_in_swim_usd_atomic = fee_in_swim_usd_decimal
            .checked_mul(ten_pow_decimals)
            .and_then(|v| v.to_u64())
            .ok_or(PropellerError::ConversionError)?;

        msg!(
            "fee_in_swim_usd_decimal: {:?} fee_in_swim_usd_atomic: {:?}",
            fee_in_swim_usd_decimal,
            fee_in_swim_usd_atomic
        );
        Ok(fee_in_swim_usd_atomic)
    }

    fn track_and_transfer_fees(&mut self, fees_in_swim_usd: u64) -> Result<()> {
        let fee_tracker = &mut self.fee_tracker;
        fee_tracker.fees_owed =
            fee_tracker.fees_owed.checked_add(fees_in_swim_usd).ok_or(PropellerError::IntegerOverflow)?;

        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.redeemer_escrow.to_account_info(),
                    to: self.fee_vault.to_account_info(),
                    authority: self.redeemer.to_account_info(),
                },
                &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
            ),
            fees_in_swim_usd,
        )
    }
}

//TODO: allow this regardless of gasKickstart or only if gasKickstart?
// possible !gasKickstart but they don't have all the accounts needed (e.g. token_account for token_bridge_mint)
/// Note: we still allow this to be called even if all token accounts already exist. But since this is wasteful,
/// we penalize the engine by not reimbursing them anything in that situation so that they are incentivized to
/// check if any of the require token accounts don't exist.
pub fn handle_propeller_create_owner_token_accounts(ctx: Context<PropellerCreateOwnerTokenAccounts>) -> Result<()> {
    let create_owner_token_account_total_fees_in_lamports = ctx.accounts.calculate_fees_in_lamports()?;
    if create_owner_token_account_total_fees_in_lamports == 0 {
        //TODO: log memo still?
        msg!("No accounts need to be initialized. Returning early");
        ctx.accounts.log_memo()?;
        return Ok(());
    }
    // owner bypass check - we don't track fees if swim_payload.user == payer
    // normally they should just initialize the needed ATAs on their own but have this check just in case.
    let swim_payload_owner = ctx.accounts.swim_payload_message.owner;
    if swim_payload_owner != ctx.accounts.payer.key() {
        let create_owner_token_account_total_fees_in_swim_usd =
            ctx.accounts.convert_fees_to_swim_usd_atomic(create_owner_token_account_total_fees_in_lamports)?;

        ctx.accounts.track_and_transfer_fees(create_owner_token_account_total_fees_in_swim_usd)?;

        let transfer_amount = ctx.accounts.swim_payload_message.transfer_amount;
        let new_transfer_amount = transfer_amount
            .checked_sub(create_owner_token_account_total_fees_in_swim_usd)
            .ok_or(error!(PropellerError::InsufficientFunds))?;

        msg!(
            "transfer_amount: {} - fees_in_swim_usd: {} = {}",
            transfer_amount,
            create_owner_token_account_total_fees_in_swim_usd,
            new_transfer_amount
        );
        ctx.accounts.swim_payload_message.transfer_amount = new_transfer_amount;
    }

    ctx.accounts.log_memo()?;
    Ok(())
}

#[derive(Accounts)]
pub struct PropellerCreateOwnerSwimUsdAta<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = swim_usd_mint @ PropellerError::InvalidSwimUsdMint,
    has_one = aggregator @ PropellerError::InvalidAggregator,
    has_one = marginal_price_pool @ PropellerError::InvalidMarginalPricePool,
    constraint = !propeller.is_paused @ PropellerError::IsPaused,
    )]
    pub propeller: Box<Account<'info, Propeller>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
    seeds = [ b"redeemer".as_ref()],
    bump = propeller.redeemer_bump
    )]
    /// this used to be "to_owner".
    /// redeemer will be PDA derived from ["redeemer"], seeds::program = propeller::id()
    /// will have to be signed when it invokes complete_transfer_with_payload
    /// if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to
    ///     (NOT the `to` account)
    pub redeemer: SystemAccount<'info>,
    #[account(
    mut,
    address = get_associated_token_address(&redeemer.key(), &propeller.swim_usd_mint)
    )]
    pub redeemer_escrow: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    address = get_associated_token_address(&propeller.key(), &propeller.swim_usd_mint)
    )]
    pub fee_vault: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    b"fee".as_ref(),
    propeller.swim_usd_mint.as_ref(),
    payer.key().as_ref()
    ],
    bump = fee_tracker.bump
    )]
    pub fee_tracker: Account<'info, FeeTracker>,

    #[account(
    seeds = [
    swim_payload_message.vaa_emitter_address.as_ref(),
    swim_payload_message.vaa_emitter_chain.to_be_bytes().as_ref(),
    swim_payload_message.vaa_sequence.to_be_bytes().as_ref(),
    ],
    bump,
    seeds::program = propeller.token_bridge().unwrap()
    )]
    /// CHECK: WH Claim account
    pub claim: UncheckedAccount<'info>,

    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    b"swim_payload".as_ref(),
    claim.key().as_ref(),
    ],
    bump = swim_payload_message.bump
    )]
    pub swim_payload_message: Box<Account<'info, SwimPayloadMessage>>,

    #[account(
    seeds = [
    b"propeller".as_ref(),
    b"token_id".as_ref(),
    propeller.key().as_ref(),
    &swim_payload_message.target_token_id.to_le_bytes()
    ],
    bump,
    )]
    /// CHECK: Unchecked b/c if target_token_id is invalid then this account should not exist/be able to be
    /// deserialized as a `TokenIdMap`. if it does exist, then engine should have called
    /// propeller_create_owner_token_accounts instead
    pub token_id_map: UncheckedAccount<'info>,
    pub swim_usd_mint: Box<Account<'info, Mint>>,
    #[account(address = swim_payload_message.owner)]
    pub owner: SystemAccount<'info>,
    #[account(
    init,
    payer = payer,
    associated_token::mint = swim_usd_mint,
    associated_token::authority = owner
    )]
    /// Note: specifying TokenAccount type here since only one token account to initialize so no need to
    /// "guess and check" which token accounts need to be initialized
    pub owner_swim_usd_ata: Box<Account<'info, TokenAccount>>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

    /* for sol -> token_bridge_mint conversion */
    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,

    // pub marginal_price_pool: MarginalPricePool<'info>,
    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    marginal_price_pool_token_0_account.mint.as_ref(),
    marginal_price_pool_token_1_account.mint.as_ref(),
    marginal_price_pool_lp_mint.key().as_ref(),
    ],
    bump = marginal_price_pool.bump,
    seeds::program = two_pool_program.key()
    )]
    pub marginal_price_pool: Box<Account<'info, TwoPool>>,
    #[account(address = marginal_price_pool.token_keys[0])]
    pub marginal_price_pool_token_0_account: Box<Account<'info, TokenAccount>>,
    #[account(address = marginal_price_pool.token_keys[1])]
    pub marginal_price_pool_token_1_account: Box<Account<'info, TokenAccount>>,
    #[account(address = marginal_price_pool.lp_mint_key)]
    pub marginal_price_pool_lp_mint: Box<Account<'info, Mint>>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
    // this can be removed once version of anchor released with this PR
    // https://github.com/coral-xyz/anchor/pull/2153
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> PropellerCreateOwnerSwimUsdAta<'info> {
    pub fn accounts(ctx: &Context<PropellerCreateOwnerSwimUsdAta>) -> Result<()> {
        require_keys_eq!(ctx.accounts.owner.key(), ctx.accounts.swim_payload_message.owner);
        TokenNumberMap::assert_is_invalid(&ctx.accounts.token_id_map.to_account_info())?;
        let propeller = &ctx.accounts.propeller;
        validate_marginal_prices_pool_accounts(
            &propeller,
            &ctx.accounts.marginal_price_pool,
            &[&ctx.accounts.marginal_price_pool_token_0_account, &ctx.accounts.marginal_price_pool_token_1_account],
        )?;
        msg!("Passed PropellerCreateOwnerTokenAccounts::accounts() check");
        Ok(())
    }

    fn log_memo(&self) -> Result<()> {
        let memo = self.swim_payload_message.memo;
        if memo != [0u8; 16] {
            let memo_ix = spl_memo::build_memo(get_memo_as_utf8(memo)?.as_ref(), &[]);
            invoke(&memo_ix, &[self.memo.to_account_info()])?;
        }
        Ok(())
    }
}

impl<'info> Fees<'info> for PropellerCreateOwnerSwimUsdAta<'info> {
    fn calculate_fees_in_lamports(&self) -> Result<u64> {
        let fees_in_lamports = Rent::get()?
            .minimum_balance(TokenAccount::LEN)
            .checked_add(self.propeller.init_ata_fee)
            .ok_or(PropellerError::IntegerOverflow)?;
        Ok(fees_in_lamports)
    }

    fn get_marginal_prices(&self) -> Result<[BorshDecimal; TOKEN_COUNT]> {
        let result = two_pool::cpi::marginal_prices(CpiContext::new(
            self.two_pool_program.to_account_info(),
            two_pool::cpi::accounts::MarginalPrices {
                pool: self.marginal_price_pool.to_account_info(),
                pool_token_account_0: self.marginal_price_pool_token_0_account.to_account_info(),
                pool_token_account_1: self.marginal_price_pool_token_1_account.to_account_info(),
                lp_mint: self.marginal_price_pool_lp_mint.to_account_info(),
            },
        ))?;
        Ok(result.get())
    }

    fn convert_fees_to_swim_usd_atomic(&self, fee_in_lamports: u64) -> Result<u64> {
        msg!("fee_in_lamports: {:?}", fee_in_lamports);
        let marginal_price_pool_lp_mint = &self.marginal_price_pool_lp_mint;

        let propeller = &self.propeller;
        let max_staleness = propeller.max_staleness;
        let swim_usd_mint_key = propeller.swim_usd_mint;
        // let marginal_prices = get_marginal_prices(cpi_ctx)?;

        let intermediate_token_price_decimal: Decimal = get_marginal_price_decimal(
            &self.marginal_price_pool,
            &self.get_marginal_prices()?,
            propeller,
            &marginal_price_pool_lp_mint.key(),
        )?;

        msg!("intermediate_token_price_decimal: {:?}", intermediate_token_price_decimal);

        let fee_in_lamports_decimal = Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::ConversionError)?;
        msg!("fee_in_lamports(u64): {:?} fee_in_lamports_decimal: {:?}", fee_in_lamports, fee_in_lamports_decimal);

        let lamports_intermediate_token_price = get_lamports_intermediate_token_price(&self.aggregator, max_staleness)?;
        let fee_in_swim_usd_decimal = lamports_intermediate_token_price
            .checked_mul(fee_in_lamports_decimal)
            .and_then(|x| x.checked_div(intermediate_token_price_decimal))
            .ok_or(PropellerError::IntegerOverflow)?;

        let swim_usd_decimals =
            get_swim_usd_mint_decimals(&swim_usd_mint_key, &self.marginal_price_pool, &marginal_price_pool_lp_mint)?;
        msg!("swim_usd_decimals: {:?}", swim_usd_decimals);

        let ten_pow_decimals =
            Decimal::from_u64(10u64.pow(swim_usd_decimals as u32)).ok_or(PropellerError::IntegerOverflow)?;
        let fee_in_swim_usd_atomic = fee_in_swim_usd_decimal
            .checked_mul(ten_pow_decimals)
            .and_then(|v| v.to_u64())
            .ok_or(PropellerError::ConversionError)?;

        msg!(
            "fee_in_swim_usd_decimal: {:?} fee_in_swim_usd_atomic: {:?}",
            fee_in_swim_usd_decimal,
            fee_in_swim_usd_atomic
        );
        Ok(fee_in_swim_usd_atomic)
    }

    fn track_and_transfer_fees(&mut self, fees_in_swim_usd: u64) -> Result<()> {
        let fee_tracker = &mut self.fee_tracker;
        fee_tracker.fees_owed =
            fee_tracker.fees_owed.checked_add(fees_in_swim_usd).ok_or(PropellerError::IntegerOverflow)?;

        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.redeemer_escrow.to_account_info(),
                    to: self.fee_vault.to_account_info(),
                    authority: self.redeemer.to_account_info(),
                },
                &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
            ),
            fees_in_swim_usd,
        )
    }
}

pub fn handle_propeller_create_owner_swim_usd_ata(ctx: Context<PropellerCreateOwnerSwimUsdAta>) -> Result<()> {
    let create_user_swim_usd_ata_fees_in_lamports = ctx.accounts.calculate_fees_in_lamports()?;
    let swim_payload_owner = ctx.accounts.swim_payload_message.owner;

    if swim_payload_owner != ctx.accounts.payer.key() {
        let create_user_swim_usd_ata_fees_in_swim_usd_atomic =
            ctx.accounts.convert_fees_to_swim_usd_atomic(create_user_swim_usd_ata_fees_in_lamports)?;

        ctx.accounts.track_and_transfer_fees(create_user_swim_usd_ata_fees_in_swim_usd_atomic)?;

        let transfer_amount = ctx.accounts.swim_payload_message.transfer_amount;
        let new_transfer_amount = transfer_amount
            .checked_sub(create_user_swim_usd_ata_fees_in_swim_usd_atomic)
            .ok_or(error!(PropellerError::InsufficientFunds))?;

        msg!(
            "transfer_amount: {} - fees_in_swim_usd: {} = {}",
            transfer_amount,
            create_user_swim_usd_ata_fees_in_swim_usd_atomic,
            new_transfer_amount
        );
        ctx.accounts.swim_payload_message.transfer_amount = new_transfer_amount;
    }
    ctx.accounts.log_memo()?;
    Ok(())
}

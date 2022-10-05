pub use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};
use {
    crate::{
        constants::LAMPORTS_PER_SOL_DECIMAL,
        convert_fees_to_swim_usd_atomic, convert_fees_to_swim_usd_atomic_2, deserialize_message_payload,
        error::*,
        get_lamports_intermediate_token_price, get_marginal_price_decimal, get_message_data,
        get_swim_usd_mint_decimals, get_transfer_with_payload_from_message_account, hash_vaa,
        state::{SwimClaim, SwimPayloadMessage, *},
        token_bridge::TokenBridge,
        token_id_map::{PoolInstruction, TokenIdMap},
        ClaimData, FeeTracker, PayloadTransferWithPayload, PostVAAData, PostedVAAData, Propeller, RawSwimPayload,
        TOKEN_COUNT,
    },
    anchor_lang::{prelude::*, solana_program::program::invoke},
    anchor_spl::{
        associated_token::{get_associated_token_address, AssociatedToken},
        token::{self, Mint, Token, TokenAccount, Transfer},
    },
    num_traits::{FromPrimitive, ToPrimitive},
    rust_decimal::Decimal,
    solana_program::{instruction::Instruction, program::invoke_signed},
    std::convert::TryInto,
    two_pool::{state::TwoPool, BorshDecimal},
};

#[derive(Accounts)]
pub struct PropellerCreateOwnerTokenAccounts<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = aggregator @ PropellerError::InvalidAggregator
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
    bump = token_id_map.bump,
    )]
    pub token_id_map: Box<Account<'info, TokenIdMap>>,

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
    pub pool_token_0_mint: Box<Account<'info, Mint>>,
    pub pool_token_1_mint: Box<Account<'info, Mint>>,
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
        require_keys_eq!(ctx.accounts.pool.key(), ctx.accounts.token_id_map.pool);
        let propeller = &ctx.accounts.propeller;
        validate_marginal_prices_pool_accounts_2(
            &propeller,
            &ctx.accounts.marginal_price_pool,
            &[&ctx.accounts.marginal_price_pool_token_0_account, &ctx.accounts.marginal_price_pool_token_1_account],
        )?;
        msg!("Passed PropellerCreateOwnerTokenAccounts::accounts() check");
        Ok(())
    }

    fn into_marginal_prices(&self) -> CpiContext<'_, '_, '_, 'info, two_pool::cpi::accounts::MarginalPrices<'info>> {
        let program = self.two_pool_program.to_account_info();
        let accounts = two_pool::cpi::accounts::MarginalPrices {
            pool: self.marginal_price_pool.to_account_info(),
            pool_token_account_0: self.marginal_price_pool_token_0_account.to_account_info(),
            pool_token_account_1: self.marginal_price_pool_token_1_account.to_account_info(),
            lp_mint: self.marginal_price_pool_lp_mint.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    fn calculate_fees_in_lamports(&self) -> Result<u64> {
        let mut create_owner_token_account_total_fees_in_lamports = 0u64;

        let init_ata_fee = self.propeller.init_ata_fee;
        let token_program = self.token_program.to_account_info();
        let payer = self.payer.to_account_info();
        let user = self.user.to_account_info();
        let system_program = self.system_program.to_account_info();
        let init_token_account_0_fees = initialize_user_ata_and_get_fees(
            self.user_pool_token_0_account.to_account_info().clone(),
            payer.clone(),
            user.clone(),
            self.pool_token_0_mint.to_account_info().clone(),
            system_program.clone(),
            token_program.clone(),
            init_ata_fee,
        )?;
        let init_token_account_1_fees = initialize_user_ata_and_get_fees(
            self.user_pool_token_1_account.to_account_info().clone(),
            payer.clone(),
            user.clone(),
            self.pool_token_1_mint.to_account_info().clone(),
            system_program.clone(),
            token_program.clone(),
            init_ata_fee,
        )?;
        let init_lp_token_account_fees = initialize_user_ata_and_get_fees(
            self.user_lp_token_account.to_account_info().clone(),
            payer.clone(),
            user.clone(),
            self.pool_lp_mint.to_account_info().clone(),
            system_program.clone(),
            token_program.clone(),
            init_ata_fee,
        )?;
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

    fn track_and_transfer_fees(&mut self, fees_in_swim_usd: u64) -> Result<()> {
        let fee_tracker = &mut self.fee_tracker;
        let updated_fees_owed =
            fee_tracker.fees_owed.checked_add(fees_in_swim_usd).ok_or(PropellerError::IntegerOverflow)?;
        fee_tracker.fees_owed = updated_fees_owed;

        let cpi_accounts = Transfer {
            from: self.redeemer_escrow.to_account_info(),
            to: self.fee_vault.to_account_info(),
            authority: self.redeemer.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                cpi_accounts,
                &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
            ),
            fees_in_swim_usd,
        )
    }

    fn log_memo(&self) -> Result<()> {
        let memo = self.swim_payload_message.memo;
        if memo != [0u8; 16] {
            let memo_ix =
                spl_memo::build_memo(std::str::from_utf8(hex::encode(memo).as_bytes()).unwrap().as_ref(), &[]);
            invoke(&memo_ix, &[self.memo.to_account_info()])?;
        }
        Ok(())
    }
}

//TODO: allow this regardless of gasKickstart or only if gasKickstart?
// possible !gasKickstart but they don't have all the accounts needed (e.g. token_account for token_bridge_mint)
/// Note: we still allow this to be called even if all token accounts already exist. But since this is wasteful,
/// we penalize the engine by not reimbursing them anything in that situation so that they are incentivized to
/// check if any of the require token accounts don't exist.
pub fn handle_propeller_create_owner_token_accounts(ctx: Context<PropellerCreateOwnerTokenAccounts>) -> Result<()> {
    //TODO: enforce that this step can only be done after CompleteNativeWithPayload is done?
    // -> no way to have a `swim_payload_message` if not done yet.

    // let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.claim.data.borrow())
    //     .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    // require!(claim_data.claimed, PropellerError::ClaimNotClaimed);

    //TODO: check `vaa.to` is this program's address?
    // let payload_transfer_with_payload =
    //     get_transfer_with_payload_from_message_account(&ctx.accounts.message.to_account_info())?;
    // msg!("message_data_payload: {:?}", payload_transfer_with_payload);
    // let PayloadTransferWithPayload {
    //     message_type,
    //     amount,
    //     token_address,
    //     token_chain,
    //     to,
    //     to_chain,
    //     from_address,
    //     payload,
    // } = payload_transfer_with_payload;
    // //TODO: do i need to re-check this?
    // // any issue in doing so?
    // msg!("payload_transfer_with_payload.to: {:?}", to);
    // let to_pubkey = Pubkey::new_from_array(to);
    // require_keys_eq!(to_pubkey, crate::ID);

    let create_owner_token_account_total_fees_in_lamports = ctx.accounts.calculate_fees_in_lamports()?;
    if create_owner_token_account_total_fees_in_lamports == 0 {
        //TODO: log memo still?
        msg!("No accounts need to be initialized. Returning early");
        ctx.accounts.log_memo()?;
        return Ok(());
    }
    //let fees_in_swim_usd = convert_fees_to_swim_usd_atomic()
    // self.handle_fees(fees_in_swim_usd)

    // let create_owner_token_account_total_fees_in_token_bridge_mint =
    //     get_fees_in_token_bridge_mint(create_owner_token_account_total_fees_in_lamports, &ctx)?;

    // let fee_tracker = &mut ctx.accounts.fee_tracker;
    // fee_tracker.fees_owed = fee_tracker
    //     .fees_owed
    //     .checked_add(create_owner_token_account_total_fees_in_token_bridge_mint)
    //     .ok_or(PropellerError::IntegerOverflow)?;
    // let cpi_accounts = Transfer {
    //     from: ctx.accounts.redeemer_escrow.to_account_info(),
    //     to: ctx.accounts.fee_vault.to_account_info(),
    //     authority: ctx.accounts.redeemer.to_account_info(),
    // };
    // token::transfer(
    //     CpiContext::new_with_signer(
    //         token_program.clone(),
    //         cpi_accounts,
    //         &[&[&b"redeemer".as_ref(), &[ctx.accounts.propeller.redeemer_bump]]],
    //     ),
    //     create_owner_token_account_total_fees_in_token_bridge_mint,
    // )?;

    let marginal_prices = two_pool::cpi::marginal_prices(ctx.accounts.into_marginal_prices())?;
    let create_owner_token_account_total_fees_in_swim_usd = convert_fees_to_swim_usd_atomic_2(
        create_owner_token_account_total_fees_in_lamports,
        &ctx.accounts.propeller,
        &ctx.accounts.marginal_price_pool_lp_mint,
        marginal_prices.get(),
        &ctx.accounts.marginal_price_pool,
        &ctx.accounts.aggregator,
        i64::MAX,
    )?;
    // let create_owner_token_account_total_fees_in_swim_usd = convert_fees_to_swim_usd_atomic(
    //     create_owner_token_account_total_fees_in_lamports,
    //     &ctx.accounts.propeller,
    //     &ctx.accounts.marginal_price_pool_lp_mint,
    //     ctx.accounts.into_marginal_prices(),
    //     &ctx.accounts.marginal_price_pool,
    //     &ctx.accounts.aggregator,
    //     i64::MAX,
    // )?;
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
    ctx.accounts.log_memo()?;
    Ok(())
}

fn initialize_user_ata_and_get_fees<'info>(
    user_unchecked_token_account: AccountInfo<'info>,
    payer: AccountInfo<'info>,
    user: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    create_ata_fee: u64,
) -> Result<u64> {
    //TODO: figure out actual cost of create ata txn.
    let create_ata_fee = 10000u64;
    let ata_data_len = user_unchecked_token_account.data_len();
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
        invoke(&ix, &[payer, user_unchecked_token_account, user, mint, system_program, token_program])?;
        let fees = Rent::get()?.minimum_balance(TokenAccount::LEN) + create_ata_fee;
        Ok(fees)
    }
}

#[derive(Accounts)]
pub struct PropellerCreateOwnerSwimUsdAta<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = swim_usd_mint @ PropellerError::InvalidSwimUsdMint,
    has_one = aggregator @ PropellerError::InvalidAggregator,
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
        // let (expected_token_id_map_address, _bump) = Pubkey::find_program_address(
        //     &[
        //         b"propeller".as_ref(),
        //         b"token_id".as_ref(),
        //         ctx.accounts.propeller.key().as_ref(),
        //         ctx.accounts.swim_payload_message.target_token_id.to_le_bytes().as_ref(),
        //     ],
        //     ctx.program_id,
        // );
        // //Note: the address should at least be valid even though it doesn't exist.
        // require_keys_eq!(expected_token_id_map_address, ctx.accounts.token_id_map.key());
        TokenIdMap::assert_is_invalid(&ctx.accounts.token_id_map.to_account_info())?;
        // let token_id_map = &ctx.accounts.token_id_map;
        // if let Ok(_) = TokenIdMap::try_deserialize(&mut &**token_id_map.try_borrow_mut_data()?) {
        //     return err!(PropellerError::TokenIdMapExists);
        // }
        let propeller = &ctx.accounts.propeller;
        validate_marginal_prices_pool_accounts(
            &propeller,
            &ctx.accounts.marginal_price_pool.key(),
            &[
                ctx.accounts.marginal_price_pool_token_0_account.mint,
                ctx.accounts.marginal_price_pool_token_1_account.mint,
            ],
        )?;
        msg!("Passed PropellerCreateOwnerTokenAccounts::accounts() check");
        Ok(())
    }

    fn into_marginal_prices(&self) -> CpiContext<'_, '_, '_, 'info, two_pool::cpi::accounts::MarginalPrices<'info>> {
        let program = self.two_pool_program.to_account_info();
        let accounts = two_pool::cpi::accounts::MarginalPrices {
            pool: self.marginal_price_pool.to_account_info(),
            pool_token_account_0: self.marginal_price_pool_token_0_account.to_account_info(),
            pool_token_account_1: self.marginal_price_pool_token_1_account.to_account_info(),
            lp_mint: self.marginal_price_pool_lp_mint.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }

    fn calculate_fees_in_lamports(&self) -> Result<u64> {
        let fees_in_lamports = Rent::get()?
            .minimum_balance(TokenAccount::LEN)
            .checked_add(self.propeller.init_ata_fee)
            .ok_or(PropellerError::IntegerOverflow)?;
        Ok(fees_in_lamports)
    }

    pub fn handle_fees(&mut self, fees_in_swim_usd: u64) -> Result<()> {
        let fee_tracker = &mut self.fee_tracker;
        let updated_fees_owed =
            fee_tracker.fees_owed.checked_add(fees_in_swim_usd).ok_or(PropellerError::IntegerOverflow)?;
        fee_tracker.fees_owed = updated_fees_owed;

        let cpi_accounts = Transfer {
            from: self.redeemer_escrow.to_account_info(),
            to: self.fee_vault.to_account_info(),
            authority: self.redeemer.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                cpi_accounts,
                &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
            ),
            fees_in_swim_usd,
        )
    }
}

pub fn handle_propeller_create_owner_swim_usd_ata(ctx: Context<PropellerCreateOwnerSwimUsdAta>) -> Result<()> {
    let fees_in_lamports = ctx.accounts.calculate_fees_in_lamports()?;
    // let fees_in_lamports = Rent::get()?
    //     .minimum_balance(TokenAccount::LEN)
    //     .checked_add(ctx.accounts.propeller.init_ata_fee)
    //     .ok_or(PropellerError::IntegerOverflow)?;
    // let init_token_bridge_ata_total_fee_in_token_bridge_mint =
    //     ctx.accounts.convert_fees_to_swim_usd_atomic(fee_in_lamports)?;
    let marginal_prices = two_pool::cpi::marginal_prices(ctx.accounts.into_marginal_prices())?;
    let fees_in_swim_usd_atomic = convert_fees_to_swim_usd_atomic_2(
        fees_in_lamports,
        &ctx.accounts.propeller,
        &ctx.accounts.marginal_price_pool_lp_mint,
        marginal_prices.get(),
        &ctx.accounts.marginal_price_pool,
        &ctx.accounts.aggregator,
        i64::MAX,
    )?;
    ctx.accounts.handle_fees(fees_in_swim_usd_atomic)?;

    let transfer_amount = ctx.accounts.swim_payload_message.transfer_amount;
    let new_transfer_amount =
        transfer_amount.checked_sub(fees_in_swim_usd_atomic).ok_or(error!(PropellerError::InsufficientFunds))?;

    msg!(
        "transfer_amount: {} - fees_in_swim_usd_atomic: {} = {}",
        transfer_amount,
        fees_in_swim_usd_atomic,
        new_transfer_amount
    );
    ctx.accounts.swim_payload_message.transfer_amount = new_transfer_amount;

    let memo = ctx.accounts.swim_payload_message.memo;
    if memo != [0u8; 16] {
        let memo_ix = spl_memo::build_memo(std::str::from_utf8(hex::encode(memo).as_bytes()).unwrap().as_ref(), &[]);
        invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
    }
    Ok(())
}

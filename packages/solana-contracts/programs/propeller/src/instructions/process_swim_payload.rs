pub use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};
use {
    crate::{
        constants::LAMPORTS_PER_SOL_DECIMAL, convert_fees_to_swim_usd_atomic, get_marginal_price_decimal,
        get_swim_usd_mint_decimals, FeeTracker,
    },
    crate::{
        deserialize_message_payload,
        // env::*,
        error::*,
        get_message_data,
        get_transfer_with_payload_from_message_account,
        hash_vaa,
        state::{SwimClaim, SwimPayloadMessage, *},
        token_bridge::TokenBridge,
        token_id_map::{PoolInstruction, TokenIdMap},
        ClaimData,
        PayloadTransferWithPayload,
        PostVAAData,
        PostedVAAData,
        Propeller,
        RawSwimPayload,
        TOKEN_COUNT,
    },
    anchor_lang::system_program,
    anchor_lang::{prelude::*, solana_program::program::invoke},
    anchor_spl::{
        associated_token::{get_associated_token_address, AssociatedToken},
        token::Transfer,
    },
    anchor_spl::{
        token,
        token::{Mint, Token, TokenAccount},
    },
    num_traits::{FromPrimitive, ToPrimitive},
    rust_decimal::Decimal,
    std::convert::TryInto,
    two_pool::state::TwoPool,
};
use {
    crate::{convert_fees_to_swim_usd_atomic_2, get_lamports_intermediate_token_price, Fees},
    two_pool::BorshDecimal,
};

pub const SWIM_USD_TO_TOKEN_NUMBER: u16 = 0;

#[derive(Accounts)]
#[instruction(target_token_id: u16)]
pub struct ProcessSwimPayload<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump
    )]
    pub propeller: Box<Account<'info, Propeller>>,
    #[account(mut)]
    pub payer: Signer<'info>,

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
    init,
    payer = payer,
    seeds = [ b"propeller".as_ref(),
    b"claim".as_ref(),
    claim.key().as_ref(),
    ],
    bump,
    space = 8 + SwimClaim::LEN,
    )]
    pub swim_claim: Account<'info, SwimClaim>,

    #[account(
    mut,
    close = swim_payload_message_payer,
    seeds = [
    b"propeller".as_ref(),
    b"swim_payload".as_ref(),
    claim.key().as_ref(),
    ],
    bump = swim_payload_message.bump,
    has_one = swim_payload_message_payer,
    has_one = claim,
    )]
    pub swim_payload_message: Box<Account<'info, SwimPayloadMessage>>,

    #[account(mut)]
    pub swim_payload_message_payer: SystemAccount<'info>,

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
    seeds = [
    b"propeller".as_ref(),
    b"token_id".as_ref(),
    propeller.key().as_ref(),
    &target_token_id.to_le_bytes()
    ],
    bump = token_id_map.bump,
    )]
    pub token_id_map: Account<'info, TokenIdMap>,

    /*  Pool Used for final swap to get token_id_map.pool_token_mint */
    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    pool_token_account_0.mint.as_ref(),
    pool_token_account_1.mint.as_ref(),
    lp_mint.key().as_ref(),
    ],
    bump = pool.bump,
    seeds::program = two_pool_program.key()
    )]
    pub pool: Box<Account<'info, TwoPool>>,

    #[account(
    mut,
    token::mint = pool.token_mint_keys[0],
    token::authority = pool,
    )]
    pub pool_token_account_0: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    token::mint = pool.token_mint_keys[1],
    token::authority = pool,
    )]
    pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub lp_mint: Box<Account<'info, Mint>>,
    #[account(
    mut,
    address = pool.governance_fee_key,
    )]
    pub governance_fee: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    address = get_associated_token_address(&swim_payload_message.owner, &pool_token_account_0.mint)
    )]
    pub user_token_account_0: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    address = get_associated_token_address(&swim_payload_message.owner, &pool_token_account_1.mint)
    )]
    pub user_token_account_1: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    address = get_associated_token_address(&swim_payload_message.owner, &pool.lp_mint_key)
    )]
    pub user_lp_token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,

    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,

    pub system_program: Program<'info, System>,
}

impl<'info> ProcessSwimPayload<'info> {
    pub fn accounts(ctx: &Context<ProcessSwimPayload>) -> Result<()> {
        // verify claim
        // verify message
        require_keys_eq!(ctx.accounts.swim_payload_message.claim.key(), ctx.accounts.claim.key());
        require_keys_eq!(
            ctx.accounts.pool.key(),
            ctx.accounts.token_id_map.pool,
            PropellerError::InvalidTokenIdMapPool
        );
        Ok(())
    }

    pub fn validate(&self) -> Result<()> {
        // verify claim
        // verify message
        require_keys_eq!(self.swim_payload_message.claim.key(), self.claim.key());
        require_keys_eq!(self.pool.key(), self.token_id_map.pool, PropellerError::InvalidTokenIdMapPool);
        Ok(())
    }

    pub fn transfer_tokens(
        &self,
        output_token_index: u16,
        transfer_amount: u64,
        min_output_amount: u64,
    ) -> Result<u64> {
        let token_id_mapping = &self.token_id_map;
        let pool_ix = &token_id_mapping.pool_ix;
        let pool_token_mint = &token_id_mapping.pool_token_mint;
        let pool_token_index = token_id_mapping.pool_token_index;

        //TODO: decide if using user_transfer_auth
        // remove user_transfer_authority account if not.

        self.execute_transfer_or_pool_ix(
            transfer_amount,
            min_output_amount,
            output_token_index,
            pool_ix,
            pool_token_index,
            pool_token_mint,
            &self.redeemer.to_account_info(),
            &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
        )
    }

    fn execute_transfer_or_pool_ix(
        &self,
        transfer_amount: u64,
        min_output_amount: u64,
        output_token_index: u16,
        pool_ix: &PoolInstruction,
        pool_token_index: u8,
        pool_token_mint: &Pubkey,
        user_transfer_authority: &AccountInfo<'info>,
        signer_seeds: &[&[&[u8]]],
    ) -> Result<u64> {
        let swim_payload_owner = self.swim_payload_message.owner;
        require_gt!(TOKEN_COUNT, pool_token_index as usize);
        match pool_ix {
            PoolInstruction::RemoveExactBurn => {
                msg!("Executing RemoveExactBurn");
                require_keys_eq!(self.pool.token_mint_keys[pool_token_index as usize], *pool_token_mint);

                // TODO: handle other checks
                Ok(two_pool::cpi::remove_exact_burn(
                    CpiContext::new_with_signer(
                        self.two_pool_program.to_account_info(),
                        two_pool::cpi::accounts::RemoveExactBurn {
                            pool: self.pool.to_account_info(),
                            pool_token_account_0: self.pool_token_account_0.to_account_info(),
                            pool_token_account_1: self.pool_token_account_1.to_account_info(),
                            lp_mint: self.lp_mint.to_account_info(),
                            governance_fee: self.governance_fee.to_account_info(),
                            user_transfer_authority: user_transfer_authority.to_account_info(),
                            user_token_account_0: self.user_token_account_0.to_account_info(),
                            user_token_account_1: self.user_token_account_1.to_account_info(),
                            user_lp_token_account: self.redeemer_escrow.to_account_info(),
                            token_program: self.token_program.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    transfer_amount,
                    pool_token_index,
                    min_output_amount,
                )?
                .get())
            }
            PoolInstruction::SwapExactInput => {
                msg!("Executing SwapExactInput");
                require_keys_eq!(self.pool.token_mint_keys[pool_token_index as usize], *pool_token_mint);

                Ok(two_pool::cpi::swap_exact_input(
                    CpiContext::new_with_signer(
                        self.two_pool_program.to_account_info(),
                        two_pool::cpi::accounts::SwapExactInput {
                            pool: self.pool.to_account_info(),
                            pool_token_account_0: self.pool_token_account_0.to_account_info(),
                            pool_token_account_1: self.pool_token_account_1.to_account_info(),
                            lp_mint: self.lp_mint.to_account_info(),
                            governance_fee: self.governance_fee.to_account_info(),
                            user_transfer_authority: user_transfer_authority.to_account_info(),
                            user_token_account_0: self.redeemer_escrow.to_account_info(),
                            user_token_account_1: self.user_token_account_1.to_account_info(),
                            token_program: self.token_program.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    [transfer_amount, 0u64],
                    pool_token_index,
                    min_output_amount,
                )?
                .get())
            }
            PoolInstruction::Transfer => {
                require_eq!(output_token_index, SWIM_USD_TO_TOKEN_NUMBER, PropellerError::InvalidOutputTokenIndex);
                self.transfer_swim_usd_tokens(transfer_amount, user_transfer_authority, signer_seeds)
            }
        }
    }

    fn transfer_swim_usd_tokens(
        &self,
        transfer_amount: u64,
        user_transfer_authority: &AccountInfo<'info>,
        signer_seeds: &[&[&[u8]]],
    ) -> Result<u64> {
        let cpi_accounts = Transfer {
            from: self.redeemer_escrow.to_account_info(),
            to: self.user_lp_token_account.to_account_info(),
            authority: user_transfer_authority.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(self.token_program.to_account_info(), cpi_accounts, signer_seeds),
            transfer_amount,
        )?;
        Ok(transfer_amount)
    }

    fn init_swim_claim(&mut self, swim_claim_bump: u8) -> Result<()> {
        let swim_claim = &mut self.swim_claim;
        swim_claim.bump = swim_claim_bump;
        swim_claim.claimed = true;
        Ok(())
    }

    fn get_swim_usd_mint(&self) -> Pubkey {
        self.propeller.swim_usd_mint
    }
}

pub fn handle_process_swim_payload(
    ctx: Context<ProcessSwimPayload>,
    target_token_id: u16,
    min_output_amount: u64,
) -> Result<u64> {
    let propeller_message = &ctx.accounts.swim_payload_message;

    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    require!(claim_data.claimed, PropellerError::ClaimNotClaimed);
    msg!("claim_data: {:?}", claim_data);

    let transfer_amount = ctx.accounts.swim_payload_message.transfer_amount;

    let owner = propeller_message.owner;
    let token_program = &ctx.accounts.token_program;
    msg!("transfer_amount: {}", transfer_amount);

    let output_amount = ctx.accounts.transfer_tokens(target_token_id, transfer_amount, min_output_amount)?;

    let swim_claim_bump = *ctx.bumps.get("swim_claim").unwrap();
    ctx.accounts.init_swim_claim(swim_claim_bump)?;

    Ok(output_amount)
}

#[derive(Accounts)]
pub struct PropellerProcessSwimPayload<'info> {
    pub process_swim_payload: ProcessSwimPayload<'info>,

    // #[account(mut)]
    // pub token_bridge_mint: Box<Account<'info, Mint>>,
    /// Assuming that USD:USDC 1:1
    ///CHECK: account for getting gas -> USD price
    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount,
    address = process_swim_payload.propeller.aggregator @ PropellerError::InvalidAggregator
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,

    #[account(
    mut,
    address = process_swim_payload.propeller.fee_vault @ PropellerError::InvalidFeeVault
    )]
    /// this is "to_fees"
    /// recipient of fees for executing complete transfer (e.g. relayer)
    pub fee_vault: Box<Account<'info, TokenAccount>>,

    // Note: anchor 0.25.0 still has some issues auto deriving recursive
    // seeds. Seems to be mostly fixed in new version.
    // #[account(
    // mut,
    // seeds = [
    // b"propeller".as_ref(),
    // b"fee".as_ref(),
    // process_swim_payload.propeller.token_bridge_mint,
    // process_swim_payload.payer.key().as_ref()
    // ],
    // bump = fee_tracker.bump
    // )]
    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    b"fee".as_ref(),
    process_swim_payload.get_swim_usd_mint().as_ref(),
    process_swim_payload.payer.key().as_ref()
    ],
    bump = fee_tracker.bump
    )]
    pub fee_tracker: Box<Account<'info, FeeTracker>>,

    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    marginal_price_pool_token_0_account.mint.as_ref(),
    marginal_price_pool_token_1_account.mint.as_ref(),
    marginal_price_pool_lp_mint.key().as_ref(),
    ],
    bump = marginal_price_pool.bump,
    seeds::program = process_swim_payload.two_pool_program.key(),
    address = process_swim_payload.propeller.marginal_price_pool @ PropellerError::InvalidMarginalPricePool
    )]
    pub marginal_price_pool: Box<Account<'info, TwoPool>>,
    #[account(address = marginal_price_pool.token_keys[0])]
    pub marginal_price_pool_token_0_account: Box<Account<'info, TokenAccount>>,
    #[account(address = marginal_price_pool.token_keys[1])]
    pub marginal_price_pool_token_1_account: Box<Account<'info, TokenAccount>>,
    #[account(address = marginal_price_pool.lp_mint_key)]
    pub marginal_price_pool_lp_mint: Box<Account<'info, Mint>>,
    /// This is for transferring lamports for kickstart
    /// TODO: force this to be system account?
    #[account(mut, address = process_swim_payload.swim_payload_message.owner)]
    pub owner: SystemAccount<'info>,
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
}

impl<'info> PropellerProcessSwimPayload<'info> {
    pub fn accounts(ctx: &Context<PropellerProcessSwimPayload>, target_token_id: u16) -> Result<()> {
        ctx.accounts.validate()?;
        require_keys_eq!(
            ctx.accounts.process_swim_payload.propeller.aggregator,
            ctx.accounts.aggregator.key(),
            PropellerError::InvalidAggregator
        );
        require_eq!(
            ctx.accounts.process_swim_payload.swim_payload_message.target_token_id,
            target_token_id,
            // PropellerError::InvalidTargetTokenId
        );
        validate_marginal_prices_pool_accounts(
            &ctx.accounts.process_swim_payload.propeller,
            &ctx.accounts.marginal_price_pool.key(),
            &[
                ctx.accounts.marginal_price_pool_token_0_account.mint,
                ctx.accounts.marginal_price_pool_token_1_account.mint,
            ],
        )?;
        msg!("Finished PropellerProcessSwimPayload::accounts()");
        Ok(())
    }

    pub fn validate(&self) -> Result<()> {
        // verify claim
        // verify message
        require_keys_eq!(
            self.process_swim_payload.swim_payload_message.claim.key(),
            self.process_swim_payload.claim.key()
        );
        require_keys_eq!(
            self.process_swim_payload.pool.key(),
            self.process_swim_payload.token_id_map.pool,
            PropellerError::InvalidTokenIdMapPool
        );
        Ok(())
    }

    fn transfer_gas_kickstart(&self) -> Result<()> {
        let propeller = &self.process_swim_payload.propeller;
        let owner_account = &self.owner.to_account_info();
        let payer = &self.process_swim_payload.payer.to_account_info();
        let owner_starting_lamports = owner_account.lamports();
        let payer_starting_lamports = payer.lamports();
        let system_program = &self.process_swim_payload.system_program;
        require_gte!(
            payer_starting_lamports,
            propeller.gas_kickstart_amount,
            PropellerError::PayerInsufficientFundsForGasKickstart
        );
        system_program::transfer(
            CpiContext::new(
                system_program.to_account_info(),
                system_program::Transfer { from: payer.clone(), to: owner_account.clone() },
            ),
            propeller.gas_kickstart_amount,
        )?;
        msg!("owner_starting_lamports: {}, owner_final_lamports: {}, payer_starting_lamports: {}, payer_final_lamports: {}",
            owner_starting_lamports, owner_account.lamports(), payer_starting_lamports, payer.lamports());
        Ok(())
    }

    fn log_memo(&self) -> Result<()> {
        let memo = self.process_swim_payload.swim_payload_message.memo;
        if memo != [0u8; 16] {
            let memo_ix =
                spl_memo::build_memo(std::str::from_utf8(hex::encode(memo).as_bytes()).unwrap().as_ref(), &[]);
            invoke(&memo_ix, &[self.memo.to_account_info()])?;
        } else {
            msg!("memo is empty");
        }
        Ok(())
    }
}

impl<'info> Fees<'info> for PropellerProcessSwimPayload<'info> {
    fn calculate_fees_in_lamports(&self) -> Result<u64> {
        //TODO: this is in lamports/SOL. need in swimUSD.
        //   for (secp + verify) & postVAA, need to implement a fee tracking mechanism since there's no way to
        //      credit the payer during that step. must be some type of "deferred" fees
        let rent = Rent::get()?;

        let propeller = &self.process_swim_payload.propeller;
        let swim_payload_message = &self.process_swim_payload.swim_payload_message;
        let propeller_process_swim_payload_fees = propeller.process_swim_payload_fee;

        let swim_claim_rent_exempt_fees = rent.minimum_balance(8 + SwimClaim::LEN);
        let gas_kickstart_amount = if swim_payload_message.gas_kickstart { propeller.gas_kickstart_amount } else { 0 };
        let fee_in_lamports = swim_claim_rent_exempt_fees
            .checked_add(propeller_process_swim_payload_fees)
            .and_then(|x| x.checked_add(gas_kickstart_amount))
            .ok_or(PropellerError::IntegerOverflow)?;

        msg!(
            "
        {}(swim_claim_rent_exempt_fees) +
        {}(propeller_process_swim_payload_fees) +
        {}(gas_kickstart_amount)
        = {}(fee_in_lamports)
        ",
            swim_claim_rent_exempt_fees,
            propeller_process_swim_payload_fees,
            gas_kickstart_amount,
            fee_in_lamports
        );
        Ok(fee_in_lamports)
    }

    fn get_marginal_prices(&self) -> Result<[BorshDecimal; TOKEN_COUNT]> {
        let result = two_pool::cpi::marginal_prices(CpiContext::new(
            self.process_swim_payload.two_pool_program.to_account_info(),
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
        let propeller = &self.process_swim_payload.propeller;

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
                self.process_swim_payload.token_program.to_account_info(),
                Transfer {
                    from: self.process_swim_payload.redeemer_escrow.to_account_info(),
                    to: self.fee_vault.to_account_info(),
                    authority: self.process_swim_payload.redeemer.to_account_info(),
                },
                &[&[&b"redeemer".as_ref(), &[self.process_swim_payload.propeller.redeemer_bump]]],
            ),
            fees_in_swim_usd,
        )
    }
}

/**
will only support remove_exact_burn in v0 since no slippage settings
for metapool, will only support swap_exact_input since no slippage settings

after completeNativeWithPayload, `to` tokenAccount that's owned by redeemer will contain
the wormholed tokens.

now we need to do the following:
1. calculate the fees and transfer to `fee_recipient`
  a. transfer or just mark a fee state?
2. swap the rest of the token from the `to` account into the desired result token and the owner's
token account

TODO:
1. handle same as CompleteNativeWithPayload
  a. initialize a SwimClaim PDA

 */
pub fn handle_propeller_process_swim_payload(
    ctx: Context<PropellerProcessSwimPayload>,
    target_token_id: u16,
) -> Result<u64> {
    let swim_payload_message = &ctx.accounts.process_swim_payload.swim_payload_message;
    let is_gas_kickstart = swim_payload_message.gas_kickstart;
    let target_token_id = swim_payload_message.target_token_id;

    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.process_swim_payload.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    require!(claim_data.claimed, PropellerError::ClaimNotClaimed);
    msg!("claim_data: {:?}", claim_data);

    let mut transfer_amount = swim_payload_message.transfer_amount;
    let propeller = &ctx.accounts.process_swim_payload.propeller;
    let redeemer = &ctx.accounts.process_swim_payload.redeemer;
    let swim_payload_owner = swim_payload_message.owner;
    let token_program = &ctx.accounts.process_swim_payload.token_program;
    msg!("original transfer_amount: {:?}", transfer_amount);
    if swim_payload_owner != ctx.accounts.process_swim_payload.payer.key() {
        let fees_in_lamports = ctx.accounts.calculate_fees_in_lamports()?;
        let fees_in_swim_usd_atomic = ctx.accounts.convert_fees_to_swim_usd_atomic(fees_in_lamports)?;
        ctx.accounts.track_and_transfer_fees(fees_in_swim_usd_atomic)?;
        msg!("fees_in_swim_usd_atomic: {:?}", fees_in_swim_usd_atomic);
        if is_gas_kickstart {
            ctx.accounts.transfer_gas_kickstart()?;
        }
        transfer_amount =
            transfer_amount.checked_sub(fees_in_swim_usd_atomic).ok_or(error!(PropellerError::InsufficientFunds))?;
    } else {
        //TODO: a user should just call processSwimPayload instead to avoid passing in extra accounts. end result is same.
        msg!("swim_payload_owner == ctx.accounts.payer.key(). Owner bypass");
    }

    msg!("transfer_amount - fee = {}", transfer_amount);
    let min_output_amount = 0u64;
    let output_amount =
        ctx.accounts.process_swim_payload.transfer_tokens(target_token_id, transfer_amount, min_output_amount)?;

    let swim_claim_bump = *ctx.bumps.get("swim_claim").unwrap();
    ctx.accounts.process_swim_payload.init_swim_claim(swim_claim_bump)?;
    ctx.accounts.log_memo()?;

    msg!("output_amount: {}", output_amount);
    Ok(output_amount)
}

#[derive(Accounts)]
pub struct PropellerProcessSwimPayloadFallback<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = marginal_price_pool @ PropellerError::InvalidMarginalPricePool,
    has_one = aggregator @ PropellerError::InvalidAggregator,
    has_one = fee_vault @ PropellerError::InvalidFeeVault,
    )]
    pub propeller: Box<Account<'info, Propeller>>,
    #[account(mut)]
    pub payer: Signer<'info>,

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
    init,
    payer = payer,
    seeds = [ b"propeller".as_ref(),
    b"claim".as_ref(),
    claim.key().as_ref(),
    ],
    bump,
    space = 8 + SwimClaim::LEN,
    )]
    pub swim_claim: Account<'info, SwimClaim>,

    #[account(
    mut,
    close = swim_payload_message_payer,
    seeds = [
    b"propeller".as_ref(),
    b"swim_payload".as_ref(),
    claim.key().as_ref(),
    ],
    bump = swim_payload_message.bump,
    has_one = swim_payload_message_payer,
    has_one = owner,
    has_one = claim,
    )]
    pub swim_payload_message: Box<Account<'info, SwimPayloadMessage>>,
    #[account(mut)]
    pub swim_payload_message_payer: SystemAccount<'info>,

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

    #[account(
    mut,
    address = get_associated_token_address(&owner.key(), &propeller.swim_usd_mint)
    )]
    pub user_swim_usd_ata: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,

    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,

    #[account(
    mut,
    associated_token::mint = propeller.swim_usd_mint,
    associated_token::authority = propeller,
    )]
    /// this is "to_fees"
    /// recipient of fees for executing complete transfer (e.g. relayer)
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
    pub fee_tracker: Box<Account<'info, FeeTracker>>,

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
    /// This is for transferring lamports for kickstart
    #[account(mut)]
    pub owner: SystemAccount<'info>,
}

impl<'info> PropellerProcessSwimPayloadFallback<'info> {
    pub fn accounts(ctx: &Context<PropellerProcessSwimPayloadFallback>) -> Result<()> {
        require_keys_eq!(ctx.accounts.owner.key(), ctx.accounts.swim_payload_message.owner);
        validate_marginal_prices_pool_accounts(
            &ctx.accounts.propeller,
            &ctx.accounts.marginal_price_pool.key(),
            &[
                ctx.accounts.marginal_price_pool_token_0_account.mint,
                ctx.accounts.marginal_price_pool_token_1_account.mint,
            ],
        )?;
        msg!("Passed PropellerProcessSwimPayloadFallback::accounts() check");
        Ok(())
    }

    fn transfer_gas_kickstart(&self) -> Result<()> {
        let propeller = &self.propeller;
        let owner_account = &self.owner.to_account_info();
        let payer = &self.payer.to_account_info();
        let owner_starting_lamports = owner_account.lamports();
        let payer_starting_lamports = payer.lamports();
        let system_program = &self.system_program;
        require_gte!(
            payer_starting_lamports,
            propeller.gas_kickstart_amount,
            PropellerError::PayerInsufficientFundsForGasKickstart
        );
        system_program::transfer(
            CpiContext::new(
                system_program.to_account_info(),
                system_program::Transfer { from: payer.clone(), to: owner_account.clone() },
            ),
            propeller.gas_kickstart_amount,
        )?;
        msg!("owner_starting_lamports: {}, owner_final_lamports: {}, payer_starting_lamports: {}, payer_final_lamports: {}",
            owner_starting_lamports, owner_account.lamports(), payer_starting_lamports, payer.lamports());
        Ok(())
    }

    fn transfer_swim_usd_tokens(
        &self,
        transfer_amount: u64,
        user_transfer_authority: &AccountInfo<'info>,
        signer_seeds: &[&[&[u8]]],
    ) -> Result<u64> {
        let cpi_accounts = Transfer {
            from: self.redeemer_escrow.to_account_info(),
            to: self.user_swim_usd_ata.to_account_info(),
            authority: user_transfer_authority.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(self.token_program.to_account_info(), cpi_accounts, signer_seeds),
            transfer_amount,
        )?;
        Ok(transfer_amount)
    }

    fn init_swim_claim(&mut self, swim_claim_bump: u8) -> Result<()> {
        let swim_claim = &mut self.swim_claim;
        swim_claim.bump = swim_claim_bump;
        swim_claim.claimed = true;
        Ok(())
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

impl<'info> Fees<'info> for PropellerProcessSwimPayloadFallback<'info> {
    fn calculate_fees_in_lamports(&self) -> Result<u64> {
        let rent = Rent::get()?;

        let propeller = &self.propeller;
        let swim_payload_message = &self.swim_payload_message;
        let propeller_process_swim_payload_fees = propeller.process_swim_payload_fee;

        let swim_claim_rent_exempt_fees = rent.minimum_balance(8 + SwimClaim::LEN);
        let gas_kickstart_amount = if swim_payload_message.gas_kickstart { propeller.gas_kickstart_amount } else { 0 };
        let fee_in_lamports = swim_claim_rent_exempt_fees
            .checked_add(propeller_process_swim_payload_fees)
            .and_then(|x| x.checked_add(gas_kickstart_amount))
            .ok_or(PropellerError::IntegerOverflow)?;

        msg!(
            "
        {}(swim_claim_rent_exempt_fees) +
        {}(propeller_process_swim_payload_fees) +
        {}(gas_kickstart_amount)
        = {}(fee_in_lamports)
        ",
            swim_claim_rent_exempt_fees,
            propeller_process_swim_payload_fees,
            gas_kickstart_amount,
            fee_in_lamports
        );
        Ok(fee_in_lamports)
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

        let max_staleness = self.propeller.max_staleness;
        let swim_usd_mint_key = self.propeller.swim_usd_mint;
        // let marginal_prices = get_marginal_prices(cpi_ctx)?;

        let intermediate_token_price_decimal: Decimal = get_marginal_price_decimal(
            &self.marginal_price_pool,
            &self.get_marginal_prices()?,
            &self.propeller,
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

pub fn handle_propeller_process_swim_payload_fallback(
    ctx: Context<PropellerProcessSwimPayloadFallback>,
) -> Result<u64> {
    let swim_payload_message = &ctx.accounts.swim_payload_message;
    let is_gas_kickstart = swim_payload_message.gas_kickstart;
    let target_token_id = swim_payload_message.target_token_id;

    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    require!(claim_data.claimed, PropellerError::ClaimNotClaimed);
    msg!("claim_data: {:?}", claim_data);

    let mut transfer_amount = swim_payload_message.transfer_amount;
    let propeller = &ctx.accounts.propeller;
    let propeller_redeemer_bump = ctx.accounts.propeller.redeemer_bump;
    let redeemer = &ctx.accounts.redeemer;
    let swim_payload_owner = swim_payload_message.owner;
    let token_program = &ctx.accounts.token_program;
    msg!("original transfer_amount: {:?}", transfer_amount);
    if swim_payload_owner != ctx.accounts.payer.key() {
        let fees_in_lamports = ctx.accounts.calculate_fees_in_lamports()?;
        let fees_in_swim_usd_atomic = ctx.accounts.convert_fees_to_swim_usd_atomic(fees_in_lamports)?;
        ctx.accounts.track_and_transfer_fees(fees_in_swim_usd_atomic)?;
        msg!("fees_in_swim_usd_atomic: {:?}", fees_in_swim_usd_atomic);
        if is_gas_kickstart {
            ctx.accounts.transfer_gas_kickstart()?;
        }
        transfer_amount =
            transfer_amount.checked_sub(fees_in_swim_usd_atomic).ok_or(error!(PropellerError::InsufficientFunds))?;
    } else {
        //TODO: a user should just call processSwimPayload instead to avoid passing in extra accounts. end result is same.
        msg!("swim_payload_owner == ctx.accounts.payer.key(). Owner bypass");
    }

    msg!("transfer_amount - fee = {}", transfer_amount);
    let output_amount = ctx.accounts.transfer_swim_usd_tokens(
        transfer_amount,
        &ctx.accounts.redeemer.to_account_info(),
        &[&[&b"redeemer".as_ref(), &[propeller_redeemer_bump]]],
    )?;

    let swim_claim_bump = *ctx.bumps.get("swim_claim").unwrap();
    ctx.accounts.init_swim_claim(swim_claim_bump)?;
    ctx.accounts.log_memo()?;

    msg!("output_amount: {}", output_amount);
    Ok(output_amount)
}

pub use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};
use {
    crate::FeeTracker,
    anchor_spl::token::Transfer,
    num_traits::{FromPrimitive, ToPrimitive},
    rust_decimal::Decimal,
};
use {
    crate::{
        create_token_id_map::{PoolInstruction, TokenIdMap},
        deserialize_message_payload,
        // env::*,
        error::*,
        get_message_data,
        get_transfer_with_payload_from_message_account,
        hash_vaa,
        state::{PropellerClaim, PropellerMessage, *},
        token_bridge::TokenBridge,
        ClaimData,
        PayloadTransferWithPayload,
        PostVAAData,
        PostedVAAData,
        Propeller,
        RawSwimPayload,
        TOKEN_COUNT,
    },
    anchor_lang::{prelude::*, solana_program::program::invoke},
    anchor_spl::{
        token,
        token::{Mint, Token, TokenAccount},
    },
    std::convert::TryInto,
    two_pool::state::TwoPool,
};

pub const SWIM_USD_TARGET_TOKEN_INDEX: u16 = 0;

#[derive(Accounts)]
pub struct ProcessSwimPayload<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.token_bridge_mint.as_ref()],
    bump = propeller.bump
    )]
    pub propeller: Box<Account<'info, Propeller>>,
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    seeds = [
    propeller_message.vaa_emitter_address.as_ref(),
    propeller_message.vaa_emitter_chain.to_be_bytes().as_ref(),
    propeller_message.vaa_sequence.to_be_bytes().as_ref(),
    ],
    bump,
    seeds::program = propeller.token_bridge().unwrap()
    )]
    /// CHECK: WH Claim account
    pub claim: UncheckedAccount<'info>,

    //TODO: do i really need to pass in the original message account?
    // seeds = [ b"PostedVAA".as_ref(), hash_vaa(vaa).as_ref() ],
    // #[account(
    //   seeds = [
    //     b"PostedVAA".as_ref(),
    //     hash_vaa(&vaa).as_ref()
    //   ],
    //   bump = propeller_message.wh_message_bump,
    //   seeds::program = propeller.wormhole()?
    // )]
    /// CHECK: MessageData with Payload
    pub message: UncheckedAccount<'info>,

    #[account(
    init,
    payer = payer,
    seeds = [ b"propeller".as_ref(),
    b"claim".as_ref(),
    claim.key().as_ref(),
    ],
    bump,
    space = 8 + PropellerClaim::LEN,
    )]
    pub propeller_claim: Account<'info, PropellerClaim>,

    #[account(
    seeds = [
    b"propeller".as_ref(),
    claim.key().as_ref(),
    message.key().as_ref(),
    ],
    bump = propeller_message.bump
    )]
    pub propeller_message: Account<'info, PropellerMessage>,

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
    token::mint = propeller.token_bridge_mint,
    token::authority = redeemer,
    )]
    pub redeemer_escrow: Account<'info, TokenAccount>,

    #[account(
    seeds = [
    b"propeller".as_ref(),
    b"token_id".as_ref(),
    propeller.key().as_ref(),
    &propeller_message.target_token_id.to_le_bytes()
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
    token::mint = lp_mint
    )]
    pub governance_fee: Box<Account<'info, TokenAccount>>,

    // needs to be a signer since its a "keypair" account
    pub user_transfer_authority: Signer<'info>,

    #[account(mut, token::mint = pool_token_account_0.mint)]
    pub user_token_account_0: Box<Account<'info, TokenAccount>>,

    #[account(mut, token::mint = pool_token_account_1.mint)]
    pub user_token_account_1: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
    pub system_program: Program<'info, System>,
}

impl<'info> ProcessSwimPayload<'info> {
    pub fn accounts(ctx: &Context<ProcessSwimPayload>) -> Result<()> {
        // verify claim
        // verify message
        require_keys_eq!(ctx.accounts.propeller_message.claim.key(), ctx.accounts.claim.key());
        require_keys_eq!(ctx.accounts.message.key(), ctx.accounts.propeller_message.wh_message);
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
        require_keys_eq!(self.propeller_message.claim.key(), self.claim.key());
        require_keys_eq!(self.message.key(), self.propeller_message.wh_message);
        require_keys_eq!(self.pool.key(), self.token_id_map.pool, PropellerError::InvalidTokenIdMapPool);
        Ok(())
    }
}

pub fn handle_process_swim_payload(ctx: Context<ProcessSwimPayload>, min_output_amount: u64) -> Result<u64> {
    let payload_transfer_with_payload =
        get_transfer_with_payload_from_message_account(&ctx.accounts.message.to_account_info())?;
    msg!("message_data_payload: {:?}", payload_transfer_with_payload);

    let PayloadTransferWithPayload {
        message_type,
        amount,
        token_address,
        token_chain,
        to,
        to_chain,
        from_address,
        payload,
    } = payload_transfer_with_payload;
    // // TODO: we should probably validate that `message_data_payload.from_address` is the expected
    // //  evm routing contract address unless there's a reason to allow someone else to use this method
    // // let swim_payload =
    // //     SwimPayload::deserialize(&mut payload.as_slice())?;
    // let swim_payload = payload;
    // msg!("swim_payload: {:?}", swim_payload);
    // let swim_payload = &ctx.accounts.propeller_message.swim_payload;
    let propeller_message = &ctx.accounts.propeller_message;
    let message_swim_payload = payload;
    require_eq!(message_swim_payload.target_token_id, propeller_message.target_token_id);
    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    require!(claim_data.claimed, PropellerError::ClaimNotClaimed);
    msg!("claim_data: {:?}", claim_data);

    let mut transfer_amount = ctx.accounts.propeller_message.transfer_amount;

    let owner = propeller_message.owner;
    msg!("transfer_amount - fee: {}", transfer_amount);

    let res = if propeller_message.target_token_id == SWIM_USD_TARGET_TOKEN_INDEX {
        // simply transfer out swimUSD to logical recipient
        // ignore min_output_amount?
        0u64
    } else {
        let token_id_mapping = &ctx.accounts.token_id_map;
        let token_pool = &token_id_mapping.pool;
        let pool_ix = &token_id_mapping.pool_ix;
        let pool_token_mint = &token_id_mapping.pool_token_mint;
        let pool_token_index = token_id_mapping.pool_token_index;

        //TODO: test if i can just use "redeemer" as the "user_transfer_authority" and
        // skip approve/revoke and just call the pool ix with CpiContext::new_with_signer()
        //
        // if removeExactBurn, then user_token_account's will be end_user's and user_lp_token_account will be
        // payer of txn
        // redeemer_escrow still holds all the tokens at this point and will be source of tokens used
        // in pool ix
        token::approve(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Approve {
                    // source
                    to: ctx.accounts.redeemer_escrow.to_account_info(),
                    delegate: ctx.accounts.user_transfer_authority.to_account_info(),
                    authority: ctx.accounts.redeemer.to_account_info(),
                },
                &[&[&b"redeemer".as_ref(), &[ctx.accounts.propeller.redeemer_bump]]],
            ),
            transfer_amount,
        )?;
        // verify destination token account owner is logical owner.
        require_keys_eq!(ctx.accounts.pool.token_mint_keys[pool_token_index as usize], *pool_token_mint);
        match pool_token_index {
            0 => {
                require_keys_eq!(ctx.accounts.user_token_account_0.owner, owner);
            }
            1 => {
                require_keys_eq!(ctx.accounts.user_token_account_1.owner, owner);
            }
            _ => return err!(PropellerError::InvalidPoolTokenIndex),
        }
        let cpi_res = match pool_ix {
            PoolInstruction::RemoveExactBurn => {
                // require_keys_eq!(
                //     ctx.accounts.user_lp_token_account.owner,
                //     ctx.accounts.payer.key(),
                // );

                // TODO: handle other checks
                let cpi_ctx = CpiContext::new(
                    ctx.accounts.two_pool_program.to_account_info(),
                    two_pool::cpi::accounts::RemoveExactBurn {
                        pool: ctx.accounts.pool.to_account_info(),
                        pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
                        pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
                        lp_mint: ctx.accounts.lp_mint.to_account_info(),
                        governance_fee: ctx.accounts.governance_fee.to_account_info(),
                        user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),
                        user_token_account_0: ctx.accounts.user_token_account_0.to_account_info(),
                        user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
                        user_lp_token_account: ctx.accounts.redeemer_escrow.to_account_info(),
                        token_program: ctx.accounts.token_program.to_account_info(),
                    },
                );
                //TODO: test if this works
                // let cpi_ctx = CpiContext::new_with_signer(
                //     ctx.accounts.two_pool_program.to_account_info(),
                //     two_pool::cpi::accounts::RemoveExactBurn {
                //         pool: ctx.accounts.pool.to_account_info(),
                //         pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
                //         pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
                //         lp_mint: ctx.accounts.lp_mint.to_account_info(),
                //         governance_fee: ctx.accounts.governance_fee.to_account_info(),
                //         user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),
                //         user_token_account_0: ctx.accounts.user_token_account_0.to_account_info(),
                //         user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
                //         user_lp_token_account: ctx.accounts.redeemer_escrow.to_account_info(),
                //         token_program: ctx.accounts.token_program.to_account_info(),
                //     },
                //     &[&[&b"redeemer".as_ref(), &[ctx.accounts.propeller.redeemer_bump]]],
                // );
                two_pool::cpi::remove_exact_burn(cpi_ctx, transfer_amount, pool_token_index, min_output_amount)?.get()
            }
            PoolInstruction::SwapExactInput => {
                let cpi_ctx = CpiContext::new(
                    ctx.accounts.two_pool_program.to_account_info(),
                    two_pool::cpi::accounts::SwapExactInput {
                        pool: ctx.accounts.pool.to_account_info(),
                        pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
                        pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
                        lp_mint: ctx.accounts.lp_mint.to_account_info(),
                        governance_fee: ctx.accounts.governance_fee.to_account_info(),
                        user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),
                        user_token_account_0: ctx.accounts.redeemer_escrow.to_account_info(),
                        user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
                        token_program: ctx.accounts.token_program.to_account_info(),
                    },
                );

                //TODO: test if this works.
                // let cpi_ctx = CpiContext::new_with_signer(
                //     ctx.accounts.two_pool_program.to_account_info(),
                //     two_pool::cpi::accounts::SwapExactInput {
                //         pool: ctx.accounts.pool.to_account_info(),
                //         pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
                //         pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
                //         lp_mint: ctx.accounts.lp_mint.to_account_info(),
                //         governance_fee: ctx.accounts.governance_fee.to_account_info(),
                //         user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),
                //         user_token_account_0: ctx.accounts.redeemer_escrow.to_account_info(),
                //         user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
                //         token_program: ctx.accounts.token_program.to_account_info(),
                //     },
                //     &[&[&b"redeemer".as_ref(), &[ctx.accounts.propeller.redeemer_bump]]],
                // );
                two_pool::cpi::swap_exact_input(cpi_ctx, [transfer_amount, 0u64], pool_token_index, min_output_amount)?
                    .get()
            }
        };
        token::revoke(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Revoke {
                // source
                source: ctx.accounts.redeemer_escrow.to_account_info(),
                authority: ctx.accounts.redeemer.to_account_info(),
            },
            &[&[&b"redeemer".as_ref(), &[ctx.accounts.propeller.redeemer_bump]]],
        ))?;
        cpi_res
    };

    let propeller_claim = &mut ctx.accounts.propeller_claim;
    propeller_claim.bump = *ctx.bumps.get("propeller_claim").unwrap();
    propeller_claim.claimed = true;
    let memo = propeller_message.memo;
    let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
    invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
    msg!("res: {:?}", res);
    Ok(res)
}

// //TODO: should i process this using the message account or the vaa data?
#[derive(Accounts)]
// #[instruction(vaa: PostVAAData, target_token_id: u16)]
pub struct PropellerProcessSwimPayload<'info> {
    pub process_swim_payload: ProcessSwimPayload<'info>,

    // #[account(mut)]
    // pub token_bridge_mint: Box<Account<'info, Mint>>,
    /// Assuming that USD:USDC 1:1
    ///CHECK: account for getting gas -> USD price
    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,

    #[account(
    mut,
    token::mint = process_swim_payload.propeller.token_bridge_mint,
    token::authority = process_swim_payload.propeller,
    )]
    /// this is "to_fees"
    /// recipient of fees for executing complete transfer (e.g. relayer)
    /// TODO: this should be fee_vault - not used/needed in non propeller ix
    pub fee_vault: Box<Account<'info, TokenAccount>>,
    #[account(
    seeds = [
    b"propeller".as_ref(),
    b"fee".as_ref(),
    process_swim_payload.propeller.token_bridge_mint.as_ref(),
    process_swim_payload.payer.key().as_ref()
    ],
    bump = fee_tracker.bump
    )]
    pub fee_tracker: Box<Account<'info, FeeTracker>>,

    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    marginal_price_pool_token_account_0.mint.as_ref(),
    marginal_price_pool_token_account_1.mint.as_ref(),
    marginal_price_pool_lp_mint.key().as_ref(),
    ],
    bump = marginal_price_pool.bump,
    seeds::program = process_swim_payload.two_pool_program.key()
    )]
    pub marginal_price_pool: Box<Account<'info, TwoPool>>,
    pub marginal_price_pool_token_account_0: Box<Account<'info, TokenAccount>>,
    pub marginal_price_pool_token_account_1: Box<Account<'info, TokenAccount>>,
    pub marginal_price_pool_lp_mint: Box<Account<'info, Mint>>,
}

impl<'info> PropellerProcessSwimPayload<'info> {
    pub fn accounts(ctx: &Context<PropellerProcessSwimPayload>) -> Result<()> {
        ctx.accounts.process_swim_payload.validate()?;
        validate_marginal_prices_pool_accounts(
            &ctx.accounts.process_swim_payload.propeller,
            &ctx.accounts.marginal_price_pool.key(),
            &[
                ctx.accounts.marginal_price_pool_token_account_0.mint,
                ctx.accounts.marginal_price_pool_token_account_1.mint,
            ],
        )?;
        Ok(())
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
    // vaa: AnchorSwimPayloadVAA,
    // vaa: PostVAAData,
    // target_token_id: u16,
) -> Result<()> {
    // let message_data = get_message_data(&ctx.accounts.message.to_account_info())?;
    // msg!("message_data: {:?}", message_data);
    // let payload_transfer_with_payload =
    //     PayloadTransferWithPayload::deserialize(&mut message_data.payload.as_slice())?;

    let payload_transfer_with_payload =
        get_transfer_with_payload_from_message_account(&ctx.accounts.process_swim_payload.message.to_account_info())?;
    msg!("message_data_payload: {:?}", payload_transfer_with_payload);

    let PayloadTransferWithPayload {
        message_type,
        amount,
        token_address,
        token_chain,
        to,
        to_chain,
        from_address,
        payload,
    } = payload_transfer_with_payload;
    // // TODO: we should probably validate that `message_data_payload.from_address` is the expected
    // //  evm routing contract address unless there's a reason to allow someone else to use this method
    // // let swim_payload =
    // //     SwimPayload::deserialize(&mut payload.as_slice())?;
    // let swim_payload = payload;
    // msg!("swim_payload: {:?}", swim_payload);
    // let swim_payload = &ctx.accounts.propeller_message.swim_payload;
    let message_swim_payload = payload;
    let propeller_message = &ctx.accounts.process_swim_payload.propeller_message;
    require!(propeller_message.gas_kickstart, PropellerError::InvalidSwimPayloadGasKickstart);
    require_eq!(message_swim_payload.target_token_id, propeller_message.target_token_id);
    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.process_swim_payload.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    require!(claim_data.claimed, PropellerError::ClaimNotClaimed);
    msg!("claim_data: {:?}", claim_data);

    // let payload_transfer_with_payload_from_vaa: PayloadTransferWithPayload =
    //     deserialize_message_payload(&mut vaa.payload.as_slice())?;
    // require_eq!(
    //     payload_transfer_with_payload_from_vaa
    //         .payload
    //         .target_token_id,
    //     swim_payload.target_token_id
    // );
    // require_eq!(swim_payload.target_token_id, target_token_id);

    let mut transfer_amount = propeller_message.transfer_amount;
    let propeller = &ctx.accounts.process_swim_payload.propeller;
    let swim_payload_owner = propeller_message.owner;
    let token_program = &ctx.accounts.process_swim_payload.token_program;
    let two_pool_program = &ctx.accounts.process_swim_payload.two_pool_program;

    if swim_payload_owner != ctx.accounts.process_swim_payload.payer.key() {
        let fees_in_token_bridge = calculate_fees(&ctx)?;
        let fee_tracker = &mut ctx.accounts.fee_tracker;
        fee_tracker.fees_owed =
            fee_tracker.fees_owed.checked_add(fees_in_token_bridge).ok_or(PropellerError::IntegerOverflow)?;
        let cpi_accounts = Transfer {
            from: ctx.accounts.process_swim_payload.redeemer_escrow.to_account_info(),
            to: ctx.accounts.fee_vault.to_account_info(),
            authority: propeller.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                cpi_accounts,
                &[&[&b"propeller".as_ref(), propeller.token_bridge_mint.as_ref(), &[propeller.bump]]],
            ),
            fees_in_token_bridge,
        )?;
        transfer_amount =
            transfer_amount.checked_sub(fees_in_token_bridge).ok_or(error!(PropellerError::InsufficientFunds))?;
    }

    msg!("transfer_amount - fee: {}", transfer_amount);

    //TODO: refactor
    if propeller_message.target_token_id == SWIM_USD_TARGET_TOKEN_INDEX {
        // simply transfer out swimUSD to logical recipient
    } else {
        let token_id_mapping = &ctx.accounts.process_swim_payload.token_id_map;
        let token_pool = &token_id_mapping.pool;
        let pool_ix = &token_id_mapping.pool_ix;
        let pool_token_mint = &token_id_mapping.pool_token_mint;
        let pool_token_index = token_id_mapping.pool_token_index;

        //TODO: need to handle decimals?
        // would need output token mint to handle decimals
        // let min_output_amount = swim_payload.min_output_amount.as_u64();
        // let min_output_amount = propeller_message.min_threshold;
        let min_output_amount = 0u64;

        // if removeExactBurn, then user_token_account's will be end_user's and user_lp_token_account will be
        // payer of txn
        // redeemer_escrow still holds all the tokens at this point and will be source of tokens used
        // in pool ix
        token::approve(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                token::Approve {
                    // source
                    to: ctx.accounts.process_swim_payload.redeemer_escrow.to_account_info(),
                    delegate: ctx.accounts.process_swim_payload.user_transfer_authority.to_account_info(),
                    authority: ctx.accounts.process_swim_payload.redeemer.to_account_info(),
                },
                &[&[&b"redeemer".as_ref(), &[propeller.redeemer_bump]]],
            ),
            transfer_amount,
        )?;
        // verify destination token account owner is logical owner.
        require_gt!(TOKEN_COUNT, pool_token_index as usize);
        require_keys_eq!(
            ctx.accounts.process_swim_payload.pool.token_mint_keys[pool_token_index as usize],
            *pool_token_mint
        );
        let user_token_accounts = [
            &ctx.accounts.process_swim_payload.user_token_account_0,
            &ctx.accounts.process_swim_payload.user_token_account_1,
        ];
        require_keys_eq!(user_token_accounts[pool_token_index as usize].owner, swim_payload_owner);

        match pool_ix {
            PoolInstruction::RemoveExactBurn => {
                // TODO: handle other checks
                let cpi_ctx = CpiContext::new(
                    two_pool_program.to_account_info(),
                    two_pool::cpi::accounts::RemoveExactBurn {
                        pool: ctx.accounts.process_swim_payload.pool.to_account_info(),
                        pool_token_account_0: ctx.accounts.process_swim_payload.pool_token_account_0.to_account_info(),
                        pool_token_account_1: ctx.accounts.process_swim_payload.pool_token_account_1.to_account_info(),
                        lp_mint: ctx.accounts.process_swim_payload.lp_mint.to_account_info(),
                        governance_fee: ctx.accounts.process_swim_payload.governance_fee.to_account_info(),
                        user_transfer_authority: ctx
                            .accounts
                            .process_swim_payload
                            .user_transfer_authority
                            .to_account_info(),
                        user_token_account_0: ctx.accounts.process_swim_payload.user_token_account_0.to_account_info(),
                        user_token_account_1: ctx.accounts.process_swim_payload.user_token_account_1.to_account_info(),
                        user_lp_token_account: ctx.accounts.process_swim_payload.redeemer_escrow.to_account_info(),
                        token_program: ctx.accounts.process_swim_payload.token_program.to_account_info(),
                    },
                );
                two_pool::cpi::remove_exact_burn(cpi_ctx, transfer_amount, pool_token_index, min_output_amount)?;
            }
            PoolInstruction::SwapExactInput => {
                // metapool
                let cpi_ctx = CpiContext::new(
                    two_pool_program.to_account_info(),
                    two_pool::cpi::accounts::SwapExactInput {
                        pool: ctx.accounts.process_swim_payload.pool.to_account_info(),
                        pool_token_account_0: ctx.accounts.process_swim_payload.pool_token_account_0.to_account_info(),
                        pool_token_account_1: ctx.accounts.process_swim_payload.pool_token_account_1.to_account_info(),
                        lp_mint: ctx.accounts.process_swim_payload.lp_mint.to_account_info(),
                        governance_fee: ctx.accounts.process_swim_payload.governance_fee.to_account_info(),
                        user_transfer_authority: ctx
                            .accounts
                            .process_swim_payload
                            .user_transfer_authority
                            .to_account_info(),
                        user_token_account_0: ctx.accounts.process_swim_payload.redeemer_escrow.to_account_info(),
                        user_token_account_1: ctx.accounts.process_swim_payload.user_token_account_1.to_account_info(),
                        token_program: ctx.accounts.process_swim_payload.token_program.to_account_info(),
                    },
                );
                two_pool::cpi::swap_exact_input(cpi_ctx, [transfer_amount, 0u64], pool_token_index, min_output_amount)?;
            }
        };
        token::revoke(CpiContext::new_with_signer(
            token_program.to_account_info(),
            token::Revoke {
                // source
                source: ctx.accounts.process_swim_payload.redeemer_escrow.to_account_info(),
                authority: ctx.accounts.process_swim_payload.redeemer.to_account_info(),
            },
            &[&[&b"redeemer".as_ref(), &[propeller.redeemer_bump]]],
        ))?;
    }

    let propeller_claim = &mut ctx.accounts.process_swim_payload.propeller_claim;
    propeller_claim.bump = *ctx.bumps.get("propeller_claim").unwrap();
    propeller_claim.claimed = true;
    let memo = propeller_message.memo;
    // get target_token_id -> (pool, pool_token_index)
    //    need to know when to do remove_exact_burn & when to do swap_exact_input
    let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
    invoke(&memo_ix, &[ctx.accounts.process_swim_payload.memo.to_account_info()])?;
    Ok(())
}

//TODO: FOR GAS KICKSTART ALSO NEED TO ASSUME/HANDLE THAT USER TOKEN ACCOUNTS MAY NOT BE INITIALIZED
fn calculate_fees(ctx: &Context<PropellerProcessSwimPayload>) -> Result<u64> {
    //TODO: this is in lamports/SOL. need in swimUSD.
    // ideal implementation
    //   do oracle price lookup and transfer right away
    //   for (secp + verify) & postVAA, need to implement a fee tracking mechanism since there's no way to
    //      credit the payer during that step.
    let rent = Rent::get()?;

    let propeller_claim_rent_exempt_fees = rent.minimum_balance(8 + PropellerClaim::LEN);
    let propeller = &ctx.accounts.process_swim_payload.propeller;
    let propeller_process_swim_payload_fees = propeller.process_swim_payload_fee;
    let gas_kickstart_amount = if ctx.accounts.process_swim_payload.propeller_message.gas_kickstart {
        propeller.gas_kickstart_amount
    } else {
        0
    };
    let fee_in_lamports = propeller_claim_rent_exempt_fees
        .checked_add(propeller_process_swim_payload_fees)
        .and_then(|x| x.checked_add(gas_kickstart_amount))
        .ok_or(PropellerError::IntegerOverflow)?;

    msg!(
        "
    {}(propeller_claim_rent_exempt_fees) +
    {}(propeller_process_swim_payload_fees) +
    {}(gas_kickstart_amount)
    = {}(fee_in_lamports)
    ",
        propeller_claim_rent_exempt_fees,
        propeller_process_swim_payload_fees,
        gas_kickstart_amount,
        fee_in_lamports
    );

    let cpi_ctx = CpiContext::new(
        ctx.accounts.process_swim_payload.two_pool_program.to_account_info(),
        two_pool::cpi::accounts::MarginalPrices {
            pool: ctx.accounts.marginal_price_pool.to_account_info(),
            pool_token_account_0: ctx.accounts.marginal_price_pool_token_account_0.to_account_info(),
            pool_token_account_1: ctx.accounts.marginal_price_pool_token_account_1.to_account_info(),
            lp_mint: ctx.accounts.marginal_price_pool_lp_mint.to_account_info(),
        },
    );
    let result = two_pool::cpi::marginal_prices(cpi_ctx)?;
    // let marginal_prices = result.get().marginal_prices;
    let marginal_prices = result.get();

    msg!("marginal_prices: {:?}", marginal_prices);
    //swimUSD is lp token of marginal price pool
    let mut res = 0u64;
    let feed = &ctx.accounts.aggregator.load()?;

    // get result
    // note - for tests this is currently hardcoded to 100
    // this val is SOL/USD price
    // 100 => 1 SOL/100 USD (usdc)
    // let v2 = feed.get_result()?.try_into()?;
    let val: Decimal = feed.get_result()?.try_into()?;
    let name = feed.name;
    msg!("val:{}, name: {:?}", val, name);
    // check whether the feed has been updated in the last 300 seconds
    feed.check_staleness(Clock::get().unwrap().unix_timestamp, 300).map_err(|_| error!(PropellerError::StaleFeed))?;
    // check feed does not exceed max_confidence_interval
    // if let Some(max_confidence_interval) = params.max_confidence_interval {
    // 	feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
    // 	.map_err(|_| error!(PropellerError::ConfidenceIntervalExceeded))?;
    // }
    // marginal_price = 0.75 USDC/swimUSD,
    // feed.val = 25.05 USDC/SOL
    // kickstart = 2 SOL
    // =>  50.1 USDC * 0.75 USDC/swimUSD = 37.575 swimUSD
    let lp_mint_key = ctx.accounts.marginal_price_pool_lp_mint.key();

    let marginal_price: Decimal = if lp_mint_key == propeller.token_bridge_mint.key() {
        marginal_prices[propeller.marginal_price_pool_token_index as usize]
            .try_into()
            .map_err(|_| error!(PropellerError::ConversionError))?
    } else {
        msg!("marginal_price_pool_lp_mint != mint");
        panic!("marginal_price_pool_lp_mint != mint not implemented yet");
        // return err!(PropellerError::Missing);
    };

    let fee_in_lamports_decimal = Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::ConversionError)?;
    let fee_in_token_bridge_mint_decimal = marginal_price
        .checked_mul(val)
        .and_then(|v| v.checked_mul(fee_in_lamports_decimal))
        .ok_or(PropellerError::IntegerOverflow)?;
    // .checked_mul(Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::IntegerOverflow)?)
    // .ok_or(PropellerError::IntegerOverflow)?;
    let fee_in_token_bridge_mint = fee_in_token_bridge_mint_decimal.to_u64().ok_or(PropellerError::ConversionError)?;
    msg!(
        "fee_in_token_bridge_mint_decimal: {:?} fee_in_token_bridge_mint: {:?}",
        fee_in_token_bridge_mint_decimal,
        fee_in_token_bridge_mint
    );
    res = fee_in_token_bridge_mint;
    Ok(res)
}

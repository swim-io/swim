pub use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};
use {
    crate::{
        create_token_id_map::{PoolInstruction, TokenIdMap},
        deserialize_message_payload,
        env::*,
        error::*,
        get_message_data, get_transfer_with_payload_from_message_account, hash_vaa, ClaimData,
        PayloadTransferWithPayload, PostVAAData, PostedVAAData, Propeller, PropellerMessage, RawSwimPayload,
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
    seeds = [ b"propeller".as_ref(), propeller.token_bridge_mint.as_ref(), ],
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
    // pub message: Account<'info, PostedVAAData>,
    #[account(
    seeds = [ b"redeemer".as_ref()],
    bump = propeller.redeemer_bump
    )]
    /// CHECK: this used to be "to_owner".
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
    // #[account(
    //   mut,
    //   token::authority = payer,
    //   token::mint = token_bridge_mint.key()
    // )]
    // #[account(
    // mut,
    // token::mint = propeller.token_bridge_mint,
    // token::authority = payer,
    // )]
    // /// this is "to_fees"
    // /// recipient of fees for executing complete transfer (e.g. relayer)
    // /// TODO: this should be fee_vault - not used/needed in non propeller ix
    // pub fee_recipient: Box<Account<'info, TokenAccount>>,
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
    /// TODO: the pool address should probably be saved in the propeller state
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
    #[account(mut, address = propeller.token_bridge_mint)]
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

    // #[account(mut, token::mint = lp_mint,)]
    // pub user_lp_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    //TODO: memo will be logged from the payload
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
        require_keys_eq!(ctx.accounts.message.key(), ctx.accounts.propeller_message.wh_message,);

        // verify using correct pool for pool_ix
        require_keys_eq!(ctx.accounts.pool.key(), ctx.accounts.token_id_map.pool);
        // require_eq!(target_token_id, ctx.accounts.propeller_message.target_token_id);

        Ok(())
    }
}

pub fn handle_process_swim_payload(ctx: Context<ProcessSwimPayload>) -> Result<u64> {
    // let message_data = get_message_data(&ctx.accounts.message.to_account_info())?;
    // msg!("message_data: {:?}", message_data);
    // let payload_transfer_with_payload =
    //     PayloadTransferWithPayload::deserialize(&mut message_data.payload.as_slice())?;

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

    // let payload_transfer_with_payload_from_vaa: PayloadTransferWithPayload =
    //     deserialize_message_payload(&mut vaa.payload.as_slice())?;
    // require_eq!(
    //     payload_transfer_with_payload_from_vaa
    //         .payload
    //         .target_token_id,
    //     swim_payload.target_token_id
    // );
    // require_eq!(swim_payload.target_token_id, target_token_id);

    let mut transfer_amount = ctx.accounts.propeller_message.transfer_amount;

    let owner = Pubkey::new_from_array(propeller_message.owner);
    msg!("transfer_amount - fee: {}", transfer_amount);
    // transfer from redeemer_escrow account to logical owner swimUSD token account?
    // no nvm i can't. if i transfer to logical owner swimUSD account i won't have authority
    // to transfer/burn from owner swimUSD account into pool token accounts for pool ixs
    let res = if propeller_message.target_token_id == SWIM_USD_TARGET_TOKEN_INDEX {
        // simply transfer out swimUSD to logical recipient
        0u64
    } else {
        let token_id_mapping = &ctx.accounts.token_id_map;
        let token_pool = &token_id_mapping.pool;
        let pool_ix = &token_id_mapping.pool_ix;
        let pool_token_mint = &token_id_mapping.pool_token_mint;
        let pool_token_index = token_id_mapping.pool_token_index;

        //TODO: need to handle decimals?
        // would need output token mint to handle decimals
        // let min_output_amount = swim_payload.min_output_amount.as_u64();
        // let min_output_amount = propeller_message_swim_payload.min_threshold;

        //TODO: this min_output_amount should come from ix input since this is user submitted.
        let min_output_amount = 0u64;

        //TODO: test if i can just use "redeemer" as the "user_transfer_authority" and
        // skip approve/revoke and just call the pool ix with CpiContext::new_with_signer()
        // let min_output_amount = 1;
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
    // get target_token_id -> (pool, pool_token_index)
    //    need to know when to do remove_exact_burn & when to do swap_exact_input
    let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
    invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
    msg!("res: {:?}", res);
    Ok(res)
}

// //TODO: should i process this using the message account or the vaa data?
// #[derive(Accounts)]
// // #[instruction(vaa: PostVAAData, target_token_id: u16)]
// pub struct ProcessGasKickstartSwimPayload<'info> {
//     #[account(
//     seeds = [ b"propeller".as_ref(), propeller.token_bridge_mint.as_ref(), ],
//     bump = propeller.bump
//     )]
//     pub propeller: Box<Account<'info, Propeller>>,
//     #[account(mut)]
//     pub payer: Signer<'info>,
//
//     #[account(
//     seeds = [
//     propeller_message.vaa_emitter_address.as_ref(),
//     propeller_message.vaa_emitter_chain.to_be_bytes().as_ref(),
//     propeller_message.vaa_sequence.to_be_bytes().as_ref(),
//     ],
//     bump,
//     seeds::program = propeller.token_bridge().unwrap()
//     )]
//     /// CHECK: WH Claim account
//     pub claim: UncheckedAccount<'info>,
//
//     // seeds = [ b"PostedVAA".as_ref(), hash_vaa(vaa).as_ref() ],
//     // #[account(
//     //   seeds = [
//     //     b"PostedVAA".as_ref(),
//     //     hash_vaa(&vaa).as_ref()
//     //   ],
//     //   bump = propeller_message.wh_message_bump,
//     //   seeds::program = propeller.wormhole()?
//     // )]
//     /// CHECK: MessageData with Payload
//     pub message: UncheckedAccount<'info>,
//     #[account(
//     init,
//     payer = payer,
//     seeds = [ b"propeller".as_ref(),
//     b"claim".as_ref(),
//     claim.key().as_ref(),
//     ],
//     bump,
//     space = 8 + PropellerClaim::LEN,
//     )]
//     pub propeller_claim: Account<'info, PropellerClaim>,
//
//     #[account(
//     seeds = [
//       b"propeller".as_ref(),
//       claim.key().as_ref(),
//       message.key().as_ref(),
//     ],
//     bump = propeller_message.bump
//     )]
//     pub propeller_message: Account<'info, PropellerMessage>,
//     // pub message: Account<'info, PostedVAAData>,
//     #[account(
//     seeds = [ b"redeemer".as_ref()],
//     bump = propeller.redeemer_bump
//     )]
//     /// CHECK: this used to be "to_owner".
//     /// redeemer will be PDA derived from ["redeemer"], seeds::program = propeller::id()
//     /// will have to be signed when it invokes complete_transfer_with_payload
//     /// if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to
//     ///     (NOT the `to` account)
//     pub redeemer: SystemAccount<'info>,
//     #[account(
//     mut,
//     token::mint = propeller.token_bridge_mint,
//     token::authority = redeemer,
//     )]
//     pub redeemer_escrow: Account<'info, TokenAccount>,
//     // #[account(
//     //   mut,
//     //   token::authority = payer,
//     //   token::mint = token_bridge_mint.key()
//     // )]
//     #[account(
//       mut,
//       token::mint = propeller.token_bridge_mint,
//       token::authority = payer,
//     )]
//     /// this is "to_fees"
//     /// recipient of fees for executing complete transfer (e.g. relayer)
//     /// TODO: this should be fee_vault - not used/needed in non propeller ix
//     pub fee_recipient: Box<Account<'info, TokenAccount>>,
//
//     // #[account(mut)]
//     // pub token_bridge_mint: Box<Account<'info, Mint>>,
//     /// Assuming that USD:USDC 1:1
//     ///CHECK: account for getting gas -> USD price
//     #[account(
//     constraint =
//     *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount
//     )]
//     pub aggregator: AccountLoader<'info, AggregatorAccountData>,
//     #[account(
//     seeds = [
//     b"propeller".as_ref(),
//     b"token_id".as_ref(),
//     propeller.key().as_ref(),
//     propeller_message.target_token_id.to_le_bytes().as_ref()
//     ],
//     bump = token_id_map.bump,
//     )]
//     pub token_id_map: Account<'info, TokenIdMap>,
//     /// TODO: the pool address should probably be saved in the propeller state
//     #[account(
//     mut,
//     seeds = [
//     b"two_pool".as_ref(),
//     pool_token_account_0.mint.as_ref(),
//     pool_token_account_1.mint.as_ref(),
//     lp_mint.key().as_ref(),
//     ],
//     bump = pool.bump,
//     seeds::program = two_pool_program.key()
//     )]
//     pub pool: Box<Account<'info, TwoPool>>,
//     #[account(
//     mut,
//     token::mint = pool.token_mint_keys[0],
//     token::authority = pool,
//     )]
//     pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
//     #[account(
//     mut,
//     token::mint = pool.token_mint_keys[1],
//     token::authority = pool,
//     )]
//     pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
//     #[account(mut)]
//     pub lp_mint: Box<Account<'info, Mint>>,
//     #[account(
//       mut,
//       token::mint = lp_mint
//     )]
//     pub governance_fee: Box<Account<'info, TokenAccount>>,
//
//     // needs to be a signer since its a "keypair" account
//     pub user_transfer_authority: Signer<'info>,
//
//     #[account(mut, token::mint = pool_token_account_0.mint,)]
//     pub user_token_account_0: Box<Account<'info, TokenAccount>>,
//
//     #[account(mut, token::mint = pool_token_account_1.mint,)]
//     pub user_token_account_1: Box<Account<'info, TokenAccount>>,
//
//     pub token_program: Program<'info, Token>,
//     //TODO: memo will be logged from the payload
//     #[account(executable, address = spl_memo::id())]
//     ///CHECK: memo program
//     pub memo: UncheckedAccount<'info>,
//     #[account(
//     mut,
//     seeds = [
//     b"two_pool".as_ref(),
//     marginal_price_pool_token_account_0.mint.as_ref(),
//     marginal_price_pool_token_account_1.mint.as_ref(),
//     marginal_price_pool.lp_mint_key.as_ref(),
//     ],
//     bump = marginal_price_pool.bump,
//     seeds::program = two_pool_program.key()
//     )]
//     pub marginal_price_pool: Box<Account<'info, TwoPool>>,
//     pub marginal_price_pool_token_account_0: Box<Account<'info, TokenAccount>>,
//     pub marginal_price_pool_token_account_1: Box<Account<'info, TokenAccount>>,
//     pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
//     pub system_program: Program<'info, System>,
// }
//
// impl<'info> ProcessGasKickstartSwimPayload<'info> {
//     pub fn accounts(ctx: &Context<ProcessGasKickstartSwimPayload>) -> Result<()> {
//         // verify claim
//         // verify message
//         require_keys_eq!(ctx.accounts.propeller_message.claim.key(), ctx.accounts.claim.key());
//         require_keys_eq!(ctx.accounts.message.key(), ctx.accounts.propeller_message.wh_message,);
//
//         // verify using correct pool for pool_ix
//         require_keys_eq!(ctx.accounts.pool.key(), ctx.accounts.token_id_map.pool);
//
//         Ok(())
//     }
// }
//
// // pub fn handle_complete_to_user<'a, 'b, 'c, 'info>(
// //     ctx: Context<'a, 'b, 'c, 'info, CompleteToUser<'info>>,
// // ) -> Result<()>
// // where
// //     'b: 'info,
// // {
// //     //
// //     // 1. check how much the fees should be
// //     //      a. swimUSD -> SOL exchange rate
// //     //          - swimUSD -> stablecoin (usdt or usdc)
// //     //              - using pool.get_marginal_prices_ix()
// //     //                  - only need to pass flagship pool state account,
// //     //                      pool token accounts & pool program account (4 total)
// //     //          - stablecoin -> SOL
// //     //              - using pyth/oracle
// //     //      b. fees = swimUSD * exchange rate
// //     // 2. swap remainder based on swim payload parameters
// //     //      a. either swap/removeLiquidity - only one output token regardless even if removeLiquidity
// //     // 2. transfer fee to fee_recipient
// //     let marginal_prices = get_marginal_prices(&ctx)?;
// //     let usdc_flagship_token_index: usize = 1;
// //     let usdc_marginal_price = marginal_prices[usdc_flagship_token_index];
// //     let aggregator = &ctx.accounts.aggregator;
// //
// //     // check feed owner
// //     let owner = *aggregator.owner;
// //     if owner != SWITCHBOARD_V2_DEVNET && owner != SWITCHBOARD_V2_MAINNET {
// //         return Err(error!(PropellerError::InvalidSwitchboardAccount));
// //     }
// //
// //     // load and deserialize feed
// //     let feed = AggregatorAccountData::new(aggregator)?;
// //
// //     // get result
// //     // note - for tests this is currently hardcoded to 100
// //     let val: u64 = feed.get_result()?.try_into()?;
// //     let name = feed.name;
// //     msg!("val:{}, name: {:?}", val, name);
// //     // check whether the feed has been updated in the last 300 seconds
// //     feed.check_staleness(Clock::get().unwrap().unix_timestamp, 300)
// //         .map_err(|_| error!(PropellerError::StaleFeed))?;
// //
// //     // check feed does not exceed max_confidence_interval
// //     // if let Some(max_confidence_interval) = params.max_confidence_interval {
// //     // 	feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
// //     // 	.map_err(|_| error!(PropellerError::ConfidenceIntervalExceeded))?;
// //     // }
// //
// //     Ok(())
// // }
//
// /**
//   will only support remove_exact_burn in v0 since no slippage settings
//   for metapool, will only support swap_exact_input since no slippage settings
//
//   after completeNativeWithPayload, `to` tokenAccount that's owned by redeemer will contain
//   the wormholed tokens.
//
//   now we need to do the following:
//   1. calculate the fees and transfer to `fee_recipient`
//     a. transfer or just mark a fee state?
//   2. swap the rest of the token from the `to` account into the desired result token and the owner's
//   token account
//
//   TODO:
//   1. handle same as CompleteNativeWithPayload
//     a. initialize a SwimClaim PDA
//
// */
// pub fn handle_process_gas_kickstart_swim_payload(
//     ctx: Context<ProcessGasKickstartSwimPayload>,
//     // vaa: AnchorSwimPayloadVAA,
//     // vaa: PostVAAData,
//     // target_token_id: u16,
// ) -> Result<()> {
//     // let message_data = get_message_data(&ctx.accounts.message.to_account_info())?;
//     // msg!("message_data: {:?}", message_data);
//     // let payload_transfer_with_payload =
//     //     PayloadTransferWithPayload::deserialize(&mut message_data.payload.as_slice())?;
//
//     let payload_transfer_with_payload =
//         get_transfer_with_payload_from_message_account(&ctx.accounts.message.to_account_info())?;
//     msg!("message_data_payload: {:?}", payload_transfer_with_payload);
//
//     let PayloadTransferWithPayload {
//         message_type,
//         amount,
//         token_address,
//         token_chain,
//         to,
//         to_chain,
//         from_address,
//         payload,
//     } = payload_transfer_with_payload;
//     // // TODO: we should probably validate that `message_data_payload.from_address` is the expected
//     // //  evm routing contract address unless there's a reason to allow someone else to use this method
//     // // let swim_payload =
//     // //     SwimPayload::deserialize(&mut payload.as_slice())?;
//     // let swim_payload = payload;
//     // msg!("swim_payload: {:?}", swim_payload);
//     // let swim_payload = &ctx.accounts.propeller_message.swim_payload;
//     let message_swim_payload = payload;
//     let propeller_message_swim_payload = &ctx.accounts.propeller_message.swim_payload;
//     require!(propeller_message_swim_payload.gas_kickstart, PropellerError::InvalidSwimPayloadGasKickstart);
//     require_eq!(message_swim_payload.target_token_id, propeller_message_swim_payload.target_token_id);
//     let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.claim.data.borrow())
//         .map_err(|_| error!(PropellerError::InvalidClaimData))?;
//     require!(claim_data.claimed, PropellerError::ClaimNotClaimed);
//     msg!("claim_data: {:?}", claim_data);
//
//     // let payload_transfer_with_payload_from_vaa: PayloadTransferWithPayload =
//     //     deserialize_message_payload(&mut vaa.payload.as_slice())?;
//     // require_eq!(
//     //     payload_transfer_with_payload_from_vaa
//     //         .payload
//     //         .target_token_id,
//     //     swim_payload.target_token_id
//     // );
//     // require_eq!(swim_payload.target_token_id, target_token_id);
//
//     let mut transfer_amount = ctx.accounts.propeller_message.transfer_amount;
//     if !propeller_message_swim_payload.gas_kickstart {
//         // transfer fees
//         transfer_amount = transfer_amount - ctx.accounts.propeller.propeller_fee;
//         token::transfer(
//             CpiContext::new_with_signer(
//                 ctx.accounts.token_program.to_account_info(),
//                 token::Transfer {
//                     from: ctx.accounts.redeemer_escrow.to_account_info(),
//                     to: ctx.accounts.fee_recipient.to_account_info(),
//                     authority: ctx.accounts.redeemer.to_account_info(),
//                 },
//                 &[&[&b"redeemer".as_ref(), &[ctx.accounts.propeller.redeemer_bump]]],
//             ),
//             ctx.accounts.propeller.propeller_fee,
//         )?;
//     } else {
//         //TODO: FOR GAS KICKSTART ALSO NEED TO ASSUME/HANDLE THAT ASSOCIATED TOKEN ACCOUNTS MAY NOT BE INITIALIZED
//         // transfer fees + gas_kickstart
//         msg!("calculate gas_kickstart amounts");
//         // transfer tokens
//         // 1. check how much the fees should be
//         //      a. swimUSD -> SOL exchange rate
//         //          - swimUSD -> stablecoin (usdt or usdc)
//         //              - using pool.get_marginal_prices_ix()
//         //                  - only need to pass flagship pool state account,
//         //                      pool token accounts & pool program account (4 total)
//         //          - stablecoin -> SOL
//         //              - using pyth/oracle
//         //      b. fees = swimUSD * exchange rate
//         // 2. swap remainder based on swim payload parameters
//         //      a. either swap/removeLiquidity - only one output token regardless even if removeLiquidity
//         // 2. transfer fee to fee_recipient
//         let marginal_prices = get_marginal_prices(&ctx)?;
//
//         // TODO: this should probally be in the propeller
//         let usdc_flagship_token_index: usize = 0;
//         // 0.99 => 1 swimUSD/0.99 USDC
//         let usdc_marginal_price = marginal_prices[usdc_flagship_token_index];
//         // let aggregator = &ctx.accounts.aggregator;
//         //
//         // // check feed owner
//         // let owner = *aggregator.owner;
//         // if owner != SWITCHBOARD_V2_DEVNET && owner != SWITCHBOARD_V2_MAINNET {
//         //     return Err(error!(PropellerError::InvalidSwitchboardAccount));
//         // }
//         //
//         // // load and deserialize feed
//         // let feed = AggregatorAccountData::new(aggregator)?;
//
//         let feed = &ctx.accounts.aggregator.load()?;
//
//         // get result
//         // note - for tests this is currently hardcoded to 100
//         // this val is SOL/USD price
//         // 100 => 1 SOL/100 USD
//         let val: u64 = feed.get_result()?.try_into()?;
//         let name = feed.name;
//         msg!("val:{}, name: {:?}", val, name);
//         // check whether the feed has been updated in the last 300 seconds
//         feed.check_staleness(Clock::get().unwrap().unix_timestamp, 300)
//             .map_err(|_| error!(PropellerError::StaleFeed))?;
//         // propeller_fee = 0.5 swimUSD (approx cost of txn in swimUSD)
//         // 0.99 USDC/1swimUSD * 1 SOL/100USD * 0.5 swimUSD =
//         // let gas_fee=  usdc_marginal_price *
//
//         // check feed does not exceed max_confidence_interval
//         // if let Some(max_confidence_interval) = params.max_confidence_interval {
//         // 	feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
//         // 	.map_err(|_| error!(PropellerError::ConfidenceIntervalExceeded))?;
//         // }
//     }
//
//     let owner = Pubkey::new_from_array(propeller_message_swim_payload.owner);
//     msg!("transfer_amount - fee: {}", transfer_amount);
//     // transfer from redeemer_escrow account to logical owner swimUSD token account?
//     // no nvm i can't. if i transfer to logical owner swimUSD account i won't have authority
//     // to transfer/burn from owner swimUSD account into pool token accounts for pool ixs
//     if propeller_message_swim_payload.target_token_id == SWIM_USD_TARGET_TOKEN_INDEX {
//         // simply transfer out swimUSD to logical recipient
//     } else {
//         let token_id_mapping = &ctx.accounts.token_id_map;
//         let token_pool = &token_id_mapping.pool;
//         let pool_ix = &token_id_mapping.pool_ix;
//         let pool_token_mint = &token_id_mapping.pool_token_mint;
//         let pool_token_index = token_id_mapping.pool_token_index;
//
//         //TODO: need to handle decimals?
//         // would need output token mint to handle decimals
//         // let min_output_amount = swim_payload.min_output_amount.as_u64();
//         let min_output_amount = propeller_message_swim_payload.min_threshold;
//
//         // if removeExactBurn, then user_token_account's will be end_user's and user_lp_token_account will be
//         // payer of txn
//         // redeemer_escrow still holds all the tokens at this point and will be source of tokens used
//         // in pool ix
//         token::approve(
//             CpiContext::new_with_signer(
//                 ctx.accounts.token_program.to_account_info(),
//                 token::Approve {
//                     // source
//                     to: ctx.accounts.redeemer_escrow.to_account_info(),
//                     delegate: ctx.accounts.user_transfer_authority.to_account_info(),
//                     authority: ctx.accounts.redeemer.to_account_info(),
//                 },
//                 &[&[&b"redeemer".as_ref(), &[ctx.accounts.propeller.redeemer_bump]]],
//             ),
//             transfer_amount,
//         )?;
//         // verify destination token account owner is logical owner.
//         require_keys_eq!(ctx.accounts.pool.token_mint_keys[pool_token_index as usize], *pool_token_mint);
//         match pool_token_index {
//             0 => {
//                 require_keys_eq!(ctx.accounts.user_token_account_0.owner, owner);
//             }
//             1 => {
//                 require_keys_eq!(ctx.accounts.user_token_account_1.owner, owner);
//             }
//             _ => return err!(PropellerError::InvalidPoolTokenIndex),
//         }
//         match pool_ix {
//             PoolInstruction::RemoveExactBurn => {
//                 // require_keys_eq!(
//                 //     ctx.accounts.user_lp_token_account.owner,
//                 //     ctx.accounts.payer.key(),
//                 // );
//
//                 // TODO: handle other checks
//                 let cpi_ctx = CpiContext::new(
//                     ctx.accounts.two_pool_program.to_account_info(),
//                     two_pool::cpi::accounts::RemoveExactBurn {
//                         pool: ctx.accounts.pool.to_account_info(),
//                         pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
//                         pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
//                         lp_mint: ctx.accounts.lp_mint.to_account_info(),
//                         governance_fee: ctx.accounts.governance_fee.to_account_info(),
//                         user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),
//                         user_token_account_0: ctx.accounts.user_token_account_0.to_account_info(),
//                         user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
//                         user_lp_token_account: ctx.accounts.redeemer_escrow.to_account_info(),
//                         token_program: ctx.accounts.token_program.to_account_info(),
//                     },
//                 );
//                 two_pool::cpi::remove_exact_burn(cpi_ctx, transfer_amount, pool_token_index, min_output_amount)?;
//             }
//             PoolInstruction::SwapExactInput => {
//                 // metapool
//                 // token::approve(
//                 //     CpiContext::new(
//                 //         ctx.accounts.token_program.to_account_info(),
//                 //         token::Approve {
//                 //             // source
//                 //             to: ctx.accounts.user_token_account_0.to_account_info(),
//                 //             delegate: ctx.accounts.user_transfer_authority.to_account_info(),
//                 //             authority: ctx.accounts.payer.to_account_info(),
//                 //         },
//                 //     ),
//                 //     transfer_amount,
//                 // )?;
//                 let cpi_ctx = CpiContext::new(
//                     ctx.accounts.two_pool_program.to_account_info(),
//                     two_pool::cpi::accounts::SwapExactInput {
//                         pool: ctx.accounts.pool.to_account_info(),
//                         pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
//                         pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
//                         lp_mint: ctx.accounts.lp_mint.to_account_info(),
//                         governance_fee: ctx.accounts.governance_fee.to_account_info(),
//                         user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),
//                         user_token_account_0: ctx.accounts.redeemer_escrow.to_account_info(),
//                         user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
//                         token_program: ctx.accounts.token_program.to_account_info(),
//                     },
//                 );
//                 two_pool::cpi::swap_exact_input(cpi_ctx, [transfer_amount, 0u64], pool_token_index, min_output_amount)?;
//                 // token::revoke(CpiContext::new(
//                 //     ctx.accounts.token_program.to_account_info(),
//                 //     token::Revoke {
//                 //         // source
//                 //         source: ctx.accounts.user_token_account_0.to_account_info(),
//                 //         authority: ctx.accounts.payer.to_account_info(),
//                 //     },
//                 // ))?;
//             }
//         };
//         token::revoke(CpiContext::new_with_signer(
//             ctx.accounts.token_program.to_account_info(),
//             token::Revoke {
//                 // source
//                 source: ctx.accounts.redeemer_escrow.to_account_info(),
//                 authority: ctx.accounts.redeemer.to_account_info(),
//             },
//             &[&[&b"redeemer".as_ref(), &[ctx.accounts.propeller.redeemer_bump]]],
//         ))?;
//     }
//
//     let propeller_claim = &mut ctx.accounts.propeller_claim;
//     propeller_claim.bump = *ctx.bumps.get("propeller_claim").unwrap();
//     propeller_claim.claimed = true;
//     let memo = propeller_message_swim_payload.memo;
//     // get target_token_id -> (pool, pool_token_index)
//     //    need to know when to do remove_exact_burn & when to do swap_exact_input
//     let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
//     invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
//     Ok(())
// }

/// Works similarly to WH claim account
/// prevents "double spend" of `SwimPayload`
/// can be used to check if `ProcessSwimPayload` has been completed
#[account]
pub struct PropellerClaim {
    pub bump: u8,
    pub claimed: bool,
}

impl PropellerClaim {
    pub const LEN: usize = 1 + 1;
}

/// This is "raw" VAA directly from guardian network
/// probably not needed.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AnchorSwimPayloadVAA {
    // Header part
    pub version: u8,
    pub guardian_set_index: u32,
    pub signatures: Vec<AnchorVAASignature>,
    // Body part
    pub timestamp: u32,
    pub nonce: u32,
    pub emitter_chain: u16,
    // pub emitter_address: ForeignAddress,
    pub emitter_address: [u8; 32],
    pub sequence: u64,
    pub consistency_level: u8,
    pub payload: Vec<u8>,
    // pub payload: PayloadTransferWithPayload,
}

#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone)]
pub struct AnchorVAASignature {
    pub signature: Vec<u8>,
    pub guardian_index: u8,
}

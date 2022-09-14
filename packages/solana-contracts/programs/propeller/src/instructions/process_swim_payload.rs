pub use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};
use {
    crate::{
        constants::LAMPORTS_PER_SOL_DECIMAL, get_marginal_price_decimal, get_token_bridge_mint_decimals, FeeTracker,
    },
    anchor_lang::system_program,
    anchor_spl::{associated_token::AssociatedToken, token::Transfer},
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

pub const TOKEN_BRIDGE_OUTPUT_TOKEN_INDEX: u16 = 0;

#[derive(Accounts)]
#[instruction(target_token_id: u16)]
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
    token::mint = lp_mint
    )]
    pub governance_fee: Box<Account<'info, TokenAccount>>,

    // needs to be a signer since its a "keypair" account
    pub user_transfer_authority: Signer<'info>,

    #[account(mut, token::mint = pool_token_account_0.mint)]
    pub user_token_account_0: Box<Account<'info, TokenAccount>>,

    #[account(mut, token::mint = pool_token_account_1.mint)]
    pub user_token_account_1: Box<Account<'info, TokenAccount>>,

    #[account(mut, token::mint = pool.lp_mint_key)]
    pub user_lp_token_account: Box<Account<'info, TokenAccount>>,

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
        // self.transfer_with_user_auth(
        //     transfer_amount,
        //     min_output_amount,
        //     output_token_index,
        //     pool_ix,
        //     pool_token_index,
        //     pool_token_mint,
        //     &self.user_transfer_authority.to_account_info(),
        // )
    }

    fn transfer_with_user_auth(
        &self,
        transfer_amount: u64,
        min_output_amount: u64,
        output_token_index: u16,
        pool_ix: &PoolInstruction,
        pool_token_index: u8,
        pool_token_mint: &Pubkey,
        user_transfer_authority: &AccountInfo<'info>,
    ) -> Result<u64> {
        token::approve(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                token::Approve {
                    // source
                    to: self.redeemer_escrow.to_account_info(),
                    delegate: self.user_transfer_authority.to_account_info(),
                    authority: self.redeemer.to_account_info(),
                },
                &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
            ),
            transfer_amount,
        )?;
        require_gt!(TOKEN_COUNT, pool_token_index as usize);
        // let user_transfer_authority = &self.user_transfer_authority.to_account_info();
        let output_amount_res = self.execute_transfer_or_pool_ix(
            transfer_amount,
            min_output_amount,
            output_token_index,
            pool_ix,
            pool_token_index,
            pool_token_mint,
            user_transfer_authority,
            &[],
        );
        token::revoke(CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            token::Revoke {
                // source
                source: self.redeemer_escrow.to_account_info(),
                authority: self.redeemer.to_account_info(),
            },
            &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
        ))?;
        output_amount_res
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
        let swim_payload_owner = self.propeller_message.owner;
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
                require_eq!(
                    output_token_index,
                    TOKEN_BRIDGE_OUTPUT_TOKEN_INDEX,
                    PropellerError::InvalidOutputTokenIndex
                );
                self.transfer_token_bridge_mint_tokens(transfer_amount, user_transfer_authority, signer_seeds)
            }
        }
    }

    fn transfer_token_bridge_mint_tokens(
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

    // fn execute_transfer_or_pool_ix_with_user_auth(&self) -> Result<u64> {
    //     let token_id_mapping = &self.token_id_map;
    //     let token_pool = &token_id_mapping.pool;
    //     let pool_ix = &token_id_mapping.pool_ix;
    //     // if let PoolInstruction::Transfer = pool_ix {
    //     //     require_eq!(output_token_index, TOKEN_BRIDGE_OUTPUT_TOKEN_INDEX, PropellerError::InvalidOutputTokenIndex);
    //     //     return self.transfer_token_bridge_mint_tokens(transfer_amount);
    //     // }
    //     let token_program = &self.token_program;
    //     let pool_token_mint = &token_id_mapping.pool_token_mint;
    //     let pool_token_index = token_id_mapping.pool_token_index;
    //     let swim_payload_owner = self.propeller_message.owner;
    //     token::approve(
    //         CpiContext::new_with_signer(
    //             token_program.to_account_info(),
    //             token::Approve {
    //                 // source
    //                 to: self.redeemer_escrow.to_account_info(),
    //                 delegate: self.user_transfer_authority.to_account_info(),
    //                 authority: self.redeemer.to_account_info(),
    //             },
    //             &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
    //         ),
    //         transfer_amount,
    //     )?;
    //     require_gt!(TOKEN_COUNT, pool_token_index as usize);
    //
    //     let user_token_accounts = [&self.user_token_account_0, &self.user_token_account_1];
    //     require_keys_eq!(user_token_accounts[pool_token_index as usize].owner, swim_payload_owner);
    //
    //     let redeemer_bump = self.propeller.redeemer_bump;
    //     let output_amount_res = match pool_ix {
    //         PoolInstruction::RemoveExactBurn => {
    //             msg!("Executing RemoveExactBurn");
    //             require_keys_eq!(self.pool.token_mint_keys[pool_token_index as usize], *pool_token_mint);
    //             // require_keys_eq!(
    //             //     self.user_lp_token_account.owner,
    //             //     self.payer.key(),
    //             // );
    //
    //             // TODO: handle other checks
    //             Ok(two_pool::cpi::remove_exact_burn(
    //                 CpiContext::new(
    //                     self.two_pool_program.to_account_info(),
    //                     two_pool::cpi::accounts::RemoveExactBurn {
    //                         pool: self.pool.to_account_info(),
    //                         pool_token_account_0: self.pool_token_account_0.to_account_info(),
    //                         pool_token_account_1: self.pool_token_account_1.to_account_info(),
    //                         lp_mint: self.lp_mint.to_account_info(),
    //                         governance_fee: self.governance_fee.to_account_info(),
    //                         user_transfer_authority: self.user_transfer_authority.to_account_info(),
    //                         user_token_account_0: self.user_token_account_0.to_account_info(),
    //                         user_token_account_1: self.user_token_account_1.to_account_info(),
    //                         user_lp_token_account: self.redeemer_escrow.to_account_info(),
    //                         token_program: self.token_program.to_account_info(),
    //                     },
    //                 ),
    //                 transfer_amount,
    //                 pool_token_index,
    //                 min_output_amount,
    //             )?
    //             .get())
    //         }
    //         PoolInstruction::SwapExactInput => {
    //             msg!("Executing SwapExactInput");
    //             require_keys_eq!(self.pool.token_mint_keys[pool_token_index as usize], *pool_token_mint);
    //
    //             Ok(two_pool::cpi::swap_exact_input(
    //                 CpiContext::new(
    //                     self.two_pool_program.to_account_info(),
    //                     two_pool::cpi::accounts::SwapExactInput {
    //                         pool: self.pool.to_account_info(),
    //                         pool_token_account_0: self.pool_token_account_0.to_account_info(),
    //                         pool_token_account_1: self.pool_token_account_1.to_account_info(),
    //                         lp_mint: self.lp_mint.to_account_info(),
    //                         governance_fee: self.governance_fee.to_account_info(),
    //                         user_transfer_authority: self.user_transfer_authority.to_account_info(),
    //                         user_token_account_0: self.redeemer_escrow.to_account_info(),
    //                         user_token_account_1: self.user_token_account_1.to_account_info(),
    //                         token_program: self.token_program.to_account_info(),
    //                     },
    //                 ),
    //                 [transfer_amount, 0u64],
    //                 pool_token_index,
    //                 min_output_amount,
    //             )?
    //             .get())
    //         }
    //         PoolInstruction::Transfer => {
    //             require_eq!(
    //                 output_token_index,
    //                 TOKEN_BRIDGE_OUTPUT_TOKEN_INDEX,
    //                 PropellerError::InvalidOutputTokenIndex
    //             );
    //             return self.transfer_token_bridge_mint_tokens(transfer_amount);
    //         }
    //     };
    //     token::revoke(CpiContext::new_with_signer(
    //         token_program.to_account_info(),
    //         token::Revoke {
    //             // source
    //             source: self.redeemer_escrow.to_account_info(),
    //             authority: self.redeemer.to_account_info(),
    //         },
    //         &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
    //     ))?;
    //     output_amount_res
    // }

    // fn execute_pool_ix_and_transfer(&self, transfer_amount: u64, min_output_amount: u64) -> Result<u64> {
    //     msg!("execute_pool_ix_and_transfer");
    //
    //     let token_program = &self.token_program;
    //     let token_id_mapping = &self.token_id_map;
    //     let token_pool = &token_id_mapping.pool;
    //     let pool_ix = &token_id_mapping.pool_ix;
    //     let pool_token_mint = &token_id_mapping.pool_token_mint;
    //     let pool_token_index = token_id_mapping.pool_token_index;
    //     let swim_payload_owner = self.propeller_message.owner;
    //     if let PoolInstruction::Transfer = pool_ix {
    //         Ok(self.transfer_token_bridge_mint_tokens(transfer_amount))
    //     }
    //
    //     //TODO: test if i can just use "redeemer" as the "user_transfer_authority" and
    //     // skip approve/revoke and just call the pool ix with CpiContext::new_with_signer()
    //     //
    //     // if removeExactBurn, then user_token_account's will be end_user's and user_lp_token_account will be
    //     // payer of txn
    //     // redeemer_escrow still holds all the tokens at this point and will be source of tokens used
    //     // in pool ix
    //     token::approve(
    //         CpiContext::new_with_signer(
    //             token_program.to_account_info(),
    //             token::Approve {
    //                 // source
    //                 to: self.redeemer_escrow.to_account_info(),
    //                 delegate: self.user_transfer_authority.to_account_info(),
    //                 authority: self.redeemer.to_account_info(),
    //             },
    //             &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
    //         ),
    //         transfer_amount,
    //     )?;
    //     require_gt!(TOKEN_COUNT, pool_token_index as usize);
    //     require_keys_eq!(self.pool.token_mint_keys[pool_token_index as usize], *pool_token_mint);
    //     let user_token_accounts = [&self.user_token_account_0, &self.user_token_account_1];
    //     require_keys_eq!(user_token_accounts[pool_token_index as usize].owner, swim_payload_owner);
    //
    //     let cpi_res = match pool_ix {
    //         PoolInstruction::RemoveExactBurn => {
    //             msg!("Executing RemoveExactBurn");
    //             // require_keys_eq!(
    //             //     self.user_lp_token_account.owner,
    //             //     self.payer.key(),
    //             // );
    //
    //             // TODO: handle other checks
    //             let cpi_ctx = CpiContext::new(
    //                 self.two_pool_program.to_account_info(),
    //                 two_pool::cpi::accounts::RemoveExactBurn {
    //                     pool: self.pool.to_account_info(),
    //                     pool_token_account_0: self.pool_token_account_0.to_account_info(),
    //                     pool_token_account_1: self.pool_token_account_1.to_account_info(),
    //                     lp_mint: self.lp_mint.to_account_info(),
    //                     governance_fee: self.governance_fee.to_account_info(),
    //                     user_transfer_authority: self.user_transfer_authority.to_account_info(),
    //                     user_token_account_0: self.user_token_account_0.to_account_info(),
    //                     user_token_account_1: self.user_token_account_1.to_account_info(),
    //                     user_lp_token_account: self.redeemer_escrow.to_account_info(),
    //                     token_program: self.token_program.to_account_info(),
    //                 },
    //             );
    //             //TODO: test if this works
    //             // let cpi_ctx = CpiContext::new_with_signer(
    //             //     self.two_pool_program.to_account_info(),
    //             //     two_pool::cpi::accounts::RemoveExactBurn {
    //             //         pool: self.pool.to_account_info(),
    //             //         pool_token_account_0: self.pool_token_account_0.to_account_info(),
    //             //         pool_token_account_1: self.pool_token_account_1.to_account_info(),
    //             //         lp_mint: self.lp_mint.to_account_info(),
    //             //         governance_fee: self.governance_fee.to_account_info(),
    //             //         user_transfer_authority: self.user_transfer_authority.to_account_info(),
    //             //         user_token_account_0: self.user_token_account_0.to_account_info(),
    //             //         user_token_account_1: self.user_token_account_1.to_account_info(),
    //             //         user_lp_token_account: self.redeemer_escrow.to_account_info(),
    //             //         token_program: self.token_program.to_account_info(),
    //             //     },
    //             //     &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
    //             // );
    //             two_pool::cpi::remove_exact_burn(cpi_ctx, transfer_amount, pool_token_index, min_output_amount)?.get()
    //         }
    //         PoolInstruction::SwapExactInput => {
    //             msg!("Executing SwapExactInput");
    //
    //             let cpi_ctx = CpiContext::new(
    //                 self.two_pool_program.to_account_info(),
    //                 two_pool::cpi::accounts::SwapExactInput {
    //                     pool: self.pool.to_account_info(),
    //                     pool_token_account_0: self.pool_token_account_0.to_account_info(),
    //                     pool_token_account_1: self.pool_token_account_1.to_account_info(),
    //                     lp_mint: self.lp_mint.to_account_info(),
    //                     governance_fee: self.governance_fee.to_account_info(),
    //                     user_transfer_authority: self.user_transfer_authority.to_account_info(),
    //                     user_token_account_0: self.redeemer_escrow.to_account_info(),
    //                     user_token_account_1: self.user_token_account_1.to_account_info(),
    //                     token_program: self.token_program.to_account_info(),
    //                 },
    //             );
    //
    //             //TODO: test if this works.
    //             // let cpi_ctx = CpiContext::new_with_signer(
    //             //     self.two_pool_program.to_account_info(),
    //             //     two_pool::cpi::accounts::SwapExactInput {
    //             //         pool: self.pool.to_account_info(),
    //             //         pool_token_account_0: self.pool_token_account_0.to_account_info(),
    //             //         pool_token_account_1: self.pool_token_account_1.to_account_info(),
    //             //         lp_mint: self.lp_mint.to_account_info(),
    //             //         governance_fee: self.governance_fee.to_account_info(),
    //             //         user_transfer_authority: self.user_transfer_authority.to_account_info(),
    //             //         user_token_account_0: self.redeemer_escrow.to_account_info(),
    //             //         user_token_account_1: self.user_token_account_1.to_account_info(),
    //             //         token_program: self.token_program.to_account_info(),
    //             //     },
    //             //     &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
    //             // );
    //             two_pool::cpi::swap_exact_input(cpi_ctx, [transfer_amount, 0u64], pool_token_index, min_output_amount)?
    //                 .get()
    //         }
    //         _ => return err!(PropellerError::InvalidInstruction),
    //     };
    //     Ok(cpi_res)
    //     // let cpi_res = match pool_ix {
    //     //     PoolInstruction::Transfer => {}
    //     //     PoolInstruction::RemoveExactBurn => {
    //     //         msg!("Executing RemoveExactBurn");
    //     //         // require_keys_eq!(
    //     //         //     self.user_lp_token_account.owner,
    //     //         //     self.payer.key(),
    //     //         // );
    //     //
    //     //         // TODO: handle other checks
    //     //         let cpi_ctx = CpiContext::new(
    //     //             self.two_pool_program.to_account_info(),
    //     //             two_pool::cpi::accounts::RemoveExactBurn {
    //     //                 pool: self.pool.to_account_info(),
    //     //                 pool_token_account_0: self.pool_token_account_0.to_account_info(),
    //     //                 pool_token_account_1: self.pool_token_account_1.to_account_info(),
    //     //                 lp_mint: self.lp_mint.to_account_info(),
    //     //                 governance_fee: self.governance_fee.to_account_info(),
    //     //                 user_transfer_authority: self.user_transfer_authority.to_account_info(),
    //     //                 user_token_account_0: self.user_token_account_0.to_account_info(),
    //     //                 user_token_account_1: self.user_token_account_1.to_account_info(),
    //     //                 user_lp_token_account: self.redeemer_escrow.to_account_info(),
    //     //                 token_program: self.token_program.to_account_info(),
    //     //             },
    //     //         );
    //     //         //TODO: test if this works
    //     //         // let cpi_ctx = CpiContext::new_with_signer(
    //     //         //     self.two_pool_program.to_account_info(),
    //     //         //     two_pool::cpi::accounts::RemoveExactBurn {
    //     //         //         pool: self.pool.to_account_info(),
    //     //         //         pool_token_account_0: self.pool_token_account_0.to_account_info(),
    //     //         //         pool_token_account_1: self.pool_token_account_1.to_account_info(),
    //     //         //         lp_mint: self.lp_mint.to_account_info(),
    //     //         //         governance_fee: self.governance_fee.to_account_info(),
    //     //         //         user_transfer_authority: self.user_transfer_authority.to_account_info(),
    //     //         //         user_token_account_0: self.user_token_account_0.to_account_info(),
    //     //         //         user_token_account_1: self.user_token_account_1.to_account_info(),
    //     //         //         user_lp_token_account: self.redeemer_escrow.to_account_info(),
    //     //         //         token_program: self.token_program.to_account_info(),
    //     //         //     },
    //     //         //     &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
    //     //         // );
    //     //         two_pool::cpi::remove_exact_burn(cpi_ctx, transfer_amount, pool_token_index, min_output_amount)?.get()
    //     //     }
    //     //     PoolInstruction::SwapExactInput => {
    //     //         msg!("Executing SwapExactInput");
    //     //
    //     //         let cpi_ctx = CpiContext::new(
    //     //             self.two_pool_program.to_account_info(),
    //     //             two_pool::cpi::accounts::SwapExactInput {
    //     //                 pool: self.pool.to_account_info(),
    //     //                 pool_token_account_0: self.pool_token_account_0.to_account_info(),
    //     //                 pool_token_account_1: self.pool_token_account_1.to_account_info(),
    //     //                 lp_mint: self.lp_mint.to_account_info(),
    //     //                 governance_fee: self.governance_fee.to_account_info(),
    //     //                 user_transfer_authority: self.user_transfer_authority.to_account_info(),
    //     //                 user_token_account_0: self.redeemer_escrow.to_account_info(),
    //     //                 user_token_account_1: self.user_token_account_1.to_account_info(),
    //     //                 token_program: self.token_program.to_account_info(),
    //     //             },
    //     //         );
    //     //
    //     //         //TODO: test if this works.
    //     //         // let cpi_ctx = CpiContext::new_with_signer(
    //     //         //     self.two_pool_program.to_account_info(),
    //     //         //     two_pool::cpi::accounts::SwapExactInput {
    //     //         //         pool: self.pool.to_account_info(),
    //     //         //         pool_token_account_0: self.pool_token_account_0.to_account_info(),
    //     //         //         pool_token_account_1: self.pool_token_account_1.to_account_info(),
    //     //         //         lp_mint: self.lp_mint.to_account_info(),
    //     //         //         governance_fee: self.governance_fee.to_account_info(),
    //     //         //         user_transfer_authority: self.user_transfer_authority.to_account_info(),
    //     //         //         user_token_account_0: self.redeemer_escrow.to_account_info(),
    //     //         //         user_token_account_1: self.user_token_account_1.to_account_info(),
    //     //         //         token_program: self.token_program.to_account_info(),
    //     //         //     },
    //     //         //     &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
    //     //         // );
    //     //         two_pool::cpi::swap_exact_input(cpi_ctx, [transfer_amount, 0u64], pool_token_index, min_output_amount)?
    //     //             .get()
    //     //     }
    //     // };
    //     // token::revoke(CpiContext::new_with_signer(
    //     //     token_program.to_account_info(),
    //     //     token::Revoke {
    //     //         // source
    //     //         source: self.redeemer_escrow.to_account_info(),
    //     //         authority: self.redeemer.to_account_info(),
    //     //     },
    //     //     &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
    //     // ))?;
    //     // Ok(cpi_res)
    // }
}

pub fn handle_process_swim_payload(
    ctx: Context<ProcessSwimPayload>,
    target_token_id: u16,
    min_output_amount: u64,
) -> Result<u64> {
    // let payload_transfer_with_payload =
    //     get_transfer_with_payload_from_message_account(&ctx.accounts.message.to_account_info())?;
    // msg!("message_data_payload: {:?}", payload_transfer_with_payload);
    //
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
    // // TODO: we should probably validate that `message_data_payload.from_address` is the expected
    // //  evm routing contract address unless there's a reason to allow someone else to use this method
    // // let swim_payload =
    // //     SwimPayload::deserialize(&mut payload.as_slice())?;
    // let swim_payload = payload;
    // msg!("swim_payload: {:?}", swim_payload);
    // let swim_payload = &ctx.accounts.propeller_message.swim_payload;
    let propeller_message = &ctx.accounts.propeller_message;
    // let message_swim_payload = payload;
    // require_eq!(message_swim_payload.target_token_id, propeller_message.target_token_id);
    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    require!(claim_data.claimed, PropellerError::ClaimNotClaimed);
    msg!("claim_data: {:?}", claim_data);

    let transfer_amount = ctx.accounts.propeller_message.transfer_amount;

    let owner = propeller_message.owner;
    let token_program = &ctx.accounts.token_program;
    msg!("transfer_amount: {}", transfer_amount);

    let output_amount = ctx.accounts.transfer_tokens(target_token_id, transfer_amount, min_output_amount)?;

    let propeller_claim = &mut ctx.accounts.propeller_claim;
    propeller_claim.bump = *ctx.bumps.get("propeller_claim").unwrap();
    propeller_claim.claimed = true;
    let memo = propeller_message.memo;
    let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
    invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
    msg!("output_amount: {:?}", output_amount);
    Ok(output_amount)
}

// //TODO: should i process this using the message account or the vaa data?
#[derive(Accounts)]
// #[instruction(vaa: PostVAAData, target_token_id: u16)]
pub struct PropellerProcessSwimPayload<'info> {
    //TODO: re-add using composite pattern since propeller engine should call propellr create owner token Accounts
    // prior to calling this instruction.
    // pub process_swim_payload: ProcessSwimPayload<'info>,
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
    #[account(owner = propeller.wormhole()?)]
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
    pub propeller_message: Box<Account<'info, PropellerMessage>>,

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
    pub redeemer_escrow: Box<Account<'info, TokenAccount>>,

    #[account(
    seeds = [
    b"propeller".as_ref(),
    b"token_id".as_ref(),
    propeller.key().as_ref(),
    &propeller_message.target_token_id.to_le_bytes()
    ],
    bump = token_id_map.bump,
    )]
    pub token_id_map: Box<Account<'info, TokenIdMap>>,

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
    #[account(
    mut,
    address = pool.lp_mint_key
    )]
    pub lp_mint: Box<Account<'info, Mint>>,
    #[account(
    mut,
    token::mint = lp_mint
    )]
    pub governance_fee: Box<Account<'info, TokenAccount>>,

    // needs to be a signer since its a "keypair" account and needs to be passed
    // to two pool program as a signer as well.
    pub user_transfer_authority: Signer<'info>,

    // #[account(mut, token::mint = pool_token_account_0.mint)]
    // pub user_token_account_0: Box<Account<'info, TokenAccount>>,
    //
    // #[account(mut, token::mint = pool_token_account_1.mint)]
    // pub user_token_account_1: Box<Account<'info, TokenAccount>>,
    //
    // #[account(mut, token::mint = pool.lp_mint_key)]
    // pub user_lp_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    /// CHECK: may or may not be uninitialized. need to account for fees if initialized
    pub user_token_account_0: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: may or may not be uninitialized. need to account for fees if initialized
    pub user_token_account_1: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: may or may not be uninitialized. need to account for fees if initialized
    pub user_lp_token_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
    pub system_program: Program<'info, System>,

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
    token::mint = propeller.token_bridge_mint,
    token::authority = propeller,
    )]
    /// this is "to_fees"
    /// recipient of fees for executing complete transfer (e.g. relayer)
    /// TODO: this should be fee_vault - not used/needed in non propeller ix
    pub fee_vault: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    b"fee".as_ref(),
    propeller.token_bridge_mint.as_ref(),
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
    pub marginal_price_pool_token_0_account: Box<Account<'info, TokenAccount>>,
    pub marginal_price_pool_token_1_account: Box<Account<'info, TokenAccount>>,
    pub marginal_price_pool_lp_mint: Box<Account<'info, Mint>>,
    /// This is for transferring lamports for kickstart
    #[account(mut)]
    pub owner: SystemAccount<'info>,
}

impl<'info> PropellerProcessSwimPayload<'info> {
    pub fn accounts(ctx: &Context<PropellerProcessSwimPayload>) -> Result<()> {
        ctx.accounts.validate()?;
        validate_marginal_prices_pool_accounts(
            &ctx.accounts.propeller,
            &ctx.accounts.marginal_price_pool.key(),
            &[
                ctx.accounts.marginal_price_pool_token_0_account.mint,
                ctx.accounts.marginal_price_pool_token_1_account.mint,
            ],
        )?;
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

    pub fn transfer_tokens(
        &self,
        output_token_index: u16,
        transfer_amount: u64,
        min_output_amount: u64,
    ) -> Result<u64> {
        let token_id_mapping = &self.token_id_map;
        let token_pool = &token_id_mapping.pool;
        let pool_ix = &token_id_mapping.pool_ix;
        if let PoolInstruction::Transfer = pool_ix {
            require_eq!(output_token_index, TOKEN_BRIDGE_OUTPUT_TOKEN_INDEX, PropellerError::InvalidOutputTokenIndex);
            return self.transfer_token_bridge_mint_tokens(transfer_amount);
        }
        let token_program = &self.token_program;
        let pool_token_mint = &token_id_mapping.pool_token_mint;
        let pool_token_index = token_id_mapping.pool_token_index;
        let swim_payload_owner = self.propeller_message.owner;

        //TODO: test if i can just use "redeemer" as the "user_transfer_authority" and
        // skip approve/revoke and just call the pool ix with CpiContext::new_with_signer()
        //
        // if removeExactBurn, then user_token_account's will be end_user's and user_lp_token_account will be
        // payer of txn
        // redeemer_escrow still holds all the tokens at this point and will be source of tokens used
        // in pool ix
        token::approve(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                token::Approve {
                    // source
                    to: self.redeemer_escrow.to_account_info(),
                    delegate: self.user_transfer_authority.to_account_info(),
                    authority: self.redeemer.to_account_info(),
                },
                &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
            ),
            transfer_amount,
        )?;
        require_gt!(TOKEN_COUNT, pool_token_index as usize);
        require_keys_eq!(self.pool.token_mint_keys[pool_token_index as usize], *pool_token_mint);
        let user_token_accounts = [&self.user_token_account_0, &self.user_token_account_1];
        // require_keys_eq!(user_token_accounts[pool_token_index as usize].owner, swim_payload_owner);

        match pool_ix {
            PoolInstruction::RemoveExactBurn => {
                msg!("Executing RemoveExactBurn");
                // require_keys_eq!(
                //     self.user_lp_token_account.owner,
                //     self.payer.key(),
                // );

                // TODO: handle other checks
                let cpi_ctx = CpiContext::new(
                    self.two_pool_program.to_account_info(),
                    two_pool::cpi::accounts::RemoveExactBurn {
                        pool: self.pool.to_account_info(),
                        pool_token_account_0: self.pool_token_account_0.to_account_info(),
                        pool_token_account_1: self.pool_token_account_1.to_account_info(),
                        lp_mint: self.lp_mint.to_account_info(),
                        governance_fee: self.governance_fee.to_account_info(),
                        user_transfer_authority: self.user_transfer_authority.to_account_info(),
                        user_token_account_0: self.user_token_account_0.to_account_info(),
                        user_token_account_1: self.user_token_account_1.to_account_info(),
                        user_lp_token_account: self.redeemer_escrow.to_account_info(),
                        token_program: self.token_program.to_account_info(),
                    },
                );
                //TODO: test if this works
                // let cpi_ctx = CpiContext::new_with_signer(
                //     self.two_pool_program.to_account_info(),
                //     two_pool::cpi::accounts::RemoveExactBurn {
                //         pool: self.pool.to_account_info(),
                //         pool_token_account_0: self.pool_token_account_0.to_account_info(),
                //         pool_token_account_1: self.pool_token_account_1.to_account_info(),
                //         lp_mint: self.lp_mint.to_account_info(),
                //         governance_fee: self.governance_fee.to_account_info(),
                //         user_transfer_authority: self.user_transfer_authority.to_account_info(),
                //         user_token_account_0: self.user_token_account_0.to_account_info(),
                //         user_token_account_1: self.user_token_account_1.to_account_info(),
                //         user_lp_token_account: self.redeemer_escrow.to_account_info(),
                //         token_program: self.token_program.to_account_info(),
                //     },
                //     &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
                // );
                Ok(two_pool::cpi::remove_exact_burn(cpi_ctx, transfer_amount, pool_token_index, min_output_amount)?
                    .get())
            }
            PoolInstruction::SwapExactInput => {
                msg!("Executing SwapExactInput");

                let cpi_ctx = CpiContext::new(
                    self.two_pool_program.to_account_info(),
                    two_pool::cpi::accounts::SwapExactInput {
                        pool: self.pool.to_account_info(),
                        pool_token_account_0: self.pool_token_account_0.to_account_info(),
                        pool_token_account_1: self.pool_token_account_1.to_account_info(),
                        lp_mint: self.lp_mint.to_account_info(),
                        governance_fee: self.governance_fee.to_account_info(),
                        user_transfer_authority: self.user_transfer_authority.to_account_info(),
                        user_token_account_0: self.redeemer_escrow.to_account_info(),
                        user_token_account_1: self.user_token_account_1.to_account_info(),
                        token_program: self.token_program.to_account_info(),
                    },
                );

                //TODO: test if this works.
                // let cpi_ctx = CpiContext::new_with_signer(
                //     self.two_pool_program.to_account_info(),
                //     two_pool::cpi::accounts::SwapExactInput {
                //         pool: self.pool.to_account_info(),
                //         pool_token_account_0: self.pool_token_account_0.to_account_info(),
                //         pool_token_account_1: self.pool_token_account_1.to_account_info(),
                //         lp_mint: self.lp_mint.to_account_info(),
                //         governance_fee: self.governance_fee.to_account_info(),
                //         user_transfer_authority: self.user_transfer_authority.to_account_info(),
                //         user_token_account_0: self.redeemer_escrow.to_account_info(),
                //         user_token_account_1: self.user_token_account_1.to_account_info(),
                //         token_program: self.token_program.to_account_info(),
                //     },
                //     &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
                // );
                Ok(two_pool::cpi::swap_exact_input(
                    cpi_ctx,
                    [transfer_amount, 0u64],
                    pool_token_index,
                    min_output_amount,
                )?
                .get())
            }
            // This should be unreachable
            _ => err!(PropellerError::InvalidTokenIdMapPoolIx),
        }
    }

    fn transfer_token_bridge_mint_tokens(&self, transfer_amount: u64) -> Result<u64> {
        let cpi_accounts = Transfer {
            from: self.redeemer_escrow.to_account_info(),
            to: self.user_lp_token_account.to_account_info(),
            authority: self.redeemer.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                cpi_accounts,
                &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
            ),
            transfer_amount,
        )?;
        Ok(transfer_amount)
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
) -> Result<u64> {
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
    let message_swim_payload = payload;
    let propeller_message = &ctx.accounts.propeller_message;
    // require!(propeller_message.gas_kickstart, PropellerError::InvalidSwimPayloadGasKickstart);
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

    let mut transfer_amount = propeller_message.transfer_amount;
    let propeller = &ctx.accounts.propeller;
    let redeemer = &ctx.accounts.redeemer;
    let swim_payload_owner = propeller_message.owner;

    let token_program = &ctx.accounts.token_program;
    let two_pool_program = &ctx.accounts.two_pool_program;

    if swim_payload_owner != ctx.accounts.payer.key() {
        let fees_in_token_bridge = calculate_fees(&ctx)?;
        msg!("fees_in_token_bridge: {:?}", fees_in_token_bridge);
        let fee_tracker = &mut ctx.accounts.fee_tracker;
        fee_tracker.fees_owed =
            fee_tracker.fees_owed.checked_add(fees_in_token_bridge).ok_or(PropellerError::IntegerOverflow)?;
        let cpi_accounts = Transfer {
            from: ctx.accounts.redeemer_escrow.to_account_info(),
            to: ctx.accounts.fee_vault.to_account_info(),
            authority: redeemer.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                cpi_accounts,
                &[&[&b"redeemer".as_ref(), &[ctx.accounts.propeller.redeemer_bump]]],
            ),
            fees_in_token_bridge,
        )?;
        transfer_amount =
            transfer_amount.checked_sub(fees_in_token_bridge).ok_or(error!(PropellerError::InsufficientFunds))?;
    }
    if propeller_message.gas_kickstart {
        let owner_account = &ctx.accounts.owner.to_account_info();
        let payer = &ctx.accounts.payer.to_account_info();
        let owner_starting_lamports = owner_account.lamports();
        let payer_starting_lamports = payer.lamports();
        require_gte!(
            payer_starting_lamports,
            propeller.gas_kickstart_amount,
            PropellerError::PayerInsufficientFundsForGasKickstart
        );
        let system_transfer = system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer { from: payer.clone(), to: owner_account.clone() },
            ),
            propeller.gas_kickstart_amount,
        )?;
        msg!("owner_starting_lamports: {}, owner_final_lamports: {}, payer_starting_lamports: {}, payer_final_lamports: {}",
            owner_starting_lamports, owner_account.lamports(), payer_starting_lamports, payer.lamports());
    }

    msg!("transfer_amount - fee: {}", transfer_amount);
    let min_output_amount = 0u64;
    let output_amount =
        ctx.accounts.transfer_tokens(propeller_message.target_token_id, transfer_amount, min_output_amount)?;

    let propeller_claim = &mut ctx.accounts.propeller_claim;
    propeller_claim.bump = *ctx.bumps.get("propeller_claim").unwrap();
    propeller_claim.claimed = true;
    let memo = propeller_message.memo;
    // get target_token_id -> (pool, pool_token_index)
    //    need to know when to do remove_exact_burn & when to do swap_exact_input
    let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
    invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
    msg!("output_amount: {}", output_amount);
    Ok(output_amount)
}

fn calculate_fees(ctx: &Context<PropellerProcessSwimPayload>) -> Result<u64> {
    //TODO: this is in lamports/SOL. need in swimUSD.
    // ideal implementation
    //   do oracle price lookup and transfer right away
    //   for (secp + verify) & postVAA, need to implement a fee tracking mechanism since there's no way to
    //      credit the payer during that step.
    let rent = Rent::get()?;

    let propeller_claim_rent_exempt_fees = rent.minimum_balance(8 + PropellerClaim::LEN);
    let propeller = &ctx.accounts.propeller;
    let propeller_process_swim_payload_fees = propeller.process_swim_payload_fee;
    let gas_kickstart_amount =
        if ctx.accounts.propeller_message.gas_kickstart { propeller.gas_kickstart_amount } else { 0 };
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
        ctx.accounts.two_pool_program.to_account_info(),
        two_pool::cpi::accounts::MarginalPrices {
            pool: ctx.accounts.marginal_price_pool.to_account_info(),
            pool_token_account_0: ctx.accounts.marginal_price_pool_token_0_account.to_account_info(),
            pool_token_account_1: ctx.accounts.marginal_price_pool_token_1_account.to_account_info(),
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
    let sol_usd_price: Decimal = feed.get_result()?.try_into()?;
    let name = feed.name;

    let lamports_usd_price =
        sol_usd_price.checked_div(LAMPORTS_PER_SOL_DECIMAL).ok_or(PropellerError::IntegerOverflow)?;
    msg!("sol_usd_price:{},lamports_usd_price: {}", sol_usd_price, lamports_usd_price);
    // check whether the feed has been updated in the last 300 seconds
    feed.check_staleness(
        Clock::get().unwrap().unix_timestamp,
        // 300
        i64::MAX,
    )
    .map_err(|_| error!(PropellerError::StaleFeed))?;
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

    let token_bridge_mint_key = ctx.accounts.propeller.token_bridge_mint;
    let marginal_price: Decimal = get_marginal_price_decimal(
        &ctx.accounts.marginal_price_pool,
        &marginal_prices,
        propeller.marginal_price_pool_token_index as usize,
        &ctx.accounts.marginal_price_pool_lp_mint.key(),
        &token_bridge_mint_key,
    )?;

    msg!("marginal_price: {}", marginal_price);
    let fee_in_lamports_decimal = Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::ConversionError)?;
    msg!("fee_in_lamports(u64): {:?} fee_in_lamports_decimal: {:?}", fee_in_lamports, fee_in_lamports_decimal);
    let fee_in_token_bridge_mint_decimal = marginal_price
        .checked_mul(lamports_usd_price)
        .and_then(|v| v.checked_mul(fee_in_lamports_decimal))
        .ok_or(PropellerError::IntegerOverflow)?;

    let token_bridge_mint_decimals = get_token_bridge_mint_decimals(
        &token_bridge_mint_key,
        &ctx.accounts.marginal_price_pool,
        &ctx.accounts.marginal_price_pool_lp_mint,
    )?;

    msg!("token_bridge_mint_decimals: {:?} ", token_bridge_mint_decimals,);

    let ten_pow_decimals =
        Decimal::from_u64(10u64.pow(token_bridge_mint_decimals as u32)).ok_or(PropellerError::IntegerOverflow)?;
    let fee_in_token_bridge_mint = fee_in_token_bridge_mint_decimal
        .checked_mul(ten_pow_decimals)
        .and_then(|v| v.to_u64())
        .ok_or(PropellerError::ConversionError)?;

    // let feed = &ctx.accounts.aggregator.load()?;
    //
    // // get result
    // // note - for tests this is currently hardcoded to 100
    // // this val is SOL/USD price
    // // 100 => 1 SOL/100 USD (usdc)
    // // let v2 = feed.get_result()?.try_into()?;
    // let val: Decimal = feed.get_result()?.try_into()?;
    // let name = feed.name;
    // msg!("val:{}, name: {:?}", val, name);
    // // check whether the feed has been updated in the last 300 seconds
    // feed.check_staleness(Clock::get().unwrap().unix_timestamp, 300).map_err(|_| error!(PropellerError::StaleFeed))?;
    // // check feed does not exceed max_confidence_interval
    // // if let Some(max_confidence_interval) = params.max_confidence_interval {
    // // 	feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
    // // 	.map_err(|_| error!(PropellerError::ConfidenceIntervalExceeded))?;
    // // }
    // // marginal_price = 0.75 USDC/swimUSD,
    // // feed.val = 25.05 USDC/SOL
    // // kickstart = 2 SOL
    // // =>  50.1 USDC * 0.75 USDC/swimUSD = 37.575 swimUSD
    // let lp_mint_key = ctx.accounts.marginal_price_pool_lp_mint.key();
    //
    // let marginal_price: Decimal = if lp_mint_key == propeller.token_bridge_mint.key() {
    //     marginal_prices[propeller.marginal_price_pool_token_index as usize]
    //         .try_into()
    //         .map_err(|_| error!(PropellerError::ConversionError))?
    // } else {
    //     msg!("marginal_price_pool_lp_mint != mint");
    //     panic!("marginal_price_pool_lp_mint != mint not implemented yet");
    //     // return err!(PropellerError::Missing);
    // };
    //
    // let fee_in_lamports_decimal = Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::ConversionError)?;
    // let fee_in_token_bridge_mint_decimal = marginal_price
    //     .checked_mul(val)
    //     .and_then(|v| v.checked_mul(fee_in_lamports_decimal))
    //     .ok_or(PropellerError::IntegerOverflow)?;
    // // .checked_mul(Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::IntegerOverflow)?)
    // // .ok_or(PropellerError::IntegerOverflow)?;
    // let fee_in_token_bridge_mint = fee_in_token_bridge_mint_decimal.to_u64().ok_or(PropellerError::ConversionError)?;
    msg!(
        "fee_in_token_bridge_mint_decimal: {:?} fee_in_token_bridge_mint: {:?}",
        fee_in_token_bridge_mint_decimal,
        fee_in_token_bridge_mint
    );
    res = fee_in_token_bridge_mint;
    Ok(res)
}

use {
    crate::two_pool_cpi::{
        add::*,
        swap_exact_input::*,
        // remove_exact_burn::*, remove_exact_output::*, remove_uniform::*, swap_exact_output::*,
    },
    anchor_lang::{prelude::*, solana_program},
    // crate::two_pool_cpi::*,
    constants::TOKEN_COUNT,
    fees::*,
    state::*,
    token_bridge::*,
    wormhole::*,
};

mod constants;
mod error;
mod fees;
mod instructions;
mod state;
mod token_bridge;
mod wormhole;

use two_pool::state::TwoPool;
pub use {error::*, instructions::*};

declare_id!("9z6G41AyXk73r1E4nTv81drQPtEqupCSAnsLdGV5WGfK");

#[program]
pub mod propeller {
    use super::*;

    #[inline(never)]
    #[access_control(Initialize::accounts(&ctx, &params))]
    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        handle_initialize(ctx, params)
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        handle_set_paused(ctx, paused)
    }

    pub fn change_pause_key(ctx: Context<ChangePauseKey>) -> Result<()> {
        handle_change_pause_key(ctx)
    }

    pub fn prepare_governance_transition(ctx: Context<Governance>) -> Result<()> {
        Ok(())
    }

    pub fn enact_governance_transition(ctx: Context<Governance>) -> Result<()> {
        Ok(())
    }

    #[inline(never)]
    #[access_control(
    CreateTokenNumberMap::accounts(
        &ctx,
        to_token_number,
        pool,
        pool_token_index,
        pool_token_mint,
        to_token_step,
    ))]
    pub fn create_token_number_map(
        ctx: Context<CreateTokenNumberMap>,
        to_token_number: u16,
        pool: Pubkey,
        pool_token_index: u8,
        pool_token_mint: Pubkey,
        to_token_step: ToTokenStep,
    ) -> Result<()> {
        handle_create_token_number_map(ctx, to_token_number, pool, pool_token_index, pool_token_mint, to_token_step)
    }

    #[inline(never)]
    #[access_control(UpdateTokenNumberMap::accounts(&ctx, &pool_token_index, &pool_token_mint, &to_token_step))]
    pub fn update_token_number_map(
        ctx: Context<UpdateTokenNumberMap>,
        to_token_number: u16,
        pool_token_index: u8,
        pool_token_mint: Pubkey,
        to_token_step: ToTokenStep,
    ) -> Result<()> {
        handle_update_token_number_map(ctx, to_token_number, pool_token_index, pool_token_mint, to_token_step)
    }

    pub fn close_token_number_map(ctx: Context<CloseTokenNumberMap>, to_token_number: u16) -> Result<()> {
        handle_close_token_number_map(ctx, to_token_number)
    }

    /** Target Chain Map **/
    pub fn create_target_chain_map(
        ctx: Context<CreateTargetChainMap>,
        target_chain: u16,
        target_address: [u8; 32],
    ) -> Result<()> {
        handle_create_target_chain_map(ctx, target_chain, target_address)
    }

    //TODO: pass in `target_chain` as input parameter for these?
    pub fn update_target_chain_map(ctx: Context<UpdateTargetChainMap>, routing_contract: [u8; 32]) -> Result<()> {
        handle_update_target_chain_map(ctx, routing_contract)
    }

    pub fn target_chain_map_set_paused(ctx: Context<TargetChainMapSetPaused>, is_paused: bool) -> Result<()> {
        handle_target_chain_map_set_paused(ctx, is_paused)
    }

    #[inline(never)]
    pub fn initialize_fee_tracker(ctx: Context<InitializeFeeTracker>) -> Result<()> {
        handle_initialize_fee_tracker(ctx)
    }

    #[inline(never)]
    #[access_control(ClaimFees::accounts(&ctx))]
    pub fn claim_fees(ctx: Context<ClaimFees>) -> Result<()> {
        handle_claim_fees(ctx)
    }

    // #[access_control(Add::accounts(&ctx))]
    // pub fn add(
    //     ctx: Context<Add>,
    //     input_amounts: [u64; TOKEN_COUNT],
    //     minimum_mint_amount: u64,
    //     memo: Vec<u8>,
    //     propeller_enabled: bool,
    //     target_chain: u16,
    // ) -> Result<u64> {
    //     handle_add(ctx, input_amounts, minimum_mint_amount, memo.as_slice(), propeller_enabled, target_chain)
    // }

    #[access_control(Add::accounts(&ctx))]
    pub fn cross_chain_add(
        ctx: Context<Add>,
        input_amounts: [u64; TOKEN_COUNT],
        minimum_mint_amount: u64,
    ) -> Result<u64> {
        handle_cross_chain_add(ctx, input_amounts, minimum_mint_amount)
    }

    #[access_control(Add::accounts(&ctx))]
    pub fn propeller_add(ctx: Context<Add>, input_amounts: [u64; TOKEN_COUNT], max_fee: u64) -> Result<u64> {
        handle_propeller_add(ctx, input_amounts, max_fee)
    }

    // pub fn swap_exact_input(
    //     ctx: Context<SwapExactInput>,
    //     exact_input_amount: u64,
    //     minimum_output_amount: u64,
    //     memo: Vec<u8>,
    //     propeller_enabled: bool,
    //     target_chain: u16,
    // ) -> Result<u64> {
    //     handle_swap_exact_input(
    //         ctx,
    //         exact_input_amount,
    //         minimum_output_amount,
    //         memo.as_slice(),
    //         propeller_enabled,
    //         target_chain,
    //     )
    // }

    /* For metapools */

    pub fn cross_chain_swap_exact_input(
        ctx: Context<SwapExactInput>,
        exact_input_amount: u64,
        minimum_output_amount: u64,
    ) -> Result<u64> {
        handle_cross_chain_swap_exact_input(ctx, exact_input_amount, minimum_output_amount)
    }

    pub fn propeller_swap_exact_input(
        ctx: Context<SwapExactInput>,
        exact_input_amount: u64,
        max_fee: u64,
    ) -> Result<u64> {
        handle_propeller_swap_exact_input(ctx, exact_input_amount, max_fee)
    }

    /*
    // pub fn swap_exact_output(
    //     ctx: Context<SwapExactOutput>,
    //     maximum_input_amount: u64,
    //     exact_output_amount: u64, // params: SwapExactOutputParams,
    //     memo: Vec<u8>,
    //     propeller_enabled: bool,
    //     target_chain: u16,
    // ) -> Result<Vec<u64>> {
    //     handle_swap_exact_output(
    //         ctx,
    //         maximum_input_amount,
    //         exact_output_amount,
    //         memo.as_slice(),
    //         propeller_enabled,
    //         target_chain,
    //     )
    // }

    // pub fn cross_chain_swap_exact_output(
    //     ctx: Context<SwapExactOutput>,
    //     maximum_input_amount: u64,
    //     exact_output_amount: u64, // params: SwapExactOutputParams,
    //     memo: Vec<u8>,
    // ) -> Result<Vec<u64>> {
    //     handle_cross_chain_swap_exact_output(
    //         ctx,
    //         maximum_input_amount,
    //         exact_output_amount,
    //         memo.as_slice(),
    //         propeller_enabled,
    //         target_chain,
    //     )
    // }
    //
    // pub fn propeller_swap_exact_output(
    //     ctx: Context<SwapExactOutput>,
    //     maximum_input_amount: u64,
    //     memo: Vec<u8>,
    //     max_fee: u64,
    // ) -> Result<Vec<u64>> {
    //     handle_propeller_swap_exact_output(
    //         ctx,
    //         maximum_input_amount,
    //         exact_output_amount,
    //         memo.as_slice(),
    //         propeller_enabled,
    //         target_chain,
    //     )
    // }

    // pub fn remove_uniform(
    //     ctx: Context<RemoveUniform>,
    //     exact_burn_amount: u64,
    //     minimum_output_amounts: [u64; TOKEN_COUNT],
    //     memo: Vec<u8>,
    // ) -> Result<Vec<u64>> {
    //     handle_remove_uniform(ctx, exact_burn_amount, minimum_output_amounts, memo.as_slice())
    // }

    // pub fn remove_exact_burn(
    //     ctx: Context<RemoveExactBurn>,
    //     exact_burn_amount: u64,
    //     minimum_output_amount: u64,
    //     memo: Vec<u8>,
    //     propeller_enabled: bool,
    //     target_chain: u16,
    // ) -> Result<u64> {
    //     handle_remove_exact_burn(
    //         ctx,
    //         exact_burn_amount,
    //         minimum_output_amount,
    //         memo.as_slice(),
    //         propeller_enabled,
    //         target_chain,
    //     )
    // }
     */

    //TODO: does remove_exact_burn make sense for metapools?
    // burn metapool lp token to get token_bridge_mint

    // pub fn cross_chain_remove_exact_burn(
    //     ctx: Context<RemoveExactBurn>,
    //     exact_burn_amount: u64,
    //     minimum_output_amount: u64,
    //     memo: Vec<u8>,
    // ) -> Result<u64> {
    //     handle_cross_chain_remove_exact_burn(ctx, exact_burn_amount, minimum_output_amount, memo.as_slice())
    // }
    //
    // pub fn propeller_remove_exact_burn(
    //     ctx: Context<RemoveExactBurn>,
    //     exact_burn_amount: u64,
    //     memo: Vec<u8>,
    //     max_fee: u64,
    // ) -> Result<u64> {
    //     handle_propeller_remove_exact_burn(ctx, exact_burn_amount, memo.as_slice(), max_fee)
    // }

    // pub fn remove_exact_output(
    //     ctx: Context<RemoveExactOutput>,
    //     maximum_burn_amount: u64,
    //     exact_output_amount: u64,
    //     memo: Vec<u8>,
    //     propeller_enabled: bool,
    //     target_chain: u16,
    // ) -> Result<Vec<u64>> {
    //     handle_remove_exact_output(
    //         ctx,
    //         maximum_burn_amount,
    //         exact_output_amount,
    //         memo.as_slice(),
    //         propeller_enabled,
    //         target_chain,
    //     )
    // }

    #[inline(never)]
    #[access_control(TransferNativeWithPayload::accounts(&ctx))]
    pub fn cross_chain_transfer_native_with_payload(
        ctx: Context<TransferNativeWithPayload>,
        nonce: u32,
        amount: u64,
        target_chain: u16,
        owner: Vec<u8>,
    ) -> Result<()> {
        handle_cross_chain_transfer_native_with_payload(ctx, nonce, amount, target_chain, owner)
    }

    #[inline(never)]
    #[access_control(TransferNativeWithPayload::accounts(&ctx))]
    pub fn propeller_transfer_native_with_payload(
        ctx: Context<TransferNativeWithPayload>,
        nonce: u32,
        amount: u64,
        target_chain: u16,
        owner: Vec<u8>,
        gas_kickstart: bool,
        max_fee: u64,
        target_token_id: u16,
        memo: Option<[u8; 16]>,
    ) -> Result<()> {
        handle_propeller_transfer_native_with_payload(
            ctx,
            nonce,
            amount,
            target_chain,
            owner,
            gas_kickstart,
            max_fee,
            target_token_id,
            memo,
        )
    }

    #[inline(never)]
    #[access_control(CompleteNativeWithPayload::accounts(&ctx))]
    pub fn complete_native_with_payload(ctx: Context<CompleteNativeWithPayload>) -> Result<()> {
        handle_complete_native_with_payload(ctx)
    }

    #[inline(never)]
    #[access_control(ProcessSwimPayload::accounts(&ctx))]
    pub fn process_swim_payload(
        ctx: Context<ProcessSwimPayload>,
        to_token_number: u16,
        min_output_amount: u64,
    ) -> Result<u64> {
        handle_process_swim_payload(ctx, to_token_number, min_output_amount)
    }

    #[inline(never)]
    #[access_control(PropellerCompleteNativeWithPayload::accounts(&ctx))]
    pub fn propeller_complete_native_with_payload(ctx: Context<PropellerCompleteNativeWithPayload>) -> Result<()> {
        handle_propeller_complete_native_with_payload(ctx)
    }

    /** Valid target_token_id **/
    #[inline(never)]
    #[access_control(PropellerCreateOwnerTokenAccounts::accounts(&ctx))]
    pub fn propeller_create_owner_token_accounts(ctx: Context<PropellerCreateOwnerTokenAccounts>) -> Result<()> {
        handle_propeller_create_owner_token_accounts(ctx)
    }

    /// Note: passing in target_token_id here due to PDA seed derivation.
    /// for propeller_process_swim_payload, require_eq!(target_token_id, propeller_message.target_token_id);
    #[inline(never)]
    #[access_control(PropellerProcessSwimPayload::accounts(&ctx, to_token_number))]
    pub fn propeller_process_swim_payload(
        ctx: Context<PropellerProcessSwimPayload>,
        to_token_number: u16,
    ) -> Result<u64> {
        handle_propeller_process_swim_payload(ctx, to_token_number)
    }

    /// This ix is used if a propeller engine detects (off-chain) that the target_token_id is not valid
    /// "Fallback" behavior is to check/create just the token bridge mint (swimUSD) token account for the owner
    /// then call propeller_process_swim_payload_fallback to finish transferring the swimUSD to the owner.
    #[inline(never)]
    #[access_control(PropellerCreateOwnerSwimUsdAta::accounts(&ctx))]
    pub fn propeller_create_owner_swim_usd_ata(ctx: Context<PropellerCreateOwnerSwimUsdAta>) -> Result<()> {
        handle_propeller_create_owner_swim_usd_ata(ctx)
    }

    #[inline(never)]
    #[access_control(PropellerProcessSwimPayloadFallback::accounts(&ctx))]
    /// This ix is used if a propeller engine detects (off-chain) that the payload.target_token_id is not valid
    /// this will transfer the swimUSD to the owner (will still kickstart if requested)
    pub fn propeller_process_swim_payload_fallback(ctx: Context<PropellerProcessSwimPayloadFallback>) -> Result<u64> {
        handle_propeller_process_swim_payload_fallback(ctx)
    }

    // #[inline(never)]
    // pub fn cross_chain_add_and_transfer(
    //     ctx: Context<AddAndTransfer>,
    //     input_amounts: [u64; TOKEN_COUNT],
    //     minimum_mint_amount: u64,
    //     memo: [u8; 16],
    //     // memo: Vec<u8>,
    //     // nonce: u32,
    //     target_chain: u16,
    //     // amount: u64,
    //     owner: Vec<u8>,
    //     // propeller_enabled: bool,
    //     // gas_kickstart: bool,
    //     // max_fee: u64,
    //     target_token_id: u16,
    // ) -> Result<()> {
    //     handle_cross_chain_add_and_transfer(
    //         ctx,
    //         input_amounts,
    //         minimum_mint_amount,
    //         memo,
    //         // nonce,
    //         target_chain,
    //         owner,
    //         target_token_id,
    //     )
    // }

    // #[inline(never)]
    // #[access_control(Secp256k1AndVerify::accounts(&ctx))]
    // pub fn secp256k1_and_verify(
    //     ctx: Context<Secp256k1AndVerify>,
    //     secp_payload: Vec<u8>,
    //     guardian_set_index: u32,
    //     verify_signatures_data: VerifySignaturesData,
    // ) -> Result<()> {
    //     handle_secp256k1_and_verify(
    //         ctx,
    //         secp_payload,
    //         guardian_set_index,
    //         verify_signatures_data,
    //     )
    //     // Ok(())
    // }
}

// Notes: doesn't fix in one txn with current max txn size of 1232.
// #[derive(Accounts)]
// #[instruction(
//     input_amounts: [u64; TOKEN_COUNT],
//     minimum_mint_amount: u64,
//     memo: [u8; 16],
//     target_chain: u16,
//     owner: Vec<u8>,
//     target_token_id: u16
// )]
// pub struct AddAndTransfer<'info> {
//     #[account(
//     seeds = [ b"propeller".as_ref(), lp_mint.key().as_ref()],
//     bump = propeller.bump,
//     )]
//     pub propeller: Box<Account<'info, Propeller>>,
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
//     // /// TODO: could be removed if initialized with pool_v2
//     // /// CHECK: checked in CPI
//     // pub pool_auth: UncheckedAccount<'info>,
//     #[account(
//     mut,
//     address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[0]),
//     constraint = pool_token_account_0.key() == pool.token_keys[0],
//     )]
//     pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
//     #[account(
//     mut,
//     address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[1]),
//     constraint = pool_token_account_1.key() == pool.token_keys[1],
//     )]
//     pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
//     #[account(
//     mut,
//     address = pool.lp_mint_key,
//     constraint = propeller.swim_usd_mint == lp_mint.key(),
//     )]
//     pub lp_mint: Box<Account<'info, Mint>>,
//     #[account(
//     mut,
//     token::mint = lp_mint,
//     address = pool.governance_fee_key,
//     )]
//     pub governance_fee: Box<Account<'info, TokenAccount>>,
//     // ///CHECK: checked in CPI
//     // pub user_transfer_authority: Signer<'info>,
//     #[account(
//     mut,
//     token::mint = pool_token_account_0.mint,
//     )]
//     pub user_token_account_0: Box<Account<'info, TokenAccount>>,
//     #[account(
//     mut,
//     token::mint = pool_token_account_1.mint,
//     )]
//     pub user_token_account_1: Box<Account<'info, TokenAccount>>,
//
//     #[account(
//     mut,
//     token::mint = lp_mint,
//     )]
//     pub user_lp_token_account: Box<Account<'info, TokenAccount>>,
//
//     pub token_program: Program<'info, Token>,
//     #[account(executable, address = spl_memo::id())]
//     ///CHECK: memo program
//     pub memo: UncheckedAccount<'info>,
//     pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
//
//     #[account(mut)]
//     pub payer: Signer<'info>,
//     #[account(
//     mut,
//     seeds = [ b"config".as_ref() ],
//     bump,
//     seeds::program = propeller.token_bridge().unwrap()
//     )]
//     /// CHECK: Token Bridge Config
//     pub token_bridge_config: AccountInfo<'info>,
//
//     #[account(
//     mut,
//     associated_token::mint = lp_mint,
//     associated_token::authority = payer
//     )]
//     pub user_swim_usd_ata: Box<Account<'info, TokenAccount>>,
//
//     // #[account(mut)]
//     // pub swim_usd_mint: Box<Account<'info, Mint>>,
//
//     //TODO: change this associated_token account?
//     //      is it necessary to do check since CPI will do check?
//     //
//     // If token is native to SOL, then this is token bridge custody (ATA) that holds the native token.
//     #[account(mut)]
//     //  technical edge-case - on first token_bridge_transfer with the token, this custody account won't be
//     //  initialized yet. if we can assume that this account is initialized, we can do explicit type check here.
//     /// CHECK: Will either be token bridge custody account or wrapped meta account
//     pub custody: UncheckedAccount<'info>,
//
//     #[account(executable, address = propeller.token_bridge()?)]
//     pub token_bridge: Program<'info, TokenBridge>,
//
//     #[account(
//     seeds=[b"custody_signer".as_ref()],
//     bump,
//     seeds::program = token_bridge.key()
//     )]
//     /// CHECK: Only used for bridging assets native to Solana.
//     pub custody_signer: UncheckedAccount<'info>,
//
//     #[account(
//     seeds=[b"authority_signer".as_ref()],
//     bump,
//     seeds::program = token_bridge.key()
//     )]
//     /// CHECK: Token Bridge Authority Signer, delegated approval for transfer
//     pub authority_signer: AccountInfo<'info>,
//
//     #[account(
//     mut,
//     seeds = [b"Bridge".as_ref()],
//     bump,
//     seeds::program = propeller.wormhole().unwrap()
//     )]
//     /// CHECK: Wormhole Config
//     pub wormhole_config: AccountInfo<'info>,
//
//     #[account(mut)]
//     // Note:
//     //     using a `Signer`
//     //     instead of a PDA since a normal token bridge transfer
//     //     uses a Keypair.generate()
//     //
//     //     A new one needs to be used for every transfer
//     //
//     //     WH expects this to be an uninitialized account so might
//     //     be able to use a PDA still in the future.
//     //     maybe [b"propeller".as_ref(), payer, sequence_value]?
//     //
//     pub wormhole_message: Signer<'info>,
//
//     #[account(
//     mut,
//     seeds = [b"emitter".as_ref()],
//     bump,
//     seeds::program = propeller.token_bridge().unwrap()
//     )]
//     /// CHECK: Wormhole Emitter is PDA representing the Token Bridge Program
//     pub wormhole_emitter: AccountInfo<'info>,
//
//     #[account(
//     mut,
//     seeds = [
//     b"Sequence".as_ref(),
//     wormhole_emitter.key().as_ref()
//     ],
//     bump,
//     seeds::program = propeller.wormhole().unwrap()
//     )]
//     /// CHECK: Wormhole Sequence Number
//     pub wormhole_sequence: AccountInfo<'info>,
//
//     #[account(
//     mut,
//     seeds = [b"fee_collector".as_ref()],
//     bump,
//     seeds::program = propeller.wormhole().unwrap()
//     )]
//     /// CHECK: Wormhole Fee Collector. leaving as UncheckedAccount since it could be uninitialized for the first transfer.
//     pub wormhole_fee_collector: AccountInfo<'info>,
//
//     /// Transfers with payload also include the address of the account or contract
//     /// that sent the transfer. Semantically this is identical to "msg.sender" on
//     /// EVM chains, i.e. it is the address of the immediate caller of the token
//     /// bridge transaction.
//     /// Since on Solana, a transaction can have multiple different signers, getting
//     /// this information is not so straightforward.
//     /// The strategy we use to figure out the sender of the transaction is to
//     /// require an additional signer ([`SenderAccount`]) for the transaction.
//     /// If the transaction was sent by a user wallet directly, then this may just be
//     /// the wallet's pubkey. If, however, the transaction was initiated by a
//     /// program, then we require this to be a PDA derived from the sender program's
//     /// id and the string "sender". In this case, the sender program must also
//     /// attach its program id to the instruction data. If the PDA verification
//     /// succeeds (thereby proving that [[`cpi_program_id`]] indeed signed the
//     /// transaction), then the program's id is attached to the VAA as the sender,
//     /// otherwise the transaction is rejected.
//     ///
//     /// Note that a program may opt to forego the PDA derivation and instead just
//     /// pass on the original wallet as the wallet account (or any other signer, as
//     /// long as they don't provide their program_id in the instruction data). The
//     /// sender address is provided as a means for protocols to verify on the
//     /// receiving end that the message was emitted by a contract they trust, so
//     /// foregoing this check is not advised. If the receiving contract needs to know
//     /// the sender wallet's address too, then that information can be included in
//     /// the additional payload, along with any other data that the protocol needs to
//     /// send across. The legitimacy of the attached data can be verified by checking
//     /// that the sender contract is a trusted one.
//     ///
//     /// Also note that attaching the correct PDA as [[`SenderAccount`]] but missing the
//     /// [[`cpi_program_id`]] field will result in a successful transaction, but in
//     /// that case the PDA's address will directly be encoded into the payload
//     /// instead of the sender program's id.
//     #[account(
//     seeds = [ b"sender".as_ref()],
//     bump = propeller.sender_bump,
//     )]
//     /// CHECK: Sender Account
//     pub sender: SystemAccount<'info>,
//
//     pub wormhole: Program<'info, Wormhole>,
//
//     #[account(
//     seeds = [
//     b"propeller".as_ref(),
//     propeller.key().as_ref(),
//     &target_chain.to_le_bytes()
//     ],
//     bump = target_chain_map.bump
//     )]
//     pub target_chain_map: Account<'info, TargetChainMap>,
//     pub system_program: Program<'info, System>,
//
//     pub clock: Sysvar<'info, Clock>,
//     pub rent: Sysvar<'info, Rent>,
// }
//
// pub fn handle_cross_chain_add_and_transfer(
//     ctx: Context<AddAndTransfer>,
//     input_amounts: [u64; TOKEN_COUNT],
//     minimum_mint_amount: u64,
//     memo: [u8; 16],
//     // memo: Vec<u8>,
//     // nonce: u32,
//     target_chain: u16,
//     // amount: u64,
//     owner: Vec<u8>,
//     // propeller_enabled: bool,
//     // gas_kickstart: bool,
//     // max_fee: u64,
//     target_token_id: u16,
// ) -> Result<()> {
//     token::approve(
//         CpiContext::new(
//             ctx.accounts.token_program.to_account_info(),
//             token::Approve {
//                 // source
//                 to: ctx.accounts.user_token_account_0.to_account_info(),
//                 delegate: ctx.accounts.propeller.to_account_info(),
//                 authority: ctx.accounts.payer.to_account_info(),
//             },
//         ),
//         input_amounts[0],
//     )?;
//     token::approve(
//         CpiContext::new(
//             ctx.accounts.token_program.to_account_info(),
//             token::Approve {
//                 // source
//                 to: ctx.accounts.user_token_account_1.to_account_info(),
//                 delegate: ctx.accounts.propeller.to_account_info(),
//                 authority: ctx.accounts.payer.to_account_info(),
//             },
//         ),
//         input_amounts[1],
//     )?;
//     let lp_mint_key = &ctx.accounts.lp_mint.key();
//     let propeller_bump = &ctx.accounts.propeller.bump;
//     let result = two_pool::cpi::add(
//         CpiContext::new_with_signer(
//             ctx.accounts.two_pool_program.to_account_info(),
//             two_pool::cpi::accounts::Add {
//                 pool: ctx.accounts.pool.to_account_info(),
//                 pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
//                 pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
//                 lp_mint: ctx.accounts.lp_mint.to_account_info(),
//                 governance_fee: ctx.accounts.governance_fee.to_account_info(),
//                 user_transfer_authority: ctx.accounts.propeller.to_account_info(),
//                 user_token_account_0: ctx.accounts.user_token_account_0.to_account_info(),
//                 user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
//                 user_lp_token_account: ctx.accounts.user_lp_token_account.to_account_info(),
//                 token_program: ctx.accounts.token_program.to_account_info(),
//             },
//             &[&[&b"propeller".as_ref(), ctx.accounts.propeller.swim_usd_mint.as_ref(), &[ctx.accounts.propeller.bump]]],
//             // &[&[&b"propeller".as_ref(), lp_mint_key.as_ref(), &[propeller_bump]]],
//         ),
//         input_amounts,
//         minimum_mint_amount,
//     )?;
//     let return_val = result.get();
//
//     anchor_lang::prelude::msg!("cross_chain_add return_val: {:?}", return_val);
//     msg!("transfer_native_with_payload");
//     token::approve(
//         CpiContext::new(
//             ctx.accounts.token_program.to_account_info(),
//             token::Approve {
//                 // source
//                 to: ctx.accounts.user_swim_usd_ata.to_account_info(),
//                 delegate: ctx.accounts.authority_signer.to_account_info(),
//                 authority: ctx.accounts.payer.to_account_info(),
//             },
//         ),
//         return_val,
//     )?;
//     msg!("finished approve for authority_signer");
//     // let mut target_token_addr = [0u8; 32];
//     // target_token_addr.copy_from_slice(target_token.as_slice());
//     let mut owner_addr = [0u8; 32];
//     owner_addr.copy_from_slice(owner.as_slice());
//
//     let swim_payload = RawSwimPayload {
//         //TODO: this should come from the propeller or global constant?
//         swim_payload_version: crate::constants::CURRENT_SWIM_PAYLOAD_VERSION,
//         owner: owner_addr,
//         propeller_enabled: false,
//         gas_kickstart: false,
//         max_fee: 0,
//         target_token_id,
//         // min_output_amount: U256::from(0u64),
//         memo: memo.clone().try_into().unwrap(),
//     };
//     msg!("transfer_native_with_payload swim_payload: {:?}", swim_payload);
//     let target_address = ctx.accounts.target_chain_map.target_address.clone();
//     let transfer_with_payload_data = TransferWithPayloadData {
//         //TODO: update this.
//         nonce: 0u32,
//         amount: return_val,
//         target_address,
//         target_chain,
//         payload: swim_payload.try_to_vec()?,
//         //note - if this field is missing then ctx.accounts.sender is used as the vaa.from
//         cpi_program_id: Some(crate::ID),
//     };
//
//     let token_bridge_custody = &ctx.accounts.custody;
//     let wh_token_transfer_acct_infos = vec![
//         ctx.accounts.payer.to_account_info().clone(),
//         ctx.accounts.token_bridge_config.to_account_info().clone(),
//         // ctx.accounts.token_bridge.to_account_info().clone(),
//         ctx.accounts.user_swim_usd_ata.to_account_info().clone(),
//         ctx.accounts.lp_mint.to_account_info().clone(),
//         // ctx.accounts.swim_usd_mint.to_account_info().clone(),
//         token_bridge_custody.to_account_info().clone(),
//         ctx.accounts.authority_signer.to_account_info().clone(),
//         ctx.accounts.custody_signer.to_account_info().clone(),
//         ctx.accounts.wormhole_config.to_account_info().clone(),
//         ctx.accounts.wormhole_message.to_account_info().clone(),
//         ctx.accounts.wormhole_emitter.to_account_info().clone(),
//         ctx.accounts.wormhole_sequence.to_account_info().clone(),
//         ctx.accounts.wormhole_fee_collector.to_account_info().clone(),
//         ctx.accounts.clock.to_account_info().clone(),
//         ctx.accounts.sender.to_account_info().clone(),
//         ctx.accounts.rent.to_account_info().clone(),
//         ctx.accounts.system_program.to_account_info().clone(),
//         ctx.accounts.wormhole.to_account_info().clone(),
//         ctx.accounts.token_program.to_account_info().clone(),
//     ];
//
//     invoke_signed(
//         &Instruction {
//             program_id: ctx.accounts.token_bridge.key(),
//             accounts: vec![
//                 AccountMeta::new(ctx.accounts.payer.key(), true),
//                 AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
//                 // AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
//                 AccountMeta::new(ctx.accounts.user_swim_usd_ata.key(), false),
//                 AccountMeta::new(ctx.accounts.lp_mint.key(), false),
//                 // AccountMeta::new(ctx.accounts.swim_usd_mint.key(), false),
//                 AccountMeta::new(token_bridge_custody.key(), false),
//                 AccountMeta::new_readonly(ctx.accounts.authority_signer.key(), false),
//                 AccountMeta::new_readonly(ctx.accounts.custody_signer.key(), false),
//                 AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
//                 // AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
//                 AccountMeta::new(ctx.accounts.wormhole_message.key(), true),
//                 AccountMeta::new_readonly(ctx.accounts.wormhole_emitter.key(), false),
//                 AccountMeta::new(ctx.accounts.wormhole_sequence.key(), false),
//                 AccountMeta::new(ctx.accounts.wormhole_fee_collector.key(), false),
//                 AccountMeta::new_readonly(Clock::id(), false),
//                 AccountMeta::new_readonly(ctx.accounts.sender.key(), true),
//                 AccountMeta::new_readonly(Rent::id(), false),
//                 AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
//                 AccountMeta::new_readonly(ctx.accounts.wormhole.key(), false),
//                 AccountMeta::new_readonly(spl_token::id(), false),
//             ],
//             data: (TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION, transfer_with_payload_data).try_to_vec()?,
//         },
//         // &ctx.accounts.to_account_infos(),
//         &wh_token_transfer_acct_infos,
//         &[&[&b"sender".as_ref(), &[ctx.accounts.propeller.sender_bump]]],
//     )?;
//
//     token::revoke(CpiContext::new(
//         ctx.accounts.token_program.to_account_info(),
//         token::Revoke {
//             // source
//             source: ctx.accounts.user_swim_usd_ata.to_account_info(),
//             authority: ctx.accounts.payer.to_account_info(),
//         },
//     ))?;
//     msg!("Revoked authority_signer approval");
//     token::revoke(CpiContext::new(
//         ctx.accounts.token_program.to_account_info(),
//         token::Revoke {
//             // source
//             source: ctx.accounts.user_token_account_0.to_account_info(),
//             authority: ctx.accounts.payer.to_account_info(),
//         },
//     ))?;
//     token::revoke(CpiContext::new(
//         ctx.accounts.token_program.to_account_info(),
//         token::Revoke {
//             // source
//             source: ctx.accounts.user_token_account_1.to_account_info(),
//             authority: ctx.accounts.payer.to_account_info(),
//         },
//     ))?;
//     msg!("Revoked user token accounts approval");
//     let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
//     invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
//
//     Ok(())
// }

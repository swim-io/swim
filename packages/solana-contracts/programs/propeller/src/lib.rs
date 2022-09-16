use anchor_lang::solana_program::{
    borsh::try_from_slice_unchecked,
    instruction::Instruction,
    program::{get_return_data, invoke, invoke_signed},
    program_option::COption,
    system_instruction::transfer,
    sysvar::SysvarId, // sysvar::Sysvar::to_account_info,
};
use {
    crate::two_pool_cpi::{
        add::*, remove_exact_burn::*, remove_exact_output::*, remove_uniform::*, swap_exact_input::*,
        swap_exact_output::*,
    },
    anchor_lang::{prelude::*, solana_program},
    anchor_spl::{
        associated_token::AssociatedToken,
        token::{Mint, Token, TokenAccount},
        *,
    },
    constants::TOKEN_COUNT,
    // error::PropellerError,
    // instructions::*,
    solana_program::clock::Epoch,
    state::*,
    token_bridge::*,
    two_pool::instructions::AddParams,
    wormhole::*,
};

mod constants;
mod error;
mod instructions;
mod state;
mod token_bridge;
mod wormhole;

pub use {error::*, instructions::*};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod propeller {
    use super::*;

    #[inline(never)]
    #[access_control(Initialize::accounts(&ctx, &params))]
    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        handle_initialize(ctx, params)
    }

    #[inline(never)]
    #[access_control(
      CreateTokenIdMap::accounts(
        &ctx,
        target_token_index,
        pool,
        pool_token_index,
        pool_token_mint,
        pool_ix,
    ))]
    pub fn create_token_id_map(
        ctx: Context<CreateTokenIdMap>,
        target_token_index: u16,
        pool: Pubkey,
        pool_token_index: u8,
        pool_token_mint: Pubkey,
        pool_ix: PoolInstruction,
    ) -> Result<()> {
        handle_create_token_id_map(ctx, target_token_index, pool, pool_token_index, pool_token_mint, pool_ix)
    }

    pub fn create_target_chain_map(
        ctx: Context<CreateTargetChainMap>,
        target_chain: u16,
        target_address: [u8; 32],
    ) -> Result<()> {
        handle_create_target_chain_map(ctx, target_chain, target_address)
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
        memo: Vec<u8>,
    ) -> Result<u64> {
        handle_cross_chain_add(ctx, input_amounts, minimum_mint_amount, memo.as_slice())
    }

    #[access_control(Add::accounts(&ctx))]
    pub fn propeller_add(
        ctx: Context<Add>,
        input_amounts: [u64; TOKEN_COUNT],
        memo: Vec<u8>,
        max_fee: u64,
    ) -> Result<u64> {
        handle_propeller_add(ctx, input_amounts, memo.as_slice(), max_fee)
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
        memo: Vec<u8>,
    ) -> Result<u64> {
        handle_cross_chain_swap_exact_input(ctx, exact_input_amount, minimum_output_amount, memo.as_slice())
    }

    pub fn propeller_swap_exact_input(
        ctx: Context<SwapExactInput>,
        exact_input_amount: u64,
        memo: Vec<u8>,
        max_fee: u64,
    ) -> Result<u64> {
        handle_propeller_swap_exact_input(ctx, exact_input_amount, memo.as_slice(), max_fee)
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
    pub fn transfer_native_with_payload(
        ctx: Context<TransferNativeWithPayload>,
        nonce: u32,
        target_chain: u16,
        amount: u64,
        owner: Vec<u8>,
        propeller_enabled: bool,
        gas_kickstart: bool,
        max_fee: u64,
        target_token_id: u16,
        memo: Vec<u8>,
    ) -> Result<()> {
        handle_transfer_native_with_payload(
            ctx,
            nonce,
            target_chain,
            amount,
            owner,
            propeller_enabled,
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
        target_token_id: u16,
        min_output_amount: u64,
    ) -> Result<u64> {
        handle_process_swim_payload(ctx, target_token_id, min_output_amount)
    }

    #[inline(never)]
    #[access_control(PropellerCompleteNativeWithPayload::accounts(&ctx))]
    pub fn propeller_complete_native_with_payload(ctx: Context<PropellerCompleteNativeWithPayload>) -> Result<()> {
        handle_propeller_complete_native_with_payload(ctx)
    }

    #[inline(never)]
    #[access_control(PropellerCreateOwnerTokenAccounts::accounts(&ctx))]
    pub fn propeller_create_owner_token_accounts(ctx: Context<PropellerCreateOwnerTokenAccounts>) -> Result<()> {
        handle_propeller_create_owner_token_accounts(ctx)
    }

    //
    // #[inline(never)]
    // #[access_control(PropellerProcessSwimPayload::accounts(&ctx))]
    // pub fn propeller_process_swim_payload(ctx: Context<PropellerProcessSwimPayload>) -> Result<u64> {
    //     handle_propeller_process_swim_payload(ctx)
    // }

    /// Note: passing in target_token_id here due to PDA seed derivation.
    /// for propeller_process_swim_payload, require_eq!(target_token_id, propeller_message.target_token_id);
    #[inline(never)]
    #[access_control(PropellerProcessSwimPayload::accounts(&ctx, target_token_id))]
    pub fn propeller_process_swim_payload(
        ctx: Context<PropellerProcessSwimPayload>,
        target_token_id: u16,
    ) -> Result<u64> {
        handle_propeller_process_swim_payload(ctx, target_token_id)
    }

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

#[derive(Accounts)]
#[instruction(chain_id:u16, target_address: [u8; 32])]
pub struct CreateChainIdMapping<'info> {
    #[account(
        seeds = [b"propeller".as_ref()],
        bump = propeller.bump,
    )]
    pub propeller: Account<'info, Propeller>,

    #[account(
        constraint = admin.key() == propeller.admin
    )]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        seeds = [
            b"propeller".as_ref(),
            b"chain_map".as_ref(),
            &chain_id.to_le_bytes()
        ],
        bump,
        space = 8 + ChainMap::MAXIMUM_SIZE,
    )]
    pub chain_map: Account<'info, ChainMap>,
    pub system_program: Program<'info, System>,
}

//TODO: not needed anymore since assuming target_address is same across all chains
#[account]
pub struct ChainMap {
    pub chain_id: u16,            // 2
    pub target_address: [u8; 32], // 32
    pub bump: u8,
}
impl ChainMap {
    pub const MAXIMUM_SIZE: usize = 2 + 32;
}

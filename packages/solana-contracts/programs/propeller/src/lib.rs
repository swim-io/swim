use anchor_lang::solana_program::{
    borsh::try_from_slice_unchecked,
    instruction::Instruction,
    program::{get_return_data, invoke, invoke_signed},
    program_option::COption,
    system_instruction::transfer,
    sysvar::SysvarId, // sysvar::Sysvar::to_account_info,
};
// use anchor_lang::solana_program;
use anchor_spl::associated_token::AssociatedToken;
// use anchor_lang::accounts::sysvar::{
//     Sysvar::{Clock, Rent},
//     as_ref,
// };
use anchor_spl::*;
// use solana_program::instruction::Instruction;
// use solana_program::program::invoke_signed;
// use solana_program::program_option::COption;
use constants::TOKEN_COUNT;
// use two_pool::TOKEN_COUNT as TOKEN_COUNT;
use state::{Propeller, PropellerSender};
use {
    crate::two_pool_cpi::{
        add::*, remove_exact_burn::*, remove_exact_output::*, remove_uniform::*,
        swap_exact_input::*, swap_exact_output::*,
    },
    anchor_lang::{prelude::*, solana_program},
    anchor_spl::token::{Mint, Token, TokenAccount},
    error::PropellerError,
    instructions::*,
    solana_program::clock::Epoch,
    token_bridge::{TRANSFER_NATIVE_INSTRUCTION, TRANSFER_WRAPPED_INSTRUCTION, *},
    two_pool::instructions::AddParams,
    wormhole::*,
};

mod constants;
mod env;
pub mod error;
pub mod instructions;
mod state;
mod token_bridge;
mod wormhole;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
// pub const TOKEN_COUNT: usize = 2;
#[program]
pub mod propeller {

    use super::*;
    // use two_pool::TOKEN_COUNT;

    #[inline(never)]
    #[access_control(Initialize::accounts(&ctx, &params))]
    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        handle_initialize(ctx, params)?;
        Ok(())
    }

    #[inline(never)]
    #[access_control(
      CreateTokenIdMap::accounts(
        &ctx,
        target_token_index,
        pool,
        pool_token_index,
        pool_token_mint
    ))]
    pub fn create_token_id_map(
        ctx: Context<CreateTokenIdMap>,
        target_token_index: u16,
        pool: Pubkey,
        pool_token_index: u8,
        pool_token_mint: Pubkey,
        pool_ix: PoolInstruction,
    ) -> Result<()> {
        handle_create_token_id_map(
            ctx,
            target_token_index,
            pool,
            pool_token_index,
            pool_token_mint,
            pool_ix,
        )
        // Ok(())
    }

    pub fn add(
        ctx: Context<Add>,
        input_amounts: [u64; TOKEN_COUNT],
        minimum_mint_amount: u64,
        memo: Vec<u8>,
        propeller_enabled: bool,
        target_chain: u16,
    ) -> Result<u64> {
      handle_add(ctx, input_amounts, minimum_mint_amount, memo.as_slice(), propeller_enabled, target_chain)
    }

    pub fn swap_exact_input(
        ctx: Context<SwapExactInput>,
        // exact_input_amounts: [u64; TOKEN_COUNT],
        exact_input_amount: u64,
        minimum_output_amount: u64,
        memo: Vec<u8>,
        propeller_enabled: bool,
        target_chain: u16,
    ) -> Result<u64> {
        handle_swap_exact_input(
            ctx,
            exact_input_amount,
            minimum_output_amount,
            memo.as_slice(),
            propeller_enabled,
            target_chain
        )
    }

    pub fn swap_exact_output(
        ctx: Context<SwapExactOutput>,
        maximum_input_amount: u64,
        // input_token_index: u8,
        exact_output_amount: u64, // params: SwapExactOutputParams,
        memo: Vec<u8>,
        propeller_enabled: bool,
        target_chain: u16,
    ) -> Result<Vec<u64>> {
        handle_swap_exact_output(
            ctx,
            maximum_input_amount,
            // input_token_index,
            exact_output_amount,
            memo.as_slice(),
            propeller_enabled,
            target_chain
        )
    }

    pub fn remove_uniform(
        ctx: Context<RemoveUniform>,
        exact_burn_amount: u64,
        minimum_output_amounts: [u64; TOKEN_COUNT],
        memo: Vec<u8>,
    ) -> Result<Vec<u64>> {
        handle_remove_uniform(
            ctx,
            exact_burn_amount,
            minimum_output_amounts,
            memo.as_slice(),
        )
    }

    pub fn remove_exact_burn(
        ctx: Context<RemoveExactBurn>,
        exact_burn_amount: u64,
        minimum_output_amount: u64,
        memo: Vec<u8>,
        propeller_enabled: bool,
        target_chain: u16,
    ) -> Result<u64> {
        handle_remove_exact_burn(
            ctx,
            exact_burn_amount,
            minimum_output_amount,
            memo.as_slice(),
            propeller_enabled,
            target_chain,
        )
    }

    pub fn remove_exact_output(
        ctx: Context<RemoveExactOutput>,
        maximum_burn_amount: u64,
        exact_output_amount: u64,
        memo: Vec<u8>,
        propeller_enabled: bool,
        target_chain: u16,
    ) -> Result<Vec<u64>> {
        handle_remove_exact_output(
            ctx,
            maximum_burn_amount,
            exact_output_amount,
            memo.as_slice(),
            propeller_enabled,
            target_chain,
        )
    }

    #[inline(never)]
    #[access_control(TransferNativeWithPayload::accounts(&ctx))]
    pub fn transfer_native_with_payload(
        ctx: Context<TransferNativeWithPayload>,
        nonce: u32,
        target_chain: u16,
        amount: u64,
        target_token_id: u16,
        // target_token: Vec<u8>,
        owner: Vec<u8>,
        gas_kickstart: bool,
        propeller_enabled: bool,
        memo: Vec<u8>,
    ) -> Result<()> {
        handle_transfer_native_with_payload(
            ctx,
            nonce,
            target_chain,
            amount,
            target_token_id,
            // target_token,
            owner,
            gas_kickstart,
            propeller_enabled,
            memo,
        )
    }

    #[inline(never)]
    #[access_control(CompleteNativeWithPayload::accounts(&ctx))]
    pub fn complete_native_with_payload(ctx: Context<CompleteNativeWithPayload>) -> Result<()> {
        handle_complete_native_with_payload(ctx)
        // Ok(())
    }

    //pool_v1 ixs
    // #[access_control(Add::accounts(&ctx))]
    // pub fn add_v1(
    //     ctx: Context<Add>,
    //     pool_add_params: AddParams
    // ) -> Result<()> {
    //     v1::handle_pool_add(ctx, pool_add_params)
    // }
    //
    // #[access_control(SwapExactInput::accounts(&ctx))]
    // pub fn swap_exact_input_v1(
    //     ctx: Context<SwapExactInput>,
    //     pool_swap_exact_input_params: SwapExactInputParams
    // ) -> Result<()> {
    //     v1::handle_pool_swap_exact_input(ctx, pool_swap_exact_input_params)
    // }
    //
    // #[access_control(SwapExactOutput::accounts(&ctx))]
    // pub fn swap_exact_output_v1(
    //     ctx: Context<SwapExactOutput>,
    //     pool_swap_exact_output_params: SwapExactOutputParams
    // ) -> Result<()> {
    //     v1::handle_pool_swap_exact_output(ctx, pool_swap_exact_output_params)
    // }
    //
    // // pool_v2 ixs
    // #[access_control(PoolAdd::accounts(&ctx))]
    // pub fn add_v2(
    //     ctx: Context<PoolAdd>,
    //     pool_add_params: AddParams
    // ) -> Result<()> {
    //     v2::handle_pool_add(ctx, pool_add_params)
    // }
    //
    // #[access_control(PoolSwapExactInput::accounts(&ctx))]
    // pub fn swap_exact_input_v2(
    //     ctx: Context<PoolSwapExactInput>,
    //     pool_swap_exact_input_params: SwapExactInputParams
    // ) -> Result<()> {
    //     v2::handle_pool_swap_exact_input(ctx, pool_swap_exact_input_params)
    // }
    //
    // #[access_control(PoolSwapExactOutput::accounts(&ctx))]
    // pub fn swap_exact_output_v2(
    //     ctx: Context<PoolSwapExactOutput>,
    //     pool_swap_exact_output_params: SwapExactOutputParams
    // ) -> Result<()> {
    //     v2::handle_pool_swap_exact_output(ctx, pool_swap_exact_output_params)
    // }

    // Wormhole Ixs //

    // #[access_control(TransferNativeWithPayload::accounts(&ctx))]
    // pub fn transfer_native_with_payload(
    //     ctx: Context<TransferNativeWithPayload>,
    //     nonce: u32,
    //     target_chain: u16,
    //     amount: u64,
    //     //TODO: this should probably be raw/optimized SwimPayload parameters to save space
    //     payload: Vec<u8>,
    // ) -> Result<()> {
    //     // let payload = vec![0u8; 0];
    //     handle_transfer_native_with_payload(
    //         ctx,
    //         nonce,
    //         target_chain,
    //         amount,
    //         payload
    //     )
    // }

    // #[inline(never)]
    // #[access_control(CompleteToUser::accounts(&ctx))]
    // pub fn complete_to_user(ctx: Context<ProcessSwimPayload>) -> Result<()> {
    //     handle_process_swim_payload(ctx)
    //     // Ok(())
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

    /*
    // pub fn test_wormhole(
    //     ctx: Context<TestWormhole>,
    //     token_chain: u16,
    // ) -> Result<()> {
    //     // let test_pda = &ctx.accounts.test_pda;
    //     let wh_program = &ctx.accounts.wormhole;
    //     let seeds: Vec<Vec<u8>> = vec![
    //         String::from("wrapped").as_bytes().to_vec(),
    //         token_chain.to_be_bytes().to_vec(),
    //         // token_address.to_vec(),
    //     ];
    //     let s: Vec<&[u8]> = seeds.iter().map(|item| item.as_slice()).collect();
    //     let seed_slice = s.as_slice();
    //
    //     let (derived, _bump) = Pubkey::find_program_address(seed_slice, wh_program.key);
    //
    //     require_keys_eq!(ctx.accounts.test_pda.key(), derived);
    //     msg!("test_msg");
    //
    //     msg!("test_pda: {:?}. derived: {:?}", ctx.accounts.test_pda.key(), derived);
    //     Ok(())
    // }
     */

    // Composite Functions //

    // #[inline(never)]
    // #[access_control(AddAndWormholeTransfer::accounts(&ctx))]
    // pub fn add_and_wormhole_transfer(
    //     ctx: Context<AddAndWormholeTransfer>,
    //     input_amounts: [u64; TOKEN_COUNT],
    //     minimum_mint_amount: u64,
    //     nonce: u32,
    //     target_chain: u16,
    //     // payload: Vec<u8>,
    // ) -> Result<()> {
    //     let payload = vec![0u8; 2];
    //     let pool_add_and_wormhole_transfer_params = PoolAddAndWormholeTransferParams {
    //         input_amounts,
    //         minimum_mint_amount,
    //         nonce,
    //         target_chain,
    //         payload,
    //     };
    //     handle_add_and_wormhole_transfer(
    //         ctx,
    //         pool_add_and_wormhole_transfer_params,
    //     )
    // }

    // #[inline(never)]
    // pub fn swap_exact_input_and_transfer(
    //     ctx: Context<SwapExactInputAndTransfer>,
    //     pool_swap_exact_input_params: PropellerSwapExactInputParams,
    //     nonce: u32,
    //     target_chain: u16,
    //     // payload: Vec<u8>,
    // ) -> Result<()> {
    //     handle_swap_exact_input_and_transfer(
    //         &ctx,
    //         pool_swap_exact_input_params,
    //         nonce,
    //         target_chain,
    //         vec![0u8; 0],
    //         // payload,
    //     )
    // }

    // #[inline(never)]
    // pub fn swap_exact_output_and_transfer(
    //     ctx: Context<SwapExactOutputAndTransfer>,
    //     swap_exact_output_params: SwapExactOutputParams,
    // ) -> Result<()> {
    //     Ok(())
    // }
}

//
// #[derive(Accounts)]
// pub struct Initialize<'info> {
//     #[account(
//         init,
//         payer = payer,
//         seeds = [
//             b"propeller".as_ref(),
//             token_bridge_mint.key().as_ref(),
//         ],
//         bump,
//         space = 8 + Propeller::MAXIMUM_SIZE,
//     )]
//     pub propeller: Account<'info, Propeller>,
//     #[account(
//         init,
//         payer = payer,
//         seeds = [b"sender".as_ref()],
//         bump,
//         space = 8 + Propeller::MAXIMUM_SIZE,
//     )]
//     /// CHECK: propeller wormhole sender account
//     pub propeller_sender: Account<'info, PropellerSender>,
//     pub admin: Signer<'info>,
//     pub token_bridge_mint: Account<'info, Mint>,
//     #[account(mut)]
//     pub payer: Signer<'info>,
//     pub system_program: Program<'info, System>,
// }
//
// impl<'info> Initialize<'info> {
//     pub fn handle_initialize(&mut self, bumps: &std::collections::BTreeMap<String, u8>,) -> Result<()> {
//         self.propeller.nonce = 0;
//         self.propeller.bump = *bumps.get("propeller").unwrap();
//         self.propeller.admin = self.admin.key();
//         self.propeller.token_bridge_mint = self.token_bridge_mint.key();
//
//         self.propeller_sender.bump = *bumps.get("propeller_sender").unwrap();
//         Ok(())
//     }
// }

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

// #[derive(Accounts)]
// pub struct SwapExactOutputAndTransfer<'info> {
//     #[account(mut)]
//     pub payer: Signer<'info>
// }
//
// #[derive(AnchorSerialize, AnchorDeserialize)]
// pub struct SwapExactOutputParams {
//     maximum_input_amount: u64,
//     input_token_index: u8,
//     exact_output_amounts: [u64; TOKEN_COUNT],
// }
//
// }
//
// // Do this first.
// #[derive(Accounts)]
// pub struct RemovePoolLiquidity<'info> {
//     #[account(mut)]
//     pub payer: Signer<'info>
// }
//
// // CompleteTransfer and burn swimUSD for spl-usdc, spl-usdt, or both
// #[derive(Accounts)]
// pub struct CompleteAndRemove<'info> {
//     #[account(mut)]
//     pub payer: Signer<'info>
// }
//
// // maybe for a solana metapool?
// #[derive(Accounts)]
// pub struct CompleteAndSwap<'info> {
//     #[account(mut)]
//     pub payer: Signer<'info>
// }
//
// // only receive swimUSD?
// #[derive(Accounts)]
// pub struct CompleteOnly<'info> {
//     #[account(mut)]
//     pub payer: Signer<'info>
// }
//
// #[derive(Accounts)]
// pub struct CompleteAndDoSomeShit<'info> {
//     #[account(mut)]
//     pub payer: Signer<'info>
// }

// Note: from wormhole-nativeswap-example
// #[derive(Accounts)]
// pub struct CompleteWithSwap {}
//
// #[derive(Accounts)]
// pub struct CompleteWithNoSwap {}

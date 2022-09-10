use {
    crate::{Wormhole, VERIFY_SIGNATURES_INSTRUCTION},
    anchor_lang::{
        prelude::*,
        solana_program::{instruction::Instruction, program::invoke, secp256k1_program, sysvar::SysvarId},
    },
};

#[derive(Accounts)]
#[instruction(secp_payload: Vec<u8>, guardian_set_index: u32, verify_signatures_data: VerifySignaturesData)]
pub struct Secp256k1AndVerify<'info> {
    #[account(executable, address = secp256k1_program::id())]
    /// CHECK: secp256k1 program
    pub secp256k1_program: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
    seeds = [
      b"GuardianSet".as_ref(),
      guardian_set_index.to_be_bytes().as_ref()
    ],
    bump,
    seeds::program = wormhole.key()
    )]
    ///CHECK: Guardian set. Checked in cpi.
    pub guardian_set: UncheckedAccount<'info>,
    #[account(mut)]
    pub signature_set: Signer<'info>,

    // pub instructions: Sysvar<'info, Instructions>,
    #[account(executable, address = Instructions::id())]
    ///CHECK: Instructions sysvar
    pub instructions: UncheckedAccount<'info>,
    //explicitly needed for initializing associated token accounts
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub wormhole: Program<'info, Wormhole>,
}

impl<'info> Secp256k1AndVerify<'info> {
    pub fn accounts(ctx: &Context<Secp256k1AndVerify>) -> Result<()> {
        Ok(())
    }
}

pub const MAX_LEN_GUARDIAN_KEYS: usize = 19;

#[derive(Default, AnchorSerialize, AnchorDeserialize)]
pub struct VerifySignaturesData {
    /// instruction indices of signers (-1 for missing)
    pub signers: [i8; MAX_LEN_GUARDIAN_KEYS],
}

pub fn handle_secp256k1_and_verify(
    ctx: Context<Secp256k1AndVerify>,
    secp_payload: Vec<u8>,
    guardian_set_index: u32,
    verify_signatures_data: VerifySignaturesData,
) -> Result<()> {
    let test = secp256k1_program::id();
    let secp_ix =
        Instruction { program_id: ctx.accounts.secp256k1_program.key(), accounts: vec![], data: secp_payload };
    invoke(&secp_ix, &[])?;
    let verify_ix = Instruction {
        program_id: ctx.accounts.wormhole.key(),
        accounts: vec![
            AccountMeta::new(ctx.accounts.payer.key(), true),
            AccountMeta::new_readonly(ctx.accounts.guardian_set.key(), false),
            AccountMeta::new(ctx.accounts.signature_set.key(), true),
            AccountMeta::new_readonly(ctx.accounts.instructions.key(), false),
            AccountMeta::new_readonly(ctx.accounts.rent.key(), false),
            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
        ],
        data: (VERIFY_SIGNATURES_INSTRUCTION, verify_signatures_data).try_to_vec()?,
    };
    invoke(
        &verify_ix,
        &[
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.guardian_set.to_account_info(),
            ctx.accounts.signature_set.to_account_info(),
            ctx.accounts.instructions.to_account_info(),
            ctx.accounts.rent.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    Ok(())
}

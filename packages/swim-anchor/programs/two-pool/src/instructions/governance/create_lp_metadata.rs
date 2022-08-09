use {
    crate::{common_governance::*, error::*, gen_pool_signer_seeds, AnchorDataV2, TwoPool},
    anchor_lang::prelude::*,
    anchor_spl::{
        metadata::{create_metadata_accounts_v2, CreateMetadataAccountsV2, Metadata},
        token::Mint,
    },
    mpl_token_metadata::state::{DataV2, PREFIX},
};

#[derive(Accounts)]
pub struct CreateLpMetadata<'info> {
    pub common_governance: CommonGovernance<'info>,
    /// this didn't work for some reason.
    pub create_metadata_accounts: CreateMetadataAccounts<'info>,
    // /// CHECK: Checked in CPI
    // pub metadata: AccountInfo<'info>,
    // pub mint: Account<'info, Mint>,
    // // pub mint_authority: AccountInfo<'info>,
    // #[account(mut)]
    // pub payer: Signer<'info>,
    // // ///CHECK: Checked in CPI
    // // pub update_authority: AccountInfo<'info>,
    // pub system_program: Program<'info, System>,
    // pub rent: Sysvar<'info, Rent>,
    #[account(
  executable,
  address = Metadata::id()
  )]
    ///CHECK: mpl_token_metadata program
    pub mpl_token_metadata: Program<'info, Metadata>,
}

//pub fn find_metadata_account(mint: &Pubkey) -> (Pubkey, u8) {
//     Pubkey::find_program_address(
//         &[PREFIX.as_bytes(), crate::id().as_ref(), mint.as_ref()],
//         &crate::id(),
//     )
// }

#[derive(Accounts)]
pub struct CreateMetadataAccounts<'info> {
    #[account(mut)]
    /// CHECK: Checked in CPI
    pub metadata: UncheckedAccount<'info>,
    pub mint: Account<'info, Mint>,
    /// CHECK: Checked in CPI
    pub mint_authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    ///CHECK: Checked in CPI
    pub update_authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> CreateMetadataAccounts<'info> {
    pub fn to_create_metadata_accounts_v2(&self) -> CreateMetadataAccountsV2<'info> {
        CreateMetadataAccountsV2 {
            metadata: self.metadata.to_account_info(),
            mint: self.mint.to_account_info(),
            mint_authority: self.mint_authority.to_account_info(),
            payer: self.payer.to_account_info(),
            update_authority: self.update_authority.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        }
    }
}

// impl<'info> From<CreateMetadataAccounts> for CreateMetadataAccountsV2<'info> {
//   fn from(ctx: Context<CreateMetadataAccounts>) -> Self<'info> {
//     CreateMetadataAccountsV2 {
//       metadata: ctx.accounts.metadata.to_account_info(),
//       mint: ctx.accounts.mint.to_account_info(),
//       mint_authority: ctx.accounts.mint_authority.to_account_info(),
//       payer: ctx.accounts.payer.to_account_info(),
//       update_authority: ctx.accounts.update_authority.to_account_info(),
//       system_program: ctx.accounts.system_program.to_account_info(),
//       rent: ctx.accounts.rent.to_account_info(),
//     }
//   }
//
//   fn from(accounts: CreateMetadataAccounts) -> Self {
//     CreateMetadataAccountsV2 {
//       metadata: accounts.metadata.to_account_info(),
//       mint: accounts.mint.to_account_info(),
//       mint_authority: accounts.mint_authority.to_account_info(),
//       payer: accounts.payer.to_account_info(),
//       update_authority: accounts.update_authority.to_account_info(),
//       system_program: accounts.system_program.to_account_info(),
//       rent: accounts.rent.to_account_info(),
//     }
//   }
// }

impl<'info> CreateLpMetadata<'info> {
    pub fn accounts(ctx: &Context<CreateLpMetadata>) -> Result<()> {
        CommonGovernance::accounts(&ctx.accounts.common_governance)?;
        require_keys_eq!(
            ctx.accounts.common_governance.pool.lp_mint_key.key(),
            ctx.accounts.create_metadata_accounts.mint.key(),
            PoolError::InvalidMintAccount
        );
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateLpMetadataParams {
    data: AnchorDataV2,
    is_mutable: bool,
    //default to true? update auth is pool state itself and should be a signer
    update_authority_is_signer: bool,
}

pub fn handle_create_lp_metadata(
    ctx: Context<CreateLpMetadata>,
    params: CreateLpMetadataParams,
) -> Result<()> {
    create_metadata_accounts_v2(
        CpiContext::new_with_signer(
            ctx.accounts.mpl_token_metadata.to_account_info(),
            ctx.accounts
                .create_metadata_accounts
                .to_create_metadata_accounts_v2(),
            &[&gen_pool_signer_seeds!(ctx.accounts.common_governance.pool)[..]],
        ),
        params.data.into(),
        params.is_mutable,
        params.update_authority_is_signer,
    )?;
    Ok(())
}

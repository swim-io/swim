use {
    crate::{common_governance::*, gen_pool_signer_seeds, AnchorDataV2},
    anchor_lang::prelude::*,
    anchor_spl::{
        metadata::{
            update_metadata_accounts_v2, Metadata,
            UpdateMetadataAccountsV2,
        },
    },
};

#[derive(Accounts)]
pub struct UpdateLpMetadata<'info> {
    pub common_governance: CommonGovernance<'info>,
    pub update_metadata_accounts: UpdateMetadataAccounts<'info>,
    #[account(
    executable,
    address = Metadata::id()
    )]
    ///CHECK: mpl_token_metadata program
    pub mpl_token_metadata: Program<'info, Metadata>,
}

impl<'info> UpdateLpMetadata<'info> {
    pub fn accounts(ctx: &Context<UpdateLpMetadata>) -> Result<()> {
        CommonGovernance::accounts(&ctx.accounts.common_governance)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct UpdateMetadataAccounts<'info> {
    #[account(mut)]
    ///CHECK: Checked in CPI
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: Checked in CPI
    pub update_authority: UncheckedAccount<'info>,
}

impl<'info> UpdateMetadataAccounts<'info> {
    pub fn to_update_metadata_accounts_v2(&self) -> UpdateMetadataAccountsV2<'info> {
        UpdateMetadataAccountsV2 {
            metadata: self.metadata.to_account_info(),
            update_authority: self.update_authority.to_account_info(),
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateLpMetadataParams {
    pub new_update_authority: Option<Pubkey>,
    pub data: Option<AnchorDataV2>,
    pub primary_sale_happened: Option<bool>,
    pub is_mutable: Option<bool>,
}

pub fn handle_update_lp_metadata(ctx: Context<UpdateLpMetadata>, params: UpdateLpMetadataParams) -> Result<()> {
    update_metadata_accounts_v2(
        CpiContext::new_with_signer(
            ctx.accounts.mpl_token_metadata.to_account_info(),
            ctx.accounts.update_metadata_accounts.to_update_metadata_accounts_v2(),
            &[&gen_pool_signer_seeds!(ctx.accounts.common_governance.pool)[..]],
        ),
        params.new_update_authority,
        params.data.map(|data| data.into()),
        params.primary_sale_happened,
        params.is_mutable,
    )
}

use {
    crate::{error::*, gen_pool_signer_seeds, governance::*},
    anchor_lang::prelude::*,
    anchor_spl::{
        metadata::{
            create_metadata_accounts_v2, update_metadata_accounts_v2, CreateMetadataAccountsV2, Metadata,
            UpdateMetadataAccountsV2,
        },
        token::Mint,
    },
    mpl_token_metadata::state::{Collection, Creator, DataV2, UseMethod, Uses},
};

#[derive(Accounts)]
pub struct CreateLpMetadata<'info> {
    pub governance: Governance<'info>,
    /// this didn't work for some reason.
    pub create_metadata_accounts: CreateMetadataAccounts<'info>,
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
        require_keys_eq!(
            ctx.accounts.governance.pool.lp_mint_key.key(),
            ctx.accounts.create_metadata_accounts.mint.key(),
            PoolError::InvalidMintAccount
        );
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateLpMetadataParams {
    pub data: AnchorDataV2,
    pub is_mutable: bool,
    //default to true? update auth is pool state itself and should be a signer
    pub update_authority_is_signer: bool,
}

pub fn handle_create_lp_metadata(ctx: Context<CreateLpMetadata>, params: CreateLpMetadataParams) -> Result<()> {
    create_metadata_accounts_v2(
        CpiContext::new_with_signer(
            ctx.accounts.mpl_token_metadata.to_account_info(),
            ctx.accounts.create_metadata_accounts.to_create_metadata_accounts_v2(),
            &[&gen_pool_signer_seeds!(ctx.accounts.governance.pool)[..]],
        ),
        params.data.into(),
        params.is_mutable,
        params.update_authority_is_signer,
    )?;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateLpMetadata<'info> {
    pub governance: Governance<'info>,
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
            &[&gen_pool_signer_seeds!(ctx.accounts.governance.pool)[..]],
        ),
        params.new_update_authority,
        params.data.map(|data| data.into()),
        params.primary_sale_happened,
        params.is_mutable,
    )
}

// copied from https://github.com/CalebEverett/nftfactory/blob/master/programs/nftfactory/src/lib.rs

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Clone)]
pub struct AnchorDataV2 {
    /// The name of the asset
    pub name: String,
    /// The symbol for the asset
    pub symbol: String,
    /// URI pointing to JSON representing the asset
    pub uri: String,
    /// Royalty basis points that goes to creators in secondary sales (0-10000)
    pub seller_fee_basis_points: u16,
    /// Array of creators, optional
    pub creators: Option<Vec<AnchorCreator>>,
    /// Collection
    pub collection: Option<AnchorCollection>,
    /// Uses
    pub uses: Option<AnchorUses>,
}

impl From<AnchorDataV2> for DataV2 {
    fn from(item: AnchorDataV2) -> Self {
        DataV2 {
            name: item.name,
            symbol: item.symbol,
            uri: item.uri,
            seller_fee_basis_points: item.seller_fee_basis_points,
            creators: item.creators.map(|a| a.into_iter().map(|v| v.into()).collect()),
            collection: item.collection.map(|v| v.into()),
            uses: item.uses.map(|v| v.into()),
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Clone, Copy)]
pub struct AnchorCreator {
    pub address: Pubkey,
    pub verified: bool,
    // In percentages, NOT basis points ;) Watch out!
    pub share: u8,
}

impl From<AnchorCreator> for Creator {
    fn from(item: AnchorCreator) -> Self {
        Creator { address: item.address, verified: item.verified, share: item.share }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Clone, Copy)]
pub enum AnchorUseMethod {
    Burn,
    Multiple,
    Single,
}

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Clone, Copy)]
pub struct AnchorUses {
    pub use_method: AnchorUseMethod,
    pub remaining: u64,
    pub total: u64,
}

impl From<AnchorUses> for Uses {
    fn from(item: AnchorUses) -> Self {
        Uses { use_method: item.use_method.into(), remaining: item.remaining, total: item.total }
    }
}

impl From<AnchorUseMethod> for UseMethod {
    fn from(item: AnchorUseMethod) -> Self {
        match item {
            AnchorUseMethod::Burn => UseMethod::Burn,
            AnchorUseMethod::Multiple => UseMethod::Burn,
            AnchorUseMethod::Single => UseMethod::Burn,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Clone, Copy)]
pub struct AnchorCollection {
    pub verified: bool,
    pub key: Pubkey,
}

impl From<AnchorCollection> for Collection {
    fn from(item: AnchorCollection) -> Self {
        Collection { verified: item.verified, key: item.key }
    }
}

use {
    anchor_lang::prelude::*,
    mpl_token_metadata::state::{Collection, Creator, DataV2, UseMethod, Uses},
};

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

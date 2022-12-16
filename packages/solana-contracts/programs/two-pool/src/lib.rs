use {
    crate::{
        amp_factor::AmpFactor,
        // decimal::{DecimalError, DecimalU64},
        decimal::DecimalU64,
        error::PoolError,
        instructions::*,
        pool_fee::PoolFee,
        state::TwoPool,
    },
    anchor_lang::prelude::*,
    rust_decimal::Decimal,
};

pub mod amp_factor;
mod common;
pub mod decimal;
pub mod error;
pub mod instructions;
pub mod invariant;
pub mod pool_fee;
pub mod state;

// #[macro_use]
mod macros;

pub const TOKEN_COUNT: usize = 2;

//TODO: option to have separate programIds depending on cluster. probably not needed and should keep the same
//  programId for all environments
// https://solana.stackexchange.com/questions/848/how-to-have-a-different-program-id-depending-on-the-cluster
// #[cfg(feature = "mainnet")]
// declare_id!("8ghymvPffJbkLHqYfSKdE8moRH5gSf4AQav9qtZfu77H");
// #[cfg(not(feature = "mainnet"))]
// declare_id!("DLANS7Qh31fFWLujEMtn5kyd87H8ZUbhwtfMurrSHYn9");
// declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
declare_id!("8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM");

solana_security_txt::security_txt! {
    // Required fields
    name: "Swim.io",
    project_url: "https://swim.io/",
    contacts: "email:admin@swim.io",
    policy: "https://swim.io/security",

    // Optional fields
    preferred_languages: "en",
    encryption: "https://swim.io/pgp-key.txt",
    expiry: "2026-04-28T05:00:00.000Z",
    auditors: "Kudelski"
}

#[program]
pub mod two_pool {
    use super::*;

    #[access_control(Initialize::accounts(&ctx))]
    pub fn initialize(
        ctx: Context<Initialize>,
        amp_factor: DecimalU64Anchor,
        lp_fee: DecimalU64Anchor,
        governance_fee: DecimalU64Anchor,
    ) -> Result<()> {
        handle_initialize(ctx, amp_factor, lp_fee, governance_fee)
    }

    // #[access_control(AddOrRemove::accounts(&ctx))]
    pub fn add(ctx: Context<AddOrRemove>, input_amounts: [u64; TOKEN_COUNT], minimum_mint_amount: u64) -> Result<u64> {
        let params = AddParams { input_amounts, minimum_mint_amount };
        handle_add(ctx, params)
        // handle_add(ctx, input_amounts, minimum_mint_amount)
    }

    // #[access_control(ctx.accounts.validate())]
    pub fn swap_exact_input(
        ctx: Context<Swap>,
        exact_input_amounts: [u64; TOKEN_COUNT],
        output_token_index: u8,
        minimum_output_amount: u64,
        // params: SwapExactInputParams,
    ) -> Result<u64> {
        let params = SwapExactInputParams { exact_input_amounts, output_token_index, minimum_output_amount };
        handle_swap_exact_input(ctx, params)
        // let output_token_index = params.output_token_index as usize;
        // let exact_input_amounts = params.exact_input_amounts;
        // let minimum_output_amount = params.minimum_output_amount;
        // handle_swap_exact_input(ctx, params)
    }

    // #[access_control(ctx.accounts.validate())]
    pub fn swap_exact_output(
        ctx: Context<Swap>,
        maximum_input_amount: u64,
        input_token_index: u8,
        exact_output_amounts: [u64; TOKEN_COUNT], // params: SwapExactOutputParams,
    ) -> Result<Vec<u64>> {
        let params = SwapExactOutputParams { maximum_input_amount, input_token_index, exact_output_amounts };
        handle_swap_exact_output(ctx, params)
    }

    pub fn remove_uniform(
        ctx: Context<AddOrRemove>,
        exact_burn_amount: u64,
        minimum_output_amounts: [u64; TOKEN_COUNT],
    ) -> Result<Vec<u64>> {
        let params = RemoveUniformParams { exact_burn_amount, minimum_output_amounts };
        handle_remove_uniform(ctx, params)
    }

    pub fn remove_exact_burn(
        ctx: Context<AddOrRemove>,
        exact_burn_amount: u64,
        output_token_index: u8,
        minimum_output_amount: u64,
        // params: RemoveExactBurnParams,
    ) -> Result<u64> {
        let params = RemoveExactBurnParams { exact_burn_amount, output_token_index, minimum_output_amount };
        handle_remove_exact_burn(ctx, params)
    }

    pub fn remove_exact_output(
        ctx: Context<AddOrRemove>,
        maximum_burn_amount: u64,
        exact_output_amounts: [u64; TOKEN_COUNT],
    ) -> Result<Vec<u64>> {
        let params = RemoveExactOutputParams { maximum_burn_amount, exact_output_amounts };
        handle_remove_exact_output(ctx, params)
    }

    //Note: using 2 instead of TOKEN_COUNT const since anchor can't handle it properly.
    #[access_control(MarginalPrices::accounts(&ctx))]
    pub fn marginal_prices(ctx: Context<MarginalPrices>) -> Result<[BorshDecimal; 2]> {
        handle_marginal_prices(ctx)
    }

    /** Governance Ixs **/

    pub fn adjust_amp_factor(
        // ctx: Context<AdjustAmpFactor>,
        ctx: Context<Governance>,
        target_ts: i64,
        target_value: DecimalU64Anchor,
        // params: AdjustAmpFactorParams,
    ) -> Result<()> {
        let params = AdjustAmpFactorParams { target_ts, target_value };
        handle_adjust_amp_factor(ctx, params)
    }

    pub fn prepare_fee_change(
        ctx: Context<Governance>,
        lp_fee: DecimalU64Anchor,
        governance_fee: DecimalU64Anchor,
    ) -> Result<()> {
        handle_prepare_fee_change(ctx, lp_fee, governance_fee)
    }

    pub fn enact_fee_change(ctx: Context<Governance>) -> Result<()> {
        handle_enact_fee_change(ctx)
    }

    pub fn change_governance_fee_account(
        ctx: Context<ChangeGovernanceFeeAccount>,
        new_governance_fee_key: Pubkey,
    ) -> Result<()> {
        handle_change_governance_fee_account(ctx, new_governance_fee_key)
    }

    pub fn prepare_governance_transition(
        ctx: Context<PrepareGovernanceTransition>,
        upcoming_governance_key: Pubkey,
    ) -> Result<()> {
        handle_prepare_governance_transition(ctx, upcoming_governance_key)
    }

    pub fn enact_governance_transition(ctx: Context<Governance>) -> Result<()> {
        handle_enact_governance_transition(ctx)
    }

    pub fn change_pause_key(ctx: Context<ChangePauseKey>, new_pause_key: Pubkey) -> Result<()> {
        handle_change_pause_key(ctx, new_pause_key)
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        handle_set_paused(ctx, paused)
    }

    #[access_control(CreateLpMetadata::accounts(&ctx))]
    pub fn create_lp_metadata(
        ctx: Context<CreateLpMetadata>,
        data: AnchorDataV2,
        is_mutable: bool,
        update_authority_is_signer: bool,
        // params: CreateLpMetadataParams,
    ) -> Result<()> {
        let params = CreateLpMetadataParams { data, is_mutable, update_authority_is_signer };
        handle_create_lp_metadata(ctx, params)
    }

    #[access_control(UpdateLpMetadata::accounts(&ctx))]
    pub fn update_lp_metadata(
        ctx: Context<UpdateLpMetadata>,
        new_update_authority: Option<Pubkey>,
        data: Option<AnchorDataV2>,
        primary_sale_happened: Option<bool>,
        is_mutable: Option<bool>,
        // params: UpdateLpMetadataParams,
    ) -> Result<()> {
        let params = UpdateLpMetadataParams { new_update_authority, data, primary_sale_happened, is_mutable };
        handle_update_lp_metadata(ctx, params)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug, Default)]
pub struct DecimalU64Anchor {
    pub value: u64,
    pub decimals: u8,
    //TODO DecimalU64Anchor must ensure that decimals is <= 19 (= DecimalU64::MAX_DECIMALS)
}

impl DecimalU64Anchor {
    pub const LEN: usize = 8 + 1;
}

impl From<DecimalU64> for DecimalU64Anchor {
    fn from(v: DecimalU64) -> Self {
        assert!(v.get_decimals() <= DecimalU64::MAX_DECIMALS);
        // require_gte!(DecimalU64::MAX_DECIMALS, v.get_decimals(), DecimalError::MaxDecimalsExceeded);
        Self { value: v.get_raw(), decimals: v.get_decimals() }
    }
}

impl From<DecimalU64Anchor> for DecimalU64 {
    fn from(v: DecimalU64Anchor) -> Self {
        assert!(v.decimals <= DecimalU64::MAX_DECIMALS);
        // require_gte!(DecimalU64::MAX_DECIMALS, v.decimals, DecimalError::MaxDecimalsExceeded);
        //unwrap is only safe one DecimalU64Anchor enforces decimals upper bound of 19
        Self::new(v.value, v.decimals).unwrap()
    }
}

impl TryInto<BorshDecimal> for DecimalU64 {
    type Error = anchor_lang::error::Error;
    fn try_into(self) -> anchor_lang::Result<BorshDecimal> {
        Decimal::try_from_i128_with_scale(self.get_raw() as i128, self.get_decimals() as u32)
            .map(|d| BorshDecimal { mantissa: d.mantissa(), scale: d.scale() })
            .map_err(|_| error!(PoolError::MaxDecimalsExceeded))
    }
}

#[derive(Default, Eq, PartialEq, Copy, Clone, AnchorSerialize, AnchorDeserialize, Debug)]
pub struct BorshDecimal {
    pub mantissa: i128,
    pub scale: u32,
}

impl TryFrom<BorshDecimal> for DecimalU64 {
    type Error = anchor_lang::error::Error;
    fn try_from(v: BorshDecimal) -> anchor_lang::Result<Self> {
        assert!(v.scale <= DecimalU64::MAX_DECIMALS as u32);
        assert!(v.mantissa <= u64::MAX as i128);
        Self::new(v.mantissa as u64, v.scale as u8).map_err(|_| error!(PoolError::ConversionError))
    }
}

impl TryFrom<BorshDecimal> for Decimal {
    type Error = anchor_lang::error::Error;
    fn try_from(v: BorshDecimal) -> anchor_lang::Result<Self> {
        assert!(v.scale <= DecimalU64::MAX_DECIMALS as u32);
        assert!(v.mantissa <= u64::MAX as i128);
        Decimal::try_from_i128_with_scale(v.mantissa, v.scale).map_err(|_| error!(PoolError::ConversionError))
    }
}

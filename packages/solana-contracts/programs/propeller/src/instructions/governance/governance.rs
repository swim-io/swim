use {
    crate::{constants::ENACT_DELAY, error::*, Propeller},
    anchor_lang::prelude::*,
    two_pool::DecimalU64Anchor,
};

#[derive(Accounts)]
pub struct Governance<'info> {
    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    propeller.swim_usd_mint.as_ref(),
    ],
    bump = propeller.bump,
    has_one = governance_key @ PropellerError::InvalidPropellerGovernanceKey,
    )]
    pub propeller: Account<'info, Propeller>,
    pub governance_key: Signer<'info>,
}

#[derive(Accounts)]
pub struct PrepareGovernanceTransition<'info> {
    pub governance: Governance<'info>,
    ///CHECK: not specifying type of account since it doesn't matter
    pub upcoming_governance_key: UncheckedAccount<'info>,
}
pub fn handle_prepare_governance_transition(
    ctx: Context<PrepareGovernanceTransition>,
    upcoming_governance_key: Pubkey,
) -> Result<()> {
    let propeller = &mut ctx.accounts.governance.propeller;
    require_keys_eq!(
        ctx.accounts.upcoming_governance_key.key(),
        upcoming_governance_key,
        PropellerError::InvalidUpcomingGovernanceKey
    );
    require_keys_neq!(upcoming_governance_key, Pubkey::default(), PropellerError::InvalidUpcomingGovernanceKey);
    propeller.prepared_governance_key = upcoming_governance_key;
    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64);
    propeller.governance_transition_ts = current_ts + ENACT_DELAY;
    Ok(())
}

pub fn handle_enact_governance_transition(ctx: Context<Governance>) -> Result<()> {
    let propeller = &mut ctx.accounts.propeller;
    require_neq!(propeller.governance_transition_ts, 0i64, PropellerError::InvalidEnact);
    require_keys_neq!(propeller.prepared_governance_key, Pubkey::default(), PropellerError::InvalidEnact);

    let current_ts = Clock::get()?.unix_timestamp;

    require_gt!(current_ts, 0i64);
    require_gt!(current_ts, propeller.governance_transition_ts, PropellerError::InsufficientDelay);

    propeller.governance_key = propeller.prepared_governance_key;
    propeller.prepared_governance_key = Pubkey::default();
    propeller.governance_transition_ts = 0i64;

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct FeeUpdates {
    pub secp_verify_init_fee: Option<u64>,
    pub secp_verify_fee: Option<u64>,
    pub post_vaa_fee: Option<u64>,
    pub init_ata_fee: Option<u64>,
    pub complete_with_payload_fee: Option<u64>,
    pub process_swim_payload_fee: Option<u64>,
}

/* Update Fees */

pub fn handle_update_fees(ctx: Context<Governance>, fee_updates: FeeUpdates) -> Result<()> {
    Ok(())
}

pub fn handle_update_gas_kickstart_amount(ctx: Context<Governance>, new_gas_kickstart_amount: u64) -> Result<()> {
    let propeller = &mut ctx.accounts.propeller;
    propeller.gas_kickstart_amount = new_gas_kickstart_amount;
    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GasOracleUpdates {
    pub aggregator: Option<Pubkey>,
    pub max_staleness: Option<i64>,
    pub max_confidence_interval: Option<i64>,
    pub fallback_oracle: Option<Pubkey>,
}

// TODO: bundle marginal pool in this update as well.
// if you update the marginal pool, may need to update gas oracle as well for new intermediate token
// e.g. update marginal pool to swimUSD/uxd pool, oracle needs to give sol/uxd price
// pub fn handle_update_gas_oracle(ctx: Context<Governance>, gas_oracle_updates: GasOracleUpdates) -> Result<()> {
//     let propeller = &mut ctx.accounts.propeller;
//     propeller.gas_oracle = new_gas_oracle;
//     Ok(())
// }

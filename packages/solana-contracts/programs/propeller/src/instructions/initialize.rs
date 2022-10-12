use {
    crate::{error::*, Propeller},
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::{create, AssociatedToken, Create},
        token::{Mint, Token, TokenAccount},
    },
    switchboard_v2::{AggregatorAccountData, SWITCHBOARD_PROGRAM_ID},
    two_pool::state::TwoPool,
};

//TODO: add fee vault.
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
    init,
    payer = payer,
    seeds = [ b"propeller".as_ref(), swim_usd_mint.key().as_ref() ],
    bump,
    space = 8 + Propeller::LEN,
    )]
    pub propeller: Box<Account<'info, Propeller>>,
    // TODO: does this account need to be initialized?
    #[account(seeds = [b"sender".as_ref()], bump)]
    pub propeller_sender: SystemAccount<'info>,
    #[account(seeds = [b"redeemer".as_ref()], bump)]
    pub propeller_redeemer: SystemAccount<'info>,
    #[account(
    init,
    payer = payer,
    associated_token::mint = swim_usd_mint,
    associated_token::authority = propeller_redeemer,
    )]
    pub propeller_redeemer_escrow: Box<Account<'info, TokenAccount>>,

    #[account(
    init,
    payer = payer,
    associated_token::mint = swim_usd_mint,
    associated_token::authority = propeller,
    )]
    pub propeller_fee_vault: Box<Account<'info, TokenAccount>>,

    pub admin: Signer<'info>,
    pub swim_usd_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    pool_token_mint_0.key().as_ref(),
    pool_token_mint_1.key().as_ref(),
    lp_mint.key().as_ref(),
    ],
    bump = pool.bump,
    seeds::program = two_pool_program.key()
    )]
    pub pool: Box<Account<'info, TwoPool>>,
    pub pool_token_mint_0: Box<Account<'info, Mint>>,
    pub pool_token_mint_1: Box<Account<'info, Mint>>,
    pub lp_mint: Box<Account<'info, Mint>>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,

    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Initialize<'info> {
    pub fn accounts(ctx: &Context<Initialize>, params: &InitializeParams) -> Result<()> {
        require_keys_eq!(ctx.accounts.pool.key(), params.marginal_price_pool);
        require_keys_eq!(
            ctx.accounts.pool.token_mint_keys[params.marginal_price_pool_token_index as usize],
            params.marginal_price_pool_token_mint
        );
        //TODO: verify that propeller.swim_usd_mint is either pool.lpMint or pool.token_mint[0].
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Debug)]
pub struct InitializeParams {
    pub gas_kickstart_amount: u64,
    pub secp_verify_init_fee: u64,
    pub secp_verify_fee: u64,
    pub post_vaa_fee: u64,
    pub complete_with_payload_fee: u64,
    pub init_ata_fee: u64,
    pub process_swim_payload_fee: u64,
    // pub propeller_min_transfer_amount: u64,
    // pub propeller_eth_min_transfer_amount: u64,
    pub marginal_price_pool: Pubkey,
    pub marginal_price_pool_token_index: u8,
    pub marginal_price_pool_token_mint: Pubkey,
    pub max_staleness: i64,
    // pub evm_routing_contract_address: [u8; 32],
}

pub fn handle_initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
    // let pool = &ctx.accounts.pool;
    // let mint0 = pool.get_token_mint_0().unwrap();
    let propeller = &mut ctx.accounts.propeller;
    propeller.bump = *ctx.bumps.get("propeller").unwrap();
    propeller.nonce = 0;
    propeller.admin = ctx.accounts.admin.key();
    //TODO: these should be passed in as params or read based on features used when deploying?
    propeller.wormhole = propeller.wormhole()?;
    propeller.token_bridge = propeller.token_bridge()?;
    propeller.swim_usd_mint = ctx.accounts.swim_usd_mint.key();

    propeller.sender_bump = *ctx.bumps.get("propeller_sender").unwrap();
    propeller.redeemer_bump = *ctx.bumps.get("propeller_redeemer").unwrap();

    propeller.gas_kickstart_amount = params.gas_kickstart_amount;
    propeller.init_ata_fee = params.init_ata_fee;
    propeller.secp_verify_init_fee = params.secp_verify_init_fee;
    propeller.secp_verify_fee = params.secp_verify_fee;
    propeller.post_vaa_fee = params.post_vaa_fee;
    propeller.complete_with_payload_fee = params.complete_with_payload_fee;
    propeller.process_swim_payload_fee = params.process_swim_payload_fee;
    // propeller.propeller_min_transfer_amount = params.propeller_min_transfer_amount;
    // propeller.propeller_eth_min_transfer_amount = params.propeller_eth_min_transfer_amount;
    propeller.marginal_price_pool = params.marginal_price_pool;
    propeller.marginal_price_pool_token_index = params.marginal_price_pool_token_index;
    propeller.marginal_price_pool_token_mint = params.marginal_price_pool_token_mint;
    // propeller.evm_routing_contract_address = params.evm_routing_contract_address;
    propeller.fee_vault = ctx.accounts.propeller_fee_vault.key();
    propeller.aggregator = ctx.accounts.aggregator.key();
    Ok(())
}

// pub fn init_redeemer_escrow

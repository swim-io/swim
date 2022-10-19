use {
    crate::{error::PropellerError, Propeller, TOKEN_COUNT},
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::{create, AssociatedToken, Create},
        token::{Mint, Token, TokenAccount},
    },
    two_pool::state::TwoPool,
};

#[derive(Accounts)]
#[instruction(to_token_number: u16, pool: Pubkey, pool_token_index: u8, pool_token_mint: Pubkey)]
pub struct CreateTokenNumberMap<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = governance_key @ PropellerError::InvalidPropellerGovernanceKey,
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    pub governance_key: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    seeds = [
    b"two_pool".as_ref(),
    pool.token_mint_keys[0].as_ref(),
    pool.token_mint_keys[1].as_ref(),
    pool.lp_mint_key.as_ref(),
    ],
    bump = pool.bump,
    seeds::program = two_pool_program.key(),
    )]
    pub pool: Box<Account<'info, TwoPool>>,

    #[account(
    init,
    payer = payer,
    seeds = [
    b"propeller".as_ref(),
    b"token_id".as_ref(),
    propeller.key().as_ref(),
    &to_token_number.to_le_bytes()
    ],
    bump,
    space = 8 + TokenNumberMap::LEN,
    )]
    pub token_number_map: Account<'info, TokenNumberMap>,
    pub system_program: Program<'info, System>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

#[account]
pub struct TokenNumberMap {
    pub bump: u8,
    pub to_token_number: u16,
    pub pool: Pubkey,
    pub pool_token_index: u8,
    pub pool_token_mint: Pubkey,
    pub to_token_step: ToTokenStep,
}

impl TokenNumberMap {
    pub const LEN: usize = 2 + 32 + 1 + 32 + 1 + 1 + 1;

    pub fn assert_is_invalid(token_id_map: &AccountInfo) -> Result<()> {
        if let Ok(_) = TokenNumberMap::try_deserialize(&mut &**token_id_map.try_borrow_mut_data()?) {
            return err!(PropellerError::TokenNumberMapExists);
        }
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, Debug)]
pub enum ToTokenStep {
    Transfer,
    RemoveExactBurn,
    SwapExactInput,
}

impl<'info> CreateTokenNumberMap<'info> {
    pub fn accounts(
        ctx: &Context<CreateTokenNumberMap>,
        to_token_number: u16,
        pool: Pubkey,
        pool_token_index: u8,
        pool_token_mint: Pubkey,
        to_token_step: ToTokenStep,
    ) -> Result<()> {
        require_keys_eq!(ctx.accounts.pool.key(), pool, PropellerError::InvalidTokenNumberMapPool);
        if let ToTokenStep::Transfer = to_token_step {
            require_keys_eq!(
                ctx.accounts.propeller.swim_usd_mint,
                pool_token_mint,
                PropellerError::InvalidTokenNumberMapPoolTokenMint
            );
            return Ok(());
        }

        let pool_token_index = pool_token_index as usize;
        require_gt!(TOKEN_COUNT, pool_token_index, PropellerError::InvalidTokenNumberMapPoolTokenIndex);
        require_keys_eq!(
            ctx.accounts.pool.token_mint_keys[pool_token_index],
            pool_token_mint,
            PropellerError::InvalidTokenNumberMapPoolTokenMint
        );
        Ok(())
    }
}

pub fn handle_create_token_number_map(
    ctx: Context<CreateTokenNumberMap>,
    to_token_number: u16,
    pool: Pubkey,
    pool_token_index: u8,
    pool_token_mint: Pubkey,
    to_token_step: ToTokenStep,
) -> Result<()> {
    let mut token_number_map = &mut ctx.accounts.token_number_map;
    token_number_map.to_token_number = to_token_number;
    token_number_map.pool = pool;
    token_number_map.pool_token_index = pool_token_index;
    token_number_map.pool_token_mint = pool_token_mint;
    token_number_map.bump = *ctx.bumps.get("token_number_map").unwrap();
    token_number_map.to_token_step = to_token_step;
    Ok(())
}

#[derive(Accounts)]
#[instruction(to_token_number: u16)]
pub struct UpdateTokenNumberMap<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = governance_key @ PropellerError::InvalidPropellerGovernanceKey,
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    pub governance_key: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // #[account(
    // seeds = [
    // b"two_pool".as_ref(),
    // pool.token_mint_keys[0].as_ref(),
    // pool.token_mint_keys[1].as_ref(),
    // pool.lp_mint_key.as_ref(),
    // ],
    // bump = pool.bump,
    // seeds::program = two_pool_program.key(),
    // )]
    // Note: anchor is unable to compile when i use the `#[account]` macro here even though it's the
    // exact same as above. manually validating the address in `accounts` fn
    pub pool: Box<Account<'info, TwoPool>>,

    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    b"token_id".as_ref(),
    propeller.key().as_ref(),
    &to_token_number.to_le_bytes()
    ],
    bump = token_number_map.bump,
    constraint = token_number_map.to_token_number == to_token_number,
    )]
    pub token_number_map: Account<'info, TokenNumberMap>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

impl<'info> UpdateTokenNumberMap<'info> {
    pub fn accounts(
        ctx: &Context<UpdateTokenNumberMap>,
        pool_token_index: &u8,
        pool_token_mint: &Pubkey,
        to_token_step: &ToTokenStep,
    ) -> Result<()> {
        let propeller = &ctx.accounts.propeller;
        let pool = &ctx.accounts.pool;
        let pool_token_mint = *pool_token_mint;
        let expected_pool_key = Pubkey::create_program_address(
            &[
                b"two_pool".as_ref(),
                pool.token_mint_keys[0].as_ref(),
                &pool.token_mint_keys[1].as_ref(),
                &pool.lp_mint_key.as_ref(),
                &[pool.bump],
            ],
            &ctx.accounts.two_pool_program.key(),
        )
        .map_err(|_| PropellerError::InvalidTokenNumberMapPool)?;
        require_keys_eq!(
            *pool.to_account_info().owner,
            ctx.accounts.two_pool_program.key(),
            PropellerError::InvalidTokenNumberMapPool
        );
        require_keys_eq!(ctx.accounts.pool.key(), expected_pool_key, PropellerError::InvalidTokenNumberMapPool);
        let pool_token_index = *pool_token_index as usize;
        require_gt!(TOKEN_COUNT, pool_token_index as usize, PropellerError::InvalidTokenNumberMapPoolTokenIndex);
        match *to_token_step {
            // metapools must have swimUSD as token_mint_keys[0]
            ToTokenStep::SwapExactInput => {
                require_keys_eq!(pool.token_mint_keys[0], propeller.swim_usd_mint);
                require_keys_eq!(pool.token_mint_keys[1], pool_token_mint);
                require_eq!(pool_token_index, 1 as usize);
            }
            ToTokenStep::RemoveExactBurn => {
                require_keys_eq!(pool.lp_mint_key, pool_token_mint);
                require_keys_eq!(pool.lp_mint_key, propeller.swim_usd_mint);
                require_keys_eq!(pool.token_mint_keys[pool_token_index], pool_token_mint);
            }
            ToTokenStep::Transfer => {
                require_keys_eq!(
                    ctx.accounts.propeller.swim_usd_mint,
                    pool_token_mint,
                    PropellerError::InvalidTokenNumberMapPoolTokenMint
                );
            }
        }
        Ok(())
    }
}

pub fn handle_update_token_number_map(
    ctx: Context<UpdateTokenNumberMap>,
    _to_token_number: u16,
    pool_token_index: u8,
    pool_token_mint: Pubkey,
    to_token_step: ToTokenStep,
) -> Result<()> {
    let token_number_map = &mut ctx.accounts.token_number_map;
    token_number_map.pool = ctx.accounts.pool.key();
    token_number_map.pool_token_index = pool_token_index;
    token_number_map.pool_token_mint = pool_token_mint;
    token_number_map.to_token_step = to_token_step;
    Ok(())
}

#[derive(Accounts)]
#[instruction(to_token_number: u16)]
pub struct CloseTokenNumberMap<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = governance_key @ PropellerError::InvalidPropellerGovernanceKey,
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    pub governance_key: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    b"token_id".as_ref(),
    propeller.key().as_ref(),
    &to_token_number.to_le_bytes()
    ],
    bump = token_number_map.bump,
    close = payer,
    )]
    pub token_number_map: Account<'info, TokenNumberMap>,
}

pub fn handle_close_token_number_map(ctx: Context<CloseTokenNumberMap>, to_token_number: u16) -> Result<()> {
    //TODO emit event?
    msg!("Closed TokenNumberMap {} for to_token_number {}", ctx.accounts.token_number_map.key(), to_token_number);
    Ok(())
}

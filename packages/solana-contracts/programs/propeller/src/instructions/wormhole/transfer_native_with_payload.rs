use {
    crate::{
        constants::CURRENT_SWIM_PAYLOAD_VERSION, error::*, target_chain_map::TargetChainMap, wormhole::SwimPayload,
        Propeller, TokenBridge, Wormhole, TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION,
    },
    anchor_lang::{
        prelude::*,
        solana_program::{instruction::Instruction, program::invoke_signed, sysvar::SysvarId},
    },
    anchor_spl::{
        associated_token::get_associated_token_address,
        token::{self, Mint, Token, TokenAccount},
    },
};

#[derive(Accounts)]
#[instruction(nonce: u32, amount: u64, target_chain: u16)]
pub struct TransferNativeWithPayload<'info> {
    #[account(
    mut,
    seeds = [b"propeller".as_ref(), swim_usd_mint.key().as_ref()],
    bump = propeller.bump,
    has_one = swim_usd_mint @ PropellerError::InvalidSwimUsdMint,
    constraint = !propeller.is_paused @ PropellerError::IsPaused,
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    mut,
    seeds = [ b"config".as_ref() ],
    bump,
    seeds::program = token_bridge.key()
    )]
    /// CHECK: Token Bridge Config
    pub token_bridge_config: UncheckedAccount<'info>,

    #[account(
    mut,
    address = get_associated_token_address(&payer.key(), &swim_usd_mint.key()),
    )]
    pub user_swim_usd_ata: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub swim_usd_mint: Box<Account<'info, Mint>>,

    //TODO: change this associated_token account?
    //      is it necessary to do check since CPI will do check?
    //
    // If token is native to SOL, then this is token bridge custody (ATA) that holds the native token.
    #[account(mut)]
    //  technical edge-case - on first token_bridge_transfer with the token, this custody account won't be
    //  initialized yet. if we can assume that this account is initialized, we can do explicit type check here.
    /// CHECK: Will either be token bridge custody account or wrapped meta account
    pub custody: UncheckedAccount<'info>,

    pub token_bridge: Program<'info, TokenBridge>,

    #[account(
    seeds=[b"custody_signer".as_ref()],
    bump,
    seeds::program = token_bridge.key()
    )]
    /// CHECK: Only used for bridging assets native to Solana.
    pub custody_signer: UncheckedAccount<'info>,

    #[account(
    seeds=[b"authority_signer".as_ref()],
    bump,
    seeds::program = token_bridge.key()
    )]
    /// CHECK: Token Bridge Authority Signer, delegated approval for transfer
    pub authority_signer: UncheckedAccount<'info>,

    #[account(
    mut,
    seeds = [b"Bridge".as_ref()],
    bump,
    seeds::program = wormhole.key()
    )]
    /// CHECK: Wormhole Config
    pub wormhole_config: UncheckedAccount<'info>,

    #[account(mut)]
    // Note:
    //     using a `Signer`
    //     instead of a PDA since a normal token bridge transfer
    //     uses a Keypair.generate()
    //
    //     A new one needs to be used for every transfer
    //
    //     WH expects this to be an uninitialized account so might
    //     be able to use a PDA still in the future.
    //     maybe [b"propeller".as_ref(), payer, sequence_value]?
    //
    pub wormhole_message: Signer<'info>,

    #[account(
    mut,
    seeds = [b"emitter".as_ref()],
    bump,
    seeds::program = token_bridge.key()
    )]
    /// CHECK: Wormhole Emitter is PDA representing the Token Bridge Program
    pub wormhole_emitter: UncheckedAccount<'info>,

    #[account(
    mut,
    seeds = [
    b"Sequence".as_ref(),
    wormhole_emitter.key().as_ref()
    ],
    bump,
    seeds::program = wormhole.key()
    )]
    /// CHECK: Wormhole Sequence Number
    pub wormhole_sequence: UncheckedAccount<'info>,

    #[account(
    mut,
    seeds = [b"fee_collector".as_ref()],
    bump,
    seeds::program = wormhole.key()
    )]
    /// CHECK: Wormhole Fee Collector. leaving as UncheckedAccount since it could be uninitialized for the first transfer.
    pub wormhole_fee_collector: UncheckedAccount<'info>,

    /// Transfers with payload also include the address of the account or contract
    /// that sent the transfer. Semantically this is identical to "msg.sender" on
    /// EVM chains, i.e. it is the address of the immediate caller of the token
    /// bridge transaction.
    /// Since on Solana, a transaction can have multiple different signers, getting
    /// this information is not so straightforward.
    /// The strategy we use to figure out the sender of the transaction is to
    /// require an additional signer ([`SenderAccount`]) for the transaction.
    /// If the transaction was sent by a user wallet directly, then this may just be
    /// the wallet's pubkey. If, however, the transaction was initiated by a
    /// program, then we require this to be a PDA derived from the sender program's
    /// id and the string "sender". In this case, the sender program must also
    /// attach its program id to the instruction data. If the PDA verification
    /// succeeds (thereby proving that [[`cpi_program_id`]] indeed signed the
    /// transaction), then the program's id is attached to the VAA as the sender,
    /// otherwise the transaction is rejected.
    ///
    /// Note that a program may opt to forego the PDA derivation and instead just
    /// pass on the original wallet as the wallet account (or any other signer, as
    /// long as they don't provide their program_id in the instruction data). The
    /// sender address is provided as a means for protocols to verify on the
    /// receiving end that the message was emitted by a contract they trust, so
    /// foregoing this check is not advised. If the receiving contract needs to know
    /// the sender wallet's address too, then that information can be included in
    /// the additional payload, along with any other data that the protocol needs to
    /// send across. The legitimacy of the attached data can be verified by checking
    /// that the sender contract is a trusted one.
    ///
    /// Also note that attaching the correct PDA as [[`SenderAccount`]] but missing the
    /// [[`cpi_program_id`]] field will result in a successful transaction, but in
    /// that case the PDA's address will directly be encoded into the payload
    /// instead of the sender program's id.
    #[account(
    seeds = [ b"sender".as_ref() ],
    bump = propeller.sender_bump,
    )]
    /// CHECK: Sender Account
    pub sender: SystemAccount<'info>,

    // #[account(executable, address = propeller.wormhole()?)]
    // /// CHECK: Wormhole Program
    // pub wormhole: AccountInfo<'info>,
    pub wormhole: Program<'info, Wormhole>,

    pub token_program: Program<'info, Token>,

    #[account(
    seeds = [
    b"propeller".as_ref(),
    propeller.key().as_ref(),
    &target_chain.to_le_bytes()
    ],
    bump = target_chain_map.bump,
    constraint = !target_chain_map.is_paused @ PropellerError::TargetChainIsPaused,
    )]
    pub target_chain_map: Account<'info, TargetChainMap>,
    pub system_program: Program<'info, System>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> TransferNativeWithPayload<'info> {
    fn invoke_transfer_native_with_payload(&self, transfer_with_payload_data: TransferWithPayloadData) -> Result<()> {
        let wh_token_transfer_acct_infos = vec![
            self.payer.to_account_info(),
            self.token_bridge_config.to_account_info(),
            self.user_swim_usd_ata.to_account_info(),
            self.swim_usd_mint.to_account_info(),
            self.custody.to_account_info(),
            self.authority_signer.to_account_info(),
            self.custody_signer.to_account_info(),
            self.wormhole_config.to_account_info(),
            self.wormhole_message.to_account_info(),
            self.wormhole_emitter.to_account_info(),
            self.wormhole_sequence.to_account_info(),
            self.wormhole_fee_collector.to_account_info(),
            self.clock.to_account_info(),
            self.sender.to_account_info(),
            self.rent.to_account_info(),
            self.system_program.to_account_info(),
            self.wormhole.to_account_info(),
            self.token_program.to_account_info(),
        ];

        invoke_signed(
            &Instruction {
                program_id: self.token_bridge.key(),
                accounts: vec![
                    AccountMeta::new(self.payer.key(), true),
                    AccountMeta::new_readonly(self.token_bridge_config.key(), false),
                    // AccountMeta::new(self.wormhole_config.key(), false),
                    AccountMeta::new(self.user_swim_usd_ata.key(), false),
                    AccountMeta::new(self.swim_usd_mint.key(), false),
                    AccountMeta::new(self.custody.key(), false),
                    AccountMeta::new_readonly(self.authority_signer.key(), false),
                    AccountMeta::new_readonly(self.custody_signer.key(), false),
                    AccountMeta::new(self.wormhole_config.key(), false),
                    // AccountMeta::new_readonly(self.token_bridge_config.key(), false),
                    AccountMeta::new(self.wormhole_message.key(), true),
                    AccountMeta::new_readonly(self.wormhole_emitter.key(), false),
                    AccountMeta::new(self.wormhole_sequence.key(), false),
                    AccountMeta::new(self.wormhole_fee_collector.key(), false),
                    AccountMeta::new_readonly(Clock::id(), false),
                    AccountMeta::new_readonly(self.sender.key(), true),
                    AccountMeta::new_readonly(Rent::id(), false),
                    AccountMeta::new_readonly(self.system_program.key(), false),
                    AccountMeta::new_readonly(self.wormhole.key(), false),
                    AccountMeta::new_readonly(spl_token::id(), false),
                ],
                data: (TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION, transfer_with_payload_data).try_to_vec()?,
            },
            // &self.to_account_infos(),
            &wh_token_transfer_acct_infos,
            &[&[(b"sender".as_ref()), &[self.propeller.sender_bump]]],
        )?;
        Ok(())
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Default)]
pub struct TransferWithPayloadData {
    pub nonce: u32,
    pub amount: u64,
    // pub fee: u64,
    pub target_address: [u8; 32],
    pub target_chain: u16,
    pub payload: Vec<u8>,
    pub cpi_program_id: Option<Pubkey>,
}

pub fn handle_cross_chain_transfer_native_with_payload(
    ctx: Context<TransferNativeWithPayload>,
    nonce: u32,
    amount: u64,
    target_chain: u16,
    owner: Vec<u8>,
) -> Result<()> {
    msg!("transfer_native_with_payload");
    token::approve(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Approve {
                // source
                to: ctx.accounts.user_swim_usd_ata.to_account_info(),
                delegate: ctx.accounts.authority_signer.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        amount,
    )?;
    msg!("finished approve for authority_signer");
    // let mut target_token_addr = [0u8; 32];
    // target_token_addr.copy_from_slice(target_token.as_slice());
    let mut owner_addr = [0u8; 32];
    owner_addr.copy_from_slice(owner.as_slice());

    let swim_payload =
        SwimPayload { swim_payload_version: CURRENT_SWIM_PAYLOAD_VERSION, owner: owner_addr, ..Default::default() };
    msg!("transfer_native_with_payload swim_payload: {:?}", swim_payload);

    let target_address = ctx.accounts.target_chain_map.target_address;
    let transfer_with_payload_data = TransferWithPayloadData {
        nonce,
        amount,
        target_address,
        target_chain,
        payload: swim_payload.try_to_vec()?,
        //note - if this field is missing then ctx.accounts.sender is used as the vaa.from
        cpi_program_id: Some(crate::ID),
    };
    ctx.accounts.invoke_transfer_native_with_payload(transfer_with_payload_data)?;

    token::revoke(CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Revoke {
            // source
            source: ctx.accounts.user_swim_usd_ata.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        },
    ))?;
    msg!("Revoked authority_signer approval");
    Ok(())
}

pub fn handle_propeller_transfer_native_with_payload(
    ctx: Context<TransferNativeWithPayload>,
    nonce: u32,
    amount: u64,
    target_chain: u16,
    owner: Vec<u8>,
    gas_kickstart: bool,
    max_fee: u64,
    target_token_id: u16,
    memo: Option<[u8; 16]>,
) -> Result<()> {
    require_gt!(amount, max_fee, PropellerError::InsufficientAmount);
    msg!("transfer_native_with_payload");
    token::approve(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Approve {
                // source
                to: ctx.accounts.user_swim_usd_ata.to_account_info(),
                delegate: ctx.accounts.authority_signer.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        amount,
    )?;
    msg!("finished approve for authority_signer");
    let mut owner_addr = [0u8; 32];
    owner_addr.copy_from_slice(owner.as_slice());

    let swim_payload = SwimPayload {
        swim_payload_version: CURRENT_SWIM_PAYLOAD_VERSION,
        owner: owner_addr,
        propeller_enabled: Some(true),
        gas_kickstart: Some(gas_kickstart),
        max_fee: Some(max_fee),
        target_token_id: Some(target_token_id),
        memo,
    };
    msg!("transfer_native_with_payload swim_payload: {:?}", swim_payload);

    let target_address = ctx.accounts.target_chain_map.target_address;
    let transfer_with_payload_data = TransferWithPayloadData {
        nonce,
        amount,
        target_address,
        target_chain,
        payload: swim_payload.try_to_vec()?,
        //note - if this field is missing then ctx.accounts.sender is used as the vaa.from
        cpi_program_id: Some(crate::ID),
    };

    ctx.accounts.invoke_transfer_native_with_payload(transfer_with_payload_data)?;

    token::revoke(CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Revoke {
            // source
            source: ctx.accounts.user_swim_usd_ata.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        },
    ))?;
    msg!("Revoked authority_signer approval");
    Ok(())
}

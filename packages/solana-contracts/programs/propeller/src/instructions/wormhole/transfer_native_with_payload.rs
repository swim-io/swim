use {
    crate::{
        error::*, Propeller, PropellerSender, RawSwimPayload, SwimPayloadVersion,
        TransferWithPayloadData, TOKEN_COUNT, TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION,
    },
    anchor_lang::{
        prelude::*,
        solana_program::{
            borsh::try_from_slice_unchecked,
            instruction::Instruction,
            program::{get_return_data, invoke, invoke_signed},
            program_option::COption,
            system_instruction::transfer,
            sysvar::SysvarId,
        },
    },
    anchor_spl::{
        token,
        token::{Mint, Token, TokenAccount},
    },
    primitive_types::U256,
};

#[derive(Accounts)]
pub struct TransferNativeWithPayload<'info> {
    #[account(
	has_one = token_bridge_mint,
	seeds = [
		b"propeller".as_ref(),
		token_bridge_mint.key().as_ref(),
	],
	bump = propeller.bump,
	)]
    pub propeller: Account<'info, Propeller>,

    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
	mut,
	seeds = [ b"config".as_ref() ],
	bump,
	seeds::program = propeller.token_bridge().unwrap()
	)]
    /// CHECK: Token Bridge Config
    pub token_bridge_config: AccountInfo<'info>,

    #[account(
	mut,
	associated_token::mint = token_bridge_mint,
	associated_token::authority = payer
	)]
    pub user_token_bridge_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub token_bridge_mint: Box<Account<'info, Mint>>,

    //TODO: change this associated_token account?
    //      is it necessary to do check since CPI will do check?
    //
    // If token is native to SOL, then this is token bridge custody (ATA) that holds the native token.
    #[account(mut)]
    //  technical edge-case - on first token_bridge_transfer with the token, this custody account won't be
    //  initialized yet. if we can assume that this account is initialized, we can do explicit type check here.
    /// CHECK: Will either be token bridge custody account or wrapped meta account
    pub custody: AccountInfo<'info>,

    #[account(executable, address = propeller.token_bridge()?)]
    /// CHECK: Token Bridge Program
    pub token_bridge: AccountInfo<'info>,

    #[account(
	seeds=[b"custody_signer".as_ref()],
	bump,
	seeds::program = token_bridge.key()
	)]
    /// CHECK: Only used for bridging assets native to Solana.
    pub custody_signer: AccountInfo<'info>,

    #[account(
	seeds=[b"authority_signer".as_ref()],
	bump,
	seeds::program = token_bridge.key()
	)]
    /// CHECK: Token Bridge Authority Signer, delegated approval for transfer
    pub authority_signer: AccountInfo<'info>,

    #[account(
	mut,
	seeds = [b"Bridge".as_ref()],
	bump,
	seeds::program = propeller.wormhole().unwrap()
	)]
    /// CHECK: Wormhole Config
    pub wormhole_config: AccountInfo<'info>,

    #[account(mut)]
    /// Note:
    ///     switched to using a `Signer`
    ///     instead of a PDA since a normal token bridge transfer
    ///     uses a Keypair.generate()
    ///
    ///     A new one needs to be used for every transfer
    ///
    ///     WH expects this to be an uninitialized account so might
    ///     be able to use a PDA still in the future.
    ///     maybe [b"propeller".as_ref(), payer, sequence_value]
    /// CHECK: Wormhole Message Storage
    pub wormhole_message: Signer<'info>,

    #[account(
	mut,
	seeds = [b"emitter".as_ref()],
	bump,
	seeds::program = propeller.token_bridge().unwrap()
	)]
    /// CHECK: Wormhole Emitter is PDA representing the Token Bridge Program
    pub wormhole_emitter: AccountInfo<'info>,

    #[account(
	mut,
	seeds = [
	b"Sequence".as_ref(),
	wormhole_emitter.key().as_ref()
	],
	bump,
	seeds::program = propeller.wormhole().unwrap()
	)]
    /// CHECK: Wormhole Sequence Number
    pub wormhole_sequence: AccountInfo<'info>,

    #[account(
	mut,
	seeds = [b"fee_collector".as_ref()],
	bump,
	seeds::program = propeller.wormhole().unwrap()
	)]
    /// CHECK: Wormhole Fee Collector
    pub wormhole_fee_collector: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,

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
		seeds = [ b"sender".as_ref()],
		bump = propeller.sender_bump,
	)]
    /// CHECK: Sender Account
    pub sender: AccountInfo<'info>,
    // pub sender: Account<'info, PropellerSender>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,

    #[account(executable, address = propeller.wormhole()?)]
    /// CHECK: Wormhole Program
    pub wormhole: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,

    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
}

impl<'info> TransferNativeWithPayload<'info> {
    //Note: some of the checks are excessive (checked in CPI etc) and add.rs to compute budget but since we now have access to requesting
    //  up to 1.4M compute budget per transaction, better safe than sorry to perform them.
    pub fn accounts(ctx: &Context<TransferNativeWithPayload>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.token_bridge_mint.key(),
            ctx.accounts.propeller.token_bridge_mint,
            PropellerError::InvalidTokenBridgeMint
        );
        // let pool_state_acct = &ctx.accounts.pool_state;
        // let pool: two_pool::state::PoolState<{two_pool::TOKEN_COUNT}> = two_pool::state::PoolState::try_from_slice(&pool_state_acct.data.borrow())?;
        // constraint = lp_mint.key() == propeller.token_bridge_mint @ PropellerError::InvalidMint
        msg!("finished accounts context check");
        Ok(())
    }
}

pub fn handle_transfer_native_with_payload(
    ctx: Context<TransferNativeWithPayload>,
    nonce: u32,
    target_chain: u16,
    amount: u64,
    target_token_id: u16,
    // target_token: Vec<u8>,
    owner: Vec<u8>,
    gas_kickstart: bool,
    propeller_enabled: bool,
    memo: Vec<u8>,
) -> Result<()> {
    msg!("transfer_native_with_payload");
    token::approve(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Approve {
                // source
                to: ctx.accounts.user_token_bridge_account.to_account_info(),
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
    let propeller = &ctx.accounts.propeller;
    //TODO: still need to handle the u256/u64

    let raw_min_threshold = match target_chain {
        crate::constants::CHAIN_ID_ETH => propeller.propeller_eth_min_transfer_amount,
        _ => propeller.propeller_min_transfer_amount,
    };
    // let raw_min_threshold = propeller.propeller_min_transfer_amount;
    let trunc_divisor = 10u64.pow(8.max(ctx.accounts.token_bridge_mint.decimals as u32) - 8);
    // Truncate to 8 decimals
    let min_threshold: u64 = raw_min_threshold / trunc_divisor;
    // Untruncate the amount to drop the remainder so we don't  "burn" user's funds.
    let min_threshold_trunc: u64 = min_threshold * trunc_divisor;

    msg!(
        "amount: {}, raw_min_threshold: {}, min_threshold_trunc: {}",
        amount,
        raw_min_threshold,
        min_threshold_trunc
    );
    // TODO: should i do the token bridge transfer amount calculation here and compare that?
    if propeller_enabled {
        require_gte!(
            amount,
            min_threshold_trunc,
            PropellerError::InsufficientAmount
        );
    }
    let swim_payload = RawSwimPayload {
        swim_payload_version: 0,
        target_token_id,
        owner: owner_addr,
        // min_output_amount: U256::from(0u64),
        memo: memo.clone().try_into().unwrap(),
        propeller_enabled,
        //TODO: not sure if this is needed. applying same math as how token-bridge handles amount.
        min_threshold: U256::from(0u64),
        // propeller_min_threshold: U256::from(propeller.propeller_min_threshold),
        // propeller_fee: U256::from(propeller.propeller_fee),
        gas_kickstart,
    };
    // let mut swim_payload_bytes = [0u8; 32];
    let swim_payload_bytes = swim_payload.try_to_vec()?;
    anchor_lang::prelude::msg!("swim_payload_bytes {:?}", swim_payload_bytes);
    //
    // Note:
    //     1. nonce is created randomly client side using this
    //         export function createNonce() {
    //              const nonceConst = Math.random() * 100000;
    //              const nonceBuffer = Buffer.alloc(4);
    //              nonceBuffer.writeUInt32LE(nonceConst, 0);
    //              return nonceBuffer;
    //          }
    //     2. fee is relayerFee
    //         a. removed in payload3
    //     3. targetAddress is Uint8Array (on wasm.rs its Vec<u8>
    //         a. WH client has special handling/formatting for this
    //             see - wh-sdk/src/utils/array.ts tryNativeToUint8Array(address: string, chain: ChainId | ChainName)
    //     4. targetChain is number/u16
    //     5. payload is Vec<u8>

    let transfer_with_payload_data = TransferWithPayloadData {
        // nonce: ctx.accounts.custodian.nonce,
        //TODO: update this.
        nonce,
        amount,
        //TODO: update this.
        //  this should be tryNativeToUint8Array(ethAddress, CHAIN_ID_ETH)
        //  this can either be hardcoded or set in propeller state since we're assuming this is the same for all chains.
        // target_address: Pubkey::default().to_bytes(),
        target_address: ctx.accounts.propeller.evm_routing_contract_address.clone(),
        // target_address: Pubkey::default().to_bytes(),
        // target_chain: Custodian::conductor_chain()?,
        target_chain,
        payload: swim_payload.try_to_vec()?,
        //note - if this field is missing then ctx.accounts.sender is used as the vaa.from
        cpi_program_id: Some(crate::ID),
    };

    let token_bridge_custody = &ctx.accounts.custody;
    let wh_token_transfer_acct_infos = vec![
        ctx.accounts.payer.to_account_info().clone(),
        ctx.accounts.token_bridge_config.to_account_info().clone(),
        // ctx.accounts.token_bridge.to_account_info().clone(),
        ctx.accounts
            .user_token_bridge_account
            .to_account_info()
            .clone(),
        ctx.accounts.token_bridge_mint.to_account_info().clone(),
        token_bridge_custody.to_account_info().clone(),
        ctx.accounts.authority_signer.to_account_info().clone(),
        ctx.accounts.custody_signer.to_account_info().clone(),
        ctx.accounts.wormhole_config.to_account_info().clone(),
        // AccountMeta::new_readonly(ctx.accounts.token_bridge_config.to_account_info().clone(), false),
        ctx.accounts.wormhole_message.to_account_info().clone(),
        ctx.accounts.wormhole_emitter.to_account_info().clone(),
        ctx.accounts.wormhole_sequence.to_account_info().clone(),
        ctx.accounts
            .wormhole_fee_collector
            .to_account_info()
            .clone(),
        // Clock::get()?.to_account_info().clone(),
        ctx.accounts.clock.to_account_info().clone(),
        //TODO: replaced with sender once that PR is merged
        ctx.accounts.sender.to_account_info().clone(),
        // Rent::get()?.to_account_info().clone(),
        ctx.accounts.rent.to_account_info().clone(),
        ctx.accounts.system_program.to_account_info().clone(),
        ctx.accounts.wormhole.to_account_info().clone(),
        ctx.accounts.token_program.to_account_info().clone(),
    ];

    invoke_signed(
        &Instruction {
            program_id: ctx.accounts.token_bridge.key(),
            // this doesn't work since it includes the propeller account which we will *probably* need
            //  for validation checks.
            // accounts: ctx.accounts.to_account_metas(None),
            accounts: vec![
                AccountMeta::new(ctx.accounts.payer.key(), true),
                AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
                // AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
                AccountMeta::new(ctx.accounts.user_token_bridge_account.key(), false),
                AccountMeta::new(ctx.accounts.token_bridge_mint.key(), false),
                AccountMeta::new(token_bridge_custody.key(), false),
                AccountMeta::new_readonly(ctx.accounts.authority_signer.key(), false),
                AccountMeta::new_readonly(ctx.accounts.custody_signer.key(), false),
                AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
                // AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
                AccountMeta::new(ctx.accounts.wormhole_message.key(), true),
                AccountMeta::new_readonly(ctx.accounts.wormhole_emitter.key(), false),
                AccountMeta::new(ctx.accounts.wormhole_sequence.key(), false),
                AccountMeta::new(ctx.accounts.wormhole_fee_collector.key(), false),
                AccountMeta::new_readonly(Clock::id(), false),
                //TODO: add.rs sender once that PR is merged
                AccountMeta::new_readonly(ctx.accounts.sender.key(), true),
                AccountMeta::new_readonly(Rent::id(), false),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                AccountMeta::new_readonly(ctx.accounts.wormhole.key(), false),
                AccountMeta::new_readonly(spl_token::id(), false),
            ],
            data: (
                TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION,
                transfer_with_payload_data,
            )
                .try_to_vec()?,
        },
        // &ctx.accounts.to_account_infos(),
        &wh_token_transfer_acct_infos,
        &[&[&b"sender".as_ref(), &[ctx.accounts.propeller.sender_bump]]],
    )?;

    token::revoke(CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Revoke {
            // source
            source: ctx.accounts.user_token_bridge_account.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        },
    ))?;
    msg!("Revoked authority_signer approval");
    let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
    invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
    Ok(())
}

// pub fn handle_transfer_native_with_payload(
// 	ctx: Context<TransferNativeWithPayload>,
// 	nonce: u32,
// 	target_chain: u16,
// 	amount: u64,
// 	payload: Vec<u8>,
// ) -> Result<()> {
// 	msg!("transfer_native_with_payload");
// 	token::approve(
// 		CpiContext::new(
// 			ctx.accounts.token_program.to_account_info(),
// 			token::Approve {
// 				// source
// 				to: ctx.accounts.user_token_bridge_account.to_account_info(),
// 				delegate: ctx.accounts.authority_signer.to_account_info(),
// 				authority: ctx.accounts.payer.to_account_info(),
// 			},
// 		),
// 		amount,
// 	)?;
// 	msg!("finished approve for authority_signer");
//
//
// 	//
// 	// Note:
// 	//     1. nonce is created randomly client side using this
// 	//         export function createNonce() {
// 	//              const nonceConst = Math.random() * 100000;
// 	//              const nonceBuffer = Buffer.alloc(4);
// 	//              nonceBuffer.writeUInt32LE(nonceConst, 0);
// 	//              return nonceBuffer;
// 	//          }
// 	//     2. fee is relayerFee
// 	//         a. removed in payload3
// 	//     3. targetAddress is Uint8Array (on wasm.rs its Vec<u8>
// 	//         a. WH client has special handling/formatting for this
// 	//             see - wh-sdk/src/utils/array.ts tryNativeToUint8Array(address: string, chain: ChainId | ChainName)
// 	//     4. targetChain is number/u16
// 	//     5. payload is Vec<u8>
// 	let transfer_with_payload_data = TransferWithPayloadData {
// 		// nonce: ctx.accounts.custodian.nonce,
// 		//TODO: update this.
// 		nonce,
// 		amount,
// 		//TODO: update this.
// 		//  this should be tryNativeToUint8Array(ethAddress, CHAIN_ID_ETH)
// 		//  this can either be hardcoded or set in propeller state since we're assuming this is the same for all chains.
// 		target_address: Pubkey::default().to_bytes(),
// 		// target_chain: Custodian::conductor_chain()?,
// 		target_chain,
// 		payload,
// 		//note - if this field is missing then ctx.accounts.sender is used as the vaa.from
// 		cpi_program_id: Some(crate::ID),
// 	};
//
// 	let token_bridge_custody = &ctx.accounts.custody;
// 	let wh_token_transfer_acct_infos = vec![
// 		ctx.accounts.payer.to_account_info().clone(),
// 		ctx.accounts.token_bridge_config.to_account_info().clone(),
// 		// ctx.accounts.token_bridge.to_account_info().clone(),
// 		ctx.accounts.user_token_bridge_account.to_account_info().clone(),
// 		ctx.accounts.token_bridge_mint.to_account_info().clone(),
// 		token_bridge_custody.to_account_info().clone(),
// 		ctx.accounts.authority_signer.to_account_info().clone(),
// 		ctx.accounts.custody_signer.to_account_info().clone(),
// 		ctx.accounts.wormhole_config.to_account_info().clone(),
// 		// AccountMeta::new_readonly(ctx.accounts.token_bridge_config.to_account_info().clone(), false),
// 		ctx.accounts.wormhole_message.to_account_info().clone(),
// 		ctx.accounts.wormhole_emitter.to_account_info().clone(),
// 		ctx.accounts.wormhole_sequence.to_account_info().clone(),
// 		ctx.accounts.wormhole_fee_collector.to_account_info().clone(),
// 		// Clock::get()?.to_account_info().clone(),
// 		ctx.accounts.clock.to_account_info().clone(),
// 		//TODO: replaced with sender once that PR is merged
// 		ctx.accounts.sender.to_account_info().clone(),
//
// 		// Rent::get()?.to_account_info().clone(),
// 		ctx.accounts.rent.to_account_info().clone(),
// 		ctx.accounts.system_program.to_account_info().clone(),
// 		ctx.accounts.wormhole.to_account_info().clone(),
// 		ctx.accounts.token_program.to_account_info().clone()
// 	];
//
// 	invoke_signed(
// 		&Instruction {
// 			program_id: ctx.accounts.token_bridge.key(),
// 			// this doesn't work since it includes the propeller account which we will *probably* need
// 			//  for validation checks.
// 			// accounts: ctx.accounts.to_account_metas(None),
// 			accounts: vec![
// 				AccountMeta::new(ctx.accounts.payer.key(), true),
// 				AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
// 				// AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
// 				AccountMeta::new(ctx.accounts.user_token_bridge_account.key(), false),
// 				AccountMeta::new(ctx.accounts.token_bridge_mint.key(), false),
// 				AccountMeta::new(token_bridge_custody.key(), false),
// 				AccountMeta::new_readonly(ctx.accounts.authority_signer.key(), false),
// 				AccountMeta::new_readonly(ctx.accounts.custody_signer.key(), false),
// 				AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
// 				// AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
//
// 				AccountMeta::new(ctx.accounts.wormhole_message.key(), true),
// 				AccountMeta::new_readonly(ctx.accounts.wormhole_emitter.key(), false),
// 				AccountMeta::new(ctx.accounts.wormhole_sequence.key(), false),
// 				AccountMeta::new(ctx.accounts.wormhole_fee_collector.key(), false),
// 				AccountMeta::new_readonly(Clock::id(), false),
// 				//TODO: add.rs sender once that PR is merged
// 				AccountMeta::new_readonly(ctx.accounts.sender.key(), true),
//
// 				AccountMeta::new_readonly(Rent::id(), false),
// 				AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
//
// 				AccountMeta::new_readonly(ctx.accounts.wormhole.key(), false),
// 				AccountMeta::new_readonly(spl_token::id(), false),
// 			],
// 			data: (TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION, transfer_with_payload_data).try_to_vec()?,
// 		},
// 		// &ctx.accounts.to_account_infos(),
// 		&wh_token_transfer_acct_infos,
// 		&[&[
// 			&b"sender".as_ref(),
// 			&[ctx.accounts.propeller.sender_bump],
// 		]],
// 	)?;
//
// 	token::revoke(
// 		CpiContext::new(
// 			ctx.accounts.token_program.to_account_info(),
// 			token::Revoke {
// 				// source
// 				source: ctx.accounts.user_token_bridge_account.to_account_info(),
// 				authority: ctx.accounts.payer.to_account_info(),
// 			},
// 		)
// 	)?;
// 	msg!("Revoked authority_signer approval");
// 	Ok(())
// }

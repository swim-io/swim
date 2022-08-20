use {
    crate::{
        deserialize_message_payload, error::*, get_message_data,
        get_transfer_with_payload_from_message_account, hash_vaa, Address, ChainID, ClaimData,
        PayloadTransferWithPayload, PostVAAData, PostedMessageData, PostedVAAData, Propeller,
        COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION,
    },
    anchor_lang::{
        prelude::*,
        solana_program::{
            instruction::Instruction, program::invoke_signed, system_program, sysvar::SysvarId,
        },
    },
    anchor_spl::token::{Mint, Token, TokenAccount},
    byteorder::{BigEndian, ReadBytesExt, WriteBytesExt},
    primitive_types::U256,
    std::io::{Cursor, ErrorKind, Read, Write},
};

#[derive(Accounts)]
// #[instruction(vaa: PostVAAData)]
pub struct CompleteNativeWithPayload<'info> {
    #[account(
      seeds = [
        b"propeller".as_ref(),
        propeller.token_bridge_mint.as_ref(),
      ],
      bump = propeller.bump,
      constraint = propeller.token_bridge_mint == mint.key() @ PropellerError::InvalidTokenBridgeMint
    )]
    pub propeller: Box<Account<'info, Propeller>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
		  mut,
		  seeds = [ b"config".as_ref() ],
		  bump,
		  seeds::program = propeller.token_bridge().unwrap()
	  )]
    /// CHECK: Token Bridge Config
    pub token_bridge_config: UncheckedAccount<'info>,
    /// contains the VAA
    /// {
    ///   ...MessageData:
    ///   payload: PayloadTransferWithPayload = {
    ///         pub amount: U256,
    //     /// Address of the token. Left-zero-padded if shorter than 32 bytes
    //     pub token_address: Address,
    //     /// Chain ID of the token
    //     pub token_chain: ChainID,
    //     /// Address of the recipient. Left-zero-padded if shorter than 32 bytes
    //     pub to: Address,
    //     /// Chain ID of the recipient
    //     pub to_chain: ChainID,
    //     /// Sender of the transaction
    //     pub from_address: Address,
    //     /// Arbitrary payload
    //     pub payload: Vec<u8>,
    ///   }
    /// }
    // #[account(
    //   mut,
    //   seeds = [
    //     b"PostedVAA".as_ref(),
    //     hash_vaa(&vaa).as_ref()
    //   ],
    //   bump,
    //   seeds::program = propeller.wormhole()?
    // )]
    #[account(mut)]
    /// CHECK: wormhole message account. seeds = [ "PostedVAA", hash(vaa) ], seeds::program = token_bridge
    pub message: UncheckedAccount<'info>,
    // pub message: Account<'info, PostedMessageData>,
    // pub message: Account<'info, PostedVAAData>,
    /// seeds = [
    ///   vaa.emitter_address, vaa.emitter_chain, vaa.sequence
    ///],
    /// seeds::program = token_bridge
    // #[account(
    //   mut,
    //   seeds = [
    //     vaa.emitter_address.as_ref(),
    //     vaa.emitter_chain.to_be_bytes().as_ref(),
    //     vaa.sequence.to_be_bytes().as_ref(),
    //   ],
    //   bump,
    //   seeds::program = propeller.wormhole()?
    // )]
    #[account(mut)]
    /// CHECK: wormhole claim account to prevent double spending
    pub claim: UncheckedAccount<'info>,
    /// CHECK: wormhole endpoint account. seeds = [ vaa.emitter_chain, vaa.emitter_address ]
    pub endpoint: UncheckedAccount<'info>,
    /// owned by redeemer
    #[account(
      mut,
      token::mint = mint.key(),
      token::authority = redeemer,
    )]
    pub to: Box<Account<'info, TokenAccount>>,
    #[account(
		  seeds = [ b"redeemer".as_ref()],
		  bump = propeller.redeemer_bump
	  )]
    /// CHECK: this used to be "to_owner".
    /// redeemer will be PDA derived from ["redeemer"], seeds::program = propeller::id()
    /// will have to be signed when it invokes complete_transfer_with_payload
    /// if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to
    ///     (NOT the `to` account)
    pub redeemer: AccountInfo<'info>,
    #[account(mut)]

    /// this is "to_fees"
    /// TODO: type as TokenAccount?
    /// CHECK: recipient of fees for executing complete transfer (e.g. relayer)
    pub fee_recipient: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: wormhole_custody_account: seeds = [mint], seeds::program = token_bridge
    pub custody: AccountInfo<'info>,
    pub mint: Box<Account<'info, Mint>>,
    /// CHECK: custody_signer_account: seeds = [b"custody_signer"], seeds::program = token_bridge
    pub custody_signer: AccountInfo<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,

    #[account(
	  executable, address = propeller.wormhole()?,
	)]
    /// CHECK: wormhole program
    pub wormhole: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    #[account(
	    executable, address = propeller.token_bridge()?,
	  )]
    ///CHECK: wormhole token bridge program
    pub token_bridge: AccountInfo<'info>,

    #[account(
      init,
      payer = payer,
      seeds = [
        b"propeller".as_ref(),
        claim.key().as_ref(),
        message.key().as_ref(),
      ],
      bump,
      space = 8 + PropellerMessage::LEN,
    )]
    pub propeller_message: Account<'info, PropellerMessage>,
}

impl<'info> CompleteNativeWithPayload<'info> {
    pub fn accounts(ctx: &Context<CompleteNativeWithPayload>) -> Result<()> {
        require!(
            Self::redeemer_check(ctx),
            PropellerError::UserRedeemerSignatureNotDetected
        );
        Ok(())
    }

    fn redeemer_check(ctx: &Context<CompleteNativeWithPayload>) -> bool {
        // if ctx.accounts.redeemer.address == ctx.accounts.message.payload.to_address() {
        // 	return ctx.accounts.redeemer.to_account_info().is_signer;
        // }
        true
    }
}

#[account]
pub struct PropellerMessage {
    pub bump: u8,
    pub wh_message: Pubkey,
    // pub wh_message_bump: u8,
    pub claim: Pubkey,
    // pub claim_bump: u8,
    pub vaa_emitter_address: [u8; 32],
    pub vaa_emitter_chain: u16,
    pub vaa_sequence: u64,
    pub transfer_amount: u64,
    pub swim_payload: SwimPayload,
}

impl PropellerMessage {
    pub const LEN: usize = 1 +  // bump
      32 + // message
      // 1 + // message_bump
      32 + // claim
      // 1 +  // claim_bump
      32 + // vaa_emitter_address
      2 +  // vaa_emitter_chain
      8 +  // vaa_sequence
      8 + // transfer_amount
      SwimPayload::LEN; // swim_payload
}

#[derive(AnchorSerialize, AnchorDeserialize, Default)]
pub struct CompleteNativeWithPayloadData {}

pub fn handle_complete_native_with_payload(ctx: Context<CompleteNativeWithPayload>) -> Result<()> {
    // let wh_complete_native_with_payload_acct_infos = vec![
    //     ctx.accounts.payer.to_account_info().clone(),
    //     ctx.accounts.token_bridge_config.to_account_info().clone(),
    //     // ctx.accounts.token_bridge.to_account_info().clone(),
    //     ctx.accounts.message.to_account_info().clone(),
    //     ctx.accounts.claim.to_account_info().clone(),
    //     ctx.accounts.endpoint.to_account_info().clone(),
    //     ctx.accounts.to.to_account_info().clone(),
    //     ctx.accounts.redeemer.to_account_info().clone(),
    //     ctx.accounts.fee_recipient.to_account_info().clone(),
    //     // AccountMeta::new_readonly(ctx.accounts.token_bridge_config.to_account_info().clone(), false),
    //     ctx.accounts.custody.to_account_info().clone(),
    //     ctx.accounts.mint.to_account_info().clone(),
    //     ctx.accounts.custody_signer.to_account_info().clone(),
    //     ctx.accounts.rent.to_account_info().clone(),
    //     ctx.accounts.system_program.to_account_info().clone(),
    //     ctx.accounts.wormhole.to_account_info().clone(),
    //     ctx.accounts.token_program.to_account_info().clone(),
    // ];

    let complete_transfer_with_payload_ix = Instruction {
        program_id: ctx.accounts.token_bridge.key(),
        // accounts: ctx.accounts.to_account_metas(None),
        accounts: vec![
            AccountMeta::new(ctx.accounts.payer.key(), true),
            AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
            AccountMeta::new_readonly(ctx.accounts.message.key(), false),
            AccountMeta::new(ctx.accounts.claim.key(), false),
            AccountMeta::new_readonly(ctx.accounts.endpoint.key(), false),
            AccountMeta::new(ctx.accounts.to.key(), false),
            AccountMeta::new_readonly(ctx.accounts.redeemer.key(), true),
            AccountMeta::new(ctx.accounts.fee_recipient.key(), false),
            AccountMeta::new(ctx.accounts.custody.key(), false),
            AccountMeta::new_readonly(ctx.accounts.mint.key(), false),
            AccountMeta::new_readonly(ctx.accounts.custody_signer.key(), false),
            // Dependencies
            AccountMeta::new_readonly(Rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
            // Program
            AccountMeta::new_readonly(ctx.accounts.wormhole.key(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: (
            COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION,
            CompleteNativeWithPayloadData {},
        )
            .try_to_vec()?,
    };
    invoke_signed(
        &complete_transfer_with_payload_ix,
        &ctx.accounts.to_account_infos(),
        &[&[
            &b"redeemer".as_ref(),
            &[ctx.accounts.propeller.redeemer_bump],
        ]],
    )?;
    msg!("successfully invoked complete_native_with_payload");

    let message_data = get_message_data(&ctx.accounts.message.to_account_info())?;
    msg!("message_data: {:?}", message_data);
    let payload_transfer_with_payload: PayloadTransferWithPayload =
        deserialize_message_payload(&mut message_data.payload.as_slice())?;
    // let payload_transfer_with_payload =
    //     get_transfer_with_payload_from_message_account(&ctx.accounts.message.to_account_info())?;

    // // TODO: we should probably validate that `message_data_payload.from_address` is the expected
    // //  evm routing contract address unless there's a reason to allow someone else to use this method
    // msg!("message_data_payload: {:?}", message_data_payload);
    // let swim_payload = SwimPayload::deserialize(&mut message_data_payload.payload.as_slice())?;
    // msg!("swim_payload: {:?}", swim_payload);
    // let posted_message =
    // let posted_vaa_data = PostedVAAData::try_deserialize(&mut *ctx.accounts.message.data.borrow())?;
    // let message = &posted_vaa_data.message;
    // msg!("messageData: {:?}", message);
    // let payload_transfer_with_payload = &message.payload;
    msg!(
        "payload_transfer_with_payload: {:?}",
        payload_transfer_with_payload
    );
    let swim_payload = &payload_transfer_with_payload.payload;
    msg!("swim_payload: {:?}", swim_payload);

    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    msg!("claim_data: {:?}", claim_data);

    // ugly. re-doing the same calculation that WH does in `complete_transfer_payload` but
    // should not be a huge issue.
    let mut transfer_amount = payload_transfer_with_payload.amount.as_u64();
    if ctx.accounts.mint.decimals > 8 {
        transfer_amount *= 10u64.pow(ctx.accounts.mint.decimals as u32);
    }

    let propeller_message = &mut ctx.accounts.propeller_message;
    propeller_message.bump = *ctx.bumps.get("propeller_message").unwrap();
    propeller_message.claim = ctx.accounts.claim.key();
    // propeller_message.claim_bump = *ctx.bumps.get("claim").unwrap();
    propeller_message.wh_message = ctx.accounts.message.key();
    // propeller_message.wh_message_bump = *ctx.bumps.get("message").unwrap();
    propeller_message.vaa_emitter_address = message_data.emitter_address;
    propeller_message.vaa_emitter_chain = message_data.emitter_chain;
    propeller_message.vaa_sequence = message_data.sequence;
    propeller_message.transfer_amount = transfer_amount;
    propeller_message.swim_payload = swim_payload.clone().into();
    Ok(())
}

//TODO: look into options for versioning.
//  ex - metaplex metadata versioning - (probably not. its messy).
#[derive(PartialEq, Debug, Clone)]
pub struct RawSwimPayload {
    //TOOD: should this come from propeller?
    pub swim_payload_version: u8,
    pub owner: Address,
    pub target_token_id: u16,
    // pub min_output_amount: U256,
    pub memo: [u8; 16],
    // pub target_token: Address,
    pub propeller_enabled: bool,
    pub min_threshold: U256,
    // pub propeller_fee: U256,
    pub gas_kickstart: bool,
}

impl RawSwimPayload {
    pub const LEN: usize = 1 + //version
      32 + //owner
      2 +    // target_token_id
      // 32 + // min_output_amount
      16 + // memo
      1 + // propeller_enabled
      32 +   // min_threshold
      32 +  // propeller_fee
      1; // gas_kickstart
}

impl From<RawSwimPayload> for SwimPayload {
    fn from(raw: RawSwimPayload) -> Self {
        SwimPayload {
            swim_payload_version: raw.swim_payload_version,
            owner: raw.owner,
            target_token_id: raw.target_token_id,
            // min_output_amount: raw.min_output_amount.as_u64(),
            memo: raw.memo,
            propeller_enabled: raw.propeller_enabled,
            min_threshold: raw.min_threshold.as_u64(),
            // propeller_fee: raw.propeller_fee.as_u64(),
            gas_kickstart: raw.gas_kickstart,
        }
    }
}

#[derive(PartialEq, Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct SwimPayload {
    //TOOD: should this come from propeller?
    pub swim_payload_version: u8,
    pub owner: [u8; 32],
    pub target_token_id: u16,
    // pub min_output_amount: u64,
    pub memo: [u8; 16],
    // pub target_token: Address,
    pub propeller_enabled: bool,
    pub min_threshold: u64,
    // pub propeller_fee: U256,
    pub gas_kickstart: bool,
}

impl SwimPayload {
    pub const LEN: usize = 1 + //version
    32 + //owner
    2 +    // target_token_id
    // 8 + // min_output_amount
    16 + // memo
    1 + // propeller_enabled
    8 +   // propeller_min_threshold
    32 +  // propeller_fee
    1; // gas_kickstart
}

#[repr(u8)]
#[derive(PartialEq, Debug, Clone)]
pub enum SwimPayloadVersion {
    V0 = 0,
    V1 = 1,
}

impl AnchorDeserialize for RawSwimPayload {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        let mut v = Cursor::new(buf);
        //TODO: add some error handling/checking here if payload version is incorrect.
        //  https://stackoverflow.com/questions/28028854/how-do-i-match-enum-values-with-an-integer
        let swim_payload_version = v.read_u8()?;

        // if v.read_u8()? != 3 {
        // 	// return Err(error!(PropellerError::InvalidPayloadTypeInVaa)).into()
        // 	// return Err(ProgramError::BorshIoError("Wrong Payload Type".to_string()).into());
        // 	return Err(std::io::Error::new(
        // 		ErrorKind::InvalidInput,
        // 		"Wrong Payload Type".to_string(),
        // 	));
        // 	// return Err(PropellerError::InvalidPayloadTypeInVaa);
        // };

        let target_token_id = v.read_u16::<BigEndian>()?;
        // let mut target_token: [u8; 32] = Address::default();
        // v.read_exact(&mut target_token)?;

        let mut owner: [u8; 32] = Address::default();
        v.read_exact(&mut owner)?;

        // let mut min_output_amount_data: [u8; 32] = [0; 32];
        // v.read_exact(&mut min_output_amount_data)?;
        // let min_output_amount = U256::from_big_endian(&min_output_amount_data);

        let mut memo: [u8; 16] = [0; 16];
        v.read_exact(&mut memo)?;

        let mut propeller_enabled = !(v.read_u8()? == 0);
        let mut min_threshold_data: [u8; 32] = [0; 32];
        v.read_exact(&mut min_threshold_data)?;
        let min_threshold = U256::from_big_endian(&min_threshold_data);

        // let mut propeller_fee_data: [u8; 32] = [0; 32];
        // v.read_exact(&mut propeller_fee_data)?;
        // let propeller_fee = U256::from_big_endian(&propeller_fee_data);

        //TODO: should we allow any non-zero value to be true or specifically 1?
        let gas_kickstart = !(v.read_u8()? == 0);
        // let amount = U256::from_big_endian(&target_token);

        Ok(RawSwimPayload {
            swim_payload_version,
            target_token_id,
            // target_token,
            owner,
            // min_output_amount,
            memo,
            propeller_enabled,
            min_threshold,
            // propeller_fee,
            gas_kickstart,
        })
    }
}
//
impl AnchorSerialize for RawSwimPayload {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        // Payload ID
        // writer.write_u8(self.swim_payload_version)?;
        writer.write_u8(0)?;

        writer.write_u16::<BigEndian>(self.target_token_id)?;
        writer.write_all(&self.owner)?;

        // let mut min_output_data: [u8; 32] = [0; 32];
        // self.min_output_amount.to_big_endian(&mut min_output_data);
        // writer.write_all(&min_output_data)?;

        writer.write_all(&self.memo)?;

        writer.write_u8(if self.propeller_enabled { 1 } else { 0 })?;

        let mut min_threshold_data: [u8; 32] = [0; 32];
        self.min_threshold.to_big_endian(&mut min_threshold_data);
        writer.write_all(&min_threshold_data)?;

        // let mut propeller_fee_data: [u8; 32] = [0; 32];
        // self.propeller_fee.to_big_endian(&mut propeller_fee_data);
        // writer.write_all(&propeller_fee_data)?;

        writer.write_u8(if self.gas_kickstart { 1 } else { 0 })?;
        Ok(())
    }
}

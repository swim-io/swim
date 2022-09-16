use {
    crate::{error::PropellerError, Address, TOKEN_COUNT},
    anchor_lang::prelude::*,
    anchor_spl::token::TokenAccount,
    byteorder::{BigEndian, ReadBytesExt, WriteBytesExt},
    std::{
        io::{Cursor, ErrorKind, Read, Write},
        str::FromStr,
    },
};

// Do i need this to hold configs & state?
//  what state do i need to hold/record on-chain
//  what configs do i need to verify on-chain
#[account]
pub struct Propeller {
    pub bump: u8,
    pub admin: Pubkey,             //32
    pub wormhole: Pubkey,          //32
    pub token_bridge: Pubkey,      //32
    pub token_bridge_mint: Pubkey, //32

    pub sender_bump: u8,
    pub redeemer_bump: u8,

    pub gas_kickstart_amount: u64,
    /// TODO: should these be in swimUSD or native gas?
    /// fee that payer of complete txn will take from transferred amount
    pub propeller_fee: u64,
    pub secp_verify_init_fee: u64,
    pub secp_verify_fee: u64,
    pub post_vaa_fee: u64,
    pub complete_with_payload_fee: u64,
    pub process_swim_payload_fee: u64,
    // minimum amount of tokens that must be transferred in token bridge transfer
    // if propeller enabled transfer.
    // Note: No longer using min transfer amounts
    // client will set `max_fee` for propellerEnabled transfers and engine will
    // be responsible for checking if the fee is sufficient for it to relay the transfer
    // pub propeller_min_transfer_amount: u64,
    // pub propeller_eth_min_transfer_amount: u64,

    // gas kickstart parameters
    // 1. marginal_price_pool will be pool used to calculate token_bridge_mint -> stablecoin
    // 2. marginal_price_pool_token_index will be index of token in pool used to calculate token_bridge_mint -> stablecoin

    // pool used to get marginal price
    // e.g. usdc-usdt pool
    pub marginal_price_pool: Pubkey,
    pub marginal_price_pool_token_mint: Pubkey,
    // index of token used for calculating gas price
    pub marginal_price_pool_token_index: u8,

    // pub evm_routing_contract_address: [u8; 32],
    pub fee_vault: Pubkey, //32

                           // pub custody_signer_key: Pubkey,     // 32
                           //    pub custody_signer_bump: u8,        // 1

                           // pub mint_signer_key: Pubkey,     // 32
                           //    pub mint_signer_bump: u8,        // 1

                           // 	pub authority_signer_key: Pubkey,     // 32
                           //    pub authority_signer_bump: u8,        // 1
                           //
                           // 	pub bridge_config_key: Pubkey,     // 32
                           //    pub bridge_config_bump: u8,        // 1
                           //
                           // 	pub wormhole_config_key: Pubkey,     // 32
                           //    pub wormhole_config_bump: u8,        // 1
                           //
                           // 	pub fee_collector_key: Pubkey,     // 32
                           //    pub fee_collector_bump: u8,        // 1
                           //
                           // 	pub wormhole_emitter_key: Pubkey,     // 32
                           //    pub wormhole_emitter_bump: u8,        // 1
                           //
                           // 	pub wormhole_sequence_key: Pubkey,     // 32
                           //    pub wormhole_sequence_bump: u8,        // 1
}
// better to save pda keys on chain and always calculate/derive client side?
//  - if save pubkeys and don't use #[account(seeds=[...])] then need to manually call or save
//      PublicKey.findProgramAddress() on client side each time.
// or save pda bumps
impl Propeller {
    pub const LEN: usize = 1 + //bump
        32 + //admin
        32 + //wormhole
        32 + //token_bridge
        32 + //token_bridge_mint
        32 + //marginal_price_pool
        32 + //marginal_price_token_mint
        1 + //marginal_price_pool_token_index
        1 + //sender_bump
        1 + //redeemer_bump
        8 + //gas_kickstart_amount
        8 + //propeller_fee
        8 + // secp_verify_init_fee
        8 + // secp_verify_fee
        8 + // post_vaa_fee
        8 + // complete_with_payload_fee
        8 + //process_swim_payload_fee
        8 + // complete_with_payload_cost
        8 + // process_swim_payload_cost
        // 8 + //propeller_min_transfer_amount
        // 8 +  //propeller_eth_min_transfer_amount
        32; //fee_vault
            // 32; // evm_routing_contract_address

    pub fn wormhole(&self) -> Result<Pubkey> {
        // let pubkey = Pubkey::from_str(CORE_BRIDGE_ADDRESS)
        // .map_err(|_| PropellerError::InvalidWormholeAddress)?;
        // let pubkey = CORE_BRIDGE_ID;
        let pubkey = crate::Wormhole::id();
        Ok(pubkey)
    }

    pub fn token_bridge(&self) -> Result<Pubkey> {
        // let pubkey = Pubkey::from_str(TOKEN_BRIDGE_ADDRESS)
        // .map_err(|_| PropellerError::InvalidWormholeAddress)?;
        let pubkey = crate::TokenBridge::id();
        Ok(pubkey)
    }
}

#[account]
pub struct PropellerClaim {
    pub bump: u8,
    pub claimed: bool,
}

impl PropellerClaim {
    pub const LEN: usize = 1 + 1;
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
    // directly embedding instead of having a nested struct b/c
    // anchor doesn't know how to parse more than level deep in
    // #[account(seeds = [...])[
    pub swim_payload_version: u8,
    pub owner: Pubkey,
    pub propeller_enabled: bool,
    pub gas_kickstart: bool,
    pub max_fee: u64,
    pub target_token_id: u16,
    pub memo: [u8; 16],
}

impl PropellerMessage {
    pub const LEN: usize = 1 +  // bump
        32 + // message
        // 1 + // message bump
        32 + // claim
        // 1 +  // claim_bump
        32 + // vaa_emitter_address
        2 +  // vaa_emitter_chain
        8 +  // vaa_sequence
        8 + // transfer_amount
        // swim_payload
        RawSwimPayload::LEN; // swim_payload
                             // 1 + //version
                             // 32 + //owner
                             // 1 + // propeller_enabled
                             // 1 + // gas_kickstart
                             // 8 + // max_fee
                             // 2 +    // target_token_id
                             // 16; // memo
                             // SwimPayload::LEN; // swim_payload
}

//TODO: look into options for versioning.
//  ex - metaplex metadata versioning - (probably not. its messy).
#[derive(PartialEq, Debug, Clone)]
pub struct RawSwimPayload {
    //TOOD: should this come from propeller?
    pub swim_payload_version: u8,
    pub owner: Address,
    pub propeller_enabled: bool,
    pub gas_kickstart: bool,
    pub max_fee: u64,
    pub target_token_id: u16,
    pub memo: [u8; 16],
}

impl RawSwimPayload {
    pub const LEN: usize = 1 + //version
        32 + //owner
        1 + // propeller_enabled
        1 + // gas_kickstart
        8 + // max_fee
        2 +    // target_token_id
        16; // memo
}

impl From<RawSwimPayload> for SwimPayload {
    fn from(raw: RawSwimPayload) -> Self {
        SwimPayload {
            swim_payload_version: raw.swim_payload_version,
            owner: raw.owner,
            propeller_enabled: raw.propeller_enabled,
            max_fee: raw.max_fee,
            gas_kickstart: raw.gas_kickstart,
            target_token_id: raw.target_token_id,
            memo: raw.memo,
        }
    }
}

#[derive(PartialEq, Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct SwimPayload {
    //TOOD: should this come from propeller?
    pub swim_payload_version: u8,
    pub owner: [u8; 32],
    pub propeller_enabled: bool,
    pub gas_kickstart: bool,
    pub max_fee: u64,
    pub target_token_id: u16,
    pub memo: [u8; 16],
}

impl SwimPayload {
    pub const LEN: usize = 1 + //version
        32 + //owner
        1 + // propeller_enabled
        1 + // gas_kickstart
        8 + // max_fee
        2 +    // target_token_id
        16; // memo
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
        //    pub swim_payload_version: u8,
        //     pub owner: Address,
        //     pub propeller_enabled: bool,
        //     pub gas_kickstart: bool,
        //     pub max_fee: u64,
        //     pub target_token_id: u16,
        //     pub memo: [u8; 16],
        //TODO: add some error handling/checking here if payload version is incorrect.
        //  https://stackoverflow.com/questions/28028854/how-do-i-match-enum-values-with-an-integer
        let swim_payload_version = v.read_u8()?;

        let mut owner: [u8; 32] = Address::default();
        v.read_exact(&mut owner)?;

        let propeller_enabled = !(v.read_u8()? == 0);
        //TODO: should we allow any non-zero value to be true or specifically 1?
        let gas_kickstart = !(v.read_u8()? == 0);
        let max_fee = v.read_u64::<BigEndian>()?;
        let target_token_id = v.read_u16::<BigEndian>()?;
        // let mut target_token: [u8; 32] = Address::default();
        // v.read_exact(&mut target_token)?;

        // let mut min_output_amount_data: [u8; 32] = [0; 32];
        // v.read_exact(&mut min_output_amount_data)?;
        // let min_output_amount = U256::from_big_endian(&min_output_amount_data);

        let mut memo: [u8; 16] = [0; 16];
        v.read_exact(&mut memo)?;

        // let mut min_threshold_data: [u8; 32] = [0; 32];
        // v.read_exact(&mut min_threshold_data)?;
        // let min_threshold = U256::from_big_endian(&min_threshold_data);

        // let mut propeller_fee_data: [u8; 32] = [0; 32];
        // v.read_exact(&mut propeller_fee_data)?;
        // let propeller_fee = U256::from_big_endian(&propeller_fee_data);

        // let amount = U256::from_big_endian(&target_token);

        Ok(RawSwimPayload {
            swim_payload_version,
            owner,
            propeller_enabled,
            gas_kickstart,
            max_fee,
            target_token_id,
            memo,
        })
    }
}
//
impl AnchorSerialize for RawSwimPayload {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        // Payload ID
        // writer.write_u8(self.swim_payload_version)?;
        writer.write_u8(0)?;

        writer.write_all(&self.owner)?;
        writer.write_u8(if self.propeller_enabled { 1 } else { 0 })?;
        writer.write_u8(if self.gas_kickstart { 1 } else { 0 })?;
        writer.write_u64::<BigEndian>(self.max_fee)?;
        writer.write_u16::<BigEndian>(self.target_token_id)?;
        writer.write_all(&self.memo)?;
        Ok(())
    }
}

pub fn validate_marginal_prices_pool_accounts(
    propeller: &Propeller,
    marginal_price_pool: &Pubkey,
    marginal_price_pool_token_account_mints: &[Pubkey; TOKEN_COUNT],
) -> Result<()> {
    require_keys_eq!(*marginal_price_pool, propeller.marginal_price_pool);
    let pool_token_index = propeller.marginal_price_pool_token_index as usize;
    require_gt!(TOKEN_COUNT, pool_token_index, PropellerError::InvalidMarginalPricePoolAccounts);
    require_keys_eq!(
        marginal_price_pool_token_account_mints[pool_token_index],
        propeller.marginal_price_pool_token_mint,
    );
    Ok(())
}

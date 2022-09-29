use {
    crate::{constants::CURRENT_SWIM_PAYLOAD_VERSION, error::PropellerError, Address, TOKEN_COUNT},
    anchor_lang::prelude::*,
    anchor_spl::token::TokenAccount,
    byteorder::{BigEndian, ReadBytesExt, WriteBytesExt},
    std::{
        io::{Cursor, ErrorKind, Read, Write},
        str::FromStr,
    },
};

pub const SWIM_PAYLOAD_VERSION: u8 = 1;
// Do i need this to hold configs & state?
//  what state do i need to hold/record on-chain
//  what configs do i need to verify on-chain
#[account]
pub struct Propeller {
    pub bump: u8,
    pub nonce: u32,
    pub admin: Pubkey,         //32
    pub wormhole: Pubkey,      //32
    pub token_bridge: Pubkey,  //32
    pub swim_usd_mint: Pubkey, //32

    pub sender_bump: u8,
    pub redeemer_bump: u8,

    // in lamports
    pub gas_kickstart_amount: u64,

    // all fees are in LAMPORTS and NOT including rent
    pub secp_verify_init_fee: u64,
    pub secp_verify_fee: u64,
    pub post_vaa_fee: u64,
    pub init_ata_fee: u64,
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
        4 + //nonce
        32 + //admin
        32 + //wormhole
        32 + //token_bridge
        32 + //swim_usd_mint
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

    pub fn get_complete_native_with_payload_fee(&self) -> u64 {
        self.secp_verify_init_fee + self.secp_verify_fee + self.post_vaa_fee + self.complete_with_payload_fee
    }
}

#[account]
pub struct SwimClaim {
    pub bump: u8,
    pub claimed: bool,
}

impl SwimClaim {
    pub const LEN: usize = 1 + 1;
}

#[account]
pub struct SwimPayloadMessage {
    pub bump: u8,
    /// payer of `CompleteWithPayload` that will get the lamports
    /// when `SwimPayloadMessage` is closed after `ProcessSwimPayload`
    pub swim_payload_message_payer: Pubkey,
    // pub wh_message_bump: u8,
    pub claim: Pubkey,
    // pub claim_bump: u8,
    pub vaa_emitter_address: [u8; 32],
    pub vaa_emitter_chain: u16,
    pub vaa_sequence: u64,
    pub transfer_amount: u64,
    pub swim_payload_version: u8,
    pub owner: Pubkey,
    pub propeller_enabled: bool,
    pub gas_kickstart: bool,
    pub max_fee: u64,
    pub target_token_id: u16,
    pub memo: [u8; 16],
}

impl SwimPayloadMessage {
    pub const LEN: usize = 1 +  // bump
        32 + // payer
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
#[derive(PartialEq, Debug, Clone, Default)]
pub struct RawSwimPayload {
    /* always required fields */
    pub swim_payload_version: u8,
    pub owner: Address,
    /* required for all propellerEnabled */
    pub propeller_enabled: bool,
    pub gas_kickstart: bool,
    pub max_fee: u64,
    pub target_token_id: u16,
    /* required for swim propeller */
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
        // if swim_payload_version == 1 {
        //     deseraialize_swim_payload_v1()
        // }
        if swim_payload_version != CURRENT_SWIM_PAYLOAD_VERSION {
            return Err(std::io::Error::new(ErrorKind::InvalidInput, "Wrong Swim Payload Version".to_string()));
        }

        let mut owner: [u8; 32] = Address::default();
        v.read_exact(&mut owner)?;

        /* optional fields */
        match v.read_u8() {
            Ok(propeller_enabled_val) => {
                let propeller_enabled = !(propeller_enabled_val == 0);
                let gas_kickstart = !(v.read_u8()? == 0);
                let max_fee = v.read_u64::<BigEndian>()?;
                let target_token_id = v.read_u16::<BigEndian>()?;
                // optional memo field
                let mut memo: [u8; 16] = [0; 16];
                if let Ok(_) = v.read_exact(&mut memo) {
                    Ok(RawSwimPayload {
                        swim_payload_version,
                        owner,
                        propeller_enabled,
                        gas_kickstart,
                        max_fee,
                        target_token_id,
                        memo,
                    })
                } else {
                    Ok(RawSwimPayload {
                        swim_payload_version,
                        owner,
                        propeller_enabled,
                        gas_kickstart,
                        max_fee,
                        target_token_id,
                        memo: [0; 16],
                    })
                }
            }
            Err(error) => match error.kind() {
                ErrorKind::UnexpectedEof => Ok(RawSwimPayload { swim_payload_version, owner, ..Default::default() }),
                _ => return Err(error),
            },
        }
    }
}

impl AnchorSerialize for RawSwimPayload {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        // Payload ID
        // writer.write_u8(self.swim_payload_version)?;
        writer.write_u8(CURRENT_SWIM_PAYLOAD_VERSION)?;

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_non_propeller_swim_payload() {}

    #[test]
    fn test_propeller_swim_payload() {}

    #[test]
    fn test_third_party_swim_payload() {}
}

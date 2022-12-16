use {
    crate::{constants::CURRENT_SWIM_PAYLOAD_VERSION},
    anchor_lang::{prelude::*, solana_program::pubkey},
    borsh::{BorshDeserialize, BorshSerialize},
    byteorder::{BigEndian, ReadBytesExt, WriteBytesExt},
    primitive_types::U256,
    sha3::Digest,
    std::{
        io::{Cursor, ErrorKind, Read, Write},
        ops::{Deref, DerefMut},
    },
};

pub type Address = [u8; 32];
pub type ChainID = u16;

#[derive(Debug, Clone)]
pub struct Wormhole;

impl anchor_lang::Id for Wormhole {
    // #[cfg(feature = "localnet")]
    #[cfg(all(feature = "localnet", not(feature = "devnet"), not(feature = "mainnet")))]
    fn id() -> Pubkey {
        pubkey!("Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o")
    }

    // #[cfg(feature = "devnet")]
    #[cfg(all(feature = "devnet", not(feature = "localnet"), not(feature = "mainnet")))]
    fn id() -> Pubkey {
        pubkey!("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5")
    }

    // #[cfg(feature = "mainnet")]
    #[cfg(all(feature = "mainnet", not(feature = "localnet"), not(feature = "devnet")))]
    fn id() -> Pubkey {
        pubkey!("worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth")
    }
}

/// Data that goes into a [`wormhole::Instruction::PostMessage`]
#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct PostMessageData {
    /// Unique nonce for this message
    pub nonce: u32,

    /// Message payload
    pub payload: Vec<u8>,

    /// Commitment Level required for an attestation to be produced
    pub consistency_level: ConsistencyLevel,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub enum ConsistencyLevel {
    Confirmed,
    Finalized,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub enum Instruction {
    Initialize,
    PostMessage,
    PostVAA,
    SetFees,
    TransferFees,
    UpgradeContract,
    UpgradeGuardianSet,
    VerifySignatures,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct BridgeData {
    /// The current guardian set index, used to decide which signature sets to accept.
    pub guardian_set_index: u32,

    /// Lamports in the collection account
    pub last_lamports: u64,

    /// Bridge configuration, which is set once upon initialization.
    pub config: BridgeConfig,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct BridgeConfig {
    /// Period for how long a guardian set is valid after it has been replaced by a new one.  This
    /// guarantees that VAAs issued by that set can still be submitted for a certain period.  In
    /// this period we still trust the old guardian set.
    pub guardian_set_expiration_time: u32,

    /// Amount of lamports that needs to be paid to the protocol to post a message
    pub fee: u64,
}

/// [From womrhole repo]
#[repr(transparent)]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PostedMessageData {
    pub message: MessageData,
}

impl AnchorSerialize for PostedMessageData {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        writer.write(b"msg")?;
        BorshSerialize::serialize(&self.message, writer)
    }
}

impl AnchorDeserialize for PostedMessageData {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        *buf = &buf[3..];
        Ok(PostedMessageData { message: <MessageData as BorshDeserialize>::deserialize(buf)? })
    }
}
impl anchor_lang::Owner for PostedMessageData {
    fn owner() -> Pubkey {
        Wormhole::id()
    }
}

impl anchor_lang::AccountDeserialize for PostedMessageData {
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self> {
        *buf = &buf[3..];
        Ok(<PostedMessageData as BorshDeserialize>::deserialize(buf)?)
    }
}
impl anchor_lang::AccountSerialize for PostedMessageData {}

impl Deref for PostedMessageData {
    type Target = PostedMessageData;

    fn deref(&self) -> &Self {
        self
    }
}

// #[derive(Debug, Default, BorshDeserialize, BorshSerialize)]
#[derive(Debug, AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Eq)]
pub struct MessageData {
    /// Header of the posted VAA
    pub vaa_version: u8,

    /// Level of consistency requested by the emitter
    pub consistency_level: u8,

    /// Time the vaa was submitted
    pub vaa_time: u32,

    /// Account where signatures are stored
    pub vaa_signature_account: Pubkey,

    /// Time the posted message was created
    pub submission_time: u32,

    /// Unique nonce for this message
    pub nonce: u32,

    /// Sequence number of this message
    pub sequence: u64,

    /// Emitter of the message
    pub emitter_chain: u16,

    /// Emitter of the message
    pub emitter_address: [u8; 32],

    /// Message payload aka `PayloadTransferWithPayload`
    pub payload: Vec<u8>,
    // pub payload: PayloadTransferWithPayload,
    // pub payload: MessageData,
}

impl anchor_lang::AccountDeserialize for MessageData {
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self> {
        *buf = &buf[3..];
        Ok(<MessageData as BorshDeserialize>::deserialize(buf)?)
        // <MessageData as BorshDeserialize>::deserialize(*data[3..])?
        // let mut deserializer = anchor_lang::Deserializer::new(data);
        // Self::deserialize(&mut deserializer)
    }
}

impl anchor_lang::Owner for MessageData {
    fn owner() -> Pubkey {
        // pub use spl_token::ID is used at the top of the file
        // Pubkey::from_str(env::CORE_BRIDGE_ADDRESS).unwrap()
        Wormhole::id()
    }
}

impl anchor_lang::AccountSerialize for MessageData {}

// #[derive(PartialEq, Debug, Clone)]
// pub struct PayloadTransferWithPayload {
//     pub message_type: u8,
//     /// Amount being transferred (big-endian uint256)
//     pub amount: U256,
//
//     //TODO: safe to assume pubkey for these since this should only be used for
//     // completeTransferWithPayload(e.g. solana side)?
//     /// Address of the token. Left-zero-padded if shorter than 32 bytes
//     pub token_address: Address,
//     /// Chain ID of the token
//     pub token_chain: ChainID,
//     /// Address of the recipient. Left-zero-padded if shorter than 32 bytes
//     pub to: Address,
//     /// Chain ID of the recipient
//     pub to_chain: ChainID,
//
//     /// TODO: only this one needs to be `Address` since it should come from the evm contract/user
//     /// Sender of the transaction
//     pub from_address: Address,
//     /// Arbitrary payload
//     // pub payload: Vec<u8>,
//     // pub payload: RawSwimPayload,
// }
//
// impl AnchorDeserialize for PayloadTransferWithPayload {
//     fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
//         let mut v = Cursor::new(buf);
//         let message_type = v.read_u8()?;
//         if message_type != 3 {
//             // return Err(error!(PropellerError::InvalidPayloadTypeInVaa)).into()
//             // return Err(ProgramError::BorshIoError("Wrong Payload Type".to_string()).into());
//             return Err(std::io::Error::new(ErrorKind::InvalidInput, "Wrong Payload Type".to_string()));
//             // return Err(PropellerError::InvalidPayloadTypeInVaa);
//         };
//
//         let mut am_data: [u8; 32] = [0; 32];
//         v.read_exact(&mut am_data)?;
//         let amount = U256::from_big_endian(&am_data);
//
//         let mut token_address = Address::default();
//         v.read_exact(&mut token_address)?;
//
//         let token_chain = v.read_u16::<BigEndian>()?;
//
//         let mut to = Address::default();
//         v.read_exact(&mut to)?;
//
//         let to_chain = v.read_u16::<BigEndian>()?;
//
//         let mut from_address = Address::default();
//         v.read_exact(&mut from_address)?;
//
//         let mut payload = vec![];
//         v.read_to_end(&mut payload)?;
//         let swim_payload = RawSwimPayload::deserialize(&mut payload.as_slice())?;
//
//         Ok(PayloadTransferWithPayload {
//             message_type,
//             amount,
//             token_address,
//             token_chain,
//             to,
//             to_chain,
//             from_address,
//             payload: swim_payload,
//         })
//     }
// }
//
// //TODO: probably not needed since we shouldn't be serializing any payload directly.
// //  this would be handled in CPI
// impl AnchorSerialize for PayloadTransferWithPayload {
//     fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
//         // Payload ID
//         writer.write_u8(3)?;
//
//         let mut am_data: [u8; 32] = [0; 32];
//         self.amount.to_big_endian(&mut am_data);
//         writer.write_all(&am_data)?;
//
//         writer.write_all(&self.token_address)?;
//         writer.write_u16::<BigEndian>(self.token_chain)?;
//         writer.write_all(&self.to)?;
//         writer.write_u16::<BigEndian>(self.to_chain)?;
//
//         writer.write_all(&self.from_address)?;
//
//         AnchorSerialize::serialize(&self.payload, writer)?;
//         // writer.write_all(self.payload.as_slice())?;
//
//         Ok(())
//     }
// }

#[derive(PartialEq, Eq, Debug, Clone)]
pub struct PayloadTransferWithPayload {
    pub message_type: u8,
    /// Amount being transferred (big-endian uint256)
    pub amount: U256,

    //TODO: safe to assume pubkey for these since this should only be used for
    // completeTransferWithPayload(e.g. solana side)?
    /// Address of the token. Left-zero-padded if shorter than 32 bytes
    pub token_address: Address,
    /// Chain ID of the token
    pub token_chain: ChainID,
    /// Address of the recipient. Left-zero-padded if shorter than 32 bytes
    pub to: Address,
    /// Chain ID of the recipient
    pub to_chain: ChainID,

    /// TODO: only this one needs to be `Address` since it should come from the evm contract/user
    /// Sender of the transaction
    pub from_address: Address,
    /// Arbitrary payload
    // pub payload: Vec<u8>,
    // pub payload: RawSwimPayload,
    pub payload: SwimPayload,
}

impl AnchorDeserialize for PayloadTransferWithPayload {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        let mut v = Cursor::new(buf);
        let message_type = v.read_u8()?;
        if message_type != 3 {
            // return Err(error!(PropellerError::InvalidPayloadTypeInVaa)).into()
            // return Err(ProgramError::BorshIoError("Wrong Payload Type".to_string()).into());
            return Err(std::io::Error::new(ErrorKind::InvalidInput, "Wrong Payload Type".to_string()));
            // return Err(PropellerError::InvalidPayloadTypeInVaa);
        };

        let mut am_data: [u8; 32] = [0; 32];
        v.read_exact(&mut am_data)?;
        let amount = U256::from_big_endian(&am_data);

        let mut token_address = Address::default();
        v.read_exact(&mut token_address)?;

        let token_chain = v.read_u16::<BigEndian>()?;

        let mut to = Address::default();
        v.read_exact(&mut to)?;

        let to_chain = v.read_u16::<BigEndian>()?;

        let mut from_address = Address::default();
        v.read_exact(&mut from_address)?;

        let mut payload = vec![];
        v.read_to_end(&mut payload)?;
        let swim_payload = SwimPayload::deserialize(&mut payload.as_slice())?;

        Ok(PayloadTransferWithPayload {
            message_type,
            amount,
            token_address,
            token_chain,
            to,
            to_chain,
            from_address,
            payload: swim_payload,
        })
    }
}

//TODO: probably not needed since we shouldn't be serializing any payload directly.
//  this would be handled in CPI
impl AnchorSerialize for PayloadTransferWithPayload {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        // Payload ID
        writer.write_u8(3)?;

        let mut am_data: [u8; 32] = [0; 32];
        self.amount.to_big_endian(&mut am_data);
        writer.write_all(&am_data)?;

        writer.write_all(&self.token_address)?;
        writer.write_u16::<BigEndian>(self.token_chain)?;
        writer.write_all(&self.to)?;
        writer.write_u16::<BigEndian>(self.to_chain)?;

        writer.write_all(&self.from_address)?;

        self.payload.serialize(writer)?;
        // AnchorSerialize::serialize(&self.payload, writer)?;
        // writer.write_all(self.payload.as_slice())?;

        Ok(())
    }
}

pub fn get_message_data(vaa_account: &AccountInfo) -> Result<MessageData> {
    Ok(PostedMessageData::try_from_slice(&vaa_account.data.borrow())?.message)
}

pub fn get_transfer_with_payload_from_message_account(vaa_account: &AccountInfo) -> Result<PayloadTransferWithPayload> {
    let message_data = get_message_data(vaa_account)?;
    let payload_transfer_with_payload = deserialize_message_payload(&mut message_data.payload.as_slice())?;
    Ok(payload_transfer_with_payload)
}

pub fn deserialize_message_payload<T: AnchorDeserialize>(buf: &mut &[u8]) -> Result<T> {
    Ok(T::deserialize(buf)?)
}

/** Adding PostedVAA version here for parity */

#[repr(transparent)]
#[derive(Clone)]
pub struct PostedVAAData {
    pub message: MessageData,
}

impl AccountSerialize for PostedVAAData {
    fn try_serialize<W: Write>(&self, writer: &mut W) -> Result<()> {
        if writer.write_all(b"vaa").is_err() {
            return Err(anchor_lang::error::ErrorCode::AccountDidNotSerialize.into());
        }
        if AnchorSerialize::serialize(self, writer).is_err() {
            return Err(anchor_lang::error::ErrorCode::AccountDidNotSerialize.into());
        }
        Ok(())
    }
}
impl AccountDeserialize for PostedVAAData {
    fn try_deserialize(buf: &mut &[u8]) -> Result<Self> {
        anchor_lang::prelude::msg!("starting try_deserialize");
        let expected: [&[u8]; 3] = [b"vaa", b"msg", b"msu"];
        let magic: &[u8] = &buf[0..3];
        if !expected.contains(&magic) {
            // return Err(Error::new(InvalidData, "Magic mismatch."));
            return Err(anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into());
        };
        anchor_lang::prelude::msg!("passed expected magic check");
        // let mut buf = [0; 3];
        // reader.read_exact(&mut buf)?;
        // if buf != b"vaa" {
        //     return Err(anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into());
        // }
        *buf = &buf[3..];
        Ok(AnchorDeserialize::deserialize(buf)?)
    }
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self> {
        anchor_lang::prelude::msg!("starting try_deserialize_unchecked");
        let mut data: &[u8] = &buf[3..];
        AnchorDeserialize::deserialize(&mut data)
            .map_err(|_| anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into())
    }
}

impl AnchorSerialize for PostedVAAData {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        // writer.write(b"vaa")?;
        BorshSerialize::serialize(&self.message, writer)
    }
}

impl AnchorDeserialize for PostedVAAData {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        // *buf = &buf[3..];
        Ok(PostedVAAData { message: <MessageData as BorshDeserialize>::deserialize(buf)? })
    }
}

impl Deref for PostedVAAData {
    type Target = MessageData;

    fn deref(&self) -> &Self::Target {
        &self.message
    }
}

impl DerefMut for PostedVAAData {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.message
    }
}

impl anchor_lang::Owner for PostedVAAData {
    fn owner() -> Pubkey {
        Wormhole::id()
    }
}

pub struct MessageAccount {}

pub const VERIFY_SIGNATURES_INSTRUCTION: u8 = 7;

/// Wormhole Claim Account data
#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct ClaimData {
    pub claimed: bool,
}

/*
This is created by the wasm post_vaa_ix() function.
It takes a full vaa (AnchorSwimPayloadVAA) and strips out the signatures
 */
#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PostVAAData {
    // Header part
    pub version: u8,
    pub guardian_set_index: u32,

    // Body part
    pub timestamp: u32,
    pub nonce: u32,
    pub emitter_chain: u16,
    pub emitter_address: [u8; 32],
    pub sequence: u64,
    pub consistency_level: u8,
    pub payload: Vec<u8>,
}

// Convert a full VAA structure into the serialization of its unique components, this structure is
// what is hashed and verified by Guardians.
pub fn serialize_vaa(vaa: &PostVAAData) -> Vec<u8> {
    let mut v = Cursor::new(Vec::new());
    v.write_u32::<BigEndian>(vaa.timestamp).unwrap();
    v.write_u32::<BigEndian>(vaa.nonce).unwrap();
    v.write_u16::<BigEndian>(vaa.emitter_chain).unwrap();
    v.write_all(&vaa.emitter_address).unwrap();
    v.write_u64::<BigEndian>(vaa.sequence).unwrap();
    v.write_u8(vaa.consistency_level).unwrap();
    v.write_all(&vaa.payload).unwrap();
    v.into_inner()
}

// Hash a VAA, this combines serialization and hashing.
pub fn hash_vaa(vaa: &PostVAAData) -> [u8; 32] {
    let body = serialize_vaa(vaa);
    let mut h = sha3::Keccak256::default();
    h.write_all(body.as_slice()).unwrap();
    h.finalize().into()
}

#[derive(PartialEq, Eq, Debug, Clone, Default)]
pub struct SwimPayload {
    //TOOD: should this come from propeller?
    //required
    pub swim_payload_version: u8,
    pub owner: [u8; 32],
    // required for all propellerEngines
    pub propeller_enabled: Option<bool>,
    pub gas_kickstart: Option<bool>,
    pub max_fee: Option<u64>,
    pub target_token_id: Option<u16>,
    // required for SWIM propellerEngine
    pub memo: Option<[u8; 16]>,
}

impl AnchorSerialize for SwimPayload {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        // Payload ID
        // writer.write_u8(self.swim_payload_version)?;
        writer.write_u8(self.swim_payload_version)?;
        writer.write_all(&self.owner)?;

        if self.propeller_enabled.is_some() {
            writer.write_u8(1)?;
            writer.write_u8(self.gas_kickstart.unwrap() as u8)?;
            writer.write_u64::<BigEndian>(self.max_fee.unwrap())?;
            writer.write_u16::<BigEndian>(self.target_token_id.unwrap())?;
            if self.memo.is_some() {
                writer.write_all(&self.memo.unwrap())?;
            }
        }
        Ok(())
    }
}

impl AnchorDeserialize for SwimPayload {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        let mut v = Cursor::new(buf);

        //TODO: add some error handling/checking here if payload version is incorrect.
        //  https://stackoverflow.com/questions/28028854/how-do-i-match-enum-values-with-an-integer
        let swim_payload_version = v.read_u8()?;
        if swim_payload_version != CURRENT_SWIM_PAYLOAD_VERSION {
            return Err(std::io::Error::new(ErrorKind::InvalidInput, "Wrong Swim Payload Version".to_string()));
        }

        let mut owner: [u8; 32] = Address::default();
        v.read_exact(&mut owner)?;

        /* optional fields */
        match v.read_u8() {
            Ok(propeller_enabled_val) => {
                let propeller_enabled = propeller_enabled_val != 0;
                let gas_kickstart = v.read_u8()? != 0;
                let max_fee = v.read_u64::<BigEndian>()?;
                let target_token_id = v.read_u16::<BigEndian>()?;
                // optional memo field
                let mut memo: [u8; 16] = [0; 16];
                if let Ok(_) = v.read_exact(&mut memo) {
                    Ok(SwimPayload {
                        swim_payload_version,
                        owner,
                        propeller_enabled: Some(propeller_enabled),
                        gas_kickstart: Some(gas_kickstart),
                        max_fee: Some(max_fee),
                        target_token_id: Some(target_token_id),
                        memo: Some(memo),
                    })
                } else {
                    Ok(SwimPayload {
                        swim_payload_version,
                        owner,
                        propeller_enabled: Some(propeller_enabled),
                        gas_kickstart: Some(gas_kickstart),
                        max_fee: Some(max_fee),
                        target_token_id: Some(target_token_id),
                        memo: None,
                    })
                }
            }
            Err(error) => match error.kind() {
                ErrorKind::UnexpectedEof => Ok(SwimPayload { swim_payload_version, owner, ..Default::default() }),
                _ => Err(error),
            },
        }
    }
}

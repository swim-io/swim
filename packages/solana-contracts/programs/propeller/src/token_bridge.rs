use {
    anchor_lang::{prelude::*, solana_program::pubkey},
    borsh::{BorshDeserialize, BorshSerialize},
};

#[derive(Debug, Clone)]
pub struct TokenBridge;

impl anchor_lang::Id for TokenBridge {
    fn id() -> Pubkey {
        // #[cfg(feature = "localnet")]
        // return pubkey!("B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE");
        // #[cfg(feature = "devnet")]
        // return pubkey!("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe");
        // #[cfg(feature = "mainnet")]
        // return pubkey!("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb");
        // TOKEN_BRIDGE_ID
        ID
    }
}

// pub const TOKEN_BRIDGE_LOCALNET: Pubkey = pubkey!("B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE");
// pub const TOKEN_BRIDGE_DEVNET: Pubkey = pubkey!("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe");
// pub const TOKEN_BRIDGE_MAINNET: Pubkey = pubkey!("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb");
//
// #[cfg(feature = "localnet")]
// pub const TOKEN_BRIDGE_ID: Pubkey = TOKEN_BRIDGE_LOCALNET;
// #[cfg(feature = "devnet")]
// pub const TOKEN_BRIDGE_ID: Pubkey = TOKEN_BRIDGE_DEVNET;
// #[cfg(feature = "mainnet")]
// pub const TOKEN_BRIDGE_ID: Pubkey = TOKEN_BRIDGE_MAINNET;

// pub use TOKEN_BRIDGE_ID as TOKEN_BRIDGE_ID_2;

// pub use wh_token_bridge::ID as TOKEN_BRIDGE_ID;
// // pub const TOKEN_BRIDGE_ID: Pubkey = TOKEN_BRIDGE;
pub use wh_token_bridge::ID;
pub mod wh_token_bridge {
    use anchor_lang::solana_program::declare_id;

    #[cfg(feature = "mainnet")]
    declare_id!("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb");

    #[cfg(feature = "devnet")]
    declare_id!("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe");

    // #[cfg(all(not(feature = "devnet"), not(feature = "mainnet")))]
    #[cfg(feature = "localnet")]
    declare_id!("B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE");
}

/** TESTNET refers to WH Testnet which uses solana devnet */
pub const MAINNET_WH_BRIDGE_STR: &str = "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth";
pub const MAINNET_WH_TOKEN_BRIDGE_STR: &str = "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb";
pub const TESTNET_WH_BRIDGE_STR: &str = "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5";
pub const TESTNET_WH_TOKEN_BRIDGE_STR: &str = "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe";
pub const DEVNET_CORE_BRIDGE_ADDRESS: &str = "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o";
pub const DEVNET_TOKEN_BRIDGE_ADDRESS: &str = "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE";

pub const CANDY_MACHINE_V2_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    0x09, 0x2a, 0xee, 0x3d, 0xfc, 0x2d, 0x0e, 0x55, 0x78, 0x23, 0x13, 0x83, 0x79, 0x69, 0xea, 0xf5, 0x21, 0x51, 0xc0,
    0x96, 0xc0, 0x6b, 0x5c, 0x2a, 0x82, 0xf0, 0x86, 0xa5, 0x03, 0xe8, 0x2c, 0x34,
]);
pub const MAINNET_WH_BRIDGE: Pubkey = Pubkey::new_from_array([
    14, 10, 88, 154, 65, 165, 95, 189, 102, 197, 42, 71, 95, 45, 146, 166, 211, 220, 155, 71, 71, 17, 76, 185, 175,
    130, 90, 152, 181, 69, 211, 206,
]);
pub const MAINNET_WH_TOKEN_BRIDGE: Pubkey = Pubkey::new_from_array([
    14, 10, 88, 158, 100, 136, 20, 122, 148, 220, 250, 89, 43, 144, 253, 212, 17, 82, 187, 44, 167, 123, 246, 1, 103,
    88, 166, 244, 223, 157, 33, 180,
]);
pub const TESTNET_WH_BRIDGE: Pubkey = Pubkey::new_from_array([
    43, 18, 70, 201, 238, 250, 60, 70, 103, 146, 37, 49, 17, 243, 95, 236, 30, 232, 238, 94, 157, 235, 196, 18, 210,
    233, 173, 173, 254, 205, 204, 114,
]);
pub const TESTNET_WH_TOKEN_BRIDGE: Pubkey = Pubkey::new_from_array([
    186, 178, 144, 69, 74, 141, 253, 176, 134, 178, 102, 106, 116, 82, 57, 139, 174, 25, 147, 150, 146, 51, 183, 216,
    207, 204, 154, 27, 0, 1, 208, 221,
]);

/**
 * Same as TransferNative & TransferWrapped Data.
 */
// #[derive(BorshDeserialize, BorshSerialize, Default)]
#[derive(AnchorDeserialize, AnchorSerialize, Default)]
pub struct TransferData {
    pub nonce: u32,
    pub amount: u64,
    pub fee: u64,
    pub target_address: [u8; 32],
    pub target_chain: u16,
}

/**
* Same as TransferNativeWithPayloadData & TransferWrappedWithPayloadData.
* this is the data that goes into the Instruction.
*/
// #[derive(BorshDeserialize, BorshSerialize, Default)]
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

/**
* Same as CompleteNativeWithPayloadData & CompleteWrappedWithPayloadData.
*/
#[derive(BorshDeserialize, BorshSerialize, Default)]
pub struct CompleteWithPayloadData {}

// Note: numbering comes from `solitare!` macro in
// https://github.com/certusone/wormhole/blob/dev.v2/solana/modules/token_bridge/program/src/lib.rs
pub const TRANSFER_WRAPPED_INSTRUCTION: u8 = 4;
pub const TRANSFER_NATIVE_INSTRUCTION: u8 = 5;
pub const COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION: u8 = 9;
pub const COMPLETE_WRAPPED_WITH_PAYLOAD_INSTRUCTION: u8 = 10;
pub const TRANSFER_WRAPPED_WITH_PAYLOAD_INSTRUCTION: u8 = 11;
pub const TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION: u8 = 12;

#[cfg(test)]
mod test {
    use {
        super::*,
        // crate::TOKEN_BRIDGE_ID,
        std::str::FromStr,
    };

    #[test]
    fn testId() {
        println!("token_bridge_id: {}", TokenBridge::id());
        println!("token_bridge_id2: {}", ID);
    }

    // #[test]
    // fn test2() {
    //     println!("{}", type_name_of_val(&TOKEN_BRIDGE_ID));
    // }

    #[test]
    fn test() {
        let mainnet_wh_bridge = Pubkey::from_str(MAINNET_WH_BRIDGE_STR).unwrap();
        let mainnet_wh_token_bridge = Pubkey::from_str(MAINNET_WH_TOKEN_BRIDGE_STR).unwrap();
        let testnet_wh_bridge = Pubkey::from_str(TESTNET_WH_BRIDGE_STR).unwrap();
        let testnet_wh_token_bridge = Pubkey::from_str(TESTNET_WH_TOKEN_BRIDGE_STR).unwrap();

        let mainnet_wh_bridge_bytes = mainnet_wh_bridge.to_bytes();
        let mainnet_wh_token_bridge_bytes = mainnet_wh_token_bridge.to_bytes();
        let testnet_wh_bridge_bytes = testnet_wh_bridge.to_bytes();
        let testnet_wh_token_bridge_bytes = testnet_wh_token_bridge.to_bytes();

        println!("{:?}", mainnet_wh_bridge_bytes);
        println!("{:?}", mainnet_wh_token_bridge_bytes);
        println!("{:?}", testnet_wh_bridge_bytes);
        println!("{:?}", testnet_wh_token_bridge_bytes);

        assert_eq!(MAINNET_WH_BRIDGE, mainnet_wh_bridge);

        assert_eq!(MAINNET_WH_TOKEN_BRIDGE, mainnet_wh_token_bridge);

        assert_eq!(TESTNET_WH_BRIDGE, testnet_wh_bridge);
        assert_eq!(TESTNET_WH_TOKEN_BRIDGE, testnet_wh_token_bridge);
        // println!("yay");
    }
}

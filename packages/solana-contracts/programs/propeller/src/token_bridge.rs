use {
    anchor_lang::{
        prelude::*,
        solana_program::{declare_id, pubkey},
    },
    borsh::{BorshDeserialize, BorshSerialize},
};
// mod token_bridge {
//     use super::*;
//     #[cfg(all(feature = "localnet", not(feature = "devnet"), not(feature = "mainnet")))]
//     declare_id!("B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE");
//
//     // #[cfg(feature = "devnet")]
//     #[cfg(all(feature = "devnet", not(feature = "localnet"), not(feature = "mainnet")))]
//     declare_id!("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe");
//
//     #[cfg(all(feature = "mainnet", not(feature = "localnet"), not(feature = "devnet")))]
//     declare_id!("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb");
// }
#[derive(Debug, Clone)]
pub struct TokenBridge;

impl anchor_lang::Id for TokenBridge {
    // #[cfg(all(test, not(feature = "test-bpf")))]
    // #[cfg(feature = "localnet")]
    #[cfg(all(feature = "localnet", not(feature = "devnet"), not(feature = "mainnet")))]
    fn id() -> Pubkey {
        // declare_id!("B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE")
        pubkey!("B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE")
    }

    // #[cfg(feature = "devnet")]

    #[cfg(all(feature = "devnet", not(feature = "localnet"), not(feature = "mainnet")))]
    fn id() -> Pubkey {
        // declare_id!("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe")
        pubkey!("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe")
    }

    #[cfg(all(feature = "mainnet", not(feature = "localnet"), not(feature = "devnet")))]
    fn id() -> Pubkey {
        // declare_id!("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb")
        pubkey!("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb")
    }
}

// Note: numbering comes from `solitare!` macro in
// https://github.com/certusone/wormhole/blob/dev.v2/solana/modules/token_bridge/program/src/lib.rs
// pub const TRANSFER_WRAPPED_INSTRUCTION: u8 = 4;
// pub const TRANSFER_NATIVE_INSTRUCTION: u8 = 5;
pub const COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION: u8 = 9;
// pub const COMPLETE_WRAPPED_WITH_PAYLOAD_INSTRUCTION: u8 = 10;
// pub const TRANSFER_WRAPPED_WITH_PAYLOAD_INSTRUCTION: u8 = 11;
pub const TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION: u8 = 12;

#[cfg(test)]
mod test {
    use {
        super::*,
        // crate::TOKEN_BRIDGE_ID,
        std::str::FromStr,
    };

    #[test]
    fn test_id() {
        println!("token_bridge_id: {}", TokenBridge::id());
        // println!("token_bridge_id2: {}", ID);
    }
}

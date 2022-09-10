use {
    anchor_lang::{prelude::*, solana_program::pubkey},
    borsh::{BorshDeserialize, BorshSerialize},
};

#[derive(Debug, Clone)]
pub struct TokenBridge;

impl anchor_lang::Id for TokenBridge {
    #[cfg(feature = "localnet")]
    fn id() -> Pubkey {
        pubkey!("B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE")
    }

    #[cfg(feature = "devnet")]
    fn id() -> Pubkey {
        pubkey!("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe")
    }

    #[cfg(feature = "mainnet")]
    fn id() -> Pubkey {
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

// use anchor_lang::prelude::Pubkey;
// use static_pubkey::static_pubkey;
// // pub const CONDUCTOR_CHAIN: &str = std::env!("CONDUCTOR_CHAIN");
// // pub const CONDUCTOR_ADDRESS: &str = std::env!("CONDUCTOR_ADDRESS");
// pub const CORE_BRIDGE_ADDRESS: &str = std::env!("CORE_BRIDGE_ADDRESS");
// pub const TOKEN_BRIDGE_ADDRESS: &str = std::env!("TOKEN_BRIDGE_ADDRESS");

// pub const CORE_BRIDGE_ADDRESS_PUBKEY: Pubkey = static_pubkey!(CORE_BRIDGE_ADDRESS);

//TODO: option to have separate programIds depending on cluster. probably not needed and should keep the same
//  programId for all environments
// https://solana.stackexchange.com/questions/848/how-to-have-a-different-program-id-depending-on-the-cluster
// #[cfg(feature = "mainnet")]
// declare_id!("8ghymvPffJbkLHqYfSKdE8moRH5gSf4AQav9qtZfu77H");
// #[cfg(not(feature = "mainnet"))]
// declare_id!("DLANS7Qh31fFWLujEMtn5kyd87H8ZUbhwtfMurrSHYn9");

use anchor_lang::prelude::*;
pub use core_bridge::ID as CORE_BRIDGE;
mod core_bridge {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth");

    #[cfg(feature = "devnet")]
    declare_id!("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5");

    // #[cfg(all(not(feature = "devnet"), not(feature = "mainnet")))]
    #[cfg(feature = "localnet")]
    declare_id!("Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o");
}

pub use token_bridge::ID as TOKEN_BRIDGE;
mod token_bridge {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb");

    #[cfg(feature = "devnet")]
    declare_id!("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe");

    // #[cfg(all(not(feature = "devnet"), not(feature = "mainnet")))]
    #[cfg(feature = "localnet")]
    declare_id!("B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE");
}

#[cfg(all(test, not(feature = "test-bpf")))]
mod tests {
    use {super::*, switchboard_v2::SWITCHBOARD_PROGRAM_ID};
    #[test]
    pub fn ids() {
        println!(
            "core_bridge: {:?}, token_bridge: {:?}",
            CORE_BRIDGE, TOKEN_BRIDGE
        );
        println!("switchboard: {:?}", SWITCHBOARD_PROGRAM_ID);
    }
}

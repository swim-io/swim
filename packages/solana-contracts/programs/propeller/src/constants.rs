use {num_traits::FromPrimitive, rust_decimal::Decimal};

pub const CURRENT_SWIM_PAYLOAD_VERSION: u8 = 1;
pub const TOKEN_COUNT: usize = 2;

// seed prefixes
// pub const SEED_PREFIX_CUSTODIAN: &str = "icco-custodian";
// pub const SEED_PREFIX_SALE: &str = "icco-sale";
// pub const SEED_PREFIX_BUYER: &str = "icco-buyer";

pub const CHAIN_ID_SOL: u16 = 1;
pub const CHAIN_ID_ETH: u16 = 2;

pub const TOKEN_BRIDGE_MINT_OUTPUT_TOKEN_INDEX: usize = 0;
pub const SWAP_EXACT_INPUT_OUTPUT_TOKEN_INDEX: u8 = 0;
pub const REMOVE_EXACT_BURN_OUTPUT_TOKEN_INDEX: u8 = 0;
pub const SWAP_EXACT_OUTPUT_INPUT_TOKEN_INDEX: u8 = 1;
/// Pool IXs for sending ignore slippage
pub const PROPELLER_MINIMUM_OUTPUT_AMOUNT: u64 = 0u64;

// pub const LAMPORTS_PER_SOL_DECIMAL: Decimal = Decimal::from_u64(1_000_000_000u64).unwrap();
pub const LAMPORTS_PER_SOL_DECIMAL: Decimal = Decimal::from_parts(1_000_000_000u32, 0, 0, false, 0u32);

#[cfg(all(feature = "localnet", not(feature = "devnet"), not(feature = "mainnet")))]
pub const TOKEN_BRIDGE_PROGRAM_ID: &str = "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE";

#[cfg(all(feature = "devnet", not(feature = "localnet"), not(feature = "mainnet")))]
pub const TOKEN_BRIDGE_PROGRAM_ID: &str = "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe";

#[cfg(all(feature = "mainnet", not(feature = "localnet"), not(feature = "devnet")))]
pub const TOKEN_BRIDGE_PROGRAM_ID: &str = "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb";

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_decimal() {
        let lamports = Decimal::from_u64(1_000_000_000u64).unwrap();
        println!("lamports_per_sol: {:?}, lamports: {:?}", LAMPORTS_PER_SOL_DECIMAL, lamports);
        assert_eq!(lamports, LAMPORTS_PER_SOL_DECIMAL);
        // println!("token_bridge_id2: {}", ID);
    }
}

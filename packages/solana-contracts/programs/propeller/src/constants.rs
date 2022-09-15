use {num_traits::FromPrimitive, rust_decimal::Decimal};

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
// // vaa payload types
// pub const PAYLOAD_SALE_INIT_SOLANA: u8 = 5; // 1 for everyone else
// pub const PAYLOAD_ATTEST_CONTRIBUTIONS: u8 = 2;
// pub const PAYLOAD_SALE_SEALED: u8 = 3;
// pub const PAYLOAD_SALE_ABORTED: u8 = 4;
//
// // universal
// pub const PAYLOAD_HEADER_LEN: usize = 33; // payload + sale id
// pub const INDEX_SALE_ID: usize = 1;
//
// // for sale init
// pub const INDEX_SALE_INIT_TOKEN_ADDRESS: usize = 33;
// pub const INDEX_SALE_INIT_TOKEN_CHAIN: usize = 65;
// pub const INDEX_SALE_INIT_TOKEN_DECIMALS: usize = 67;
// pub const INDEX_SALE_INIT_SALE_START: usize = 68;
// pub const INDEX_SALE_INIT_SALE_END: usize = 100;
// pub const INDEX_SALE_INIT_ACCEPTED_TOKENS_START: usize = 132;
//
// pub const ACCEPTED_TOKEN_NUM_BYTES: usize = 33;
// pub const ACCEPTED_TOKENS_MAX: usize = 8;
// pub const INDEX_ACCEPTED_TOKEN_INDEX: usize = 0;
// pub const INDEX_ACCEPTED_TOKEN_ADDRESS: usize = 1;
// pub const INDEX_ACCEPTED_TOKEN_END: usize = 33;
//
// // for attest contributions
// pub const ATTEST_CONTRIBUTIONS_ELEMENT_LEN: usize = 33; // token index + amount
//
// // for sale sealed
// pub const INDEX_SALE_SEALED_ALLOCATIONS_START: usize = 33;
//
// pub const ALLOCATION_NUM_BYTES: usize = 65;
// pub const INDEX_ALLOCATIONS_AMOUNT: usize = 1;
// pub const INDEX_ALLOCATIONS_EXCESS: usize = 33;
// pub const INDEX_ALLOCATIONS_END: usize = 65;

// misc
// pub const PAD_U8: usize = 31;
// pub const PAD_U64: usize = 24;

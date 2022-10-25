use {num_traits::FromPrimitive, rust_decimal::Decimal};

pub const CURRENT_SWIM_PAYLOAD_VERSION: u8 = 1;
pub const TOKEN_COUNT: usize = 2;
pub const ENACT_DELAY: i64 = 3 * 86400;

pub const METAPOOL_SWIM_USD_INDEX: u8 = 0;
pub const REMOVE_EXACT_BURN_OUTPUT_TOKEN_INDEX: u8 = 0;
pub const SWAP_EXACT_OUTPUT_INPUT_TOKEN_INDEX: u8 = 1;
/// Pool IXs for sending ignore slippage
pub const PROPELLER_MINIMUM_OUTPUT_AMOUNT: u64 = 0u64;

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

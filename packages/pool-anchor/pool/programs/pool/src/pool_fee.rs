//naming: pool_fee to distinguish from other fees (such as Solana's fee sysvar)
use anchor_lang::prelude::*;

use crate::{decimal::DecimalU64, error::PoolError};

//fees are stored with a resolution of one hundredth of a basis point, i.e. 10^-6
const DECIMALS: u8 = 6;
//10^(DECIMALS+2) has to fit into ValueT
pub type ValueT = u32;
type DecT = DecimalU64;

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug)]
pub struct PoolFee(ValueT);

impl PoolFee {
    pub fn new(fee: DecT) -> Result<Self, PoolError> {
        let mut ret = Self::default();
        ret.set(fee)?;
        Ok(ret)
    }

    pub fn set(&mut self, fee: DecT) -> Result<(), PoolError> {
        let floored_fee = fee.floor(DECIMALS);
        if fee >= DecT::from(1) || floored_fee != fee {
            //fee has to be less than 100 % and decimals have to fit
            return Err(PoolError::InvalidFeeInput);
        }

        self.0 = (floored_fee.get_raw() * 10u64.pow((DECIMALS - floored_fee.get_decimals()) as u32))
            as u32;

        Ok(())
    }

    pub fn get(&self) -> DecT {
        DecT::new(self.0 as u64, DECIMALS).unwrap()
    }
}

// #[cfg(all(test, not(feature = "test-bpf")))]
// mod tests {
//     use super::*;

//     fn new_u64(value: u64, decimals: u8) -> DecT {
//         DecT::new(value, decimals).unwrap()
//     }

//     #[test]
//     fn new_pool_fee() {
//         // 50% fee
//         let _fee = PoolFee::new(new_u64(500000, 6)).unwrap();
//     }

//     fn get_fee_u32(floored_fee: DecT) -> u32 {
//         (floored_fee.get_raw() * 10u64.pow((DECIMALS - floored_fee.get_decimals()) as u32)) as u32
//     }
//     #[test]
//     fn new_pool_fee2() {
//         let swimlake_fee_value = new_u64(0, 0);
//         let floored_fee = swimlake_fee_value.floor(DECIMALS);
//         let swimlake_u32 = (floored_fee.get_raw()
//             * 10u64.pow((DECIMALS - floored_fee.get_decimals()) as u32))
//             as u32;
//         // println!("swimlake_u32: {}", swimlake_u32);
//         let swimlake_fee = PoolFee::new(swimlake_fee_value).unwrap();
//         assert_eq!(swimlake_fee_value, swimlake_fee_value.floor(DECIMALS));
//         assert_eq!(swimlake_fee.get(), swimlake_fee_value.floor(DECIMALS));
//         //.000300 => .03% => 3 bips
//         let metapool_fee_value = new_u64(300, 6);
//         let metapool_fee_value2 = new_u64(3, 4);

//         let metapool_u32 = get_fee_u32(metapool_fee_value);
//         let metapool2_u32 = get_fee_u32(metapool_fee_value2);

//         // println!("metapool_u32: {}", metapool_u32);
//         // println!("metapool2_u32: {}", metapool2_u32);
//         // assert_eq!(metapool_u32, metapool2_u32);

//         let metapool_fee = PoolFee::new(metapool_fee_value).unwrap();
//         assert_eq!(metapool_fee_value, metapool_fee_value.floor(DECIMALS));
//         assert_eq!(metapool_fee.get(), metapool_fee_value.floor(DECIMALS));

//         let metapool_fee2 = PoolFee::new(metapool_fee_value2).unwrap();
//         assert_eq!(metapool_fee.get(), metapool_fee2.get());
//     }

//     #[test]
//     #[should_panic]
//     fn invalid_set_pool_fee() {
//         let mut fee = PoolFee::default();
//         fee.set(new_u64(1000000, 6)).unwrap();
//     }

//     #[test]
//     fn get_fee() {
//         // 0.5% fee
//         let fee_value = new_u64(500000, 8);
//         let fee = PoolFee::new(fee_value).unwrap();
//         assert_eq!(fee.get(), fee_value.floor(DECIMALS));
//     }

//     #[test]
//     #[should_panic]
//     fn overflow_value() {
//         let _fee = PoolFee::new(new_u64(123456789, 11)).unwrap();
//     }
// }

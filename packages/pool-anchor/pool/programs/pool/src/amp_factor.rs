use anchor_lang::prelude::*;

use std::ops::{Add, Sub};

use crate::{decimal::DecimalU64, error::PoolError};
// seconds since unix epoch
use solana_program::clock::UnixTimestamp;

pub type TimestampT = UnixTimestamp;
pub type ValueT = DecimalU64;

//result.unwrap() is not a const function...
pub const MIN_AMP_VALUE: ValueT = ValueT::const_from(1);
pub const MAX_AMP_VALUE: ValueT = ValueT::const_from(10u64.pow(6));

pub const MIN_ADJUSTMENT_WINDOW: TimestampT = 60 * 60 * 24;
pub const MAX_RELATIVE_ADJUSTMENT: ValueT = ValueT::const_from(10);

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug)]
pub struct AmpFactor {
    //invariants:
    // inital_ts <= target_ts
    // and either:
    //   MIN_AMP_VALUE <= initial_value <= MAX_AMP_VALUE
    //   MIN_AMP_VALUE <= target_value <= MAX_AMP_VALUE
    // or
    //   target_value is always 0
    initial_value: ValueT,
    initial_ts: TimestampT,
    target_value: ValueT,
    target_ts: TimestampT,
}

impl Default for AmpFactor {
    fn default() -> Self {
        AmpFactor::new(MIN_AMP_VALUE).unwrap()
    }
}

impl AmpFactor {
    pub fn new(amp_factor: ValueT) -> Result<AmpFactor, PoolError> {
        if !(MIN_AMP_VALUE..=MAX_AMP_VALUE).contains(&amp_factor)
            && amp_factor != ValueT::const_from(0)
        {
            Err(PoolError::InvalidAmpFactorValue)
        } else {
            Ok(AmpFactor {
                initial_value: MIN_AMP_VALUE, //irrelevant dummy value
                initial_ts: 0,
                target_value: amp_factor,
                target_ts: 0,
            })
        }
    }

    /// Returns the current [`AmpFactor`] value
    ///
    /// [`AmpFactor`] will be linearly interpolated while in the adjustment window
    ///
    /// mathematically speaking we ought to use exponential interpolation
    /// to see why, assume an amp factor adjustment from 1 to 4:
    /// going from 1 to 2 constitutes a doubling, as does going from 2 to 4
    /// hence we should use the first half of the alotted time to go from 1 to 2 and
    /// the second half to go from 2 to 4
    ///
    /// ultimately however, it's only important that the adjustment happens gradually
    /// to prevent [exploitation](https://medium.com/@peter_4205/curve-vulnerability-report-a1d7630140ec)
    /// and so for simplicity's sake we use linear interpolation and restrict
    /// the maximum _relative_ change to a factor of 10 (i.e. amp_factor at most do
    /// a 10x over a day (not +10, but potentially much more))
    pub fn get(&self, current_ts: TimestampT) -> ValueT {
        if current_ts >= self.target_ts {
            //check if we are inside an adjustment window
            //not in an adjustment window
            self.target_value
        } else {
            assert!(current_ts >= self.initial_ts);

            let is_increase = self.target_value > self.initial_value;
            let value_diff = if is_increase {
                self.target_value - self.initial_value
            } else {
                self.initial_value - self.target_value
            };
            let time_since_initial: ValueT = ((current_ts - self.initial_ts) as u64).into();
            let total_adjustment_time: ValueT = ((self.target_ts - self.initial_ts) as u64).into();
            let delta = value_diff * (time_since_initial / total_adjustment_time);

            (if is_increase {
                ValueT::add
            } else {
                ValueT::sub
            })(self.initial_value, delta)
        }
    }

    /// Sets the target value and timestamp for the [`AmpFactor`] to adjust to
    ///
    /// [`AmpFactor`] will be linearly interpolated while in the adjustment window
    /// see [`AmpFactor::get`] for more details
    pub fn set_target(
        &mut self,
        current_ts: TimestampT,
        target_value: ValueT,
        target_ts: TimestampT,
    ) -> Result<(), PoolError> {
        if !(MIN_AMP_VALUE..=MAX_AMP_VALUE).contains(&target_value) {
            return Err(PoolError::InvalidAmpFactorValue);
        }

        if target_ts < current_ts + MIN_ADJUSTMENT_WINDOW {
            return Err(PoolError::InvalidAmpFactorTimestamp);
        }

        let initial_value = self.get(current_ts);
        if (initial_value < target_value && initial_value * MAX_RELATIVE_ADJUSTMENT < target_value)
            || (initial_value > target_value
                && initial_value > target_value * MAX_RELATIVE_ADJUSTMENT)
        {
            return Err(PoolError::InvalidAmpFactorValue);
        }

        self.initial_value = initial_value;
        self.initial_ts = current_ts;
        self.target_value = target_value;
        self.target_ts = target_ts;

        Ok(())
    }
}

// #[cfg(all(test, not(feature = "test-bpf")))]
// mod tests {
//     use super::*;

//     fn new_u64(value: u64, decimals: u8) -> ValueT {
//         ValueT::new(value, decimals).unwrap()
//     }

//     #[test]
//     fn new_amp_factor() {
//         assert!(AmpFactor::new(MIN_AMP_VALUE - new_u64(1, 1)).is_err());
//         assert!(AmpFactor::new(MAX_AMP_VALUE + 1).is_err());

//         assert!(AmpFactor::new(ValueT::from(0)).is_ok());
//         assert!(AmpFactor::new(MIN_AMP_VALUE).is_ok());
//         assert!(AmpFactor::new(MIN_AMP_VALUE + 1).is_ok());
//         assert!(AmpFactor::new((MIN_AMP_VALUE + MAX_AMP_VALUE) / 2).is_ok());
//         assert!(AmpFactor::new(MAX_AMP_VALUE - 1).is_ok());
//         assert!(AmpFactor::new(MAX_AMP_VALUE).is_ok());
//     }

//     #[test]
//     fn valid_set_target_upward() {
//         let mut amp = AmpFactor::new(new_u64(10000, 0)).unwrap();
//         assert_eq!(amp.get(1), 10000);

//         amp.set_target(20000, new_u64(20000, 0), 106400).unwrap();

//         assert_eq!(amp.get(20000), 10000);
//         assert_eq!(
//             amp.get(30000),
//             new_u64(11157407407407407407, 15) //11157.407407407407407
//         );
//         assert_eq!(
//             amp.get(50000),
//             new_u64(13472222222222222222, 15) //13472.222222222222222
//         );
//         assert_eq!(
//             amp.get(70000),
//             new_u64(15787037037037037037, 15) //15787.037037037037037
//         );
//         assert_eq!(
//             amp.get(90000),
//             new_u64(18101851851851851851, 15) //18101.851851851851851
//         );
//         assert_eq!(amp.get(106400), 20000);
//     }

//     #[test]
//     fn valid_set_target_downward() {
//         let mut amp = AmpFactor::new(ValueT::from(20000)).unwrap();
//         assert_eq!(amp.get(1), 20000);

//         amp.set_target(20000, ValueT::from(10000), 106400).unwrap();

//         assert_eq!(amp.get(20000), 20000);
//         assert_eq!(amp.get(36400), new_u64(18101851851851851852, 15));
//         assert_eq!(amp.get(56400), new_u64(15787037037037037038, 15));
//         assert_eq!(amp.get(76400), new_u64(13472222222222222223, 15));
//         assert_eq!(amp.get(96400), new_u64(11157407407407407408, 15));
//         assert_eq!(amp.get(106400), 10000);
//     }

//     #[test]
//     #[should_panic]
//     fn invalid_set_target() {
//         //Target value set to 20x initial value
//         let mut amp = AmpFactor::new(ValueT::from(1000)).unwrap();
//         amp.set_target(20000, ValueT::from(20000), 106400).unwrap();
//     }

//     #[test]
//     #[should_panic]
//     fn invalid_adjustment_window() {
//         let mut amp = AmpFactor::new(ValueT::from(10000)).unwrap();
//         amp.set_target(20000, ValueT::from(20000), 50000).unwrap();
//     }

//     // #[test]
//     // fn test_set_wide_window() {
//     //     let mut amp = AmpFactor::new(ValutT::from(1000)).unwrap();
//     //     amp.set_target(200)
//     // }
// }

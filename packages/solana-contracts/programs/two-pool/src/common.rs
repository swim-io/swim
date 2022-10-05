use {
    crate::{decimal::U128, TOKEN_COUNT},
    arrayvec::ArrayVec,
    std::fmt::Debug,
};

//final unwraps are safe because we know that there is enough capacity

pub fn create_array<T: Debug, const SIZE: usize>(closure: impl FnMut(usize) -> T) -> [T; SIZE] {
    (0..SIZE).into_iter().map(closure).collect::<ArrayVec<_, SIZE>>().into_inner().unwrap()
}

pub fn create_result_array<T: Debug, E: Debug, const SIZE: usize>(
    closure: impl FnMut(usize) -> Result<T, E>,
) -> Result<[T; SIZE], E> {
    Ok((0..SIZE).into_iter().map(closure).collect::<Result<ArrayVec<_, SIZE>, _>>()?.into_inner().unwrap())
}

pub fn to_equalized(value: u64, equalizer: u8) -> U128 {
    if equalizer > 0 {
        U128::from(value) * U128::ten_to_the(equalizer)
    } else {
        U128::from(value)
    }
}

pub fn from_equalized(value: U128, equalizer: u8) -> u64 {
    if equalizer > 0 {
        ((value + U128::ten_to_the(equalizer - 1) * 5u64) / U128::ten_to_the(equalizer)).as_u64()
    } else {
        value.as_u64()
    }
}

pub fn array_equalize(amounts: [u64; TOKEN_COUNT], equalizers: [u8; TOKEN_COUNT]) -> [U128; TOKEN_COUNT] {
    amounts
        .iter()
        .zip(equalizers.iter())
        .map(|(&amount, &equalizer)| to_equalized(amount, equalizer))
        .collect::<Vec<_>>()
        .as_slice()
        .try_into()
        .unwrap()
}

/// `result_from_equalized` takes in a user's amount, the user's equalizer, the governance mint amount,
/// the lp decimal equalizer, and the latest depth, and returns the user's amount, the governance mint
/// amount, and the latest depth
///
/// Arguments:
///
/// * `user_amount`: The amount of tokens the user is staking
/// * `user_equalizer`: The equalizer of the user's token.
/// * `governance_mint_amount`: The amount of governance tokens that will be minted to the user.
/// * `lp_decimal_equalizer`: The equalizer for the LP token. should always be pool_state.lp_decimal_equalizer
/// * `latest_depth`: The amount of liquidity in the pool.
pub fn result_from_equalized(
    user_amount: U128,
    user_equalizer: u8,
    governance_mint_amount: U128,
    lp_decimal_equalizer: u8,
    latest_depth: U128,
) -> (u64, u64, u128) {
    (
        from_equalized(user_amount, user_equalizer),
        from_equalized(governance_mint_amount, lp_decimal_equalizer),
        latest_depth.as_u128(),
    )
}

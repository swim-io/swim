//! Macros for [crate::two_pool]

#[macro_export]
macro_rules! gen_pool_signer_seeds {
    ($pool:expr) => {
        &[
            b"two_pool" as &[u8],
            &$pool.token_mint_keys[0].to_bytes(),
            &$pool.token_mint_keys[1].to_bytes(),
            &$pool.lp_mint_key.to_bytes(),
            &[$pool.bump],
        ]
    };
}

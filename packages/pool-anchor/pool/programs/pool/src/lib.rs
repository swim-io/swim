use anchor_spl::token::*;

pub mod amp_factor;
pub mod common;
pub mod decimal;
pub mod error;
pub mod instruction;
pub mod invariant;
pub mod pool_fee;
pub mod processor;
pub mod state;

use {
    pool_lib::{error::to_error_msg, processor::Processor},
    solana_program::{
        account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, msg, pubkey::Pubkey,
    },
};

#[macro_export]
macro_rules! define_pool {
    ($token_count:expr, $pool_id:expr) => {
        use {
            pool_lib::{error::to_error_msg, processor::Processor},
            solana_program::{
                account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, msg,
                pubkey::Pubkey,
            },
        };

        pub use pool_lib::{
            amp_factor, common, decimal, error, instruction, invariant, pool_fee, state,
        };

        /// Export current solana-program types for downstream users who may also be
        /// building with a different solana-program version
        pub use solana_program;

        pub const TOKEN_COUNT: usize = $token_count;
        solana_program::declare_id!($pool_id);

        use solana_security_txt::security_txt;

        security_txt! {
            // Required fields
            name: "Swim.io",
            project_url: "https://swim.io/",
            contacts: "email:admin@swim.io",
            policy: "https://swim.io/security",

            // Optional fields
            preferred_languages: "en",
            encryption: "https://swim.io/pgp-key.txt",
            expiry: "2026-04-28T05:00:00.000Z",
            auditors: "Kudelski"
        }
    };
}

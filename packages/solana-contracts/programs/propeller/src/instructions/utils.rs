use {crate::error::*, anchor_lang::prelude::*};

pub fn get_memo_as_utf8(memo: [u8; 16]) -> Result<String> {
    String::from_utf8(hex::encode(memo).into_bytes()).map_err(|_| error!(PropellerError::InvalidMemo))
}

use anchor_lang::prelude::error_code;

#[error_code]
#[derive(Eq, PartialEq)]
pub enum PropellerError {
    #[msg("InsufficientFunds")]
    InsufficientFunds,

    #[msg("InvalidAccount")]
    InvalidAccount,

    #[msg("InvalidRemainingAccounts")]
    InvalidRemainingAccounts,

    #[msg("InvalidTokenBridgeAddress")]
    InvalidTokenBridgeAddress,

    #[msg("InvalidTokenDecimals")]
    InvalidTokenDecimals,

    #[msg("InvalidTokenIndex")]
    InvalidTokenIndex,

    #[msg("InvalidVaaAction")]
    InvalidVaaAction,

    #[msg("InvalidWormholeAddress")]
    InvalidWormholeAddress,

    #[msg("InvalidVaaPayload")]
    InvalidVaaPayload,

    #[msg("NothingToClaim")]
    NothingToClaim,

    #[msg("TransferNotAllowed")]
    TransferNotAllowed,

    #[msg("Incorrect ProgramId for CPI return value")]
    InvalidCpiReturnProgramId,

    #[msg("Invalid CPI Return value")]
    InvalidCpiReturnValue,

    #[msg("Invalid Mint")]
    InvalidMint,

    #[msg("Invalid Mint for AddAndWormholeTransfer")]
    InvalidAddAndWormholeTransferMint,

    #[msg("Invalid output token index for SwapExactInput params")]
    InvalidSwapExactInputOutputTokenIndex,

    #[msg("Invalid input amount for SwapExactInput params")]
    InvalidSwapExactInputInputAmount,

    #[msg("Invalid Token Bridge Mint")]
    InvalidTokenBridgeMint,

    #[msg("Invalid Payload Type in VAA")]
    InvalidPayloadTypeInVaa,

    #[msg("Serializing error")]
    SerializeError,

    #[msg("Deserializing error")]
    DeserializeError,

    #[msg("User redeemer needs to be signer")]
    UserRedeemerSignatureNotDetected,

    #[msg("Not a valid Switchboard account")]
    InvalidSwitchboardAccount,

    #[msg("Switchboard feed has not been updated in 5 minutes")]
    StaleFeed,

    #[msg("Switchboard feed exceeded provided confidence interval")]
    ConfidenceIntervalExceeded,

    #[msg("Insufficient Amount being transferred")]
    InsufficientAmount,

    #[msg("Invalid claim data")]
    InvalidClaimData,

    #[msg("Claim Account not claimed")]
    ClaimNotClaimed,
}

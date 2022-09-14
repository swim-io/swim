use anchor_lang::prelude::*;

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

    #[msg("Invalid Propeller Admin")]
    InvalidPropellerAdmin,

    #[msg("Invalid Pool for Token Id Map")]
    InvalidTokenIdMapPool,

    #[msg("Invalid Output Token Index")]
    InvalidOutputTokenIndex,

    #[msg("Invalid Pool Token Index for Token Id Map")]
    InvalidTokenIdMapPoolTokenIndex,

    #[msg("Invalid Pool Token Mint for Token Id Map")]
    InvalidTokenIdMapPoolTokenMint,

    #[msg("Invalid Pool Ix for Token Id Map")]
    InvalidTokenIdMapPoolIx,

    #[msg("Invalid Gas Kickstart parameter in Swim Payload")]
    InvalidSwimPayloadGasKickstart,

    #[msg("Invalid Marginal Price Pool Accounts")]
    InvalidMarginalPricePoolAccounts,

    #[msg("Propeller Not Enabled in payload")]
    NotPropellerEnabled,

    #[msg("Invalid Routing Contract Address")]
    InvalidRoutingContractAddress,

    #[msg("Integer Overflow")]
    IntegerOverflow,

    #[msg("Conversion Error")]
    ConversionError,

    #[msg("Unable to retrieve token bridge mint decimals from marginal price pool information")]
    UnableToRetrieveTokenBridgeMintDecimals,

    #[msg("Invalid Metapool Token Mint. token_mint[0] should == token_bridge_mint")]
    InvalidMetapoolTokenMint,

    #[msg("Unable to deserialize account info as token account")]
    UnableToDeserializeTokenAccount,

    #[msg("Invalid token account data length. != 0 && != TokenAccount::LEN")]
    InvalidTokenAccountDataLen,

    #[msg("Payer has insufficent funds for gas kickstart")]
    PayerInsufficientFundsForGasKickstart,
}

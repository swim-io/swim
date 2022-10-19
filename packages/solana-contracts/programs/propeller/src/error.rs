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

    #[msg("Invalid SwimUSD Mint")]
    InvalidSwimUsdMint,

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

    #[msg("Switchboard feed value is stale ")]
    StaleFeed,

    #[msg("Switchboard feed exceeded provided confidence interval")]
    ConfidenceIntervalExceeded,

    #[msg("Insufficient Amount being transferred")]
    InsufficientAmount,

    #[msg("Invalid Wormhole Claim Account")]
    InvalidWormholeClaimAccount,

    #[msg("Invalid claim data")]
    InvalidClaimData,

    #[msg("Claim Account not claimed")]
    ClaimNotClaimed,

    #[msg("Invalid Propeller GovernanceKey")]
    InvalidPropellerGovernanceKey,

    #[msg("Invalid Propeller Pause Key")]
    InvalidPropellerPauseKey,

    #[msg("Invalid Pool for Token Number Map")]
    InvalidTokenNumberMapPool,

    #[msg("Invalid Output Token Index")]
    InvalidOutputTokenIndex,

    #[msg("Invalid Pool Token Index for Token Number Map")]
    InvalidTokenNumberMapPoolTokenIndex,

    #[msg("Invalid Pool Token Mint for Token Number Map")]
    InvalidTokenNumberMapPoolTokenMint,

    #[msg("Invalid To Token Step for Token Number Map")]
    InvalidTokenNumberMapToTokenStep,

    #[msg("Invalid Gas Kickstart parameter in Swim Payload")]
    InvalidSwimPayloadGasKickstart,

    #[msg("Invalid Marginal Price Pool")]
    InvalidMarginalPricePool,

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

    #[msg("Unable to retrieve SwimUSD mint decimals from marginal price pool information")]
    UnableToRetrieveSwimUsdMintDecimals,

    #[msg("Invalid Metapool Token Mint. token_mint[0] should == swim_usd_mint")]
    InvalidMetapoolTokenMint,

    #[msg("Unable to deserialize account info as token account")]
    UnableToDeserializeTokenAccount,

    #[msg("Invalid token account data length. != 0 && != TokenAccount::LEN")]
    InvalidTokenAccountDataLen,

    #[msg("Payer has insufficient funds for gas kickstart")]
    PayerInsufficientFundsForGasKickstart,

    #[msg("Owner of token account != swimPayload.owner")]
    IncorrectOwnerForCreateTokenAccount,

    #[msg("TokenNumberMap exists. Please use the correct instruction")]
    TokenNumberMapExists,

    #[msg("Invalid Swim Payload version")]
    InvalidSwimPayloadVersion,

    #[msg("Invalid Aggregator")]
    InvalidAggregator,

    #[msg("Invalid Fee Vault")]
    InvalidFeeVault,

    #[msg("Invalid Memo")]
    InvalidMemo,

    #[msg("ToTokenNumber does not match SwimPayload.to_tokenNumber")]
    ToTokenNumberMismatch,

    #[msg("Routing Contract is paused")]
    IsPaused,

    #[msg("Target Chain is paused")]
    TargetChainIsPaused,

    #[msg("Invalid SwimPayloadMessagePayer")]
    InvalidSwimPayloadMessagePayer,
}

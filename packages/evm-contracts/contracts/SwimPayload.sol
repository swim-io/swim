//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

//  1 byte  - swim internal payload version number
// 32 bytes - logical owner/recipient (will use ATA of owner and token on Solana)
//  1 byte  - propeller enabled bool
//  1 byte  - gas kickstart requested bool
//  2 bytes - swimTokenNumber (support up to 65k different tokens, just to be safe)
// 16 bytes - memo/interactionId

struct SwimPayload {
  address toOwner;
  bool propellerEnabled;
  bool gasKickstart;
  uint16 tokenNumber;
  bytes16 memo;
}

library SwimPayloadConversion {
  error InvalidVersion(uint8 version, uint8 expected, bytes encoded);
  error InvalidSize(uint256 size, bytes encoded);

  uint256 private constant TOKENBRIDGE_TYPE_SIZE = 1;
  uint256 private constant TOKENBRIDGE_AMOUNT_SIZE = 32;
  uint256 private constant TOKENBRIDGE_TOKEN_ORIGIN_ADDRESS_SIZE = 32;
  uint256 private constant TOKENBRIDGE_TOKEN_ORIGIN_CHAIN_SIZE = 2;
  uint256 private constant TOKENBRIDGE_TARGET_ADDRESS_SIZE = 32;
  uint256 private constant TOKENBRIDGE_TARGET_CHAIN_SIZE = 2;
  uint256 private constant TOKENBRIDGE_SENDER_ADDRESS_SIZE = 32;

  uint256 private constant TOKENBRIDGE_TOTAL_SIZE =
    TOKENBRIDGE_TYPE_SIZE +
    TOKENBRIDGE_AMOUNT_SIZE +
    TOKENBRIDGE_TOKEN_ORIGIN_ADDRESS_SIZE +
    TOKENBRIDGE_TOKEN_ORIGIN_CHAIN_SIZE +
    TOKENBRIDGE_TARGET_ADDRESS_SIZE +
    TOKENBRIDGE_TARGET_CHAIN_SIZE +
    TOKENBRIDGE_SENDER_ADDRESS_SIZE;

  uint8 private constant SWIM_PAYLOAD_VERSION = 1;

  uint256 private constant VERSION_SIZE = 1;
  uint256 private constant OWNER_SIZE = 32;
  uint256 private constant PROPELLER_ENABLED_SIZE = 1;
  uint256 private constant GAS_KICKSTART_SIZE = 1;
  uint256 private constant TOKEN_NUMBER_SIZE = 2;
  uint256 private constant MEMO_SIZE = 16;

  uint256 private constant OWNER_MINLEN = TOKENBRIDGE_TOTAL_SIZE + VERSION_SIZE + OWNER_SIZE;
  uint256 private constant TOKEN_NUMBER_MINLEN =
    OWNER_MINLEN + PROPELLER_ENABLED_SIZE + GAS_KICKSTART_SIZE + TOKEN_NUMBER_SIZE;
  uint256 private constant MEMO_MINLEN = TOKEN_NUMBER_MINLEN + MEMO_SIZE;

  function decode(
    bytes memory encoded //encoded token bridge payload
  ) internal pure returns (
    uint amount,
    bytes32 tokenOriginAddress,
    uint16 tokenOriginChain,
    SwimPayload memory swimPayload
  ) {
    if (
      encoded.length != OWNER_MINLEN &&
      encoded.length != TOKEN_NUMBER_MINLEN &&
      encoded.length != MEMO_MINLEN
    )
      revert InvalidSize(encoded.length, encoded);

    uint256 tmp;
    uint256 offset;

    //parse relevant token bridge parts
    offset = TOKENBRIDGE_TYPE_SIZE + TOKENBRIDGE_AMOUNT_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    amount = tmp;

    offset += TOKENBRIDGE_TOKEN_ORIGIN_ADDRESS_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    tokenOriginAddress = bytes32(tmp);

    offset += TOKENBRIDGE_TOKEN_ORIGIN_CHAIN_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    tokenOriginChain = uint16(tmp);

    //parse actual swim payload
    offset = TOKENBRIDGE_TOTAL_SIZE + VERSION_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    if (uint8(tmp) != SWIM_PAYLOAD_VERSION)
      revert InvalidVersion(uint8(tmp), SWIM_PAYLOAD_VERSION, encoded);

    offset += OWNER_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    swimPayload.toOwner = address(uint160(tmp));

    if (encoded.length > OWNER_MINLEN) {
      offset += PROPELLER_ENABLED_SIZE;
      assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
      swimPayload.propellerEnabled = uint8(tmp) != 0;

      offset += GAS_KICKSTART_SIZE;
      assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
      swimPayload.gasKickstart = uint8(tmp) != 0;

      offset += TOKEN_NUMBER_SIZE;
      assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
      swimPayload.tokenNumber = uint16(tmp);
    }

    if (encoded.length > TOKEN_NUMBER_MINLEN) {
      offset += MEMO_SIZE;
      assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
      swimPayload.memo = bytes16(uint128(tmp));
    }
  }

  //non propeller interaction
  function encode(bytes32 toOwner) internal pure returns (bytes memory encoded) {
    return abi.encodePacked(SWIM_PAYLOAD_VERSION, toOwner);
  }

  //third party propeller interaction
  function encode(
    bytes32 toOwner,
    uint16 tokenNumber,
    bool gasKickStart
  ) internal pure returns (bytes memory encoded) {
    return abi.encodePacked(SWIM_PAYLOAD_VERSION, toOwner, tokenNumber, uint8(1), gasKickStart);
  }

  //swim propeller interaction
  function encode(
    bytes32 toOwner,
    uint16 tokenNumber,
    bool gasKickStart,
    bytes16 memo
  ) internal pure returns (bytes memory encoded) {
    return abi.encodePacked(SWIM_PAYLOAD_VERSION, toOwner, tokenNumber, uint8(1), gasKickStart, memo);
  }
}

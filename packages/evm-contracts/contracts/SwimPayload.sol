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
  error InvalidVersion(uint8 version, uint8 expected);
  error TooShort(uint256 length, uint256 minimum);

  uint8 private constant SWIM_PAYLOAD_VERSION = 1;

  uint256 private constant SOLIDITY_ARRAY_LENGTH_SIZE = 32;

  uint256 private constant VERSION_SIZE = 1;
  uint256 private constant OWNER_SIZE = 32;
  uint256 private constant PROPELLER_ENABLED_SIZE = 1;
  uint256 private constant GAS_KICKSTART_SIZE = 1;
  uint256 private constant TOKEN_NUMBER_SIZE = 2;
  uint256 private constant MEMO_SIZE = 16;

  uint256 private constant OWNER_MINLEN = VERSION_SIZE + OWNER_SIZE;
  uint256 private constant TOKEN_NUMBER_MINLEN =
    OWNER_MINLEN + PROPELLER_ENABLED_SIZE + GAS_KICKSTART_SIZE + TOKEN_NUMBER_SIZE;
  uint256 private constant MEMO_MINLEN = TOKEN_NUMBER_MINLEN + MEMO_SIZE;

  function decode(bytes memory encoded) internal pure returns (SwimPayload memory swimPayload) {
    checkLength(encoded, OWNER_MINLEN);

    uint256 tmp;
    uint256 offset = SOLIDITY_ARRAY_LENGTH_SIZE;

    offset += VERSION_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    if (uint8(tmp) != SWIM_PAYLOAD_VERSION)
      revert InvalidVersion(uint8(tmp), SWIM_PAYLOAD_VERSION);

    offset += OWNER_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    swimPayload.toOwner = address(uint160(tmp));

    if (encoded.length == OWNER_MINLEN)
      return swimPayload;

    checkLength(encoded, TOKEN_NUMBER_MINLEN);

    offset += PROPELLER_ENABLED_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    swimPayload.propellerEnabled = uint8(tmp) != 0;

    offset += GAS_KICKSTART_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    swimPayload.gasKickstart = uint8(tmp) != 0;

    offset += TOKEN_NUMBER_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    swimPayload.tokenNumber = uint16(tmp);

    if (encoded.length == TOKEN_NUMBER_MINLEN)
      return swimPayload;

    checkLength(encoded, MEMO_MINLEN);

    offset += MEMO_SIZE;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    swimPayload.memo = bytes16(uint128(tmp));
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

  function checkLength(bytes memory encoded, uint256 minimumLength) private pure {
    if (encoded.length < minimumLength)
      revert TooShort(encoded.length, minimumLength);
  }
}

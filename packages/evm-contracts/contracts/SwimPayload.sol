//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./BytesParsing.sol";

struct SwimPayload {
  address toOwner;
  bool propellerEnabled;
  bool gasKickstart;
  uint64 maxPropellerFee;
  uint16 toTokenNumber;
  bytes16 memo;
}

library SwimPayloadConversion {
  using BytesParsing for bytes;

  error InvalidVersion(uint8 version, uint8 expected, bytes encoded);
  error InvalidSize(uint size, bytes encoded);

  uint private constant TOKENBRIDGE_TYPE_SIZE = 1;
  uint private constant TOKENBRIDGE_AMOUNT_SIZE = 32;
  uint private constant TOKENBRIDGE_TOKEN_ORIGIN_ADDRESS_SIZE = 32;
  uint private constant TOKENBRIDGE_TOKEN_ORIGIN_CHAIN_SIZE = 2;
  uint private constant TOKENBRIDGE_TARGET_ADDRESS_SIZE = 32;
  uint private constant TOKENBRIDGE_TARGET_CHAIN_SIZE = 2;
  uint private constant TOKENBRIDGE_SENDER_ADDRESS_SIZE = 32;

  uint private constant TOKENBRIDGE_TOTAL_SIZE = //133
    TOKENBRIDGE_TYPE_SIZE +
    TOKENBRIDGE_AMOUNT_SIZE +
    TOKENBRIDGE_TOKEN_ORIGIN_ADDRESS_SIZE +
    TOKENBRIDGE_TOKEN_ORIGIN_CHAIN_SIZE +
    TOKENBRIDGE_TARGET_ADDRESS_SIZE +
    TOKENBRIDGE_TARGET_CHAIN_SIZE +
    TOKENBRIDGE_SENDER_ADDRESS_SIZE;

  uint8 private constant SWIM_PAYLOAD_VERSION = 1;

  uint private constant VERSION_SIZE = 1;
  uint private constant OWNER_SIZE = 32;
  uint private constant PROPELLER_ENABLED_SIZE = 1;
  uint private constant GAS_KICKSTART_SIZE = 1;
  uint private constant MAX_PROPELLER_FEE = 8;
  uint private constant TOKEN_NUMBER_SIZE = 2;
  uint private constant MEMO_SIZE = 16;

  uint private constant OWNER_MINLEN = TOKENBRIDGE_TOTAL_SIZE + VERSION_SIZE + OWNER_SIZE; //166
  uint private constant TOKEN_NUMBER_MINLEN = OWNER_MINLEN + PROPELLER_ENABLED_SIZE +
    GAS_KICKSTART_SIZE + MAX_PROPELLER_FEE + TOKEN_NUMBER_SIZE; //178
  uint private constant MEMO_MINLEN = TOKEN_NUMBER_MINLEN + MEMO_SIZE; //194

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

    uint offset = TOKENBRIDGE_TYPE_SIZE;
    (amount, offset) = encoded.asUint256(offset);
    (tokenOriginAddress, offset) = encoded.asBytes32(offset);
    (tokenOriginChain, offset) = encoded.asUint16(offset);

    //parse actual swim payload
    offset = TOKENBRIDGE_TOTAL_SIZE;
    uint8 version;
    (version, offset) = encoded.asUint8(offset);
    if (version != SWIM_PAYLOAD_VERSION)
      revert InvalidVersion(version, SWIM_PAYLOAD_VERSION, encoded);

    bytes32 toOwner;
    (toOwner, offset) = encoded.asBytes32(offset);
    swimPayload.toOwner = address(uint160(uint256(toOwner)));

    if (encoded.length > OWNER_MINLEN) {
      (swimPayload.propellerEnabled, offset) = encoded.asBool(offset);
      (swimPayload.gasKickstart, offset) = encoded.asBool(offset);
      (swimPayload.toTokenNumber, offset) = encoded.asUint16(offset);
      (swimPayload.maxPropellerFee, offset) = encoded.asUint64(offset);

      if (encoded.length > TOKEN_NUMBER_MINLEN)
        (swimPayload.memo,) = encoded.asBytes16(offset);
    }
  }

  //non propeller interaction
  function encode(bytes32 toOwner) internal pure returns (bytes memory encoded) {
    return abi.encodePacked(SWIM_PAYLOAD_VERSION, toOwner);
  }

  //third party propeller interaction
  function encode(
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber
  ) internal pure returns (bytes memory encoded) {
    return abi.encodePacked(
      SWIM_PAYLOAD_VERSION,
      toOwner,
      uint8(1),
      gasKickstart,
      maxPropellerFee,
      toTokenNumber
    );
  }

  //swim propeller interaction
  function encode(
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber,
    bytes16 memo
  ) internal pure returns (bytes memory encoded) {
    return abi.encodePacked(
      SWIM_PAYLOAD_VERSION,
      toOwner,
      uint8(1),
      gasKickstart,
      maxPropellerFee,
      toTokenNumber,
      memo
    );
  }
}

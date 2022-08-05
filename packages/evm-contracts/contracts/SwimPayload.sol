//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

//   1 byte - swim internal payload version number
// 32 bytes - logical owner/recipient (will use ATA of owner and token on Solana)
//  2 bytes - swimTokenNumber (support up to 65k different tokens, just to be safe)
// 32 bytes - minimum output amount (using 32 bytes like Wormhole)
// 16 bytes - memo/interactionId (??) (current memo is 16 bytes - can't use Wormhole sequence due to Solana originating transactions (only receive sequence number in last transaction on Solana, hence no id for earlier transactions))
// ?? bytes - propeller parameters (propellerEnabled: bool / gasTokenPrefundingAmount: uint256 / propellerFee (?? - similar to wormhole arbiter fee))

library SwimPayload {
  error InvalidVersion();
  error TooShort();

  uint8 private constant SWIM_PAYLOAD_VERSION = 1;

  uint256 private constant VERSION_OFFSET = 0;
  uint256 private constant VERSION_SIZE = 1;
  uint256 private constant VERSION_MINLEN = VERSION_OFFSET + VERSION_SIZE;

  uint256 private constant OWNER_OFFSET = VERSION_MINLEN;
  uint256 private constant OWNER_SIZE = 32;
  uint256 private constant OWNER_MINLEN = OWNER_OFFSET + OWNER_SIZE;

  uint256 private constant TOKEN_NUMBER_OFFSET = OWNER_MINLEN;
  uint256 private constant TOKEN_NUMBER_SIZE = 2;
  uint256 private constant TOKEN_NUMBER_MINLEN = TOKEN_NUMBER_OFFSET + TOKEN_NUMBER_SIZE;

  uint256 private constant THRESHOLD_OFFSET = TOKEN_NUMBER_MINLEN;
  uint256 private constant THRESHOLD_SIZE = 32;
  uint256 private constant THRESHOLD_MINLEN = THRESHOLD_OFFSET + THRESHOLD_SIZE;

  uint256 private constant SOLIDITY_ARRAY_LENGTH_SIZE = 32;

  function checkVersion(bytes memory swimPayload) internal pure {
    checkLength(swimPayload, VERSION_MINLEN);
    if (uint8(swimPayload[0]) != SWIM_PAYLOAD_VERSION) {
      revert InvalidVersion();
    }
  }

  function decodeOwner(bytes memory swimPayload) internal pure returns (address) {
    unchecked {
      checkLength(swimPayload, OWNER_MINLEN);
      uint256 offset = SOLIDITY_ARRAY_LENGTH_SIZE + OWNER_OFFSET;
      uint256 swimOwner;
      //memory-safe annotation only becomes available with Solidity 0.8.13
      assembly /*("memory-safe")*/
      {
        swimOwner := mload(add(swimPayload, offset))
      }
      return address(uint160(swimOwner));
    }
  }

  function decodeSwapParameters(bytes memory swimPayload) internal pure returns (uint16, uint256) {
    unchecked {
      checkLength(swimPayload, THRESHOLD_MINLEN);
      uint16 tokenNumber = (uint16(uint8(swimPayload[TOKEN_NUMBER_OFFSET])) << 8) +
        uint16(uint8(swimPayload[TOKEN_NUMBER_OFFSET + 1]));

      uint256 offset = SOLIDITY_ARRAY_LENGTH_SIZE + THRESHOLD_OFFSET;
      uint256 thresholdAmount;
      assembly /*("memory-safe")*/
      {
        thresholdAmount := mload(add(swimPayload, offset))
      }
      return (tokenNumber, thresholdAmount);
    }
  }

  function encode(bytes32 toOwner) internal pure returns (bytes memory swimPayload) {
    return abi.encodePacked(SWIM_PAYLOAD_VERSION, toOwner);
  }

  function checkLength(bytes memory swimPayload, uint256 minimumLength) private pure {
    if (swimPayload.length < minimumLength) {
      revert TooShort();
    }
  }
}

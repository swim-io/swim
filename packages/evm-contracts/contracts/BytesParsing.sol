//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//!!!! INTENTIONALLY NEVER CHECKS FOR LENGTH !!!!
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

library BytesParsing {
  function asBytes(
    bytes memory encoded,
    uint offset,
    uint length
  ) internal pure returns (bytes memory, uint) {
    //taken from here and shortened:
    // https://github.com/GNSPS/solidity-bytes-utils/blob/6458fb2780a3092bc756e737f246be1de6d3d362/contracts/BytesLib.sol#L228

    bytes memory tempBytes;
    assembly {
      switch iszero(length)
      case 0 {
        tempBytes := mload(0x40)
        let lengthmod := and(length, 31)
        let mc := add(add(tempBytes, lengthmod), mul(0x20, iszero(lengthmod)))
        let end := add(mc, length)
        for {
          let cc := add(add(add(encoded, lengthmod), mul(0x20, iszero(lengthmod))), offset)
        } lt(mc, end) {
          mc := add(mc, 0x20)
          cc := add(cc, 0x20)
        } {
          mstore(mc, mload(cc))
        }

        mstore(tempBytes, length)
        mstore(0x40, and(add(mc, 31), not(31)))
      }
      default {
        tempBytes := mload(0x40)
        mstore(tempBytes, 0)
        mstore(0x40, add(tempBytes, 0x20))
      }
    }
    return (tempBytes, offset + length);
  }

  function asAddress(bytes memory encoded, uint offset) internal pure returns (address, uint) {
    uint tmp;
    offset += 20;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    return (address(uint160(tmp)), offset);
  }

  function asBytes16(bytes memory encoded, uint offset) internal pure returns (bytes16, uint) {
    uint tmp;
    offset += 16;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    return (bytes16(uint128(tmp)), offset);
  }

  function asBytes32(bytes memory encoded, uint offset) internal pure returns (bytes32, uint) {
    uint tmp;
    offset += 32;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    return (bytes32(tmp), offset);
  }

  function asBool(bytes memory encoded, uint offset) internal pure returns (bool, uint) {
    uint tmp;
    offset += 1;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    return (uint8(tmp) != 0, offset);
  }

  function asUint8(bytes memory encoded, uint offset) internal pure returns (uint8, uint) {
    uint tmp;
    offset += 1;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    return (uint8(tmp), offset);
  }

  function asUint16(bytes memory encoded, uint offset) internal pure returns (uint16, uint) {
    uint tmp;
    offset += 2;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    return (uint16(tmp), offset);
  }

  function asUint32(bytes memory encoded, uint offset) internal pure returns (uint32, uint) {
    uint tmp;
    offset += 4;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    return (uint32(tmp), offset);
  }

  function asUint64(bytes memory encoded, uint offset) internal pure returns (uint64, uint) {
    uint tmp;
    offset += 8;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    return (uint64(tmp), offset);
  }

  function asUint128(bytes memory encoded, uint offset) internal pure returns (uint128, uint) {
    uint tmp;
    offset += 16;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    return (uint128(tmp), offset);
  }

  function asUint256(bytes memory encoded, uint offset) internal pure returns (uint256, uint) {
    uint tmp;
    offset += 32;
    assembly ("memory-safe") { tmp := mload(add(encoded, offset)) }
    return (tmp, offset);
  }
}

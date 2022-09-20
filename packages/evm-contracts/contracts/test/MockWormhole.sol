// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.15;

import "../interfaces/IWormhole.sol";
import "../BytesParsing.sol";

contract MockWormhole is IWormhole {
  using BytesParsing for bytes;

  uint private constant VM_VERSION_SIZE = 1;
  uint private constant VM_GUARDIAN_SET_SIZE = 4;
  uint private constant VM_SIGNATURE_COUNT_SIZE = 1;
  uint private constant VM_TIMESTAMP_SIZE = 4;
  uint private constant VM_NONCE_SIZE = 4;
  uint private constant VM_EMITTER_CHAIN_ID_SIZE = 2;
  uint private constant VM_EMITTER_ADDRESS_SIZE = 32;
  uint private constant VM_SEQUENCE_SIZE = 8;
  uint private constant VM_CONSISTENCY_LEVEL_SIZE = 1;
  uint private constant VM_SIZE_MINIUM = VM_VERSION_SIZE + VM_GUARDIAN_SET_SIZE +
    VM_SIGNATURE_COUNT_SIZE + VM_TIMESTAMP_SIZE + VM_NONCE_SIZE + VM_EMITTER_CHAIN_ID_SIZE +
    VM_EMITTER_ADDRESS_SIZE + VM_SEQUENCE_SIZE + VM_CONSISTENCY_LEVEL_SIZE;

  uint private constant SIGNATURE_GUARDIAN_INDEX_SIZE = 1;
  uint private constant SIGNATURE_R_SIZE = 32;
  uint private constant SIGNATURE_S_SIZE = 32;
  uint private constant SIGNATURE_V_SIZE = 1;
  uint private constant SIGNATURE_SIZE_TOTAL =
    SIGNATURE_GUARDIAN_INDEX_SIZE + SIGNATURE_R_SIZE + SIGNATURE_S_SIZE + SIGNATURE_V_SIZE;

  uint public constant messageFee = 0;
  mapping(address => uint64) public sequences;

  function publishMessage(
    uint32 nonce,
    bytes memory payload,
    uint8 consistencyLevel
  ) external payable returns (uint64 sequence) {
    require(msg.value == messageFee, "invalid fee");
    sequence = sequences[msg.sender]++;
    emit LogMessagePublished(msg.sender, sequence, nonce, payload, consistencyLevel);
  }

  function parseVM(bytes memory encodedVm) external pure returns (VM memory vm) {
    vm = _parseVM(encodedVm);
  }

  function parseAndVerifyVM(
    bytes calldata encodedVm
  ) external pure returns (VM memory vm, bool valid, string memory reason) {
    vm = _parseVM(encodedVm);
    valid = true; //behold the rigorous checking!
    reason = "";
  }

  function _parseVM(bytes memory encodedVm) internal pure returns (VM memory vm) {
    require(encodedVm.length >= VM_SIZE_MINIUM, "vm too small");

    bytes memory body;

    uint offset = 0;
    (vm.version,          offset) = encodedVm.asUint8(offset);
    (vm.guardianSetIndex, offset) = encodedVm.asUint32(offset);
    (vm.signatures,       offset) = parseSignatures(encodedVm, offset);
    (body,                   ) = encodedVm.asBytes(offset, encodedVm.length - offset);
    (vm.timestamp,        offset) = encodedVm.asUint32(offset);
    (vm.nonce,            offset) = encodedVm.asUint32(offset);
    (vm.emitterChainId,   offset) = encodedVm.asUint16(offset);
    (vm.emitterAddress,   offset) = encodedVm.asBytes32(offset);
    (vm.sequence,         offset) = encodedVm.asUint64(offset);
    (vm.consistencyLevel, offset) = encodedVm.asUint8(offset);
    (vm.payload,                ) = encodedVm.asBytes(offset, encodedVm.length - offset);
    vm.hash = keccak256(abi.encodePacked(keccak256(body)));
  }

  function parseSignatures(
    bytes memory encodedVm,
    uint offset
  ) internal pure returns (Signature[] memory signatures, uint /*offset*/) {
    uint8 _sigCount;
    (_sigCount, offset) = encodedVm.asUint8(offset);
    uint sigCount = uint(_sigCount);

    require(encodedVm.length >= (VM_SIZE_MINIUM + sigCount * SIGNATURE_SIZE_TOTAL), "vm too small");

    signatures = new Signature[](sigCount);
    for (uint i = 0; i < sigCount; ++i) {
      uint8 guardianIndex;
      bytes32 r;
      bytes32 s;
      uint8 v;

      (guardianIndex, offset) = encodedVm.asUint8(offset);
      (r, offset) = encodedVm.asBytes32(offset);
      (s, offset) = encodedVm.asBytes32(offset);
      (v, offset) = encodedVm.asUint8(offset);

      //for +27 see https://github.com/wormhole-foundation/wormhole/blob/2e220a6f76a1ec03364fa2fac2e571b9824744f8/ethereum/contracts/Messages.sol#L119
      signatures[i] = Signature(r, s, v+27, guardianIndex);
    }

    return (signatures, offset);
  }
}

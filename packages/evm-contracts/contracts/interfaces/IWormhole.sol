// SPDX-License-Identifier: Apache 2

pragma solidity ^0.8.15;

interface IWormhole {
  struct Signature {
    bytes32 r;
    bytes32 s;
    uint8 v;
    uint8 guardianIndex;
  }

  struct VM {
    uint8 version;
    uint32 timestamp;
    uint32 nonce;
    uint16 emitterChainId;
    bytes32 emitterAddress;
    uint64 sequence;
    uint8 consistencyLevel;
    bytes payload;
    uint32 guardianSetIndex;
    Signature[] signatures;
    bytes32 hash;
  }

  event LogMessagePublished(
    address indexed sender,
    uint64 sequence,
    uint32 nonce,
    bytes payload,
    uint8 consistencyLevel
  );

  function messageFee() external view returns (uint256);

  function publishMessage(
    uint32 nonce,
    bytes memory payload,
    uint8 consistencyLevel
  ) external payable returns (uint64 sequence);

  function parseVM(bytes memory encodedVm) external pure returns (VM memory vm);

  function parseAndVerifyVM(
    bytes calldata encodedVm
  ) external view returns (VM memory vm, bool valid, string memory reason);

  //everything below is currently not in use in mocks and hence commented out

  // function chainId() external view returns (uint16);
  // function verifyVM(VM memory vm) external view returns (bool valid, string memory reason);

  // struct GuardianSet {
  //   address[] keys;
  //   uint32 expirationTime;
  // }

  // function verifySignatures(
  //   bytes32 hash,
  //   Signature[] memory signatures,
  //   GuardianSet memory guardianSet
  // ) external pure returns (bool valid, string memory reason);

  // function getGuardianSet(uint32 index) external view returns (GuardianSet memory);
  // function getCurrentGuardianSetIndex() external view returns (uint32);
  // function getGuardianSetExpiry() external view returns (uint32);

  // function isInitialized(address impl) external view returns (bool);
  // function governanceChainId() external view returns (uint16);
  // function governanceContract() external view returns (bytes32);
  // function governanceActionIsConsumed(bytes32 hash) external view returns (bool);
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

error ContractAlreadyExists(address contrct);
error ContractCallFailed(bytes lowLevelData);
error ProxyConstructorFailed(bytes lowLevelData);
error SenderNotAuthorized();

interface ISwimFactory {
  event ContractCreated(address indexed addr, bool isProxy);
  event TransferOwnership(address indexed from, address indexed to);

  function create(bytes memory code, bytes32 salt) external returns (address);
  function create(bytes memory code, bytes32 salt, bytes memory call) external returns (address);
  function createProxy(address logic, bytes32 salt, bytes memory call) external returns (address);

  function determineAddress(bytes memory code, bytes32 salt) external view returns (address);
  function determineProxyAddress(bytes32 salt) external view returns (address);
}

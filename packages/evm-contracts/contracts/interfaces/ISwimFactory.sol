// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

error ContractAlreadyExists(address contrct);
error ProxyConstructorFailed(bytes lowLevelData);

interface ISwimFactory {
  function createLogic(bytes memory code, bytes32 salt) external returns (address);

  function createProxy(
    address implementation,
    bytes32 salt,
    bytes memory call
  ) external returns (address);

  function determineLogicAddress(bytes memory code, bytes32 salt) external view returns (address);

  function determineProxyAddress(bytes32 salt) external view returns (address);
}

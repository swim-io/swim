//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

enum SwimOperation {
  Add,
  RemoveUniform,
  RemoveExactBurn,
  RemoveExactOutput,
  OnChainSwap,
  CrossChainOut,
  CrossChainIn,
  PropellerOut,
  PropellerIn
}

interface ISwimInteractor {
  event SwimInteraction(
    address indexed sender,
    bytes16 indexed memo,
    SwimOperation operation,
    bytes args,
    bytes results
  );
}

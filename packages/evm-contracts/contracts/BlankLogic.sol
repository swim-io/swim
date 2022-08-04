//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract BlankLogic is UUPSUpgradeable {
  //the contract will always be upgraded
  function _authorizeUpgrade(address) internal override {}
}

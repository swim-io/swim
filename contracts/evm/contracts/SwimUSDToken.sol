// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract SwimUSD is Initializable, ERC20Upgradeable, OwnableUpgradeable {
  function initialize() public initializer {
    __ERC20_init("SwimUSD", "sUSD");
    __Ownable_init();
  }

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}

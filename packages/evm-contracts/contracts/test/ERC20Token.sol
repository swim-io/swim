//SPDX-License-Identifier: TODO
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Token is ERC20, Ownable {
  constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

  function mint(address recipient, uint256 amount) external onlyOwner {
    _mint(recipient, amount);
  }
}

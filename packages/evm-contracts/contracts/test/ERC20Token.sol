//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Token is ERC20, Ownable {
  uint8 private _decimals;

  constructor(
    string memory name_,
    string memory symbol_,
    uint8 decimals_
  ) ERC20(name_, symbol_) {
    _decimals = decimals_;
  }

  //because openzeppelin made it public instead of external, we have to override explicitly...
  function decimals() public view override returns (uint8) {
    return _decimals;
  }

  function mint(address recipient, uint256 amount) external onlyOwner {
    _mint(recipient, amount);
  }
}

//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract LpToken is ERC20BurnableUpgradeable, OwnableUpgradeable {

  function initialize(string memory name, string memory symbol)
    external initializer returns (bool)
  {
    __Context_init_unchained();
    __ERC20_init_unchained(name, symbol);
    __Ownable_init_unchained();
    return true;
  }

  function mint(address recipient, uint amount) external onlyOwner {
      //require(amount != 0, "LPToken: cannot mint 0");
      _mint(recipient, amount);
  }
}

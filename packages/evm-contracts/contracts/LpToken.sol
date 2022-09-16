//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

//The full inheritance hierarchy:
// UUPSUpgradeable -> IERC1822Proxiable, ERC1967Upgrade
// ERC20BurnableUpgradeable -> Initializable, ContextUpgradeable, ERC20Upgradeable
// ContextUpgradeable -> Initializable
// ERC20Upgradeable -> Initializable, ContextUpgradeable, IERC20Upgradeable, IERC20MetadataUpgradeable
// OwnableUpgradeable -> Initializable, ContextUpgradeable
// (Initializeable, ERC1967Upgrade have no parents, IERC* are interfaces)
//
//Of all those, only ERC20Upgradeable and OwnableUpgradeable have a non-empty initialize.
contract LpToken is UUPSUpgradeable, ERC20BurnableUpgradeable, OwnableUpgradeable {
  uint8 private /*immutable*/ _decimals;

  function initialize(
    address owner,
    string memory name,
    string memory symbol,
    uint8 __decimals
  ) external initializer returns (bool) {
    _decimals = __decimals;
    __ERC20_init_unchained(name, symbol);
    __Ownable_init_unchained();
    _transferOwnership(owner);
    return true;
  }

  //because openzeppelin made it public instead of external, we have to override explicitly...
  function decimals() public view override returns (uint8) {
    return _decimals;
  }

  function mint(address recipient, uint256 amount) external onlyOwner {
    _mint(recipient, amount);
  }

  //intentionally empty (we only want the onlyOwner modifier "side-effect")
  function _authorizeUpgrade(address) internal override onlyOwner {}
}

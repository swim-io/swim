// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Faucet {

  struct Requester {
    uint16 index;
    uint8 count;
    uint64 blocknumber;
  }

  using SafeERC20 for IERC20;

  uint private constant MAX_TOKEN_COUNT = 6;
  uint8 private constant MAX_REQUESTS = 10;

  address private _owner;
  IERC20[MAX_TOKEN_COUNT] public tokens;
  uint[MAX_TOKEN_COUNT] public amounts;
  address[] public requesters;

  mapping(address => Requester) public requesterMapping;

  constructor(address owner_) {
    _owner = owner_;
  }

  function setup(address[] calldata tokens_, uint[] calldata amounts_) external {
    require(msg.sender == _owner, "computer says no");
    require(tokens_.length <= MAX_TOKEN_COUNT, "what are you doing");
    require(tokens_.length == amounts_.length, "length mismatch");
    for (uint i = 0; i < tokens_.length; ++i) {
      tokens[i] = IERC20(tokens_[i]);
      amounts[i] = amounts_[i];
    }
  }

  fallback() external {
    Requester storage requester = requesterMapping[tx.origin];
    if (requester.count == 0) {
      uint index = requesters.length;
      requesters.push(tx.origin);
      requester.index = uint16(index);
      requester.count = 1;
      requester.blocknumber = uint64(block.number);
    }
    else {
      require(requester.blocknumber != block.number, "You Can't Get Ye Flask");
      require(requester.count < MAX_REQUESTS, "Greed is a Sin");
      requester.blocknumber = uint64(block.number);
      ++requester.count;
    }

    for (uint i = 0; i < MAX_TOKEN_COUNT; ++i)
      if (address(tokens[i]) != address(0))
        tokens[i].safeTransfer(msg.sender, amounts[i]);
  }
}

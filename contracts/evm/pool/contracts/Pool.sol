//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "hardhat/console.sol";

uint constant MAX_TOKEN_COUNT = 6; //imposed by bit assumptions in invariant pool math
uint constant FEE_DECIMALS = 6;
uint constant FEE_DECIMAL_DIVISOR = 10**FEE_DECIMALS;
uint constant MAX_AMP = 10**6;

//We'll use uint32 for timestamps. 2^32 seconds ~= 136 years, i.e. it will last
// us until the early 22nd century... so we ought to be fine.

struct TokenWithEqualizer {
  address token;
  int8 equalizer;
}

contract Pool {
  using SafeERC20 for IERC20;

  //slot
  uint8 tokenCount;           // 1 byte
  bool paused;                // 1 byte
  uint32 totalFee;            // 4 bytes
  uint32 governanceFee;       // 4 bytes
  uint32 ampInitialValue;     // 4 bytes
  uint32 ampInitialTimestamp; // 4 bytes
  uint32 ampTargetValue;      // 4 bytes
  uint32 ampTargetTimestamp;  // 4 bytes
                              //--------
                              //26 bytes

  //slot
  TokenWithEqualizer lpToken;

  //MAX_TOKEN_COUNT slots (save gas by not having to keccak)
  TokenWithEqualizer[MAX_TOKEN_COUNT] poolTokens;

  //slot
  address governance;

  //slot
  address governanceFeeRecipient;

  constructor(
    address[] memory tokens,
    int8[] memory tokenEqualizers,
    uint32 ampFactor,
    uint32 lpFee,
    uint32 _governanceFee,
    address _governance,
    address _governanceFeeRecipient,
    ) {
      //we are deliberately relying on SafeMath in here

      uint8 _tokenCount = tokens.length;
      require(_tokenCount <= MAX_TOKEN_COUNT && tokenEqualizers.length == _tokenCount);
      tokenCount = tokens.length;

      for (uint i = 0; i < _tokenCount; ++i) {
        //TDOO DEVDEVDEV continue here
      }

      //ampFactor == 0 => constant product (only supported for 2 tokens)
      require(ampFactor <= MAX_AMP && (ampFactor > 0 || _tokenCount == 2));
      ampInitialValue = 0;
      ampInitialTimestamp = 0;
      ampTargetValue = ampFactor;
      ampTargetTimestamp = 0;

      uint32 _totalFee = lpFee + _governanceFee; //SafeMath!
      require(_totalFee < FEE_DECIMAL_DIVISOR);
      totalFee = _totalFee;
      governanceFee = _governanceFee;

      require(_totalFee == 0 || _governanceFeeRecipient != address(0));
      governanceFeeRecipient = _governanceFeeRecipient;

      paused = false;
      governance = _governance;
  }

  function greet() public view returns (string memory) {
      return greeting;
  }

  function setGreeting(string memory _greeting) public {
      console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
      greeting = _greeting;
  }
}

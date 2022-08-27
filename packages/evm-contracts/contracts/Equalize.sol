//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

type Equalized is uint256;

library Equalize {
  error MaxAmountExceeded(uint256 amount, int8 equalizer);
  error LosingAllPrecision(uint256 value, int8 equalizer);

  uint256 public constant MAX_AMOUNT = (1 << 61) - 1;

  function to(uint256 amount, int8 equalizer) internal pure returns (Equalized) {
    if (amount == 0) return Equalized.wrap(0);

    uint256 equalized;
    if (equalizer < 0) {
      unchecked {
        equalized = amount / uint256(10)**(uint256(int256(-equalizer)));
      }
      if (equalized == 0) revert LosingAllPrecision(amount, equalizer);
    } else {
      unchecked {
        equalized = uint256(10)**(uint256(int256(equalizer)));
      }
      equalized *= amount; //SafeMath!
    }
    if (equalized > MAX_AMOUNT) revert MaxAmountExceeded(amount, equalizer);
    return Equalized.wrap(equalized);
  }

  function from(Equalized equalized, int8 equalizer) internal pure returns (uint256) {
    uint256 amount = Equalized.unwrap(equalized);
    if (amount == 0) return 0;

    if (equalizer < 0) {
      uint256 tmp;
      unchecked {
        tmp = uint256(10)**(uint256(int256(-equalizer)));
      }
      amount *= tmp; //SafeMath!
    } else {
      unchecked {
        amount /= uint256(10)**(uint256(int256(equalizer)));
      }
      if (amount == 0) revert LosingAllPrecision(Equalized.unwrap(equalized), equalizer);
    }
    return amount;
  }
}

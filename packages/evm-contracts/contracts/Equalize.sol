//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

type Equalized is uint;

library Equalize {
  error MaxAmountExceeded(uint amount, int equalizer);
  error LosingAllPrecision(uint value, int equalizer);

  uint public constant MAX_AMOUNT = (1 << 61) - 1;

  function to(uint amount, int equalizer) internal pure returns (Equalized) {
    if (amount == 0) return Equalized.wrap(0);

    uint equalized;
    if (equalizer < 0) {
      unchecked {
        equalized = amount / uint(10)**(uint(-equalizer));
      }
      if (equalized == 0) revert LosingAllPrecision(amount, equalizer);
    } else {
      unchecked {
        equalized = uint(10)**(uint(equalizer));
      }
      equalized *= amount; //SafeMath!
    }
    if (equalized > MAX_AMOUNT) revert MaxAmountExceeded(amount, equalizer);
    return Equalized.wrap(equalized);
  }

  function from(Equalized equalized, int equalizer) internal pure returns (uint) {
    uint amount = Equalized.unwrap(equalized);
    if (amount == 0) return 0;

    if (equalizer < 0) {
      uint tmp;
      unchecked {
        tmp = uint(10)**(uint(-equalizer));
      }
      amount *= tmp; //SafeMath!
    } else {
      unchecked {
        amount /= uint(10)**(uint(equalizer));
      }
      if (amount == 0) revert LosingAllPrecision(Equalized.unwrap(equalized), equalizer);
    }
    return amount;
  }
}

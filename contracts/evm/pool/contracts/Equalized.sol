//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

type EqualizedAmount is uint64;

library Equalized {
  uint64 public constant MAX_AMOUNT = 1<<61; //non-inclusive!

  function to(uint amount, int8 equalizer)
    internal pure returns (EqualizedAmount) {
    uint equalized;
    if (equalizer < 0) {
      unchecked {equalized = amount / uint(10)**(uint(int(-equalizer)));}
    }
    else {
      unchecked {equalized = uint(10)**(uint(int(equalizer)));}
      equalized *= amount; //SafeMath!
    }
    require(equalized < uint(MAX_AMOUNT), "MAX_AMOUNT exceeded");
    return EqualizedAmount.wrap(uint64(equalized));
  }

  function from(EqualizedAmount equalized, int8 equalizer)
    internal pure returns (uint) {
    uint amount;
    if (equalizer < 0) {
      unchecked {amount = uint(10)**(uint(int(-equalizer)));}
      amount *= uint(EqualizedAmount.unwrap(equalized)); //SafeMath!
    }
    else {
      unchecked {
        amount = uint(EqualizedAmount.unwrap(equalized));
        amount /= uint(10)**(uint(int(equalizer)));
      }
    }
    return amount;
  }
}

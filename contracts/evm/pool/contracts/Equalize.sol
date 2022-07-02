//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

type Equalized is uint64;

library Equalize {
  uint64 public constant MAX_AMOUNT = 1<<61; //non-inclusive!

  function to(uint amount, int8 equalizer)
    internal pure returns (Equalized) {
    if (amount == 0)
      return Equalized.wrap(0);

    uint equalized;
    if (equalizer < 0) {
      unchecked {equalized = amount / uint(10)**(uint(int(-equalizer)));}
      require(equalized > 0, "losing all precision when equalizing");
    }
    else {
      unchecked {equalized = uint(10)**(uint(int(equalizer)));}
      equalized *= amount; //SafeMath!
    }
    require(equalized < uint(MAX_AMOUNT), "MAX_AMOUNT exceeded");
    return Equalized.wrap(uint64(equalized));
  }

  function from(Equalized equalized, int8 equalizer)
    internal pure returns (uint) {
    uint amount = uint(Equalized.unwrap(equalized));
    if (amount == 0)
      return 0;

    if (equalizer < 0) {
      uint tmp;
      unchecked {tmp = uint(10)**(uint(int(-equalizer)));}
      amount *= tmp; //SafeMath!
    }
    else {
      unchecked {amount /= uint(10)**(uint(int(equalizer)));}
      require(amount > 0, "losing all precision when deequalizing");
    }
    return amount;
  }
}

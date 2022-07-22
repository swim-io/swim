//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "./PoolErrors.sol";

type Equalized is uint;

library Equalize {
  uint public constant MAX_AMOUNT = (1<<61)-1;

  function to(uint amount, int8 equalizer)
    internal pure returns (Equalized) {
    if (amount == 0)
      return Equalized.wrap(0);

    uint equalized;
    if (equalizer < 0) {
      unchecked {equalized = amount / uint(10)**(uint(int(-equalizer)));}
      if (equalized == 0)
        revert Equalize_LosingAllPrecision(amount, equalizer);
    }
    else {
      unchecked {equalized = uint(10)**(uint(int(equalizer)));}
      equalized *= amount; //SafeMath!
    }
    if(equalized > MAX_AMOUNT)
      revert Equalize_MaxAmountExceeded(amount, equalizer);
    return Equalized.wrap(equalized);
  }

  function from(Equalized equalized, int8 equalizer)
    internal pure returns (uint) {
    uint amount = Equalized.unwrap(equalized);
    if (amount == 0)
      return 0;

    if (equalizer < 0) {
      uint tmp;
      unchecked {tmp = uint(10)**(uint(int(-equalizer)));}
      amount *= tmp; //SafeMath!
    }
    else {
      unchecked {amount /= uint(10)**(uint(int(equalizer)));}
      if (amount == 0)
        revert Equalize_LosingAllPrecision(Equalized.unwrap(equalized), equalizer);
    }
    return amount;
  }
}

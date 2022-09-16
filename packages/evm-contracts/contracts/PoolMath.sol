//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./Equalize.sol";
import "./Invariant.sol";

//The code in here is less readable than I'd like because I had to inline a couple of variables to
// avoid solc's "Stack too deep, try removing local variables" error message
library PoolMath {
  error ImpossibleRemove();

  struct Pool {
    uint8 tokenCount;
    Equalized[] balances;
    uint32 ampFactor;
    uint32 totalFee;
    uint32 governanceFee;
    Equalized totalLpSupply;
  }

  function addRemove(
    bool isAdd,
    Equalized[] memory amounts,
    Pool memory pool
  ) internal pure returns (Equalized userLpAmount, Equalized governanceMintAmount) {
    unchecked {
      uint256 initialDepth = Invariant.calculateDepth(pool.balances, pool.ampFactor, 0);
      uint256 sumPoolBalances = 0;
      uint256 sumUpdatedBalances = 0;
      Equalized[] memory updatedBalances = new Equalized[](pool.tokenCount);
      for (uint256 i = 0; i < pool.tokenCount; ++i) {
        uint256 balance = Equalized.unwrap(pool.balances[i]);
        uint256 amount = Equalized.unwrap(amounts[i]);
        uint256 updatedBalance = isAdd ? balance + amount : balance - amount;
        updatedBalances[i] = Equalized.wrap(updatedBalance);
        sumPoolBalances += balance;
        sumUpdatedBalances += updatedBalance;
      }
      uint256 updatedDepth = Invariant.calculateDepth(
        updatedBalances,
        pool.ampFactor,
        (initialDepth * sumUpdatedBalances) / sumPoolBalances //initialGuess
      );

      if (pool.totalFee != 0) {
        Equalized[] memory feeAdjustedBalances = new Equalized[](pool.tokenCount);
        for (uint256 i = 0; i < pool.tokenCount; ++i) {
          uint256 updatedBalance = Equalized.unwrap(updatedBalances[i]);
          uint256 scaledBalance = (Equalized.unwrap(pool.balances[i]) * sumUpdatedBalances) / //rounding?
            sumPoolBalances;
          uint256 taxbase = isAdd
            ? (updatedBalance > scaledBalance ? updatedBalance - scaledBalance : 0)
            : (updatedBalance < scaledBalance ? scaledBalance - updatedBalance : 0);
          //We calculate feeAmount = taxbase * (isAdd ?pool.totalFee : (1/(1-totalFee)-1))
          // but in a way that correctly handles FEE_DECIMALS and is compatible with uint arithmetic.
          uint256 feeAmount = isAdd //rounding?
            ? (taxbase * pool.totalFee) / FEE_MULTIPLIER
            : (taxbase * FEE_MULTIPLIER) / (FEE_MULTIPLIER - pool.totalFee) - taxbase;
          if (updatedBalance <= feeAmount) revert ImpossibleRemove();
          uint256 feeAdjustedBalance = updatedBalance - feeAmount;
          feeAdjustedBalances[i] = Equalized.wrap(feeAdjustedBalance);
        }
        uint256 feeAdjustedDepth = Invariant.calculateDepth(
          feeAdjustedBalances,
          pool.ampFactor,
          updatedDepth
        );
        userLpAmount = Equalized.wrap( //rounding?
          (Equalized.unwrap(pool.totalLpSupply) *
            (isAdd ? feeAdjustedDepth - initialDepth : initialDepth - feeAdjustedDepth)) / //userDepth
            initialDepth
        );
        uint256 totalFeeDepth = updatedDepth - feeAdjustedDepth;
        uint256 governanceDepth = (totalFeeDepth * pool.governanceFee) / pool.totalFee; //rounding?
        uint256 updatedLpSupply = isAdd
          ? Equalized.unwrap(pool.totalLpSupply) + Equalized.unwrap(userLpAmount)
          : Equalized.unwrap(pool.totalLpSupply) - Equalized.unwrap(userLpAmount);
        governanceMintAmount = Equalized.wrap( //rounding?
          (governanceDepth * updatedLpSupply) /
            ((isAdd ? feeAdjustedDepth : updatedDepth) - governanceDepth) //totalLpDepth
        );
      } else
        userLpAmount = Equalized.wrap( //rounding?
          ((isAdd ? updatedDepth - initialDepth : initialDepth - updatedDepth) *
            Equalized.unwrap(pool.totalLpSupply)) / initialDepth
        );
    }
  }

  function swap(
    bool isInput,
    Equalized[] memory amounts,
    uint8 index,
    Pool memory pool
  ) internal pure returns (Equalized userTokenAmount, Equalized governanceMintAmount) {
    unchecked {
      uint256 initialDepth = Invariant.calculateDepth(pool.balances, pool.ampFactor, 0);
      Equalized[] memory updatedBalances = new Equalized[](pool.tokenCount);
      for (uint256 i = 0; i < pool.tokenCount; ++i) {
        uint256 balance = Equalized.unwrap(pool.balances[i]);
        uint256 amount = Equalized.unwrap(amounts[i]);
        uint256 updatedBalance = isInput ? balance + amount : balance - amount;
        updatedBalances[i] = Equalized.wrap(updatedBalance);
      }
      Equalized[] memory knownBalances = new Equalized[](pool.tokenCount - 1);
      if (isInput && pool.totalFee != 0) {
        for (uint256 i = 0; i < knownBalances.length; ++i) {
          uint256 j = i < index ? i : i + 1;
          uint256 amount = Equalized.unwrap(amounts[j]);
          uint256 updatedBalance = Equalized.unwrap(updatedBalances[j]);
          uint256 inputFeeAmount = (amount * pool.totalFee) / FEE_MULTIPLIER; //rounding?
          uint256 knownBalance = updatedBalance - inputFeeAmount;
          knownBalances[i] = Equalized.wrap(knownBalance);
        }
      } else {
        for (uint256 i = 0; i < knownBalances.length; ++i) {
          uint256 j = i < index ? i : i + 1;
          knownBalances[i] = updatedBalances[j];
        }
      }
      uint256 initialGuess = isInput ? Equalized.unwrap(pool.balances[index]) : 0;
      uint256 unknownBalance = Equalized.unwrap(
        Invariant.calculateUnknownBalance(knownBalances, initialDepth, pool.ampFactor, initialGuess)
      );

      uint256 _userTokenAmount;
      if (isInput) {
        _userTokenAmount = Equalized.unwrap(pool.balances[index]) - unknownBalance;
        updatedBalances[index] = Equalized.wrap(
          Equalized.unwrap(updatedBalances[index]) - _userTokenAmount
        );
      } else {
        _userTokenAmount = unknownBalance - Equalized.unwrap(pool.balances[index]);
        if (pool.totalFee != 0)
          _userTokenAmount = (_userTokenAmount * FEE_MULTIPLIER) / (FEE_MULTIPLIER - pool.totalFee); //rounding?
        updatedBalances[index] = Equalized.wrap(
          Equalized.unwrap(updatedBalances[index]) + _userTokenAmount
        );
      }
      userTokenAmount = Equalized.wrap(_userTokenAmount);

      if (pool.totalFee != 0) {
        uint256 finalDepth = Invariant.calculateDepth(pool.balances, pool.ampFactor, initialDepth);
        uint256 totalFeeDepth = finalDepth - initialDepth;
        uint256 governanceDepth = (totalFeeDepth * pool.governanceFee) / pool.totalFee; //rounding?
        uint256 totalLpDepth = finalDepth - governanceDepth;
        uint256 _totalLpSupply = Equalized.unwrap(pool.totalLpSupply);
        uint256 _governanceMintAmount = (governanceDepth * _totalLpSupply) / totalLpDepth;
        governanceMintAmount = Equalized.wrap(_governanceMintAmount);
      }
    }
  }

  function removeExactBurn(
    Equalized burnAmount,
    uint8 outputIndex,
    Pool memory pool
  ) internal pure returns (Equalized outputAmount, Equalized governanceMintAmount) { unchecked {
    //RemoveExactBurnCache memory cache = RemoveExactBurnCache(0, 0, 0);
    uint256 updatedLpSupply = Equalized.unwrap(pool.totalLpSupply) - Equalized.unwrap(burnAmount);
    uint256 updatedDepth = (Invariant.calculateDepth(pool.balances, pool.ampFactor, 0) * //rounding?
      updatedLpSupply) / Equalized.unwrap(pool.totalLpSupply); //initialDepth
    Equalized[] memory knownBalances = new Equalized[](pool.tokenCount - 1);
    for (uint256 i = 0; i < knownBalances.length; ++i) {
      uint256 j = i < outputIndex ? i : i + 1;
      knownBalances[i] = pool.balances[j];
    }
    uint256 baseAmount = Equalized.unwrap(pool.balances[outputIndex]) -
      Equalized.unwrap(
        Invariant.calculateUnknownBalance(
          knownBalances,
          updatedDepth,
          pool.ampFactor,
          Equalized.unwrap(pool.balances[outputIndex])
        )
      );
    if (pool.totalFee != 0) {
      uint256 sumPoolBalances = Invariant.sum(pool.balances);
      //64 bits or less:
      uint256 taxableFraction = (//rounding?
      (sumPoolBalances - Equalized.unwrap(pool.balances[outputIndex])) << 64) / sumPoolBalances;
      //totalFee is less than FEE_MULTIPLIER/2, hence 1<<64 is an upper bound for the quotient,
      // and therefore overall fee is < 1<<64, i.e. fits in 64 bits or less:
      uint256 fee = (FEE_MULTIPLIER << 64) / (FEE_MULTIPLIER - pool.totalFee) - (1 << 64); //rounding?
      outputAmount = Equalized.wrap(
        baseAmount -
          ((//(64 bits * 64 bits) / (64 bits + (64 bits * 64 bits)>>64) = 128 / 64 = 64 bits or less:
          ((baseAmount * taxableFraction) / ((1 << 64) + ((taxableFraction * fee) >> 64))) *
            fee) >> 64)
      );
      //In the next line we're assigning to a function parameter (bad) that's a reference too
      // (way worse still). Otoh, we're not using pool.balances for anything else, neither inside
      // this function, nor within the larger context of the entire contract invocation. Hence,
      // copying the entire array and wasting a bunch of gas in the process, just to neurotically
      // and autistically avoid a code smell is even less palatable. So here goes...
      pool.balances[outputIndex] = Equalized.wrap(
        Equalized.unwrap(pool.balances[outputIndex]) - Equalized.unwrap(outputAmount)
      );
      uint256 totalFeeDepth = Invariant.calculateDepth(
        pool.balances,
        pool.ampFactor,
        updatedDepth
      ) - updatedDepth; //finalDepth
      uint256 governanceDepth = (totalFeeDepth * pool.governanceFee) / pool.totalFee;
      governanceMintAmount = Equalized.wrap(
        (governanceDepth * updatedLpSupply) / (updatedDepth + totalFeeDepth - governanceDepth)
      );
    } else outputAmount = Equalized.wrap(baseAmount);
  }}
}

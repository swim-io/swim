//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "./Equalize.sol";
import "./Invariant.sol";

library PoolMath {

function addRemove(
  bool isAdd,
  Equalized[] memory amounts,
  Equalized[] memory poolBalances,
  uint32 ampFactor,
  uint32 totalFee,
  uint32 governanceFee,
  Equalized totalLpSupply
) internal pure returns (
  Equalized userLpAmount,
  Equalized governanceMintAmount
) { unchecked {
  uint tokenCount = poolBalances.length;
  uint initialDepth = Invariant.calculateDepth(poolBalances, ampFactor, 0);
  uint sumPoolBalances = 0;
  uint sumUpdatedBalances = 0;
  Equalized[] memory updatedBalances = new Equalized[](tokenCount);
  for (uint i = 0; i < tokenCount; ++i) {
    uint balance = Equalized.unwrap(poolBalances[i]);
    uint amount = Equalized.unwrap(amounts[i]);
    uint updatedBalance = isAdd ? balance + amount : balance - amount;
    updatedBalances[i] = Equalized.wrap(updatedBalance);
    sumPoolBalances += balance;
    sumUpdatedBalances = updatedBalance;
  }
  uint initialGuess = initialDepth * sumUpdatedBalances / sumPoolBalances;
  uint updatedDepth = Invariant.calculateDepth(updatedBalances, ampFactor, initialGuess);

  uint _userLpAmount;
  uint _totalLpSupply = Equalized.unwrap(totalLpSupply);
  if (totalFee != 0) {
    Equalized[] memory feeAdjustedBalances = new Equalized[](tokenCount);
    for (uint i = 0; i < tokenCount; ++i) {
      uint balance = Equalized.unwrap(poolBalances[i]);
      uint updatedBalance = Equalized.unwrap(updatedBalances[i]);
      uint scaledBalance = balance * sumUpdatedBalances / sumPoolBalances; //TODO round?
      uint taxbase = isAdd
        ? (updatedBalance > scaledBalance ? updatedBalance - scaledBalance : 0)
        : (updatedBalance < scaledBalance ? scaledBalance - updatedBalance : 0);
      //We calculate feeAmount = taxbase * (isAdd ? totalFee : (1/(1-totalFee)-1))
      // but in a way that correctly handles FEE_DECIMALS and is compatible with uint arithmetic.
      uint feeAmount = isAdd //TODO round?
        ? taxbase * totalFee / FEE_DECIMAL_FACTOR
        : taxbase * FEE_DECIMAL_FACTOR / (FEE_DECIMAL_FACTOR-totalFee) - taxbase;
      require(updatedBalance > feeAmount, "impossible remove");
      uint feeAdjustedBalance = updatedBalance - feeAmount;
      feeAdjustedBalances[i] = Equalized.wrap(feeAdjustedBalance);
    }
    uint feeAdjustedDepth = Invariant.calculateDepth(feeAdjustedBalances, ampFactor, updatedDepth);
    uint totalFeeDepth = updatedDepth - feeAdjustedDepth;
    uint userDepth = isAdd ? feeAdjustedDepth - initialDepth : initialDepth - feeAdjustedDepth;
    _userLpAmount = _totalLpSupply * userDepth / initialDepth; //TODO round?
    uint governanceDepth = totalFeeDepth * governanceFee / totalFee; //TODO round?
    uint updatedLpSupply = isAdd ? _totalLpSupply + _userLpAmount : _totalLpSupply - _userLpAmount;
    uint totalLpDepth = (isAdd ? feeAdjustedDepth : updatedDepth) - governanceDepth;
    uint _governanceMintAmount = governanceDepth * updatedLpSupply / totalLpDepth; //TODO round?
    governanceMintAmount = Equalized.wrap(_governanceMintAmount);
  }
  else {
    _userLpAmount = isAdd ? updatedDepth - initialDepth : initialDepth - updatedDepth;
    _userLpAmount *= _totalLpSupply;
    _userLpAmount /= initialDepth; //TODO round?
  }
  userLpAmount = Equalized.wrap(_userLpAmount);
}}

function swap(
  bool isInput,
  Equalized[] memory amounts,
  uint8 index,
  Equalized[] memory poolBalances,
  uint32 ampFactor,
  uint32 totalFee,
  uint32 governanceFee,
  Equalized totalLpSupply
) internal pure returns (
  Equalized userTokenAmount,
  Equalized governanceMintAmount
) { unchecked {
  uint initialDepth = Invariant.calculateDepth(poolBalances, ampFactor, 0);
  Equalized[] memory updatedBalances = new Equalized[](poolBalances.length);
  for (uint i = 0; i < poolBalances.length; ++i) {
    uint balance = Equalized.unwrap(poolBalances[i]);
    uint amount = Equalized.unwrap(amounts[i]);
    uint updatedBalance = isInput ? balance + amount : balance - amount;
    updatedBalances[i] = Equalized.wrap(updatedBalance);
  }
  Equalized[] memory knownBalances = new Equalized[](poolBalances.length-1);
  if (isInput && totalFee != 0) {
    for (uint i = 0; i < knownBalances.length; ++i) {
      uint j = i < index ? i : i+1;
      uint amount = Equalized.unwrap(amounts[j]);
      uint updatedBalance = Equalized.unwrap(updatedBalances[j]);
      uint inputFeeAmount = amount * totalFee / FEE_DECIMAL_FACTOR; //rounding?
      uint knownBalance = updatedBalance - inputFeeAmount;
      knownBalances[i] = Equalized.wrap(knownBalance);
    }
  }
  else {
    for (uint i = 0; i < knownBalances.length; ++i) {
      uint j = i < index ? i : i+1;
      knownBalances[i] = updatedBalances[j];
    }
  }
  uint initialGuess = isInput ? Equalized.unwrap(poolBalances[index]) : 0;
  uint unknownBalance = Equalized.unwrap(
    Invariant.calculateUnknownBalance(knownBalances, initialDepth, ampFactor, initialGuess)
  );

  uint _userTokenAmount;
  if (isInput) {
    _userTokenAmount = Equalized.unwrap(poolBalances[index]) - unknownBalance;
    updatedBalances[index] = Equalized.wrap(
      Equalized.unwrap(updatedBalances[index]) - _userTokenAmount
    );
  }
  else {
    _userTokenAmount = unknownBalance - Equalized.unwrap(poolBalances[index]);
    if (totalFee != 0) {
      _userTokenAmount = //rounding?
        _userTokenAmount * FEE_DECIMAL_FACTOR / (FEE_DECIMAL_FACTOR-totalFee) - _userTokenAmount;
    }
    updatedBalances[index] = Equalized.wrap(
      Equalized.unwrap(updatedBalances[index]) + _userTokenAmount
    );
  }
  userTokenAmount = Equalized.wrap(_userTokenAmount);

  if (totalFee != 0) {
    uint finalDepth = Invariant.calculateDepth(poolBalances, ampFactor, initialDepth);
    uint totalFeeDepth = finalDepth - initialDepth;
    uint governanceDepth = totalFeeDepth * governanceFee / totalFee; //rounding?
    uint totalLpDepth = finalDepth - governanceDepth;
    uint _totalLpSupply = Equalized.unwrap(totalLpSupply);
    uint _governanceMintAmount = governanceDepth * _totalLpSupply / totalLpDepth;
    governanceMintAmount = Equalized.wrap(_governanceMintAmount);
  }
}}

function removeExactBurn(
  Equalized burnAmount,
  uint8 outputIndex,
  Equalized[] memory poolBalances,
  uint32 ampFactor,
  uint32 totalFee,
  uint32 governanceFee,
  Equalized totalLpSupply
) internal pure returns (
  Equalized outputAmount,
  Equalized governanceMintAmount
) { unchecked {
  uint initialDepth = Invariant.calculateDepth(poolBalances, ampFactor, 0);
  uint _totalLpSupply = Equalized.unwrap(totalLpSupply);
  uint updatedLpSupply = _totalLpSupply - Equalized.unwrap(burnAmount);
  uint updatedDepth = initialDepth * updatedLpSupply / _totalLpSupply; //rounding?
  Equalized[] memory knownBalances = new Equalized[](poolBalances.length-1);
  for (uint i = 0; i < knownBalances.length; ++i) {
    uint j = i < outputIndex ? i : i+1;
    knownBalances[i] = poolBalances[j];
  }
  uint baseBalance = Equalized.unwrap(poolBalances[outputIndex]);
  uint unknownBalance = Equalized.unwrap(
    Invariant.calculateUnknownBalance(knownBalances, updatedDepth, ampFactor, baseBalance)
  );
  uint baseAmount = baseBalance - unknownBalance;
  if (totalFee != 0) {
    uint sumPoolBalances = Invariant.sum(poolBalances);
    //64 bits or less:
    uint taxableFraction = ((sumPoolBalances - baseBalance)<<64) / sumPoolBalances; //rounding?
    //totalFee is less than FEE_DECIMAL_FACTOR/2, hence 2<<64 is an upper bound for the quotient,
    // and therefore overall fee is < 1<<64, i.e. fits in 64 bits or less:
    uint fee = (FEE_DECIMAL_FACTOR<<64) / (FEE_DECIMAL_FACTOR - totalFee) - (1<<64); //rounding?
    //(64 bits * 64 bits) / (64 bits + (64 bits * 64 bits)>>64) = 128 / 64 = 64 bits or less:
    uint taxbase = (baseAmount * taxableFraction) / ((1<<64) + ((taxableFraction * fee)>>64)); //rounding?
    uint feeAmount = taxbase * fee;
    outputAmount = Equalized.wrap(baseAmount - feeAmount);
    //In the next line we're assigning to a function parameter (bad) that's a reference too
    // (way worse still). Otoh, we're not using poolBalances for anything else, neither inside
    // this function, nor within the larger context of the entire contract invocation. Hence,
    // copying the entire array and wasting a bunch of gas in the process, just to neurotically
    //and autistically avoid a code smell is even less palatable. So here goes...
    poolBalances[outputIndex] = Equalized.wrap(baseBalance - Equalized.unwrap(outputAmount));
    uint finalDepth = Invariant.calculateDepth(poolBalances, ampFactor, updatedDepth);
    uint totalFeeDepth = finalDepth - updatedDepth;
    uint governanceDepth = totalFeeDepth * governanceFee / totalFee;
    uint totalLpDepth = updatedDepth + totalFeeDepth - governanceDepth;
    governanceMintAmount = Equalized.wrap(governanceDepth * updatedLpSupply / totalLpDepth);
  }
  else {
    outputAmount = Equalized.wrap(baseAmount);
  }

}

}}

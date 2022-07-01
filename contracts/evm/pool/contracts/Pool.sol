//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./LpToken.sol";
import "./AmpFactor.sol";
import "./Invariant.sol";
import "./PoolMath.sol";

import "hardhat/console.sol";

//We'll use uint32 for timestamps. 2^32 seconds ~= 136 years, i.e. it will last
// us until the early 22nd century... so we ought to be fine.

struct TokenWithEqualizer { //uses 22/32 bytes of its slot
  address addr;
  int8 equalizer; //it's cheaper to (densely) store the equalizers than the blown up values
}

contract Pool {
  using SafeERC20 for IERC20;

  uint public constant FEE_DECIMALS = 6; //enough to represent 100th of a bip
  uint public constant FEE_DECIMAL_DIVISOR = 10**FEE_DECIMALS;
  uint public constant MAX_TOKEN_COUNT = Invariant.MAX_TOKEN_COUNT;
  uint constant MIN_AMP_ADJUSTMENT_WINDOW = 1 days;
  uint constant MAX_AMP_RELATIVE_ADJUSTMENT = 10;

  //slot (26/32 bytes used)
  uint8  public /*immutable*/ tokenCount;
  bool   public paused;
  uint32 public totalFee;
  uint32 public governanceFee;
  uint32 public ampInitialValue;
  uint32 public ampInitialTimestamp;
  uint32 public ampTargetValue;
  uint32 public ampTargetTimestamp;

  //slot
  TokenWithEqualizer public /*immutable*/ lpToken;

  //MAX_TOKEN_COUNT slots (save gas by not having to keccak)
  TokenWithEqualizer[MAX_TOKEN_COUNT] public /*immutable*/ poolTokens;

  //slot
  address public governance;

  //slot
  address public governanceFeeRecipient;

  //TODO proxy pattern and initialize
  constructor(
    string memory lpTokenName,
    string memory lpTokenSymbol,
    address lpTokenAddress,
    int8 lpTokenEqualizer,
    address[] memory poolTokenAddresses,
    int8[] memory poolTokenEqualizers,
    uint32 ampFactor,
    uint32 lpFee,
    uint32 _governanceFee,
    address _governance,
    address _governanceFeeRecipient,
    ) { unchecked {
    //TODO LpToken
    require(LpToken(Clones.clone(lpTokenAddress)).initialize(lpTokenName, lpTokenSymbol), "LpToken initialization failed");
    lpToken.addr = lpTokenAddress;
    lpToken.equalizer = lpTokenEqualizer;

    uint8 _tokenCount = poolTokenAddresses.length;
    require(
      _tokenCount <= MAX_TOKEN_COUNT,
      "maximum supported token count exceeded"
    );
    require(
      poolTokenEqualizers.length == _tokenCount,
      "one token equalizer per token required"
    );
    tokenCount = tokens.length;

    for (uint i = 0; i < _tokenCount; ++i) {
      //TODO do we want any form of checking here? (e.g. duplicates)
      poolTokens[i].addr = poolTokenAddresses[i];
      require(poolTokenEqualizers[i] > -19 && ) //TODO
      poolTokens[i].equalizer = poolTokenEqualizers[i];
    }

    //ampFactor == 0 => constant product (only supported for 2 tokens)
    require(ampFactor <= MAX_AMP, "maximum amp factor exceeded");
    require(
      ampFactor >= ONE_AMP_SHIFTED || (ampFactor == 0 && _tokenCount == 2),
      "invalid amp factor"
    );
    ampInitialValue = 0;
    ampInitialTimestamp = 0;
    ampTargetValue = ampFactor << AMP_SHIFT;
    ampTargetTimestamp = 0;

    _setFees(lpFee, _governanceFee);

    require(
      _totalFee == 0 || _governanceFeeRecipient != address(0),
      "invalid governance fee recipient"
    );
    governanceFeeRecipient = _governanceFeeRecipient;

    paused = false;
    governance = _governance;
  }}

  //available, even when paused!
  function removeUniform(
    uint burnAmount,
    uint[] memory minimumOutputAmounts
  ) external returns(uint[] memory outputAmounts) {
    //deliberately using SafeMath in here

    LpToken lpT = LpToken(lpToken.addr);
    uint lpTotalSupply = lpT.totalSupply();
    require(lpT.burnFrom(msg.sender, burnAmount)); //TODO transferFrom to contract == burn?

    for (uint i = 0; i < tokenCount; unchecked {++i}) {
      IERC20 poolToken = IERC20(poolTokens[i]);
      uint poolBalance = poolToken.balanceOf(address(this));
      uint outputAmount = poolBalance * burnAmount / totalSupply; //SafeMath!
      poolToken.safeTransfer(msg.sender, outputAmount);
      outputAmounts.push(outputAmount);
    }
  }

  function add(
    uint[] memory inputAmounts,
    uint minimumMintAmount,
    ) external notPaused returns(uint mintedLp) {
    require(
      inputAmounts.length == tokenCount,
      "invalid number of input amounts"
    );

  }

  function removeExactOutput(
    uint[] memory outputAmounts,
    uint maximumBurnAmount,
    ) external notPaused returns(uint burnedLp) {

  }

  function removeExactBurn() external notPaused returns (uint) {

  }

  function swapExactInput() {

  }

  function swapExactOutput() {

  }

  function swap() {

  }

  function setFees(
    uint32 lpFee,
    uint32 _governanceFee
  ) external onlyOwner {
    _setFees(lpFee, _governanceFee);
  }

  function adjustAmpFactor(
    uint32 targetValue,
    uint32 targetTimestamp
  ) external onlyGovernance {
    uint currentAmpFactor = getAmpFactor();
    require(
      currentAmpFactor != 0,
      "can't change amp factor of constant product pool"
    );
    require(targetValue <= MAX_AMP, "maximum amp factor exceeded");
    uint _ampTargetValue = uint(targetValue) << AMP_SHIFT;
    require(_ampTargetValue >= ONE_AMP_SHIFTED, "below minimum amp factor");
    require(
      uint(targetTimestamp) > block.timestamp + MIN_AMP_ADJUSTMENT_WINDOW,
      "target timestamp not far enough in the future"
    );
    require(
      (currentAmpFactor <= _ampTargetValue &&
        (currentAmpFactor * MAX_AMP_RELATIVE_ADJUSTMENT >= _ampTargetValue)) ||
      (currentAmpFactor > _ampTargetValue &&
       (currentAmpFactor <= _ampTargetValue * MAX_AMP_RELATIVE_ADJUSTMENT)),
      "exceeding maximum relative adjustment"
    );

    ampInitialValue = uint32(block.timestamp);
    ampInitialTimestamp = uint32(currentAmpFactor);
    ampTargetValue = uint32(_ampTargetValue);
    ampTargetTimestamp = targetTimestamp;
  }

  function pause() external onlyGovernance {
    paused = true;
  }

  function unpause() external onlyGovernance {
    paused = false;
  }

  function _setFees(
    uint32 lpFee,
    uint32 _governanceFee
  ) private {
    uint32 _totalFee = lpFee + _governanceFee; //SafeMath!
    require(_totalFee < FEE_DECIMAL_DIVISOR, "total fee has to be less than 1");
    totalFee = _totalFee;
    governanceFee = _governanceFee;
  }

  function getPoolBalancesAndLpSupply() view returns(
    PoolMath.EqualizedAmount[] memory poolBalances,
    uint lpTotalSupply
  ) {
    for (uint i = 0; i < tokenCount; unchecked {++i}) {
      uint balance = IERC20(poolTokens[i].balanceOf(address(this)));
      poolBalances.push(Equalized.to(balance, poolTokens[i].equalizer));
    }
    lpTotalSupply = IERC20(lpToken.addr).totalSupply();
  }

  function getAmpFactor() internal view returns(uint ampFactor) { unchecked {
    int currentTimestamp = int(block.timestamp);
    int _ampTargetTimestamp = int(ampTargetTimestamp);
    if (currentTimestamp < _ampTargetTimestamp) {
      int _ampInitialTimestamp = int(_ampInitialTimestamp);
      int _ampInitialValue = int(ampInitialValue);
      int _ampTargetValue = int(ampTargetValue);
      int totalValueDifference = _ampTargetValue - _ampInitialValue;
      int timeSinceInitial = currentTimestamp - _ampInitialTimestamp;
      int totalAdjustmentTime = _ampTargetTimestamp - _ampInitialTimestamp;
      int delta = totalValueDifference * timeSinceInitial / totalAdjustmentTime;
      ampFactor = uint(_ampInitialValue + delta);
    }
    else {
      ampFactor = uint(ampTargetValue);
    }
  }}
}

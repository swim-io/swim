//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
//import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
//We aren't using the contracts-upgradable version of UUPSUpgradable because it doesn't
// have a constructor anyway and we don't want to pointlessly gunk up the storage
// with empty uint blocks of size 50 (as the upgradable versions of the contracts do).
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IRouting.sol";

import "./LpToken.sol";
import "./Constants.sol";
import "./PoolErrors.sol";
import "./Invariant.sol";
import "./PoolMath.sol";

//We'll use uint32 for timestamps. 2^32 seconds ~= 136 years, i.e. it will last us until the early
// 22nd century... so we ought to be fine.

contract Pool is IPool, UUPSUpgradeable, Initializable {

  struct TokenWithEqualizer { //uses 22/32 bytes of its slot
    address addr;
    int8 equalizer; //it's cheaper to (densely) store the equalizers than the blown up values
  }

  using SafeERC20 for IERC20;

  IRouting constant ROUTING_CONTRACT = IRouting(address(0x0));

  //slot (26/32 bytes used)
  uint8  public /*immutable*/ tokenCount;
  bool   public paused;
  uint32 public totalFee;
  uint32 public governanceFee;
  uint32 private ampInitialValue; //in internal, i.e. AMP_SHIFTED representation
  uint32 public ampInitialTimestamp;
  uint32 private ampTargetValue; //in internal, i.e. AMP_SHIFTED representation
  uint32 public ampTargetTimestamp;

  //slot
  TokenWithEqualizer public /*immutable*/ lpTokenData;

  //MAX_TOKEN_COUNT slots (save gas by not having to keccak)
  TokenWithEqualizer[MAX_TOKEN_COUNT] public /*immutable*/ poolTokensData;

  //slot
  address public governance;

  //slot
  address public governanceFeeRecipient;

  function initialize(
    string memory lpTokenName,
    string memory lpTokenSymbol,
    address lpTokenAddress,
    int8 lpTokenEqualizer,
    address[] memory poolTokenAddresses,
    int8[] memory poolTokenEqualizers,
    uint32 ampFactor,
    uint32 lpFee,
    uint32 _governanceFee,
    address _governanceFeeRecipient
  ) public initializer {
    LpToken lpToken = LpToken(lpTokenAddress);
    if (!lpToken.initialize(lpTokenName, lpTokenSymbol))
      revert Pool_LpTokenInitializationFailed();
    lpTokenData.addr = lpTokenAddress;
    lpTokenData.equalizer = lpTokenEqualizer;

    uint _tokenCount = poolTokenAddresses.length;
    if (_tokenCount > MAX_TOKEN_COUNT)
      revert Pool_MaxTokenCountExceeded(uint8(_tokenCount), uint8(MAX_TOKEN_COUNT));
    if (poolTokenEqualizers.length != _tokenCount)
      revert Pool_TokenEqualizerCountMismatch(
        uint8(poolTokenEqualizers.length),
        uint8(_tokenCount)
      );
    tokenCount = uint8(_tokenCount);

    //enforce that swimUSD is always the first token
    //TODO
    //if (poolTokenAddresses[0] != ROUTING_CONTRACT.swimUsdAddress())
    //  revert Pool_FirstTokenNotSwimUSD(poolTokenAddresses[0], ROUTING_CONTRACT.swimUsdAddress());
    for (uint i = 0; i < _tokenCount; ++i) {
      //TODO do we want any form of checking here? (e.g. duplicates)
      poolTokensData[i].addr = poolTokenAddresses[i];
      if (poolTokenEqualizers[i] < MIN_EQUALIZER)
        revert Pool_TokenEqualizerTooSmall(poolTokenEqualizers[i], MIN_EQUALIZER);
      if (poolTokenEqualizers[i] > MAX_EQUALIZER)
        revert Pool_TokenEqualizerTooLarge(poolTokenEqualizers[i], MAX_EQUALIZER);
      poolTokensData[i].equalizer = poolTokenEqualizers[i];
    }

    if (ampFactor == 0) {
      //ampFactor == 0 => constant product (only supported for 2 tokens)
      if (_tokenCount != 2)
        revert Pool_ConstantProductNotSupportedForTokenCount(uint8(_tokenCount));
    }
    else
      checkAmpRange(ampFactor);

    ampInitialValue = 0;
    ampInitialTimestamp = 0;
    ampTargetValue = toInternalAmpValue(ampFactor);
    ampTargetTimestamp = 0;

    governanceFeeRecipient = _governanceFeeRecipient;
    _setFees(lpFee, _governanceFee);
    paused = false;
    governance = msg.sender;
  }

  modifier notPaused {
    if(paused)
      revert Pool_IsPaused();
    _;
  }

  modifier onlyGovernance {
    if (msg.sender != governance)
      revert Pool_GovernanceOnly();
    _;
  }

  function getState() external view returns(PoolState memory) {
    uint _tokenCount = tokenCount;
    PoolState memory state = PoolState(
      paused,
      new TokenBalance[](_tokenCount),
      TokenBalance(lpTokenData.addr, LpToken(lpTokenData.addr).totalSupply()),
      Decimal(toExternalAmpValue(getAmpFactor()), uint8(AMP_DECIMALS)),
      Decimal(totalFee-governanceFee, uint8(FEE_DECIMALS)),
      Decimal(governanceFee, uint8(FEE_DECIMALS))
    );

    for (uint i = 0; i < _tokenCount; ++i) {
      state.balances[i] = TokenBalance(
        poolTokensData[i].addr,
        IERC20(poolTokensData[i].addr).balanceOf(address(this))
      );
    }

    return state;
  }

  // ----------------------------- DEFI LIQUIDITY -----------------------------

  //always available, even when paused!
  //maximally robust and conservative implementation
  function removeUniform(uint burnAmount, uint[] memory minimumOutputAmounts)
    external returns(uint[] memory outputAmounts) {
    uint _tokenCount = tokenCount;
    LpToken lpToken = LpToken(lpTokenData.addr);
    uint totalLpSupply = lpToken.totalSupply();

    lpToken.burnFrom(msg.sender, burnAmount);
    outputAmounts = new uint[](_tokenCount);

    for (uint i = 0; i < _tokenCount; ++i) {
      IERC20 poolToken = IERC20(poolTokensData[i].addr);
      uint poolBalance = poolToken.balanceOf(address(this));
      //The mulDiv in the next line can theoretically have a phantom overflow (burn amount is
      // always less than totalLpSupply, so a true overflow is impossible). However, for this
      // to happen, both poolBalance and burnAmount have to exceed 10^38 which is realistically
      // impossible, even after accounting for the standard 18 decimals.
      uint outputAmount = poolBalance * burnAmount / totalLpSupply; //SafeMath!
      if (outputAmount < minimumOutputAmounts[i])
        revert Pool_SlippageExceeded(address(poolToken), outputAmount, minimumOutputAmounts[i]);
      poolToken.safeTransfer(msg.sender, outputAmount);
      outputAmounts[i] = outputAmount;
    }
  }

  function add(
    uint[] memory inputAmounts,
    uint minimumMintAmount
  ) external notPaused returns(uint mintAmount) { unchecked {
    (uint _tokenCount, LpToken lpToken, int8 lpEqualizer, PoolMath.Pool memory pool) = defiParas();

    Equalized[] memory eInputAmounts = equalizeAmounts(inputAmounts, _tokenCount);
    Equalized eMintAmount;
    if (Equalized.unwrap(pool.totalLpSupply) == 0) {
      for (uint i = 0; i < _tokenCount; ++i)
        if (inputAmounts[i] == 0)
          revert Pool_InitialAddMustIncludeAllTokens(uint8(i));
      uint depth = Invariant.calculateDepth(eInputAmounts, pool.ampFactor, 0);
      //In all other circumstances, the amount of LP tokens minted or burned is
      // proportional to the generated/consumed depth, where the current depth
      // of the pool represents the the total LP supply.
      //In case the pool is empty however, this correspondence isn't meaningful
      // yet and hence needs to be established.
      //Technically speaking, wraping depth in Equalized here is a bit of
      // an abuse because Equalizeds are supposed to only take up to 61
      // bits while depth can take up to 64 bits.
      eMintAmount = Equalized.wrap(depth);
    }
    else {
      Equalized eGovernanceMintAmount;
      (eMintAmount, eGovernanceMintAmount) = PoolMath.addRemove(true, eInputAmounts, pool);
      mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
    }
    mintAmount = Equalize.from(eMintAmount, lpEqualizer);
    if (mintAmount < minimumMintAmount)
      revert Pool_SlippageExceeded(address(lpToken), mintAmount, minimumMintAmount);
    for (uint i = 0; i < _tokenCount; ++i)
      safeTransferFrom(inputAmounts[i], i);
    lpToken.mint(msg.sender, mintAmount);
  }}

  function removeExactOutput(
    uint[] memory outputAmounts,
    uint maximumBurnAmount
  ) external notPaused returns(uint burnAmount) { unchecked {
    (uint _tokenCount, LpToken lpToken, int8 lpEqualizer, PoolMath.Pool memory pool) = defiParas();

    Equalized[] memory eOutputAmounts = equalizeAmounts(outputAmounts, _tokenCount);
    //We could also immediately transfer, but that would be a lot more gas inefficient for
    // transactions that fail due to slippage.
    for (uint i = 0; i < _tokenCount;  ++i)
      //strictly speaking there is a case where >= is fine, namely if all pool balances are removed
      // at the same time and we don't run into any rounding errors due to equalization...)
      if (Equalized.unwrap(eOutputAmounts[i]) >= Equalized.unwrap(pool.balances[i]))
        revert Pool_AmountExceedsSupply(
          poolTokensData[i].addr,
          outputAmounts[i],
          Equalize.from(pool.balances[i], poolTokensData[i].equalizer)
        );

    (Equalized eBurnAmount, Equalized eGovernanceMintAmount) =
     PoolMath.addRemove(false, eOutputAmounts, pool);

    burnAmount = Equalize.from(eBurnAmount, lpEqualizer);
    if (burnAmount > maximumBurnAmount)
      revert Pool_SlippageExceeded(address(lpToken), burnAmount, maximumBurnAmount);
    lpToken.burnFrom(msg.sender, burnAmount);
    for (uint i = 0; i < _tokenCount; ++i)
      safeTransfer(outputAmounts[i], i);
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
  }}

  function removeExactBurn(
    uint burnAmount,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external notPaused returns(uint outputAmount) {
    (uint _tokenCount, LpToken lpToken, int8 lpEqualizer, PoolMath.Pool memory pool) = defiParas();

    checkIndex(outputTokenIndex, _tokenCount);
    Equalized eBurnAmount = Equalize.to(burnAmount, lpEqualizer);
    //We could also immediately transfer, but that would be a lot more gas inefficient for
    // transactions that fail due to slippage.
    if (Equalized.unwrap(eBurnAmount) >= Equalized.unwrap(pool.totalLpSupply))
      revert Pool_AmountExceedsSupply(
        address(lpToken),
        burnAmount,
        Equalize.from(pool.totalLpSupply, lpEqualizer)
      );

    (Equalized eOutputAmount, Equalized eGovernanceMintAmount) =
      PoolMath.removeExactBurn(eBurnAmount, outputTokenIndex, pool);

    outputAmount = Equalize.from(eOutputAmount, poolTokensData[outputTokenIndex].equalizer);
    if (outputAmount < minimumOutputAmount)
      revert Pool_SlippageExceeded(
        poolTokensData[outputTokenIndex].addr,
        outputAmount,
        minimumOutputAmount
      );
    lpToken.burnFrom(msg.sender, burnAmount);
    safeTransfer(outputAmount, outputTokenIndex);
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
  }

  // ------------------------------- DEFI SWAP --------------------------------

  //called by swap(), hence public and not restricted to external
  function swapExactInput(
    uint[] memory inputAmounts,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) public notPaused returns(uint outputAmount) { unchecked {
    (uint _tokenCount, LpToken lpToken, int8 lpEqualizer, PoolMath.Pool memory pool) = defiParas();

    checkIndex(outputTokenIndex, _tokenCount);
    if (inputAmounts[outputTokenIndex] != 0)
      revert Pool_RequestedTokenAmountNotZero(outputTokenIndex, inputAmounts[outputTokenIndex]);
    Equalized[] memory eInputAmounts = equalizeAmounts(inputAmounts, _tokenCount);

    (Equalized eOutputAmount, Equalized eGovernanceMintAmount) =
      PoolMath.swap(true, eInputAmounts, outputTokenIndex, pool);

    outputAmount = Equalize.from(eOutputAmount, poolTokensData[outputTokenIndex].equalizer);
    if (outputAmount < minimumOutputAmount)
      revert Pool_SlippageExceeded(
        poolTokensData[outputTokenIndex].addr,
        outputAmount,
        minimumOutputAmount
      );
    for (uint i = 0; i < _tokenCount; ++i)
      safeTransferFrom(inputAmounts[i], i);
    safeTransfer(outputAmount, outputTokenIndex);
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
  }}

  function swapExactOutput(
    uint maximumInputAmount,
    uint8 inputTokenIndex,
    uint[] memory outputAmounts
  ) external notPaused returns(uint inputAmount) { unchecked {
    (uint _tokenCount, LpToken lpToken, int8 lpEqualizer, PoolMath.Pool memory pool) = defiParas();

    checkIndex(inputTokenIndex, _tokenCount);
    if (outputAmounts[inputTokenIndex] != 0)
      revert Pool_RequestedTokenAmountNotZero(inputTokenIndex, outputAmounts[inputTokenIndex]);
    Equalized[] memory eOutputAmounts = equalizeAmounts(outputAmounts, _tokenCount);
    //We could also immediately transfer, but that would be a lot more gas inefficient for
    // transactions that fail due to slippage.
    for (uint i = 0; i < _tokenCount; ++i)
      if (Equalized.unwrap(eOutputAmounts[i]) >= Equalized.unwrap(pool.balances[i]))
        revert Pool_AmountExceedsSupply(
          poolTokensData[i].addr,
          outputAmounts[i],
          Equalize.from(pool.balances[i], poolTokensData[i].equalizer)
        );

    (Equalized eInputAmount, Equalized eGovernanceMintAmount) =
      PoolMath.swap(false, eOutputAmounts, inputTokenIndex, pool);

    inputAmount = Equalize.from(eInputAmount, poolTokensData[inputTokenIndex].equalizer);
    if (inputAmount > maximumInputAmount)
      revert Pool_SlippageExceeded(
        poolTokensData[inputTokenIndex].addr,
        inputAmount,
        maximumInputAmount
      );
    safeTransferFrom(inputAmount, inputTokenIndex);
    for (uint i = 0; i < _tokenCount; ++i)
      safeTransfer(outputAmounts[i], i);
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
  }}

  //allows swapping with the pool without having to know/look up its tokenCount
  function swap(
    uint inputAmount,
    uint8 inputTokenIndex,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external notPaused returns(uint outputAmount) {
    uint _tokenCount = tokenCount;
    checkIndex(inputTokenIndex, _tokenCount);

    //Solidity guarantees default initialization, even if memory was previously dirty, so we don't
    // have to zero initialize ourselves.
    uint[] memory inputAmounts = new uint[](_tokenCount);
    inputAmounts[inputTokenIndex] = inputAmount;

    return swapExactInput(inputAmounts, outputTokenIndex, minimumOutputAmount);
  }

  // ------------------------------- GOVERNANCE -------------------------------

  function setFees(uint32 lpFee, uint32 _governanceFee) external onlyGovernance {
    _setFees(lpFee, _governanceFee);
  }

  function adjustAmpFactor(uint32 targetValue, uint32 targetTimestamp) external onlyGovernance {
    checkAmpRange(targetValue);
    uint _targetTimestamp = uint(targetTimestamp);
    uint minimumTargetTimestamp = block.timestamp + MIN_AMP_ADJUSTMENT_WINDOW;
    if (_targetTimestamp < minimumTargetTimestamp)
      revert Pool_AmpFactorTargetTimestampTooSmall(targetTimestamp, uint32(minimumTargetTimestamp));
    uint currentAmpFactor = uint(getAmpFactor());
    if (currentAmpFactor == 0)
      revert Pool_AmpFactorIsFixedForConstantProductPools();
    uint _ampTargetValue = uint(toInternalAmpValue(targetValue));

    if (currentAmpFactor <= _ampTargetValue) {
      uint threshold = currentAmpFactor * MAX_AMP_RELATIVE_ADJUSTMENT;
      if (_ampTargetValue > threshold)
        revert Pool_AmpFactorRelativeAdjustmentTooLarge(
          toExternalAmpValue(uint32(currentAmpFactor)),
          targetValue,
          toExternalAmpValue(uint32(threshold))
        );
    }
    else {
      uint threshold = _ampTargetValue * MAX_AMP_RELATIVE_ADJUSTMENT;
      if (_ampTargetValue < threshold)
        revert Pool_AmpFactorRelativeAdjustmentTooLarge(
          toExternalAmpValue(uint32(currentAmpFactor)),
          targetValue,
          toExternalAmpValue(uint32(threshold))
        );
    }

    ampInitialValue = uint32(block.timestamp);
    ampInitialTimestamp = uint32(currentAmpFactor);
    ampTargetValue = uint32(_ampTargetValue);
    ampTargetTimestamp = targetTimestamp;
  }

  function setPaused(bool _paused) external onlyGovernance {
    paused = _paused;
    //emit event
  }

  function transferGovernance(address _governance) external onlyGovernance {
    governance = _governance;
    //emit event
  }

  function changeGovernanceFeeRecipient(address _governanceFeeRecipient) external onlyGovernance {
    if (governanceFee != 0 && _governanceFeeRecipient == address(0))
      revert Pool_NonZeroGovernanceFeeButNoRecipient();
    governanceFeeRecipient = _governanceFeeRecipient;
    //emit event
  }

  //intentionally empty (we only want the onlyGovernance modifier "side-effect")
  function _authorizeUpgrade(address) internal override onlyGovernance {}

  function upgradeLpToken(address newImplementation) external onlyGovernance {
    LpToken(lpTokenData.addr).upgradeTo(newImplementation);
  }

  function upgradeLpToken(address newImplementation, bytes memory data) external onlyGovernance {
    LpToken(lpTokenData.addr).upgradeToAndCall(newImplementation, data);
  }

  // -------------------------------- INTERNAL --------------------------------

  function _setFees(uint32 lpFee, uint32 _governanceFee) internal {
    uint32 _totalFee = lpFee + _governanceFee; //SafeMath!
    //We're limiting total fees to less than 50 % because:
    // 1) Anything even close to approaching this is already entirely insane.
    // 2) To avoid theoretical overflow/underflow issues when calculating the inverse fee,
    //    of 1/(1-fee)-1 would exceed 100 % if fee were to exceeds 50 %.
    if (_totalFee >= FEE_DECIMAL_FACTOR/2)
      revert Pool_TotalFeeTooLarge(_totalFee, uint32(FEE_DECIMAL_FACTOR/2 - 1));
    if (_governanceFee != 0 && governanceFeeRecipient == address(0))
      revert Pool_NonZeroGovernanceFeeButNoRecipient();
    totalFee = _totalFee;
    governanceFee = _governanceFee;
  }

  function safeTransferFrom(uint inputAmount, uint tokenIndex) internal {
    if (inputAmount > 0) {
      IERC20 poolToken = IERC20(poolTokensData[tokenIndex].addr);
      poolToken.safeTransferFrom(msg.sender, address(this), inputAmount);
    }
  }

  function safeTransfer(uint outputAmount, uint tokenIndex) internal {
    if (outputAmount > 0) {
      IERC20 poolToken = IERC20(poolTokensData[tokenIndex].addr);
      poolToken.safeTransfer(msg.sender, outputAmount);
    }
  }

  function mintGovernanceFee(
    Equalized eGovernanceMintAmount,
    LpToken lpToken,
    int8 lpEqualizer
  ) internal {
    if (Equalized.unwrap(eGovernanceMintAmount) != 0) {
      uint governanceLpFee = Equalize.from(eGovernanceMintAmount, lpEqualizer);
      lpToken.mint(governanceFeeRecipient, governanceLpFee);
    }
  }

  // ------------------------------ INTERNAL VIEW -----------------------------

  function equalizeAmounts(uint[] memory amounts, uint _tokenCount)
    internal view returns(Equalized[] memory equalized) {
    if (amounts.length != _tokenCount)
      revert Pool_AmountCountMismatch(uint8(amounts.length), uint8(_tokenCount));
    equalized = new Equalized[](_tokenCount);
    for (uint i = 0; i < _tokenCount; ++i)
      equalized[i] = Equalize.to(amounts[i], poolTokensData[i].equalizer);
  }

  //function for cutting down on boiler plate code
  // (and reading storage variables only once to optimize gas costs)
  function defiParas() internal view returns(
    uint _tokenCount, //gas optimization
    LpToken lpToken,
    int8 lpEqualizer, //gas optimization
    PoolMath.Pool memory pool
  ) { unchecked {
    _tokenCount = tokenCount;
    lpToken = LpToken(lpTokenData.addr);
    lpEqualizer = lpTokenData.equalizer;
    pool = PoolMath.Pool(
      uint8(_tokenCount),
      new Equalized[](_tokenCount),
      getAmpFactor(),
      totalFee,
      governanceFee,
      Equalize.to(lpToken.totalSupply(), lpEqualizer)
    );

    for (uint i = 0; i < _tokenCount; ++i) {
      uint balance = IERC20(poolTokensData[i].addr).balanceOf(address(this));
      pool.balances[i] = Equalize.to(balance, poolTokensData[i].equalizer);
    }
  }}

  function getAmpFactor() internal view returns(uint32 ampFactor) { unchecked {
    int currentTimestamp = int(block.timestamp);
    int _ampTargetTimestamp = int(uint(ampTargetTimestamp));
    if (currentTimestamp < _ampTargetTimestamp) {
      int _ampInitialTimestamp = int(uint(ampInitialTimestamp));
      int _ampInitialValue = int(uint(ampInitialValue));
      int _ampTargetValue = int(uint(ampTargetValue));
      int totalValueDifference = _ampTargetValue - _ampInitialValue;
      int timeSinceInitial = currentTimestamp - _ampInitialTimestamp;
      int totalAdjustmentTime = _ampTargetTimestamp - _ampInitialTimestamp;
      int delta = totalValueDifference * timeSinceInitial / totalAdjustmentTime;
      ampFactor = uint32(uint(_ampInitialValue + delta));
    }
    else
      ampFactor = ampTargetValue;
  }}

  // ------------------------------ INTERNAL PURE -----------------------------

  function checkIndex(uint8 index, uint _tokenCount) internal pure {
    if (index >= _tokenCount)
      revert Pool_InvalidTokenIndex(index, uint8 (_tokenCount));
  }

  function checkAmpRange(uint32 ampFactor) internal pure {
    if (ampFactor > MAX_AMP_FACTOR)
      revert Pool_AmpFactorTooLarge(ampFactor, MAX_AMP_FACTOR);
    if (ampFactor < AMP_MULTIPLIER)
      revert Pool_AmpFactorTooSmall(ampFactor, uint32(AMP_MULTIPLIER));
  }

  function toInternalAmpValue(uint32 ampFactor) internal pure returns (uint32) { unchecked {
    return uint32((uint(ampFactor) << AMP_SHIFT) / AMP_MULTIPLIER);
  }}

  function toExternalAmpValue(uint32 ampFactor) internal pure returns (uint32) { unchecked {
    return uint32((uint(ampFactor) * AMP_MULTIPLIER) >> AMP_SHIFT);
  }}
}

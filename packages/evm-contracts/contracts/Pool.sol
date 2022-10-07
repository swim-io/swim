//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

//We aren't using the contracts-upgradable version of UUPSUpgradable and Initialize because they
// don't have constructors anyway and we don't want to pointlessly gunk up the storage with empty
// uint blocks of size 50 (as the upgradable versions of the contracts do).
//
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IRouting.sol";
import "./interfaces/ISwimFactory.sol";

import "./LpToken.sol";
import "./Constants.sol";
import "./Invariant.sol";
import "./PoolMath.sol";

//We'll use uint32 for timestamps. 2^32 seconds ~= 136 years, i.e. it will last us until the early
// 22nd century... so we ought to be fine.

contract Pool is IPool, Initializable, UUPSUpgradeable {

  struct TokenWithEqualizer { //uses 22/32 bytes of its slot
    address addr;
    int8 equalizer; //storing the equalizer rather than the multiplier (=10^equalizer) saves storage
  }

  //A word on transfers in the contract: We always do the calculations first and the transfers after
  // which reduces gas cost in case transactions exceed slippage. We also always first take inputs
  // from the user and mint fees before sending them their outputs.
  using SafeERC20 for IERC20;

  uint private constant MAX_TOKEN_COUNT = 6;
  int8 private constant PRECISION = int8(int(POOL_PRECISION));
  int8 private constant SWIM_USD_EQUALIZER = PRECISION - int8(SWIM_USD_DECIMALS);
  //Min and max equalizers are somewhat arbitrary, though shifting down by more than 14 decimals
  // will almost certainly be unintentional and shifting up by more than 4 digits will almost
  // certainly result in too small of a usable value range (only 18 digits in total!).
  //In general, a positive equalizer should be quite unlikely on an EVM chain.
  // (The main scenario where this seems somewhat likely at all are tokens that were Wormhole
  //  bridged from Solana that use a very low native number of decimals to begin with.)
  int8 private constant MIN_EQUALIZER = -14;
  int8 private constant MAX_EQUALIZER = 4;

  //amp factor for external representation
  uint private constant AMP_DECIMALS = 3;
  uint private constant AMP_MULTIPLIER = 10**AMP_DECIMALS;
  //we choose MAX_AMP_FACTOR so that MAX_AMP_FACTOR<<AMP_SHIFT requires 30 bits or less
  uint32 private constant MAX_AMP_FACTOR = 10**6 * uint32(AMP_MULTIPLIER);
  uint private constant MIN_AMP_ADJUSTMENT_WINDOW = 1 days;
  uint private constant MAX_AMP_RELATIVE_ADJUSTMENT = 10;

  //slot[0] (28/32 bytes used)
  // We could cut down on gas costs further by implementing a method that reads the slot once
  //  and parses out the values manually instead of having Solidity generate inefficient, garbage
  //  bytecode as it does...
  //uint8 _initialized inherited from Initializable
  //bool _initializing inerited from Initializable
  uint8  private /*immutable*/ _tokenCount;
  bool   private _paused;
  uint32 private _totalFee;
  uint32 private _governanceFee;
  uint32 private _ampInitialValue; //in internal, i.e. AMP_SHIFTED representation
  uint32 private _ampInitialTimestamp;
  uint32 private _ampTargetValue; //in internal, i.e. AMP_SHIFTED representation
  uint32 private _ampTargetTimestamp;

  //slot[1]
  address private _governance;

  //slot[2]
  address private _governanceFeeRecipient;

  //slot[3]
  TokenWithEqualizer private /*immutable*/ _lpTokenData;

  //slots[4 to 4+MAX_TOKEN_COUNT]
  // (use fixed size array to save gas by not having to keccak on access)
  TokenWithEqualizer[MAX_TOKEN_COUNT] private /*immutable*/ _poolTokensData;

  modifier notPaused {
    if(_paused)
      revert IsPaused();
    _;
  }

  modifier onlyGovernance {
    if (msg.sender != _governance)
      revert GovernanceOnly();
    _;
  }

  //using memory instead of calldata data location to avoid "stack too deep"
  function initialize(
    string memory lpTokenName,
    string memory lpTokenSymbol,
    bytes32 lpTokenSalt,
    uint8 lpTokenDecimals,
    address[] memory poolTokenAddresses,
    int8[] memory poolTokenEqualizers,
    uint32 ampFactor,
    uint32 lpFee,
    uint32 governanceFee,
    address governance_,
    address governanceFeeRecipient_
  ) public initializer {
    checkAndSetTokenWithEqualizer(
      _lpTokenData,
      //moved to a separate function to avoid stack too deep
      deployLpToken(lpTokenName, lpTokenSymbol, lpTokenDecimals, lpTokenSalt),
      //LpToken ensures decimals are sensible hence we don't have to worry about conversion here
      PRECISION - int8(lpTokenDecimals)
    );

    uint tokenCount = poolTokenAddresses.length + 1;
    if (tokenCount > MAX_TOKEN_COUNT)
      revert MaxTokenCountExceeded(uint8(tokenCount), uint8(MAX_TOKEN_COUNT));
    if (poolTokenEqualizers.length != poolTokenAddresses.length)
      revert TokenEqualizerCountMismatch(uint8(poolTokenEqualizers.length), uint8(tokenCount));
    _tokenCount = uint8(tokenCount);

    //swimUSD is always the first token
    _poolTokensData[0].addr = IRouting(ROUTING_CONTRACT).swimUsdAddress();
    _poolTokensData[0].equalizer = SWIM_USD_EQUALIZER;

    for (uint i = 0; i < poolTokenAddresses.length; ++i) {
      //check that token contract exists and is (likely) ERC20 by calling balanceOf
      (bool success, bytes memory result) =
        poolTokenAddresses[i].call(abi.encodeWithSignature("balanceOf(address)", address(0)));
      if (!success || result.length != 32)
        revert InvalidTokenAddress(poolTokenAddresses[i]);

      checkAndSetTokenWithEqualizer(
        _poolTokensData[i+1],
        poolTokenAddresses[i],
        poolTokenEqualizers[i]
      );
    }

    if (ampFactor == 0) {
      //ampFactor == 0 => constant product (only supported for 2 tokens)
      if (tokenCount != 2)
        revert ConstantProductNotSupportedForTokenCount(uint8(tokenCount));
    }
    else
      checkAmpRange(ampFactor);

    _ampInitialValue = 0;
    _ampInitialTimestamp = 0;
    _ampTargetValue = toInternalAmpValue(ampFactor);
    _ampTargetTimestamp = 0;

    _governance = governance_;
    _governanceFeeRecipient = governanceFeeRecipient_;
    _setFees(lpFee, governanceFee);
    _paused = false;
  }

  // ----------------------------- EXTERNAL VIEW ---------------------------------------------------

  function governance() external view returns (address) {
    return _governance;
  }

  function governanceFeeRecipient() external view returns (address) {
    return _governanceFeeRecipient;
  }

  function getLpToken() external view returns (address) {
    return _lpTokenData.addr;
  }

  function getState() external view returns (PoolState memory) {
    uint tokenCount = _tokenCount;
    PoolState memory state = PoolState(
      _paused,
      new TokenBalance[](tokenCount),
      TokenBalance(_lpTokenData.addr, LpToken(_lpTokenData.addr).totalSupply()),
      Decimal(toExternalAmpValue(getAmpFactor()), uint8(AMP_DECIMALS)),
      Decimal(_totalFee - _governanceFee, uint8(FEE_DECIMALS)),
      Decimal(_governanceFee, uint8(FEE_DECIMALS))
    );

    for (uint i = 0; i < tokenCount; ++i) {
      address addr = _poolTokensData[i].addr;
      state.balances[i] = TokenBalance(addr, IERC20(addr).balanceOf(address(this)));
    }

    return state;
  }

  //calculate marginal prices measured in LP-tokens / i-token
  // i.e. marginally, adding or removing 1 i-token will net you marginalPrice[i] LP-tokens
  function getMarginalPrices() external view returns (Decimal[] memory marginalPrices) { unchecked {
    ( //we read fees from storage here which is unnecessary but oh well
      uint tokenCount,
      ,
      int[] memory poolTokenEqualizers,
      ,
      int lpEqualizer,
      PoolMath.Pool memory pool
    ) = defiParas();

    //we calculate marginal prices using equalized amounts so we now have to adjust the actual
    // prices based on the equalizers
    uint[] memory unadjustedMarginalPrices = Invariant.calculateMarginalPrices(
      pool.balances,
      pool.ampFactor,
      pool.totalLpSupply
    );
    marginalPrices = new Decimal[](tokenCount);
    for (uint i = 0; i < tokenCount; ++i)
      marginalPrices[i] = Decimal(
        unadjustedMarginalPrices[i],
        uint8(uint(int(MARGINAL_PRICE_DECIMALS) - lpEqualizer + poolTokenEqualizers[i]))
      );
  }}

  // ----------------------------- DEFI LIQUIDITY --------------------------------------------------

  //always available, even when paused!
  function removeUniform(
    uint burnAmount,
    uint[] calldata minimumOutputAmounts
  ) external returns (uint[] memory outputAmounts) {
    outputAmounts = _removeUniform(burnAmount, minimumOutputAmounts);
  }

  function removeUniform(
    uint burnAmount,
    uint[] calldata minimumOutputAmounts,
    bytes16 memo
  ) external returns (uint[] memory outputAmounts) {
    outputAmounts = _removeUniform(burnAmount, minimumOutputAmounts);
    emit MemoInteraction(memo);
  }

  //maximally robust and conservative implementation - does not use PoolMath/Invariant
  function _removeUniform(
    uint burnAmount,
    uint[] calldata minimumOutputAmounts
  ) internal returns (uint[] memory outputAmounts) {
    uint tokenCount = _tokenCount;
    LpToken lpToken = LpToken(_lpTokenData.addr);
    uint totalLpSupply = lpToken.totalSupply();

    lpToken.burnFrom(msg.sender, burnAmount);
    outputAmounts = new uint[](tokenCount);

    for (uint i = 0; i < tokenCount; ++i) {
      IERC20 poolToken = IERC20(_poolTokensData[i].addr);
      uint poolBalance = poolToken.balanceOf(address(this));
      //The mulDiv in the next line can theoretically have a phantom overflow (burn amount is
      // always less than totalLpSupply, so a true overflow is impossible). However, for this
      // to happen, both poolBalance and burnAmount have to exceed 10^38 which is realistically
      // impossible, even after accounting for the standard 18 decimals.
      uint outputAmount = poolBalance * burnAmount / totalLpSupply; //SafeMath!
      if (outputAmount < minimumOutputAmounts[i])
        revert SlippageExceeded(address(poolToken), outputAmount, minimumOutputAmounts[i]);
      poolToken.safeTransfer(msg.sender, outputAmount);
      outputAmounts[i] = outputAmount;
    }
  }

  function add(
    uint[] calldata inputAmounts,
    uint minimumMintAmount
  ) external notPaused returns (uint mintAmount) {
    mintAmount = _add(inputAmounts, minimumMintAmount);
  }

  function add(
    uint[] calldata inputAmounts,
    uint minimumMintAmount,
    bytes16 memo
  ) external notPaused returns (uint mintAmount) {
    mintAmount = _add(inputAmounts, minimumMintAmount);
    emit MemoInteraction(memo);
  }

  function _add(
    uint[] calldata inputAmounts,
    uint minimumMintAmount
  ) internal returns (uint mintAmount) { unchecked {
    (
      uint tokenCount,
      address[] memory poolTokenAddrs,
      int[] memory poolTokenEqualizers,
      LpToken lpToken,
      int lpEqualizer,
      PoolMath.Pool memory pool
    ) = defiParas();

    Equalized[] memory eInputAmounts = equalizeAmounts(inputAmounts, poolTokenEqualizers);
    Equalized eMintAmount;
    if (Equalized.unwrap(pool.totalLpSupply) == 0) {
      for (uint i = 0; i < tokenCount; ++i)
        if (Equalized.unwrap(eInputAmounts[i]) == 0)
          revert InitialAddMustIncludeAllTokens(uint8(i));
      uint depth = Invariant.calculateDepth(eInputAmounts, pool.ampFactor, 0);
      //In all other circumstances, the amount of LP tokens minted or burned is
      // proportional to the generated/consumed depth, where the current depth
      // of the pool represents the the total LP supply.
      //In case the pool is empty however, this correspondence isn't meaningful
      // yet and hence needs to be established.
      //Technically speaking, wrapping depth in Equalized here is a bit of
      // an abuse because Equalizeds are supposed to only take up to 61
      // bits while depth can use up to 64 bits.
      eMintAmount = Equalized.wrap(depth);
    }
    else {
      Equalized eGovernanceMintAmount;
      (eMintAmount, eGovernanceMintAmount) = PoolMath.addRemove(true, eInputAmounts, pool);
      mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
    }
    mintAmount = Equalize.from(eMintAmount, lpEqualizer);
    if (mintAmount < minimumMintAmount)
      revert SlippageExceeded(address(lpToken), mintAmount, minimumMintAmount);
    for (uint i = 0; i < tokenCount; ++i)
      safeTransferFrom(inputAmounts[i], poolTokenAddrs[i]);
    lpToken.mint(msg.sender, mintAmount);
  }}

  function removeExactOutput(
    uint[] calldata outputAmounts,
    uint maximumBurnAmount
  ) external notPaused returns (uint burnAmount) {
    burnAmount = _removeExactOutput(outputAmounts, maximumBurnAmount);
  }

  function removeExactOutput(
    uint[] calldata outputAmounts,
    uint maximumBurnAmount,
    bytes16 memo
  ) external notPaused returns (uint burnAmount) {
    burnAmount = _removeExactOutput(outputAmounts, maximumBurnAmount);
    emit MemoInteraction(memo);
  }

  function _removeExactOutput(
    uint[] calldata outputAmounts,
    uint maximumBurnAmount
  ) internal returns (uint burnAmount) { unchecked {
    (
      uint tokenCount,
      address[] memory poolTokenAddrs,
      int[] memory poolTokenEqualizers,
      LpToken lpToken,
      int lpEqualizer,
      PoolMath.Pool memory pool
    ) = defiParas();

    Equalized[] memory eOutputAmounts = equalizeAmounts(outputAmounts, poolTokenEqualizers);
    for (uint i = 0; i < tokenCount;  ++i)
      //strictly speaking there is a case where >= is fine, namely if all pool balances are removed
      // at the same time and we don't run into any rounding errors due to equalization...)
      if (Equalized.unwrap(eOutputAmounts[i]) >= Equalized.unwrap(pool.balances[i]))
        revert AmountExceedsSupply(
          poolTokenAddrs[i],
          outputAmounts[i],
          Equalize.from(pool.balances[i], poolTokenEqualizers[i])
        );

    (Equalized eBurnAmount, Equalized eGovernanceMintAmount) =
      PoolMath.addRemove(false, eOutputAmounts, pool);

    burnAmount = Equalize.from(eBurnAmount, lpEqualizer);
    if (burnAmount > maximumBurnAmount)
      revert SlippageExceeded(address(lpToken), burnAmount, maximumBurnAmount);
    lpToken.burnFrom(msg.sender, burnAmount);
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
    for (uint i = 0; i < tokenCount; ++i)
      safeTransfer(outputAmounts[i], poolTokenAddrs[i]);
  }}

  function removeExactBurn(
    uint burnAmount,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external notPaused returns (uint outputAmount) {
    outputAmount = _removeExactBurn(burnAmount, outputTokenIndex, minimumOutputAmount);
  }

  function removeExactBurn(
    uint burnAmount,
    uint8 outputTokenIndex,
    uint minimumOutputAmount,
    bytes16 memo
  ) external notPaused returns (uint outputAmount) {
    outputAmount = _removeExactBurn(burnAmount, outputTokenIndex, minimumOutputAmount);
    emit MemoInteraction(memo);
  }

  function _removeExactBurn(
    uint burnAmount,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) internal returns (uint outputAmount) {
    (
      uint tokenCount,
      address[] memory poolTokenAddrs,
      int[] memory poolTokenEqualizers,
      LpToken lpToken,
      int lpEqualizer,
      PoolMath.Pool memory pool
    ) = defiParas();

    checkIndex(outputTokenIndex, tokenCount);
    Equalized eBurnAmount = Equalize.to(burnAmount, lpEqualizer);
    //We could also immediately transfer, but that would be a lot more gas inefficient for
    // transactions that fail due to slippage.
    if (Equalized.unwrap(eBurnAmount) >= Equalized.unwrap(pool.totalLpSupply))
      revert AmountExceedsSupply(
        address(lpToken),
        burnAmount,
        Equalize.from(pool.totalLpSupply, lpEqualizer)
      );

    (Equalized eOutputAmount, Equalized eGovernanceMintAmount) =
      PoolMath.removeExactBurn(eBurnAmount, outputTokenIndex, pool);

    outputAmount = Equalize.from(eOutputAmount, poolTokenEqualizers[outputTokenIndex]);
    if (outputAmount < minimumOutputAmount)
      revert SlippageExceeded(poolTokenAddrs[outputTokenIndex], outputAmount, minimumOutputAmount);
    lpToken.burnFrom(msg.sender, burnAmount);
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
    safeTransfer(outputAmount, poolTokenAddrs[outputTokenIndex]);
  }

  // ----------------------------- DEFI SWAP -------------------------------------------------------

  function swapExactInput(
    uint[] calldata inputAmounts,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external notPaused returns (uint outputAmount) {
    outputAmount = _swapExactInput(inputAmounts, outputTokenIndex, minimumOutputAmount);
  }

  function _swapExactInput(
    uint[] memory inputAmounts, //memory because it is also called by swap()
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) internal returns (uint outputAmount) { unchecked {
    (
      uint tokenCount,
      address[] memory poolTokenAddrs,
      int[] memory poolTokenEqualizers,
      LpToken lpToken,
      int lpEqualizer,
      PoolMath.Pool memory pool
    ) = defiParas();

    checkIndex(outputTokenIndex, tokenCount);
    if (inputAmounts[outputTokenIndex] != 0)
      revert RequestedTokenAmountNotZero(outputTokenIndex, inputAmounts[outputTokenIndex]);
    Equalized[] memory eInputAmounts = equalizeAmounts(inputAmounts, poolTokenEqualizers);

    (Equalized eOutputAmount, Equalized eGovernanceMintAmount) =
      PoolMath.swap(true, eInputAmounts, outputTokenIndex, pool);

    outputAmount = Equalize.from(eOutputAmount, poolTokenEqualizers[outputTokenIndex]);
    if (outputAmount < minimumOutputAmount)
      revert SlippageExceeded(poolTokenAddrs[outputTokenIndex], outputAmount, minimumOutputAmount);
    for (uint i = 0; i < tokenCount; ++i)
      safeTransferFrom(inputAmounts[i], poolTokenAddrs[i]);
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
    safeTransfer(outputAmount, poolTokenAddrs[outputTokenIndex]);
  }}

  function swapExactOutput(
    uint maximumInputAmount,
    uint8 inputTokenIndex,
    uint[] calldata outputAmounts
  ) external notPaused returns (uint inputAmount) { unchecked {
    (
      uint tokenCount,
      address[] memory poolTokenAddrs,
      int[] memory poolTokenEqualizers,
      LpToken lpToken,
      int lpEqualizer,
      PoolMath.Pool memory pool
    ) = defiParas();

    checkIndex(inputTokenIndex, tokenCount);
    if (outputAmounts[inputTokenIndex] != 0)
      revert RequestedTokenAmountNotZero(inputTokenIndex, outputAmounts[inputTokenIndex]);
    Equalized[] memory eOutputAmounts = equalizeAmounts(outputAmounts, poolTokenEqualizers);
    //We could also immediately transfer, but that would be a lot more gas inefficient for
    // transactions that fail due to slippage.
    for (uint i = 0; i < tokenCount; ++i)
      if (Equalized.unwrap(eOutputAmounts[i]) >= Equalized.unwrap(pool.balances[i]))
        revert AmountExceedsSupply(
          poolTokenAddrs[i],
          outputAmounts[i],
          Equalize.from(pool.balances[i], poolTokenEqualizers[i])
        );

    (Equalized eInputAmount, Equalized eGovernanceMintAmount) =
      PoolMath.swap(false, eOutputAmounts, inputTokenIndex, pool);

    inputAmount = Equalize.from(eInputAmount, poolTokenEqualizers[inputTokenIndex]);
    if (inputAmount > maximumInputAmount)
      revert SlippageExceeded(poolTokenAddrs[inputTokenIndex], inputAmount, maximumInputAmount);
    safeTransferFrom(inputAmount, poolTokenAddrs[inputTokenIndex]);
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
    for (uint i = 0; i < tokenCount; ++i)
      safeTransfer(outputAmounts[i], poolTokenAddrs[i]);
  }}

  //allows swapping with the pool without having to know/look up its tokenCount
  function swap(
    uint inputAmount,
    uint8 inputTokenIndex,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external notPaused returns (uint outputAmount) {
    uint tokenCount = _tokenCount;
    checkIndex(inputTokenIndex, tokenCount);

    //Solidity guarantees default initialization, even if memory was previously dirty, so we don't
    // have to zero initialize ourselves.
    uint[] memory inputAmounts = new uint[](tokenCount);
    inputAmounts[inputTokenIndex] = inputAmount;

    outputAmount = _swapExactInput(inputAmounts, outputTokenIndex, minimumOutputAmount);
  }

  // ----------------------------- GOVERNANCE ------------------------------------------------------

  function setFees(uint32 lpFee, uint32 governanceFee) external onlyGovernance {
    _setFees(lpFee, governanceFee);
  }

  function _setFees(uint32 lpFee, uint32 governanceFee) internal {
    uint32 totalFee = lpFee + governanceFee; //SafeMath!
    //We're limiting total fees to less than 50 % because:
    // 1) Anything even close to approaching this is already entirely insane.
    // 2) To avoid theoretical overflow/underflow issues when calculating the inverse fee,
    //    of 1/(1-fee)-1 would exceed 100 % if fee were to exceed 50 %.
    if (totalFee >= FEE_MULTIPLIER/2)
      revert TotalFeeTooLarge(totalFee, uint32(FEE_MULTIPLIER/2 - 1));
    if (governanceFee != 0 && _governanceFeeRecipient == address(0))
      revert NonZeroGovernanceFeeButNoRecipient();
    _totalFee = totalFee;
    _governanceFee = governanceFee;
  }

  function adjustAmpFactor(uint32 targetValue, uint32 targetTimestamp) external onlyGovernance {
    checkAmpRange(targetValue);
    // solhint-disable-next-line not-rely-on-time
    uint minimumTargetTimestamp = block.timestamp + MIN_AMP_ADJUSTMENT_WINDOW;
    if (uint(targetTimestamp) < minimumTargetTimestamp)
      revert AmpFactorTargetTimestampTooSmall(targetTimestamp, uint32(minimumTargetTimestamp));
    uint currentAmpFactor = uint(getAmpFactor());
    if (currentAmpFactor == 0)
      revert AmpFactorIsFixedForConstantProductPools();
    uint ampTargetValue = uint(toInternalAmpValue(targetValue));

    if (currentAmpFactor <= ampTargetValue) {
      uint threshold = currentAmpFactor * MAX_AMP_RELATIVE_ADJUSTMENT;
      if (ampTargetValue > threshold)
        revert AmpFactorRelativeAdjustmentTooLarge(
          toExternalAmpValue(uint32(currentAmpFactor)),
          targetValue,
          toExternalAmpValue(uint32(threshold))
        );
    }
    else {
      uint threshold = ampTargetValue * MAX_AMP_RELATIVE_ADJUSTMENT;
      if (currentAmpFactor > threshold)
        revert AmpFactorRelativeAdjustmentTooLarge(
          toExternalAmpValue(uint32(currentAmpFactor)),
          targetValue,
          toExternalAmpValue(uint32(threshold))
        );
    }
    // solhint-disable-next-line not-rely-on-time
    _ampInitialValue     = uint32(currentAmpFactor);
    _ampInitialTimestamp = uint32(block.timestamp);
    _ampTargetValue      = uint32(ampTargetValue);
    _ampTargetTimestamp  = targetTimestamp;
  }

  function setPaused(bool paused) external onlyGovernance {
    _paused = paused;
    emit Paused(paused);
  }

  function transferGovernance(address governance_) external onlyGovernance {
    _governance = governance_;
    emit TransferGovernance(msg.sender, governance_);
  }

  function changeGovernanceFeeRecipient(address governanceFeeRecipient_) external onlyGovernance {
    if (_governanceFee != 0 && governanceFeeRecipient_ == address(0))
      revert NonZeroGovernanceFeeButNoRecipient();
    _governanceFeeRecipient = governanceFeeRecipient_;
    emit ChangeGovernanceFeeRecipient(governanceFeeRecipient_);
  }

  function upgradeLpToken(address newImplementation) external onlyGovernance {
    LpToken(_lpTokenData.addr).upgradeTo(newImplementation);
  }

  function upgradeLpToken(address newImplementation, bytes memory data) external onlyGovernance {
    LpToken(_lpTokenData.addr).upgradeToAndCall(newImplementation, data);
  }

  //intentionally empty (we only want the onlyGovernance modifier "side-effect")
  function _authorizeUpgrade(address) internal override onlyGovernance {}

  // ----------------------------- INTERNAL --------------------------------------------------------

  function deployLpToken(
    string memory lpTokenName,
    string memory lpTokenSymbol,
    uint8 lpTokenDecimals,
    bytes32 lpTokenSalt
  ) internal returns (address) {
    try
      ISwimFactory(SWIM_FACTORY).createProxy(
        LP_TOKEN_LOGIC,
        lpTokenSalt,
        abi.encodeWithSignature(
          "initialize(address,string,string,uint8)",
          address(this),
          lpTokenName,
          lpTokenSymbol,
          lpTokenDecimals
        )
      )
    returns (address lpTokenAddress) {
      return lpTokenAddress;
    }
    catch (bytes memory lowLevelData) {
      revert LpTokenInitializationFailed(lowLevelData);
    }
  }

  function checkAndSetTokenWithEqualizer(
    TokenWithEqualizer storage tokenData,
    address addr,
    int8 equalizer
  ) internal {
    if (equalizer < MIN_EQUALIZER)
      revert TokenEqualizerTooSmall(equalizer, MIN_EQUALIZER);
    if (equalizer > MAX_EQUALIZER)
      revert TokenEqualizerTooLarge(equalizer, MAX_EQUALIZER);
    tokenData.addr = addr;
    tokenData.equalizer = equalizer;
  }

  function safeTransferFrom(uint inputAmount, address poolTokenAddr) internal {
    if (inputAmount > 0)
      IERC20(poolTokenAddr).safeTransferFrom(msg.sender, address(this), inputAmount);
  }

  function safeTransfer(uint outputAmount, address poolTokenAddr) internal {
    if (outputAmount > 0)
      IERC20(poolTokenAddr).safeTransfer(msg.sender, outputAmount);
  }

  function mintGovernanceFee(
    Equalized eGovernanceMintAmount,
    LpToken lpToken,
    int lpEqualizer
  ) internal {
    if (Equalized.unwrap(eGovernanceMintAmount) != 0) {
      uint governanceLpFee = Equalize.from(eGovernanceMintAmount, lpEqualizer);
      lpToken.mint(_governanceFeeRecipient, governanceLpFee);
    }
  }

  // ----------------------------- INTERNAL VIEW ---------------------------------------------------

  //used to cut down on boiler plate and reduce gas by reading storage variables only once
  function defiParas() internal view returns (
    uint tokenCount,
    address[] memory poolTokenAddrs,
    int[] memory poolTokenEqualizers,
    LpToken lpToken,
    int lpEqualizer,
    PoolMath.Pool memory pool
  ) { unchecked {
    tokenCount = _tokenCount;
    poolTokenAddrs = new address[](tokenCount);
    poolTokenEqualizers = new int[](tokenCount);
    Equalized[] memory poolBalances = new Equalized[](tokenCount);
    for (uint i = 0; i < tokenCount; ++i) {
      TokenWithEqualizer memory data = _poolTokensData[i]; //enforce single storage access
      address poolTokenAddr = data.addr;
      int poolTokenEqualizer = data.equalizer;
      uint balance = IERC20(poolTokenAddr).balanceOf(address(this));
      poolTokenAddrs[i] = poolTokenAddr;
      poolTokenEqualizers[i] = poolTokenEqualizer;
      poolBalances[i] = Equalize.to(balance, poolTokenEqualizer);
    }
    lpToken = LpToken(_lpTokenData.addr);
    lpEqualizer = _lpTokenData.equalizer;
    pool = PoolMath.Pool(
      tokenCount,
      poolBalances,
      //still inefficient storage access here (we could read amp and fee paras together at once)
      getAmpFactor(),
      _totalFee,
      _governanceFee,
      Equalize.to(lpToken.totalSupply(), lpEqualizer)
    );
  }}

  function getAmpFactor() internal view returns (uint32 ampFactor) { unchecked {
     // solhint-disable-next-line not-rely-on-time
    int currentTimestamp = int(block.timestamp);
    int ampTargetTimestamp = int(uint(_ampTargetTimestamp));
    if (currentTimestamp < ampTargetTimestamp) {
      int ampInitialTimestamp = int(uint(_ampInitialTimestamp));
      int ampInitialValue = int(uint(_ampInitialValue));
      int ampTargetValue = int(uint(_ampTargetValue));
      int totalValueDifference = ampTargetValue - ampInitialValue;
      int timeSinceInitial = currentTimestamp - ampInitialTimestamp;
      int totalAdjustmentTime = ampTargetTimestamp - ampInitialTimestamp;
      int delta = totalValueDifference * timeSinceInitial / totalAdjustmentTime;
      ampFactor = uint32(uint(ampInitialValue + delta));
    }
    else
      ampFactor = _ampTargetValue;
  }}

  // ----------------------------- INTERNAL PURE ---------------------------------------------------

  function equalizeAmounts(uint[] memory amounts, int[] memory poolTokenEqualizers)
    internal pure returns (Equalized[] memory equalized) { unchecked {
    uint tokenCount = poolTokenEqualizers.length;
    if (amounts.length != tokenCount)
      revert AmountCountMismatch(uint8(amounts.length), uint8(tokenCount));
    equalized = new Equalized[](tokenCount);
    for (uint i = 0; i < tokenCount; ++i)
      equalized[i] = Equalize.to(amounts[i], poolTokenEqualizers[i]);
  }}

  function checkIndex(uint8 index, uint tokenCount) internal pure {
    if (index >= tokenCount)
      revert InvalidTokenIndex(index, uint8 (tokenCount));
  }

  function checkAmpRange(uint32 ampFactor) internal pure {
    if (ampFactor > MAX_AMP_FACTOR)
      revert AmpFactorTooLarge(ampFactor, MAX_AMP_FACTOR);
    if (ampFactor < AMP_MULTIPLIER)
      revert AmpFactorTooSmall(ampFactor, uint32(AMP_MULTIPLIER));
  }

  function toInternalAmpValue(uint32 ampFactor) internal pure returns (uint32) { unchecked {
    return uint32((uint(ampFactor) << AMP_SHIFT) / AMP_MULTIPLIER);
  }}

  function toExternalAmpValue(uint32 ampFactor) internal pure returns (uint32) { unchecked {
    return uint32((uint(ampFactor) * AMP_MULTIPLIER) >> AMP_SHIFT);
  }}
}

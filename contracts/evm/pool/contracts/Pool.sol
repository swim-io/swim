//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
//import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
//We aren't using the contracts-upgradable version of UUPSUpgradable because it doesn't
// have a constructor anyway and we don't want to pointlessly gunk up the storage
// with empty uint blocks of size 50 (as the upgradable versions of the contracts do).
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "./LpToken.sol";
import "./Constants.sol";
import "./Invariant.sol";
import "./PoolMath.sol";

//We'll use uint32 for timestamps. 2^32 seconds ~= 136 years, i.e. it will last us until the early
// 22nd century... so we ought to be fine.

struct TokenWithEqualizer { //uses 22/32 bytes of its slot
  address addr;
  int8 equalizer; //it's cheaper to (densely) store the equalizers than the blown up values
}

contract Pool is UUPSUpgradeable, Initializable {
  using SafeERC20 for IERC20;

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
    address lpTokenImpl,
    int8 lpTokenEqualizer,
    address[] memory poolTokenAddresses,
    int8[] memory poolTokenEqualizers,
    uint32 ampFactor,
    uint32 lpFee,
    uint32 _governanceFee,
    address _governanceFeeRecipient
  ) public initializer {
    LpToken lpToken = LpToken(Clones.clone(lpTokenImpl));
    require(lpToken.initialize(lpTokenName, lpTokenSymbol), "LpToken initialization failed");
    lpTokenData.addr = address(lpToken);
    lpTokenData.equalizer = lpTokenEqualizer;

    uint _tokenCount = poolTokenAddresses.length;
    require(_tokenCount <= MAX_TOKEN_COUNT, "maximum supported token count exceeded");
    require(poolTokenEqualizers.length == _tokenCount, "one token equalizer per token required");
    tokenCount = uint8(_tokenCount);

    for (uint i = 0; i < _tokenCount; ++i) {
      //TODO do we want any form of checking here? (e.g. duplicates)
      poolTokensData[i].addr = poolTokenAddresses[i];
      require(
        poolTokenEqualizers[i] >= MIN_EQUALIZER && poolTokenEqualizers[i] <= MAX_EQUALIZER,
        "invalid equalizer value"
      );
      poolTokensData[i].equalizer = poolTokenEqualizers[i];
    }

    //ampFactor == 0 => constant product (only supported for 2 tokens)
    require(ampFactor <= MAX_AMP_FACTOR, "maximum amp factor exceeded");
    require(
      ampFactor >= ONE_AMP_SHIFTED || (ampFactor == 0 && _tokenCount == 2),
      "invalid amp factor"
    );
    ampInitialValue = 0;
    ampInitialTimestamp = 0;
    ampTargetValue = ampFactor << uint32(AMP_SHIFT);
    ampTargetTimestamp = 0;

    governanceFeeRecipient = _governanceFeeRecipient;
    _setFees(lpFee, _governanceFee);
    paused = false;
    governance = msg.sender;
  }

  modifier notPaused {
    require(!paused);
    _;
  }

  modifier onlyGovernance {
    require(msg.sender == governance);
    _;
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
      uint outputAmount = poolBalance * burnAmount / totalLpSupply; //SafeMath!
      require(outputAmount >= minimumOutputAmounts[i]);
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
      for (uint i = 0; i < _tokenCount; ++i) {
        require(inputAmounts[i] > 0, "Initial add must include all tokens");
      }
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
    require(mintAmount >= minimumMintAmount);
    for (uint i = 0; i < _tokenCount; ++i) {
      safeTransferFrom(inputAmounts[i], i);
    }
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
    for (uint i = 0; i < _tokenCount;  ++i) {
      require(
        Equalized.unwrap(eOutputAmounts[i]) < Equalized.unwrap(pool.balances[i])
      );
    }

    (Equalized eBurnAmount, Equalized eGovernanceMintAmount) =
     PoolMath.addRemove(false, eOutputAmounts, pool);

    burnAmount = Equalize.from(eBurnAmount, lpEqualizer);
    require(burnAmount <= maximumBurnAmount);
    lpToken.burnFrom(msg.sender, burnAmount);
    for (uint i = 0; i < _tokenCount; ++i) {
      safeTransfer(outputAmounts[i], i);
    }
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
  }}

  function removeExactBurn(
    uint burnAmount,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external notPaused returns(uint outputAmount) {
    (uint _tokenCount, LpToken lpToken, int8 lpEqualizer, PoolMath.Pool memory pool) = defiParas();

    require(outputTokenIndex < _tokenCount);
    Equalized eBurnAmount = Equalize.to(burnAmount, lpEqualizer);
    //We could also immediately transfer, but that would be a lot more gas inefficient for
    // transactions that fail due to slippage.
    require(Equalized.unwrap(eBurnAmount) < Equalized.unwrap(pool.totalLpSupply));

    (Equalized eOutputAmount, Equalized eGovernanceMintAmount) =
      PoolMath.removeExactBurn(eBurnAmount, outputTokenIndex, pool);

    outputAmount = Equalize.from(eOutputAmount, poolTokensData[outputTokenIndex].equalizer);
    require(outputAmount >= minimumOutputAmount);
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
  ) external notPaused returns(uint outputAmount) { unchecked {
    (uint _tokenCount, LpToken lpToken, int8 lpEqualizer, PoolMath.Pool memory pool) = defiParas();

    require(outputTokenIndex < _tokenCount);
    require(inputAmounts[outputTokenIndex] == 0);
    Equalized[] memory eInputAmounts = equalizeAmounts(inputAmounts, _tokenCount);

    (Equalized eOutputAmount, Equalized eGovernanceMintAmount) =
      PoolMath.swap(true, eInputAmounts, outputTokenIndex, pool);

    outputAmount = Equalize.from(eOutputAmount, poolTokensData[outputTokenIndex].equalizer);
    require(outputAmount >= minimumOutputAmount);
    for (uint i = 0; i < _tokenCount; ++i) {
      safeTransferFrom(inputAmounts[i], i);
    }
    safeTransfer(outputAmount, outputTokenIndex);
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
  }}

  function swapExactOutput(
    uint maximumInputAmount,
    uint8 inputTokenIndex,
    uint[] memory outputAmounts
  ) external notPaused returns(uint inputAmount) { unchecked {
    (uint _tokenCount, LpToken lpToken, int8 lpEqualizer, PoolMath.Pool memory pool) = defiParas();

    require(inputTokenIndex < _tokenCount);
    require(outputAmounts[inputTokenIndex] == 0);
    Equalized[] memory eOutputAmounts = equalizeAmounts(outputAmounts, _tokenCount);
    //We could also immediately transfer, but that would be a lot more gas inefficient for
    // transactions that fail due to slippage.
    for (uint i = 0; i < _tokenCount; ++i) {
      require(
        Equalized.unwrap(eOutputAmounts[i]) < Equalized.unwrap(pool.balances[i])
      );
    }

    (Equalized eInputAmount, Equalized eGovernanceMintAmount) =
      PoolMath.swap(false, eOutputAmounts, inputTokenIndex, pool);

    inputAmount = Equalize.from(eInputAmount, poolTokensData[inputTokenIndex].equalizer);
    require(inputAmount <= maximumInputAmount);
    safeTransferFrom(inputAmount, inputTokenIndex);
    for (uint i = 0; i < _tokenCount; ++i) {
      safeTransfer(outputAmounts[i], i);
    }
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
  }}

  //allows swapping with the pool without having to know/look up its tokenCount
  function swap(
    uint inputAmount,
    uint8 inputTokenIndex,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external notPaused returns(uint outputAmount) { unchecked {
    (uint _tokenCount, LpToken lpToken, int8 lpEqualizer, PoolMath.Pool memory pool) = defiParas();

    require(inputTokenIndex < _tokenCount);
    require(outputTokenIndex < _tokenCount);
    require(inputTokenIndex != outputTokenIndex);
    //Solidity guarantees default initialization, even if memory was previously dirty, so we don't
    // have to zero initialize ourselves.
    Equalized[] memory eInputAmounts = new Equalized[](_tokenCount);
    eInputAmounts[inputTokenIndex] =
      Equalize.to(inputAmount, poolTokensData[inputTokenIndex].equalizer);

    (Equalized eOutputAmount, Equalized eGovernanceMintAmount) =
      PoolMath.swap(true, eInputAmounts, outputTokenIndex, pool);

    outputAmount = Equalize.from(eOutputAmount, poolTokensData[outputTokenIndex].equalizer);
    require(outputAmount >= minimumOutputAmount);
    safeTransferFrom(inputAmount, inputTokenIndex);
    safeTransfer(outputAmount, outputTokenIndex);
    mintGovernanceFee(eGovernanceMintAmount, lpToken, lpEqualizer);
  }}

  // ------------------------------- GOVERNANCE -------------------------------

  function setFees(uint32 lpFee, uint32 _governanceFee) external onlyGovernance {
    _setFees(lpFee, _governanceFee);
  }

  function adjustAmpFactor(uint32 targetValue, uint32 targetTimestamp) external onlyGovernance {
    uint currentAmpFactor = uint(getAmpFactor());
    require(
      currentAmpFactor != 0,
      "can't change amp factor of constant product pool"
    );
    require(targetValue <= MAX_AMP_FACTOR, "maximum amp factor exceeded");
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

  function setPaused(bool _paused) external onlyGovernance {
    paused = _paused;
    //emit event
  }

  function transferGovernance(address _governance) external onlyGovernance {
    governance = _governance;
    //emit event
  }

  function changeGovernanceFeeRecipient(address _governanceFeeRecipient) external onlyGovernance {
    require(totalFee == 0 || _governanceFeeRecipient != address(0));
    governanceFeeRecipient = _governanceFeeRecipient;
    //emit event
  }

  //intentionally empty (we only want the onlyGovernance modifier "side-effect")
  function _authorizeUpgrade(address) internal override onlyGovernance {}

  // -------------------------------- INTERNAL --------------------------------

  function _setFees(uint32 lpFee, uint32 _governanceFee) internal {
    uint32 _totalFee = lpFee + _governanceFee; //SafeMath!
    //We're limiting total fees to less than 50 % because:
    // 1) Anything even close to approaching this is already entirely insane.
    // 2) To avoid theoretical overflow/underflow issues when calculating the inverse fee,
    //    of 1/(1-fee)-1 would exceed 100 % if fee were to exceeds 50 %.
    require(_totalFee < FEE_DECIMAL_FACTOR/2, "total fee has to be less than 50 %");
    require(_totalFee == 0 || governanceFeeRecipient != address(0));
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
    require(amounts.length == _tokenCount, "invalid number of passed token amounts");
    equalized = new Equalized[](_tokenCount);
    for (uint i = 0; i < _tokenCount; ++i) {
      equalized[i] = Equalize.to(amounts[i], poolTokensData[i].equalizer);
    }
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
    else {
      ampFactor = uint32(uint(ampTargetValue));
    }
  }}
}

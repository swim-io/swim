//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./LpToken.sol";

import "hardhat/console.sol";

//We'll use uint32 for timestamps. 2^32 seconds ~= 136 years, i.e. it will last
// us until the early 22nd century... so we ought to be fine.

struct TokenWithEqualizer { //uses 22/32 bytes of its slot
  address addr;
  int8 equalizer; //it's cheaper to (densely) store the equalizers than the blown up values
}

contract Pool {
  using SafeERC20 for IERC20;

  uint private constant MAX_TOKEN_COUNT = 6; //imposed by bit assumptions in invariant pool math
  uint public constant FEE_DECIMALS = 6; //enough to represent 100th of a bip
  uint public constant FEE_DECIMAL_DIVISOR = 10**FEE_DECIMALS;


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
    ) {
    //we are deliberately relying on Solidity built-in SafeMath in here

    //TODO
    require(LpToken(Clones.clone(lpTokenAddress)).initialize(lpTokenName, lpTokenSymbol), "LpToken initialization failed");
    lpToken.addr = lpTokenAddress;
    lpToken.equalizer = lpTokenEqualizer;

    uint8 _tokenCount = poolTokenAddresses.length;
    require(_tokenCount <= MAX_TOKEN_COUNT, "maximum supported token count exceeded");
    require(poolTokenEqualizers.length == _tokenCount, "one token equalizer per token required");
    tokenCount = tokens.length;

    for (uint i = 0; i < _tokenCount; ++i) {
      //TODO do we want any form of checking here? (e.g. duplicates)
      poolTokens[i].addr = poolTokenAddresses[i];
      poolTokens[i].equalizer = poolTokenEqualizers[i];
    }

    //ampFactor == 0 => constant product (only supported for 2 tokens)
    require(ampFactor <= MAX_AMP, "maximum amp factor exceeded");
    require(ampFactor > 0 || _tokenCount == 2, "constant product only supported for 2 tokens");
    ampInitialValue = 0;
    ampInitialTimestamp = 0;
    ampTargetValue = ampFactor;
    ampTargetTimestamp = 0;

    uint32 _totalFee = lpFee + _governanceFee; //SafeMath!
    require(_totalFee < FEE_DECIMAL_DIVISOR, "total fee has to be less than 1");
    totalFee = _totalFee;
    governanceFee = _governanceFee;

    require(_totalFee == 0 || _governanceFeeRecipient != address(0), "invalid governance fee recipient");
    governanceFeeRecipient = _governanceFeeRecipient;

    paused = false;
    governance = _governance;
  }

  function add(
    uint[] memory inputAmounts,
    uint minimumMintAmount,
    ) external returns(uint) {
    require(inputAmounts.length == tokenCount, "invalid number of input amounts");

  }

  function equalize(uint amounts, int8 equalizer) internal view {
    if (equalizer < 0) {

    }
  }

  // Add {
  //       input_amounts: [AmountT; TOKEN_COUNT],
  //       minimum_mint_amount: AmountT,
  //   },
  //   /// Swaps in the exact specified amounts for
  //   /// at least `minimum_out_amount` of the output_token specified
  //   /// by output_token_index
  //   ///
  //   /// Accounts expected by this instruction:
  //   ///     0. `[w]` The pool state account
  //   ///     1. `[]` pool authority
  //   ///     2. ..2 + TOKEN_COUNT `[w]` pool's token accounts
  //   ///     3. ..3 + TOKEN_COUNT `[w]` LP Token Mint
  //   ///     4. ..4 + TOKEN_COUNT `[w]` governance_fee_account
  //   ///     5. ..5 + TOKEN_COUNT `[s]` user transfer authority account
  //   ///     6. ..6 + TOKEN_COUNT `[w]` user token accounts
  //   SwapExactInput {
  //       exact_input_amounts: [AmountT; TOKEN_COUNT],
  //       output_token_index: u8,
  //       minimum_output_amount: AmountT,
  //   },
  //   /// Swaps in at most `maximum_input_amount` of the input token specified by
  //   /// `input_token_index` for the exact_output_amounts
  //   ///
  //   /// Accounts expected by this instruction:
  //   ///     0. `[w]` The pool state account
  //   ///     1. `[]` pool authority
  //   ///     2. ..2 + TOKEN_COUNT `[w]` pool's token accounts
  //   ///     3. ..3 + TOKEN_COUNT `[w]` LP Token Mint
  //   ///     4. ..4 + TOKEN_COUNT `[w]` governance_fee_account
  //   ///     5. ..5 + TOKEN_COUNT `[s]` user transfer authority account
  //   ///     6. ..6 + TOKEN_COUNT `[w]` user token accounts
  //   SwapExactOutput {
  //       maximum_input_amount: AmountT,
  //       input_token_index: u8,
  //       exact_output_amounts: [AmountT; TOKEN_COUNT],
  //   },

  //   /// Withdraw at least the number of tokens specified by `minimum_output_amounts` by
  //   /// burning `exact_burn_amount` of LP tokens
  //   /// Final withdrawal amounts are based on current deposit ratios
  //   ///
  //   ///
  //   /// Accounts expected by this instruction:
  //   ///     0. `[w]` The pool state account
  //   ///     1. `[]` pool authority
  //   ///     2. ..2 + TOKEN_COUNT `[w]` pool's token accounts
  //   ///     3. ..3 + TOKEN_COUNT `[w]` LP Token Mint
  //   ///     4. ..4 + TOKEN_COUNT `[w]` governance_fee_account
  //   ///     5. ..5 + TOKEN_COUNT `[s]` user transfer authority account
  //   ///     6. ..6 + TOKEN_COUNT `[w]` user token accounts
  //   ///     7. ..6 + (2 * TOKEN_COUNT) `[]` SPL token program account
  //   ///     8. ..7 + (2 * TOKEN_COUNT) `[w]` user LP token account to withdraw/burn from
  //   RemoveUniform {
  //       exact_burn_amount: AmountT,
  //       minimum_output_amounts: [AmountT; TOKEN_COUNT],
  //   },
  //   /// Withdraw at least `minimum_output_amount` of output token specified by `output_token_index` by
  //   /// burning `exact_burn_amount` of LP tokens
  //   /// "WithdrawOne"
  //   ///
  //   ///
  //   /// Accounts expected by this instruction:
  //   ///     0. `[w]` The pool state account
  //   ///     1. `[]` pool authority
  //   ///     2. ..2 + TOKEN_COUNT `[w]` pool's token accounts
  //   ///     3. ..3 + TOKEN_COUNT `[w]` LP Token Mint
  //   ///     4. ..4 + TOKEN_COUNT `[w]` governance_fee_account
  //   ///     5. ..5 + TOKEN_COUNT `[s]` user transfer authority account
  //   ///     6. ..6 + TOKEN_COUNT `[w]` user token accounts
  //   ///     7. ..6 + (2 * TOKEN_COUNT) `[]` SPL token program account
  //   ///     8. ..7 + (2 * TOKEN_COUNT) `[w]` user LP token account to withdraw/burn from
  //   RemoveExactBurn {
  //       exact_burn_amount: AmountT,
  //       output_token_index: u8,
  //       minimum_output_amount: AmountT,
  //   },
  //   /// Withdraw exactly the number of output tokens specified by `exact_output_amount`
  //   /// by burning at most `maximum_burn_amount` of LP tokens
  //   ///
  //   /// Accounts expected by this instruction:
  //   ///     0. `[w]` The pool state account
  //   ///     1. `[]` pool authority
  //   ///     2. ..2 + TOKEN_COUNT `[w]` pool's token accounts
  //   ///     3. ..3 + TOKEN_COUNT `[w]` LP Token Mint
  //   ///     4. ..4 + TOKEN_COUNT `[w]` governance_fee_account
  //   ///     5. ..5 + TOKEN_COUNT `[s]` user transfer authority account
  //   ///     6. ..6 + TOKEN_COUNT `[w]` user token accounts
  //   ///     7. ..6 + (2 * TOKEN_COUNT) `[]` SPL token program account
  //   ///     8. ..7 + (2 * TOKEN_COUNT) `[w]` user LP token account to withdraw/burn from
  //   RemoveExactOutput {
  //       maximum_burn_amount: AmountT,
  //       exact_output_amounts: [AmountT; TOKEN_COUNT],
  //   },
}

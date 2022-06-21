//SPDX-License-Identifier: Unlicence
pragma solidity ^0.8.15;

import "../node_modules/hardhat/console.sol";

import "../node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./interfaces/IFlagshipPool.sol";
import "./interfaces/IRouting.sol";
import "./interfaces/ISwimUSD.sol";

error Routing__OnChainSwapFailed();
error Routing__SwapAndTransferFailed();

abstract contract Routing is
  OwnableUpgradeable,
  UUPSUpgradeable,
  PausableUpgradeable,
  ReentrancyGuardUpgradeable
{
  ISwimUSD public immutable swimUSD;
  uint32 private wormholeNonce;

  struct Token {
    uint16 tokenId;
    address tokenContract;
    address chainPool;
    uint8 tokenIndexInPool;
  }

  mapping(uint16 => Token) tokenIdMapping;
  mapping(address => Token) tokenAddressMapping;

  /**
   * @dev Emitted on registerToken()
   * @param tokenId The ID of registered token
   * @param tokenContract The registered token contract address
   **/
  event TokenRegistered(uint16 indexed tokenId, address indexed tokenContract, address chainPool);

  /**
   * @dev Emitted on onChainSwap()
   * @param fromToken The token address from which user swaps
   * @param toToken The token address to which user swaps
   * @param toOwner TThe beneficiary of the supply, receiving the outputAmount
   * @param outputAmount The amount received after swap
   **/
  event OnChainSwap(
    address indexed fromToken,
    address indexed toToken,
    address toOwner,
    uint256 outputAmount
  );

  constructor(address _swimUSD) {
    wormholeNonce = 0;
    swimUSD = ISwimUSD(_swimUSD);
  }

  /**
   * @notice Swap two tokens using one chain
   * @param _fromToken the token the user wants to swap from
   * @param _toToken the token the user wants to swap to
   * @param _toOwner the address of token beneficiary
   * @param _inputAmount the amount of tokens the user wants to swap from
   * @param _minimumOutputAmount the min amount the user would like to receive, or revert
   * @return _outputAmount The amount of tokent that will be received
   */

  function onChainSwap(
    address _fromToken,
    uint256 _inputAmount,
    address _toOwner,
    address _toToken,
    uint256 _minimumOutputAmount
  ) public returns (uint256 _outputAmount) {
    require(
      tokenAddressMapping[_fromToken].tokenContract == _fromToken,
      "Source token not registered"
    );
    require(
      tokenAddressMapping[_toToken].tokenContract == _toToken,
      "Destination token not registered"
    );
    require(IERC20Upgradeable(_fromToken).transferFrom(msg.sender, address(this), _inputAmount));
    address poolAddress = tokenAddressMapping[_fromToken].chainPool;

    require(IERC20Upgradeable(_fromToken).approve(poolAddress, _inputAmount));

    uint256[] memory amounts = new uint256[](2);
    amounts[0] = uint256(_inputAmount);
    amounts[1] = uint256(0);

    uint256 receivedSwimUSDAmount = IFlagshipPool(poolAddress).swap(
      amounts,
      tokenAddressMapping[_fromToken].tokenIndexInPool,
      _inputAmount
    );

    require(swimUSD.approve(poolAddress, receivedSwimUSDAmount));

    uint256[] memory amounts2 = new uint256[](3);
    amounts2[0] = uint256(0);
    amounts2[1] = uint256(0);
    amounts2[2] = uint256(receivedSwimUSDAmount);

    uint256 receivedAmount = IFlagshipPool(poolAddress).swap(
      amounts2,
      tokenAddressMapping[_toToken].tokenIndexInPool,
      _minimumOutputAmount
    );

    require(IERC20Upgradeable(_toToken).transfer(_toOwner, receivedAmount));

    emit OnChainSwap(_fromToken, _toToken, _toOwner, receivedAmount);

    _outputAmount = receivedAmount;
  }

  /**
   * @notice Swap from EVM to Wormhole
   * @param _fromToken the token the user wants to swap from
   * @param _inputAmount the amount of tokens the user wants to swap from
   * @param _firstMinimumOutputAmount Minimum output amount after first swap
   * @param _wormholeRecipientChain Wormhole receiver chain
   * @param _toOwner the address of token beneficiary
   * @param _toTokenId Token ID the user wants to swap to
   * @param _secondMinimumOutputAmount The amount of tokens that will be received
   * @return _wormholeSequence Wormhole Sequence
   */

  function swapAndTransfer(
    address _fromToken,
    uint256 _inputAmount,
    uint256 _firstMinimumOutputAmount,
    uint16 _wormholeRecipientChain,
    bytes32 _toOwner,
    uint16 _toTokenId,
    uint256 _secondMinimumOutputAmount
  ) external payable returns (uint64 _wormholeSequence) {
    
  }

  function receiveAndOverride(
    bytes memory _encodedVm,
    address _toToken,
    uint256 _minimumOutputAmount
  ) external returns (uint256 _outputAmount) {}

  function receiveAndSwap(bytes memory _encodedVm) external returns (uint256 _outputAmount) {}

  /**
   * @notice Registers and stores token and pool details
   * @dev Only contract deployer can register tokens and pools
   * @param _tokenId Token ID on current chain
   * @param _tokenContract Token contract address
   * @param _chainPool Contract address of pool on current chain
   * @param _tokenIndexInPool Token index in given pool on current chain
   */
  function registerToken(
    uint16 _tokenId,
    address _tokenContract,
    address _chainPool,
    uint8 _tokenIndexInPool
  ) external onlyOwner {
    require(tokenIdMapping[_tokenId].tokenId != _tokenId, "Token is registered with that ID");
    require(
      tokenAddressMapping[_tokenContract].tokenContract != _tokenContract,
      "Token is registered with that address"
    );

    Token memory token = tokenIdMapping[_tokenId];
    token.tokenId = _tokenId;
    token.tokenContract = _tokenContract;
    token.chainPool = _chainPool;
    token.tokenIndexInPool = _tokenIndexInPool;

    tokenIdMapping[_tokenId] = token;
    tokenAddressMapping[_tokenContract] = token;

    emit TokenRegistered(_tokenId, _tokenContract, _chainPool);
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }
}

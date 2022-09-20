// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.15;

import "../interfaces/ITokenBridge.sol";
import "../interfaces/IWormhole.sol";

import "../Constants.sol";
import "../BytesParsing.sol";

import "./ERC20Token.sol";

contract MockTokenBridge is ITokenBridge {
  using BytesParsing for bytes;

  uint8 private constant PAYLOAD_ID_NO_PAYLOAD = 1;
  uint8 private constant PAYLOAD_ID_WITH_PAYLOAD = 3;
  uint8 private constant CONSISTENCY_LEVEL = 15;

  struct GenericTransfer {
    uint8 payloadId;
    uint256 amount;
    bytes32 tokenAddress;
    uint16 tokenChainId;
    bytes32 recipient;
    uint16 recipientChain;
    uint256 fee;
    bytes32 fromAddress;
    bytes payload;
  }

  IWormhole public wormhole;
  ERC20Token private swimUsd;
  mapping(bytes32 => bool) public completedTransfers;

  constructor(address _wormhole) {
    wormhole = IWormhole(_wormhole);
    swimUsd = new ERC20Token("SwimUSD", "swimUSD", SWIM_USD_DECIMALS);
  }

  function transferTokens(
    address token,
    uint256 amount,
    uint16 recipientChain,
    bytes32 recipient,
    uint256 arbiterFee,
    uint32 nonce
  ) public payable returns (uint64 sequence) {
    require(arbiterFee == 0, "non-zero arbiterFee not supported");
    bytes memory payload;
    return _transferTokens(
      token,
      amount,
      recipientChain,
      recipient,
      nonce,
      payload,
      PAYLOAD_ID_NO_PAYLOAD
    );
  }

  function transferTokensWithPayload(
    address token,
    uint256 amount,
    uint16 recipientChain,
    bytes32 recipient,
    uint32 nonce,
    bytes memory payload
  ) public payable returns (uint64 sequence) {
    return _transferTokens(
      token,
      amount,
      recipientChain,
      recipient,
      nonce,
      payload,
      PAYLOAD_ID_WITH_PAYLOAD
    );
  }

  function _transferTokens(
    address token,
    uint256 amount,
    uint16 recipientChain,
    bytes32 recipient,
    uint32 nonce,
    bytes memory payload,
    uint8 payloadId
  ) internal returns (uint64 sequence) {
    require(token == address(swimUsd), "only SwimUSD supported");
    swimUsd.transferFrom(msg.sender, address(this), amount);
    swimUsd.burn(amount);

    GenericTransfer memory transfer = GenericTransfer(
      payloadId,
      amount,
      SWIM_USD_SOLANA_ADDRESS,
      WORMHOLE_SOLANA_CHAIN_ID,
      recipient,
      recipientChain,
      0,
      bytes32(uint256(uint160(address(this)))),
      payload
    );
    bytes memory encoded = encodeTransfer(transfer);
    return wormhole.publishMessage{value: msg.value}(nonce, encoded, CONSISTENCY_LEVEL);
  }

  function completeTransfer(bytes memory encodedVm) external {
    _completeTransfer(encodedVm, PAYLOAD_ID_NO_PAYLOAD);
  }

  function completeTransferWithPayload(bytes memory encodedVm) external returns (bytes memory) {
    return _completeTransfer(encodedVm, PAYLOAD_ID_WITH_PAYLOAD);
  }

  function wrappedAsset(
    uint16 tokenChainId,
    bytes32 tokenAddress
  ) external view returns (address) {
    return (tokenChainId == WORMHOLE_SOLANA_CHAIN_ID && tokenAddress == SWIM_USD_SOLANA_ADDRESS)
     ? address(swimUsd)
     : address(0);
  }

  function _completeTransfer(
    bytes memory encodedVm,
    uint8 payloadId
  ) internal returns (bytes memory) {
    (IWormhole.VM memory vm,,) = wormhole.parseAndVerifyVM(encodedVm);
    GenericTransfer memory transfer = parseTransfer(vm.payload);
    require(transfer.payloadId == payloadId, "invalid transfer type");
    address recipient = toAddress(transfer.recipient);
    if (payloadId == PAYLOAD_ID_WITH_PAYLOAD)
      require(msg.sender == recipient, "sender != recipient");

    require(!completedTransfers[vm.hash], "already redeemed");
    completedTransfers[vm.hash] = true;
    require(
      transfer.tokenChainId == WORMHOLE_SOLANA_CHAIN_ID &&
        transfer.tokenAddress == SWIM_USD_SOLANA_ADDRESS,
      "unattested token (not swimUSD)"
    );

    swimUsd.mint(recipient, transfer.amount);

    return vm.payload;
  }

  function encodeTransfer(
    GenericTransfer memory transfer
  ) internal pure returns (bytes memory) {
    return transfer.payloadId == PAYLOAD_ID_NO_PAYLOAD
      ? abi.encodePacked(
        transfer.payloadId,
        transfer.amount,
        transfer.tokenAddress,
        transfer.tokenChainId,
        transfer.recipient,
        transfer.recipientChain,
        transfer.fee
      )
      : abi.encodePacked(
        transfer.payloadId,
        transfer.amount,
        transfer.tokenAddress,
        transfer.tokenChainId,
        transfer.recipient,
        transfer.recipientChain,
        transfer.fromAddress,
        transfer.payload
      );
  }

  function parseTransfer(
    bytes memory encoded
  ) internal pure returns (GenericTransfer memory transfer) {
    uint offset = 0;
    (transfer.payloadId, offset) = encoded.asUint8(offset);
    require(
      transfer.payloadId == PAYLOAD_ID_NO_PAYLOAD || transfer.payloadId == PAYLOAD_ID_WITH_PAYLOAD,
      "Invalid payloadId"
    );
    (transfer.amount, offset) = encoded.asUint256(offset);
    (transfer.tokenAddress, offset) = encoded.asBytes32(offset);
    (transfer.tokenChainId, offset) = encoded.asUint16(offset);
    (transfer.recipient, offset) = encoded.asBytes32(offset);
    (transfer.recipientChain, offset) = encoded.asUint16(offset);
    if (transfer.payloadId == 1) {
      (transfer.fee, offset) = encoded.asUint256(offset);
      require(encoded.length == offset, "invalid transfer size");
    }
    else {
      (transfer.fromAddress, offset) = encoded.asBytes32(offset);
      require(encoded.length >= offset, "invalid transfer size");
      (transfer.payload,) = encoded.asBytes(offset, encoded.length - offset);
    }
  }

  function toAddress(bytes32 addr) internal pure returns (address) {
      require(bytes12(addr) == 0, "Invalid address");
      return address(uint160(uint256(addr)));
  }
}

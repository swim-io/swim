//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "../Routing.sol";


contract RoutingV2 is Routing {

  function changeTokenBridge(address tokenBridgeAdr) public onlyOwner {
    tokenBridge = ITokenBridge(tokenBridgeAdr);
  }
}

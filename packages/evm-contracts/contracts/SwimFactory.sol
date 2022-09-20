//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./BlankLogic.sol";
import "./interfaces/ISwimFactory.sol";

interface IUUPSUpgradeable {
  function upgradeToAndCall(address newImplementation, bytes memory data) external payable;
}

//Our deploy code for proxy (all numbers in hex):
// PUSH20 blankLogicAddress (PUSH20 = 73)
// PUSH32 360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc (PUSH32 = 7F)
// SSTORE (= 55)
// PUSH2 proxyContractSize (= 2FA (762 in base 10)) (PUSH2 = 61)
// DUP1 (= 80)
// PUSH1 deployCodeSize (= 44 (68 in base 10)) (PUSH1 = 60)
// PUSH1 0
// CODECOPY (= 39)
// PUSH1 0
// RETURN (= F3)
// STOP (= 00)

//Deploy code length:
// 33 + 21 + 1 + 3 + 1 + 2 + 2 + 1 + 2 + 1 + 1 = 68 = 0x44
//Deploy opcode:
// 73XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX7F360894a13ba1a3210667
// c828492db98dca3e2076cc3735a920a3ca505d382bbc5561YYYY8060ZZ600039
// 6000F300
//
//Where:
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX = blankLogicAddress
// YYYY = proxyContractSize
// ZZ = deployCodeSize

//Hardhat-deploy ERC1967Proxy opcode stripped of aux data:
// 60806040523661001357610011610017565b005b6100115b6100276100226100
// 74565b6100b9565b565b606061004e8383604051806060016040528060278152
// 6020016102fb602791396100dd565b9392505050565b73ffffffffffffffffff
// ffffffffffffffffffffff163b151590565b90565b60006100b47f360894a13b
// a1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffff
// ffffffffffffffffffffffffffffffffff1690565b905090565b366000803760
// 0080366000845af43d6000803e8080156100d8573d6000f35b3d6000fd5b6060
// 73ffffffffffffffffffffffffffffffffffffffff84163b610188576040517f
// 08c379a000000000000000000000000000000000000000000000000000000000
// 815260206004820152602660248201527f416464726573733a2064656c656761
// 74652063616c6c20746f206e6f6e2d636f60448201527f6e7472616374000000
// 000000000000000000000000000000000000000000000060648201526084015b
// 60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffff
// ffff16856040516101b0919061028d565b600060405180830381855af4915050
// 3d80600081146101eb576040519150601f19603f3d011682016040523d82523d
// 6000602084013e6101f0565b606091505b509150915061020082828661020a56
// 5b9695505050505050565b6060831561021957508161004e565b825115610229
// 5782518084602001fd5b816040517f08c379a000000000000000000000000000
// 000000000000000000000000000000815260040161017f91906102a9565b6000
// 5b83811015610278578181015183820152602001610260565b83811115610287
// 576000848401525b50505050565b6000825161029f81846020870161025d565b
// 9190910192915050565b60208152600082518060208401526102c88160408501
// 6020870161025d565b601f017fffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffffe016919091016040019291505056
//
//Auxdata (solc fingerprint):
// 416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c
// 206661696c6564a26469706673582212201e3c9348ed6dd2f363e89451207bd8
// df182bc878dc80d47166301a510c8801e964736f6c634300080a0033
//
//Original Hardhat-deploy opcode = stripped opcode + fe + auxdata
// fe is the invalid opcode which (unnecessarily) separates the deployed code
// from the auxdata/fingerprint (unnecessarily, because the last opcode
// is 56 which is a jump, so we can never hit fe anyway)
//
//762 (stripped length) + 1 (invalid opcode) + 96 (fingerprint) = 855 (original code length)

contract SwimFactory is ISwimFactory {
  uint private constant PROXY_DEPLOYMENT_CODESIZE = 68;
  uint private constant PROXY_STRIPPED_DEPLOYEDCODESIZE = 762;
  uint private constant PROXY_TOTAL_CODESIZE =
    PROXY_DEPLOYMENT_CODESIZE + PROXY_STRIPPED_DEPLOYEDCODESIZE;
  uint private constant IMPLEMENTATION_SLOT =
    0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

  address public owner;
  uint private _reentrancyCount;
  //given the deployer address we could derive and hence hardcode the address where BlankLogic
  // will be deployed to as to further save on gas, but the hassle is probably not worth it
  address private immutable _blankLogicAddress;

  constructor(address owner_) {
    owner = owner_;
    _blankLogicAddress = address(new BlankLogic());
  }

  modifier onlyOwnerOrAlreadyDeploying() {
    if (msg.sender != owner && _reentrancyCount == 0)
      revert SenderNotAuthorized();
    ++_reentrancyCount;
    _;
    --_reentrancyCount;
  }

  function transferOwnership(address newOwner) external {
    if (msg.sender != owner)
      revert SenderNotAuthorized();
    owner = newOwner;
    emit TransferOwnership(msg.sender, newOwner);
  }

  function create(
    bytes calldata code,
    bytes32 salt,
    bytes calldata call
  ) external onlyOwnerOrAlreadyDeploying returns (address) {
    address ct = create2(code, salt);
    (bool success, bytes memory lowLevelData) = ct.call(call);
    if (!success)
      revert ContractCallFailed(lowLevelData);

    emit ContractCreated(ct, false);
    return ct;
  }

  function create(
    bytes calldata code,
    bytes32 salt
  ) external onlyOwnerOrAlreadyDeploying returns (address) {
    address ct = create2(code, salt);
    emit ContractCreated(ct, false);
    return ct;
  }

  function createProxy(
    address logic,
    bytes32 salt,
    bytes calldata call
  ) external onlyOwnerOrAlreadyDeploying returns (address) {
    bytes memory code = proxyDeploymentCode();
    address proxy = create2(code, salt);
    try IUUPSUpgradeable(proxy).upgradeToAndCall(logic, call) {}
    catch (bytes memory lowLevelData) {
      revert ProxyConstructorFailed(lowLevelData);
    }
    emit ContractCreated(proxy, true);
    return proxy;
  }

  function determineAddress(bytes memory code, bytes32 salt) public view returns (address) {
    return
      address(
        bytes20(
          keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(code))) << 96
        )
      );
  }

  function determineProxyAddress(bytes32 salt) external view returns (address) {
    return determineAddress(proxyDeploymentCode(), salt);
  }

  // -------------------------------- INTERNAL --------------------------------

  function create2(bytes memory code, bytes32 salt) internal returns (address) {
    bytes memory code_ = code;
    bytes32 salt_ = salt;
    address ct;
    bool failed;
    assembly ("memory-safe") {
      ct := create2(0, add(code_, 32), mload(code_), salt_)
      failed := iszero(extcodesize(ct))
    }
    if (failed) revert ContractAlreadyExists(ct);
    return ct;
  }

  function proxyDeploymentCode() internal view returns (bytes memory) {
    // doesn't work because stack too deep... => gotta do it ourselves
    // return bytes.concat(
    //   bytes1(0x73), //PUSH20
    //   bytes20(blankLogicAddress), //sstore val argument
    //   bytes1(0x7f), //PUSH32
    //   IMPLEMENTATION_SLOT, //sstore key argument
    //   bytes1(0x55), //SSTORE
    //   bytes1(0x61), //PUSH2
    //   bytes2(uint16(PROXY_STRIPPED_DEPLOYEDCODESIZE)), //return len argument
    //   bytes1(0x80), //DUP - codecopy len argument
    //   bytes1(0x60), //PUSH1
    //   bytes1(uint8(PROXY_DEPLOYMENT_CODESIZE)), //codecopy ost argument
    //   bytes1(0x60), //PUSH1
    //   bytes1(0),    //codecopy dstOst argument
    //   bytes1(0x39), //CODECOPY
    //   bytes1(0x60), //PUSH1
    //   bytes1(0),    //return ost argument
    //   bytes1(0xf3), //RETURN
    //   bytes1(0x00), //STOP
    //   bytes32(0x60806040523661001357610011610017565b005b6100115b6100276100226100),
    //   bytes32(0x74565b6100b9565b565b606061004e8383604051806060016040528060278152),
    //   bytes32(0x6020016102fb602791396100dd565b9392505050565b73ffffffffffffffffff),
    //   bytes32(0xffffffffffffffffffffff163b151590565b90565b60006100b47f360894a13b),
    //   bytes32(0xa1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffff),
    //   bytes32(0xffffffffffffffffffffffffffffffffff1690565b905090565b366000803760),
    //   bytes32(0x0080366000845af43d6000803e8080156100d8573d6000f35b3d6000fd5b6060),
    //   bytes32(0x73ffffffffffffffffffffffffffffffffffffffff84163b610188576040517f),
    //   bytes32(0x08c379a000000000000000000000000000000000000000000000000000000000),
    //   bytes32(0x815260206004820152602660248201527f416464726573733a2064656c656761),
    //   bytes32(0x74652063616c6c20746f206e6f6e2d636f60448201527f6e7472616374000000),
    //   bytes32(0x000000000000000000000000000000000000000000000060648201526084015b),
    //   bytes32(0x60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffff),
    //   bytes32(0xffff16856040516101b0919061028d565b600060405180830381855af4915050),
    //   bytes32(0x3d80600081146101eb576040519150601f19603f3d011682016040523d82523d),
    //   bytes32(0x6000602084013e6101f0565b606091505b509150915061020082828661020a56),
    //   bytes32(0x5b9695505050505050565b6060831561021957508161004e565b825115610229),
    //   bytes32(0x5782518084602001fd5b816040517f08c379a000000000000000000000000000),
    //   bytes32(0x000000000000000000000000000000815260040161017f91906102a9565b6000),
    //   bytes32(0x5b83811015610278578181015183820152602001610260565b83811115610287),
    //   bytes32(0x576000848401525b50505050565b6000825161029f81846020870161025d565b),
    //   bytes32(0x9190910192915050565b60208152600082518060208401526102c88160408501),
    //   bytes32(0x6020870161025d565b601f017fffffffffffffffffffffffffffffffffffffff),
    //   bytes26(0xffffffffffffffffffffffffe016919091016040019291505056)
    // );
    /* solhint-disable var-name-mixedcase */
    uint PROXY_DEPLOYMENT_CODESIZE_ = PROXY_DEPLOYMENT_CODESIZE;
    uint PROXY_STRIPPED_DEPLOYEDCODESIZE_ = PROXY_STRIPPED_DEPLOYEDCODESIZE;
    uint IMPLEMENTATION_SLOT_ = IMPLEMENTATION_SLOT;
    /* solhint-enable var-name-mixedcase */
    uint blankLogicAddress = uint(uint160(_blankLogicAddress));
    bytes memory code = new bytes(PROXY_TOTAL_CODESIZE);
    assembly ("memory-safe")
    {
      mstore(add(code, 32), add(add(shl(248, 0x73), shl(88, blankLogicAddress)), shl(80, 0x7f)))
      mstore(add(code, 54), IMPLEMENTATION_SLOT_)
      mstore(
        add(code, 86),
        add(
          add(
            add(
              add(shl(240, 0x5561), shl(224, PROXY_STRIPPED_DEPLOYEDCODESIZE_)),
              shl(208, 0x8060)
            ),
            shl(200, PROXY_DEPLOYMENT_CODESIZE_)
          ),
          shl(144, 0x6000396000f300)
        )
      )
      mstore(add(code, 100), 0x60806040523661001357610011610017565b005b6100115b6100276100226100)
      mstore(add(code, 132), 0x74565b6100b9565b565b606061004e8383604051806060016040528060278152)
      mstore(add(code, 164), 0x6020016102fb602791396100dd565b9392505050565b73ffffffffffffffffff)
      mstore(add(code, 196), 0xffffffffffffffffffffff163b151590565b90565b60006100b47f360894a13b)
      mstore(add(code, 228), 0xa1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffff)
      mstore(add(code, 260), 0xffffffffffffffffffffffffffffffffff1690565b905090565b366000803760)
      mstore(add(code, 292), 0x0080366000845af43d6000803e8080156100d8573d6000f35b3d6000fd5b6060)
      mstore(add(code, 324), 0x73ffffffffffffffffffffffffffffffffffffffff84163b610188576040517f)
      mstore(add(code, 356), 0x08c379a000000000000000000000000000000000000000000000000000000000)
      mstore(add(code, 388), 0x815260206004820152602660248201527f416464726573733a2064656c656761)
      mstore(add(code, 420), 0x74652063616c6c20746f206e6f6e2d636f60448201527f6e7472616374000000)
      mstore(add(code, 452), 0x000000000000000000000000000000000000000000000060648201526084015b)
      mstore(add(code, 484), 0x60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffff)
      mstore(add(code, 516), 0xffff16856040516101b0919061028d565b600060405180830381855af4915050)
      mstore(add(code, 548), 0x3d80600081146101eb576040519150601f19603f3d011682016040523d82523d)
      mstore(add(code, 580), 0x6000602084013e6101f0565b606091505b509150915061020082828661020a56)
      mstore(add(code, 612), 0x5b9695505050505050565b6060831561021957508161004e565b825115610229)
      mstore(add(code, 644), 0x5782518084602001fd5b816040517f08c379a000000000000000000000000000)
      mstore(add(code, 676), 0x000000000000000000000000000000815260040161017f91906102a9565b6000)
      mstore(add(code, 708), 0x5b83811015610278578181015183820152602001610260565b83811115610287)
      mstore(add(code, 740), 0x576000848401525b50505050565b6000825161029f81846020870161025d565b)
      mstore(add(code, 772), 0x9190910192915050565b60208152600082518060208401526102c88160408501)
      mstore(add(code, 804), 0x6020870161025d565b601f017fffffffffffffffffffffffffffffffffffffff)
      mstore(add(code, 836), shl(48, 0xffffffffffffffffffffffffe016919091016040019291505056))
    }
    return code;
  }
}

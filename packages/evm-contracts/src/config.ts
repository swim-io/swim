export const SWIM_FACTORY_ADDRESS = "0x77C1f7813D79c8e6E37DE1aA631B6F961fD45648";

export const TOKEN_NUMBERS = {
  USDC: 1,
  USDT: 2,
  BUSD: 3,
};

export const DEFAULTS = {
  salt: "0x" + "00".repeat(32),
  precision: 6,
  lpDecimals: 6,
  amp: 1_000, //3 decimals
  lpFee: 300, //fee as 100th of a bip (6 decimals, 1000000 = 100 % fee)
  governanceFee: 100,
}

export const SALTS = {
  routingLogic: DEFAULTS.salt,
  poolLogic: DEFAULTS.salt,
  lpToken: DEFAULTS.salt,
  routingProxy: DEFAULTS.salt,
}

const GOERLI = {
  name: "Ethereum Goerli Testnet",
  wormholeTokenBridge: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
  pools: [
    {
      salt: "0x" + "00".repeat(31) + "02",
      lpSalt: "0x" + "00".repeat(31) + "12",
      lpName: "Test Pool LP",
      lpSymbol: "LP",
      tokens: [
        //usdc and usdt both already have 6 decimals on Goerli
        { address: "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6", tokenNumber: TOKEN_NUMBERS.USDC },
        { address: "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B", tokenNumber: TOKEN_NUMBERS.USDT },
      ],
    },
  ]
};

const BNB_TESTNET = {
  name: "BNB Chain Testnet",
  wormholeTokenBridge: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
  pools: [
    {
      salt: "0x" + "00".repeat(31) + "01",
      lpSalt: "0x" + "00".repeat(31) + "11",
      lpName: "Test Pool LP",
      lpSymbol: "LP",
      tokens: [
        { address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC", tokenNumber: TOKEN_NUMBERS.BUSD },
        { address: "0x98529E942FD121d9C470c3d4431A008257E0E714", tokenNumber: TOKEN_NUMBERS.USDT },
      ],
    },
  ],
};

export const CHAINS = {
  5: GOERLI,
  97: BNB_TESTNET,
};

export const FACTORY_PRESIGNED = { //for hardhat local network
  from: "0xb895F763eBB3744A85B01Df988Bc4e4F9727439E",
  maxCost: "3750000000000000",
  signedTx: "0xf9188180846fc23ac0831e84808080b9182d608060405234801561001057600080fd5b5060405161180d38038061180d83398101604081905261002f916100a6565b600080546001600160a01b0319166001600160a01b03831617905560405161005690610099565b604051809103906000f080158015610072573d6000803e3d6000fd5b50600280546001600160a01b0319166001600160a01b0392909216919091179055506100d6565b610ae880610d2583390190565b6000602082840312156100b857600080fd5b81516001600160a01b03811681146100cf57600080fd5b9392505050565b610c40806100e56000396000f3fe608060405234801561001057600080fd5b50600436106100725760003560e01c80638da5cb5b116100505780638da5cb5b146100cc578063dda39c08146100df578063f2fde38b146100f257600080fd5b80630492e49314610077578063205f8342146100a65780633e36e51c146100b9575b600080fd5b61008a610085366004610991565b610107565b6040516001600160a01b03909116815260200160405180910390f35b61008a6100b4366004610a4d565b610193565b61008a6100c7366004610a4d565b610234565b60005461008a906001600160a01b031681565b61008a6100ed366004610aae565b6102b8565b610105610100366004610b05565b61044a565b005b600061018d6101146104de565b8051602091820120604080517fff00000000000000000000000000000000000000000000000000000000000000818501523060601b6bffffffffffffffffffffffff191660218201526035810187905260558082019390935281518082039093018352607501905280519101206001600160a01b031690565b92915050565b600080546001600160a01b03163314806101af57506000600154115b6101b857600080fd5b6001600081546101c790610b36565b9091555060006101d78484610926565b604051600181529091506001600160a01b038216907f8bc3e5adcf79834694ea9a3bc347edb046015ae83ad0c26c4008921aed0ee31d9060200160405180910390a2905060016000815461022a90610b51565b9091555092915050565b8151602080840191909120604080517fff00000000000000000000000000000000000000000000000000000000000000818501523060601b6bffffffffffffffffffffffff191660218201526035810185905260558082019390935281518082039093018352607501905280519101206000906001600160a01b03165b9392505050565b600080546001600160a01b03163314806102d457506000600154115b6102dd57600080fd5b6001600081546102ec90610b36565b9091555060006102fa6104de565b905060006103088286610926565b6040517f4f1ef2860000000000000000000000000000000000000000000000000000000081529091506001600160a01b03821690634f1ef286906103529089908890600401610bb5565b600060405180830381600087803b15801561036c57600080fd5b505af192505050801561037d575060015b6103ee573d8080156103ab576040519150601f19603f3d011682016040523d82523d6000602084013e6103b0565b606091505b50806040517f43adf0b80000000000000000000000000000000000000000000000000000000081526004016103e59190610bdf565b60405180910390fd5b604051600081526001600160a01b038216907f8bc3e5adcf79834694ea9a3bc347edb046015ae83ad0c26c4008921aed0ee31d9060200160405180910390a291505060016000815461043f90610b51565b909155509392505050565b6000546001600160a01b031633146104a45760405162461bcd60e51b815260206004820152600e60248201527f4e6f7420417574686f72697a656400000000000000000000000000000000000060448201526064016103e5565b600080547fffffffffffffffffffffffff0000000000000000000000000000000000000000166001600160a01b0392909216919091179055565b6002546060906044906102fa907f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc906001600160a01b031660006105228486610bf2565b67ffffffffffffffff81111561053a5761053a6109aa565b6040519080825280601f01601f191660200182016040528015610564576020820181803683370190505b5060589290921b7f7300000000000000000000000000000000000000007f0000000000000000000001602083015250603681019190915260c89290921b60e09190911b017f556100008060006000396000f3000000000000000000000000000000000000000160568201527f60806040523661001357610011610017565b005b6100115b610027610022610060648201527f74565b6100b9565b565b606061004e838360405180606001604052806027815260848201527f6020016102fb602791396100dd565b9392505050565b73ffffffffffffffffff60a48201527fffffffffffffffffffffff163b151590565b90565b60006100b47f360894a13b60c48201527fa1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffff60e48201526ee96fa9a46faf6fa9a4c99fff7fc89f196101048201527e80366000845af43d6000803e8080156100d8573d6000f35b3d6000fd5b60606101248201527f73ffffffffffffffffffffffffffffffffffffffff84163b610188576040517f61014482015262461bcd60e51b6101648201527f815260206004820152602660248201527f416464726573733a2064656c6567616101848201527f74652063616c6c20746f206e6f6e2d636f60448201527f6e74726163740000006101a48201526860648201526084015b6101c48201527f60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffff6101e48201527fffff16856040516101b0919061028d565b600060405180830381855af49150506102048201527f3d80600081146101eb576040519150601f19603f3d011682016040523d82523d6102248201527f6000602084013e6101f0565b606091505b509150915061020082828661020a566102448201527f5b9695505050505050565b6060831561021957508161004e565b8251156102296102648201527f5782518084602001fd5b816040517f08c379a00000000000000000000000000061028482015270815260040161017f91906102a9565b60006102a48201527f5b83811015610278578181015183820152602001610260565b838111156102876102c48201527f576000848401525b50505050565b6000825161029f81846020870161025d565b6102e48201527f9190910192915050565b60208152600082518060208401526102c881604085016103048201527f6020870161025d565b601f017fffffffffffffffffffffffffffffffffffffff6103248201527fffffffffffffffffffffffffe016919091016040019291505056000000000000610344820152919050565b6000808390506000839050600080828451602086016000f5915050803b158015610987576040517fc56443730000000000000000000000000000000000000000000000000000000081526001600160a01b03831660048201526024016103e5565b5095945050505050565b6000602082840312156109a357600080fd5b5035919050565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126109d157600080fd5b813567ffffffffffffffff808211156109ec576109ec6109aa565b604051601f8301601f19908116603f01168101908282118183101715610a1457610a146109aa565b81604052838152866020858801011115610a2d57600080fd5b836020870160208301376000602085830101528094505050505092915050565b60008060408385031215610a6057600080fd5b823567ffffffffffffffff811115610a7757600080fd5b610a83858286016109c0565b95602094909401359450505050565b80356001600160a01b0381168114610aa957600080fd5b919050565b600080600060608486031215610ac357600080fd5b610acc84610a92565b925060208401359150604084013567ffffffffffffffff811115610aef57600080fd5b610afb868287016109c0565b9150509250925092565b600060208284031215610b1757600080fd5b6102b182610a92565b634e487b7160e01b600052601160045260246000fd5b6000600019821415610b4a57610b4a610b20565b5060010190565b600081610b6057610b60610b20565b506000190190565b6000815180845260005b81811015610b8e57602081850181015186830182015201610b72565b81811115610ba0576000602083870101525b50601f01601f19169290920160200192915050565b6001600160a01b0383168152604060208201526000610bd76040830184610b68565b949350505050565b6020815260006102b16020830184610b68565b60008219821115610c0557610c05610b20565b50019056fea26469706673582212205543f00a5d5c3205d97ffc35edc9ade79837d7d7ffe2225bca0c2c1c3e2258d464736f6c6343000809003360a06040523060805234801561001457600080fd5b50608051610a9d61004b6000396000818160a00152818161012a015281816102180152818161029d015261037e0152610a9d6000f3fe6080604052600436106100345760003560e01c80633659cfe6146100395780634f1ef2861461005b57806352d1902d1461006e575b600080fd5b34801561004557600080fd5b506100596100543660046108a0565b610095565b005b6100596100693660046108ea565b61020d565b34801561007a57600080fd5b50610083610371565b60405190815260200160405180910390f35b306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614156101285760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201526b19195b1959d85d1958d85b1b60a21b60648201526084015b60405180910390fd5b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166101837f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546001600160a01b031690565b6001600160a01b0316146101ee5760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201526b6163746976652070726f787960a01b606482015260840161011f565b6040805160008082526020820190925261020a91839190610436565b50565b306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016141561029b5760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201526b19195b1959d85d1958d85b1b60a21b606482015260840161011f565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166102f67f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546001600160a01b031690565b6001600160a01b0316146103615760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201526b6163746976652070726f787960a01b606482015260840161011f565b61036d82826001610436565b5050565b6000306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016146104115760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c0000000000000000606482015260840161011f565b507f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc90565b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff161561046e57610469836105ea565b505050565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b815260040160206040518083038186803b1580156104a757600080fd5b505afa9250505080156104d7575060408051601f3d908101601f191682019092526104d4918101906109ac565b60015b6105495760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201527f6f6e206973206e6f742055555053000000000000000000000000000000000000606482015260840161011f565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc81146105de5760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f7860448201527f6961626c65555549440000000000000000000000000000000000000000000000606482015260840161011f565b506104698383836106c0565b6001600160a01b0381163b6106675760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201527f6f74206120636f6e747261637400000000000000000000000000000000000000606482015260840161011f565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80547fffffffffffffffffffffffff0000000000000000000000000000000000000000166001600160a01b0392909216919091179055565b6106c9836106eb565b6000825111806106d65750805b15610469576106e5838361072b565b50505050565b6106f4816105ea565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606107508383604051806060016040528060278152602001610a4160279139610757565b9392505050565b60606001600160a01b0384163b6107d65760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e74726163740000000000000000000000000000000000000000000000000000606482015260840161011f565b600080856001600160a01b0316856040516107f191906109f1565b600060405180830381855af49150503d806000811461082c576040519150601f19603f3d011682016040523d82523d6000602084013e610831565b606091505b509150915061084182828661084b565b9695505050505050565b6060831561085a575081610750565b82511561086a5782518084602001fd5b8160405162461bcd60e51b815260040161011f9190610a0d565b80356001600160a01b038116811461089b57600080fd5b919050565b6000602082840312156108b257600080fd5b61075082610884565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080604083850312156108fd57600080fd5b61090683610884565b9150602083013567ffffffffffffffff8082111561092357600080fd5b818501915085601f83011261093757600080fd5b813581811115610949576109496108bb565b604051601f8201601f19908116603f01168101908382118183101715610971576109716108bb565b8160405282815288602084870101111561098a57600080fd5b8260208601602083013760006020848301015280955050505050509250929050565b6000602082840312156109be57600080fd5b5051919050565b60005b838110156109e05781810151838201526020016109c8565b838111156106e55750506000910152565b60008251610a038184602087016109c5565b9190910192915050565b6020815260008251806020840152610a2c8160408501602087016109c5565b601f01601f1916919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220570b1cb83bff365199987f95f3adeb77cf4da4e61cf7ecbde2a5c2e314cfc5bd64736f6c63430008090033000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226682f4f5a0318b515bb0e5f533087ff2bf0a62bd5cc2a946f8db2170d948266fc0eaa47bb8a024b2a66ae9150ab4484b920fb1a190b02c5d181ebaab7e58d37d77ef3d03c6a0",
}
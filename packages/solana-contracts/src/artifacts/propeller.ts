export type Propeller = {
  "version": "0.1.0",
  "name": "propeller",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "propeller",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "propellerSender",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "sender"
              }
            ]
          }
        },
        {
          "name": "propellerRedeemer",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "propellerRedeemerEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "propellerFeeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_token_mint_0"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_token_mint_1"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenMint0",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolTokenMint1",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "InitializeParams"
          }
        }
      ]
    },
    {
      "name": "createTokenIdMap",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "arg",
                "type": "publicKey",
                "path": "pool"
              },
              {
                "kind": "arg",
                "type": "publicKey",
                "path": "pool"
              },
              {
                "kind": "arg",
                "type": "publicKey",
                "path": "pool.lp_mint_key"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "tokenIdMap",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "token_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "arg",
                "type": "u16",
                "path": "target_token_index"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targetTokenIndex",
          "type": "u16"
        },
        {
          "name": "pool",
          "type": "publicKey"
        },
        {
          "name": "poolTokenIndex",
          "type": "u8"
        },
        {
          "name": "poolTokenMint",
          "type": "publicKey"
        },
        {
          "name": "poolIx",
          "type": {
            "defined": "PoolInstruction"
          }
        }
      ]
    },
    {
      "name": "createTargetChainMap",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "targetChainMap",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "arg",
                "type": "u16",
                "path": "target_chain"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targetChain",
          "type": "u16"
        },
        {
          "name": "targetAddress",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "updateTargetChainMap",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "targetChainMap",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "TargetChainMap",
                "path": "target_chain_map.target_chain"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "routingContract",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "initializeFeeTracker",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "swim_usd_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimFees",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "FeeTracker",
                "path": "fee_tracker.fees_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "FeeTracker",
                "path": "fee_tracker.payer"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "feeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "crossChainAdd",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_1.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "governanceFee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        },
        {
          "name": "minimumMintAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "propellerAdd",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_1.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "governanceFee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        },
        {
          "name": "maxFee",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "crossChainSwapExactInput",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_1.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "governanceFee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "exactInputAmount",
          "type": "u64"
        },
        {
          "name": "minimumOutputAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "propellerSwapExactInput",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_1.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "governanceFee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "exactInputAmount",
          "type": "u64"
        },
        {
          "name": "maxFee",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "crossChainTransferNativeWithPayload",
      "accounts": [
        {
          "name": "propeller",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenBridgeConfig",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "config"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "userSwimUsdAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swimUsdMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "custody",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBridge",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "custodySigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "custody_signer"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_bridge"
            }
          }
        },
        {
          "name": "authoritySigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "authority_signer"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_bridge"
            }
          }
        },
        {
          "name": "wormholeConfig",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Bridge"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeMessage",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "wormholeEmitter",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "emitter"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeSequence",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Sequence"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "wormhole_emitter"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeFeeCollector",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "fee_collector"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "sender",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Transfers with payload also include the address of the account or contract",
            "that sent the transfer. Semantically this is identical to \"msg.sender\" on",
            "EVM chains, i.e. it is the address of the immediate caller of the token",
            "bridge transaction.",
            "Since on Solana, a transaction can have multiple different signers, getting",
            "this information is not so straightforward.",
            "The strategy we use to figure out the sender of the transaction is to",
            "require an additional signer ([`SenderAccount`]) for the transaction.",
            "If the transaction was sent by a user wallet directly, then this may just be",
            "the wallet's pubkey. If, however, the transaction was initiated by a",
            "program, then we require this to be a PDA derived from the sender program's",
            "id and the string \"sender\". In this case, the sender program must also",
            "attach its program id to the instruction data. If the PDA verification",
            "succeeds (thereby proving that [[`cpi_program_id`]] indeed signed the",
            "transaction), then the program's id is attached to the VAA as the sender,",
            "otherwise the transaction is rejected.",
            "",
            "Note that a program may opt to forego the PDA derivation and instead just",
            "pass on the original wallet as the wallet account (or any other signer, as",
            "long as they don't provide their program_id in the instruction data). The",
            "sender address is provided as a means for protocols to verify on the",
            "receiving end that the message was emitted by a contract they trust, so",
            "foregoing this check is not advised. If the receiving contract needs to know",
            "the sender wallet's address too, then that information can be included in",
            "the additional payload, along with any other data that the protocol needs to",
            "send across. The legitimacy of the attached data can be verified by checking",
            "that the sender contract is a trusted one.",
            "",
            "Also note that attaching the correct PDA as [[`SenderAccount`]] but missing the",
            "[[`cpi_program_id`]] field will result in a successful transaction, but in",
            "that case the PDA's address will directly be encoded into the payload",
            "instead of the sender program's id."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "sender"
              }
            ]
          }
        },
        {
          "name": "wormhole",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "targetChainMap",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "arg",
                "type": "u16",
                "path": "target_chain"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "targetChain",
          "type": "u16"
        },
        {
          "name": "owner",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "propellerTransferNativeWithPayload",
      "accounts": [
        {
          "name": "propeller",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenBridgeConfig",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "config"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "userSwimUsdAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swimUsdMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "custody",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBridge",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "custodySigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "custody_signer"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_bridge"
            }
          }
        },
        {
          "name": "authoritySigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "authority_signer"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_bridge"
            }
          }
        },
        {
          "name": "wormholeConfig",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Bridge"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeMessage",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "wormholeEmitter",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "emitter"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeSequence",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Sequence"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "wormhole_emitter"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeFeeCollector",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "fee_collector"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "sender",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Transfers with payload also include the address of the account or contract",
            "that sent the transfer. Semantically this is identical to \"msg.sender\" on",
            "EVM chains, i.e. it is the address of the immediate caller of the token",
            "bridge transaction.",
            "Since on Solana, a transaction can have multiple different signers, getting",
            "this information is not so straightforward.",
            "The strategy we use to figure out the sender of the transaction is to",
            "require an additional signer ([`SenderAccount`]) for the transaction.",
            "If the transaction was sent by a user wallet directly, then this may just be",
            "the wallet's pubkey. If, however, the transaction was initiated by a",
            "program, then we require this to be a PDA derived from the sender program's",
            "id and the string \"sender\". In this case, the sender program must also",
            "attach its program id to the instruction data. If the PDA verification",
            "succeeds (thereby proving that [[`cpi_program_id`]] indeed signed the",
            "transaction), then the program's id is attached to the VAA as the sender,",
            "otherwise the transaction is rejected.",
            "",
            "Note that a program may opt to forego the PDA derivation and instead just",
            "pass on the original wallet as the wallet account (or any other signer, as",
            "long as they don't provide their program_id in the instruction data). The",
            "sender address is provided as a means for protocols to verify on the",
            "receiving end that the message was emitted by a contract they trust, so",
            "foregoing this check is not advised. If the receiving contract needs to know",
            "the sender wallet's address too, then that information can be included in",
            "the additional payload, along with any other data that the protocol needs to",
            "send across. The legitimacy of the attached data can be verified by checking",
            "that the sender contract is a trusted one.",
            "",
            "Also note that attaching the correct PDA as [[`SenderAccount`]] but missing the",
            "[[`cpi_program_id`]] field will result in a successful transaction, but in",
            "that case the PDA's address will directly be encoded into the payload",
            "instead of the sender program's id."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "sender"
              }
            ]
          }
        },
        {
          "name": "wormhole",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "targetChainMap",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "arg",
                "type": "u16",
                "path": "target_chain"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "targetChain",
          "type": "u16"
        },
        {
          "name": "owner",
          "type": "bytes"
        },
        {
          "name": "gasKickstart",
          "type": "bool"
        },
        {
          "name": "maxFee",
          "type": "u64"
        },
        {
          "name": "targetTokenId",
          "type": "u16"
        },
        {
          "name": "memo",
          "type": {
            "option": {
              "array": [
                "u8",
                16
              ]
            }
          }
        }
      ]
    },
    {
      "name": "completeNativeWithPayload",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenBridgeConfig",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "config"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "message",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "contains the VAA",
            "{",
            "...MessageData:",
            "payload: PayloadTransferWithPayload = {",
            "pub amount: U256,",
            "}",
            "}"
          ]
        },
        {
          "name": "claim",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "seeds = [",
            "vaa.emitter_address, vaa.emitter_chain, vaa.sequence",
            "],",
            "seeds::program = token_bridge"
          ]
        },
        {
          "name": "endpoint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "owned by redeemer. \"redeemerEscrow\""
          ]
        },
        {
          "name": "redeemer",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)",
            "TODO: this is a little weird. i think we can safely assume that the `vaa.to` will be this programId",
            "and that the `redeemer` account will be the PDA derived from [\"redeemer\"], seeds::program = propeller::id()"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "feeRecipient",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "this is \"to_fees\"",
            "recipient of fees for executing complete transfer (e.g. relayer)"
          ]
        },
        {
          "name": "custody",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "custodySigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wormhole",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBridge",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "swimPayloadMessage",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "swim_payload"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "processSwimPayload",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "claim",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                },
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_address"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_chain"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_sequence"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "swimClaim",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "claim"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "swimPayloadMessage",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "swim_payload"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "swimPayloadMessagePayer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "redeemer",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "this used to be \"to_owner\".",
            "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "redeemerEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenIdMap",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "token_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "arg",
                "type": "u16",
                "path": "target_token_id"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_1.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "governanceFee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targetTokenId",
          "type": "u16"
        },
        {
          "name": "minOutputAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "propellerCompleteNativeWithPayload",
      "accounts": [
        {
          "name": "completeNativeWithPayload",
          "accounts": [
            {
              "name": "propeller",
              "isMut": false,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "Propeller",
                    "path": "propeller.swim_usd_mint"
                  }
                ]
              }
            },
            {
              "name": "payer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "tokenBridgeConfig",
              "isMut": true,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "config"
                  }
                ],
                "programId": {
                  "kind": "account",
                  "type": "publicKey",
                  "account": "Propeller",
                  "path": "propeller"
                }
              }
            },
            {
              "name": "message",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "contains the VAA",
                "{",
                "...MessageData:",
                "payload: PayloadTransferWithPayload = {",
                "pub amount: U256,",
                "}",
                "}"
              ]
            },
            {
              "name": "claim",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "seeds = [",
                "vaa.emitter_address, vaa.emitter_chain, vaa.sequence",
                "],",
                "seeds::program = token_bridge"
              ]
            },
            {
              "name": "endpoint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "to",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "owned by redeemer. \"redeemerEscrow\""
              ]
            },
            {
              "name": "redeemer",
              "isMut": false,
              "isSigner": false,
              "docs": [
                "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
                "will have to be signed when it invokes complete_transfer_with_payload",
                "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
                "(NOT the `to` account)",
                "TODO: this is a little weird. i think we can safely assume that the `vaa.to` will be this programId",
                "and that the `redeemer` account will be the PDA derived from [\"redeemer\"], seeds::program = propeller::id()"
              ],
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "redeemer"
                  }
                ]
              }
            },
            {
              "name": "feeRecipient",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "this is \"to_fees\"",
                "recipient of fees for executing complete transfer (e.g. relayer)"
              ]
            },
            {
              "name": "custody",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "swimUsdMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "custodySigner",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "rent",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "systemProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "wormhole",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenBridge",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "swimPayloadMessage",
              "isMut": true,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "swim_payload"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "path": "claim"
                  }
                ]
              }
            }
          ]
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": {
                  "defined": "Box<Account<'info,Mint>>"
                },
                "account": "CompleteNativeWithPayload",
                "path": "complete_native_with_payload.swim_usd_mint"
              },
              {
                "kind": "account",
                "type": {
                  "defined": "Signer<'info>"
                },
                "account": "CompleteNativeWithPayload",
                "path": "complete_native_with_payload.payer"
              }
            ]
          }
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_0_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_1_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "marginal_price_pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "marginalPricePoolToken0Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolToken1Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "memo",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "propellerCreateOwnerTokenAccounts",
      "docs": [
        "Valid target_token_id *"
      ],
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "redeemer",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "this used to be \"to_owner\".",
            "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "redeemerEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "claim",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                },
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_address"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_chain"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_sequence"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "swimPayloadMessage",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "swim_payload"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "tokenIdMap",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "token_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.target_token_id"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_token_0_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_token_1_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolToken0Mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolToken1Mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPoolToken0Account",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPoolToken1Account",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_0_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_1_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "marginal_price_pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "marginalPricePoolToken0Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolToken1Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "memo",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "propellerProcessSwimPayload",
      "docs": [
        "Note: passing in target_token_id here due to PDA seed derivation.",
        "for propeller_process_swim_payload, require_eq!(target_token_id, propeller_message.target_token_id);"
      ],
      "accounts": [
        {
          "name": "processSwimPayload",
          "accounts": [
            {
              "name": "propeller",
              "isMut": false,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "Propeller",
                    "path": "propeller.swim_usd_mint"
                  }
                ]
              }
            },
            {
              "name": "payer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "claim",
              "isMut": false,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "type": {
                      "array": [
                        "u8",
                        32
                      ]
                    },
                    "account": "SwimPayloadMessage",
                    "path": "swim_payload_message.vaa_emitter_address"
                  },
                  {
                    "kind": "account",
                    "type": "u16",
                    "account": "SwimPayloadMessage",
                    "path": "swim_payload_message.vaa_emitter_chain"
                  },
                  {
                    "kind": "account",
                    "type": "u64",
                    "account": "SwimPayloadMessage",
                    "path": "swim_payload_message.vaa_sequence"
                  }
                ],
                "programId": {
                  "kind": "account",
                  "type": "publicKey",
                  "account": "Propeller",
                  "path": "propeller"
                }
              }
            },
            {
              "name": "swimClaim",
              "isMut": true,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "claim"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "path": "claim"
                  }
                ]
              }
            },
            {
              "name": "swimPayloadMessage",
              "isMut": true,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "swim_payload"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "path": "claim"
                  }
                ]
              }
            },
            {
              "name": "swimPayloadMessagePayer",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "redeemer",
              "isMut": false,
              "isSigner": false,
              "docs": [
                "this used to be \"to_owner\".",
                "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
                "will have to be signed when it invokes complete_transfer_with_payload",
                "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
                "(NOT the `to` account)"
              ],
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "redeemer"
                  }
                ]
              }
            },
            {
              "name": "redeemerEscrow",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenIdMap",
              "isMut": false,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "token_id"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "Propeller",
                    "path": "propeller"
                  },
                  {
                    "kind": "arg",
                    "type": "u16",
                    "path": "target_token_id"
                  }
                ]
              }
            },
            {
              "name": "pool",
              "isMut": true,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "two_pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TokenAccount",
                    "path": "pool_token_account_0.mint"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TokenAccount",
                    "path": "pool_token_account_1.mint"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "Mint",
                    "path": "lp_mint"
                  }
                ],
                "programId": {
                  "kind": "account",
                  "type": "publicKey",
                  "path": "two_pool_program"
                }
              }
            },
            {
              "name": "poolTokenAccount0",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "poolTokenAccount1",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "lpMint",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "governanceFee",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTransferAuthority",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "userTokenAccount0",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTokenAccount1",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userLpTokenAccount",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "twoPoolProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "systemProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Assuming that USD:USDC 1:1"
          ]
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "this is \"to_fees\"",
            "recipient of fees for executing complete transfer (e.g. relayer)"
          ]
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "ProcessSwimPayload",
                "path": "process_swim_payload"
              },
              {
                "kind": "account",
                "type": {
                  "defined": "Signer<'info>"
                },
                "account": "ProcessSwimPayload",
                "path": "process_swim_payload.payer"
              }
            ]
          }
        },
        {
          "name": "marginalPricePool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_0_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_1_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "marginal_price_pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": {
                "defined": "Program<'info,two_pool::program::TwoPool>"
              },
              "account": "ProcessSwimPayload",
              "path": "process_swim_payload.two_pool_program"
            }
          }
        },
        {
          "name": "marginalPricePoolToken0Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolToken1Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "This is for transferring lamports for kickstart"
          ]
        },
        {
          "name": "memo",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targetTokenId",
          "type": "u16"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "propellerCreateOwnerSwimUsdAta",
      "docs": [
        "This ix is used if a propeller engine detects (off-chain) that the target_token_id is not valid",
        "\"Fallback\" behavior is to check/create just the token bridge mint (swimUSD) token account for the owner",
        "then call propeller_process_swim_payload_fallback to finish transferring the swimUSD to the owner."
      ],
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "redeemer",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "this used to be \"to_owner\".",
            "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "redeemerEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "claim",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                },
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_address"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_chain"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_sequence"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "swimPayloadMessage",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "swim_payload"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "tokenIdMap",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "deseraizlied as a `TokenIdMap`. if it does exist, then engine should have called",
            "propeller_create_owner_token_accounts instead"
          ]
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerSwimUsdAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Note: specifying TokenAccount type here since only one token account to initialize so no need to",
            "\"guess and check\" which token accounts need to be initialized"
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_0_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_1_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "marginal_price_pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "marginalPricePoolToken0Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolToken1Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "memo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "propellerProcessSwimPayloadFallback",
      "docs": [
        "This ix is used if a propeller engine detects (off-chain) that the payload.target_token_id is not valid",
        "this will transfer the swimUSD to the owner (will still kickstart if requested)"
      ],
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "claim",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                },
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_address"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_chain"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_sequence"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "swimClaim",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "claim"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "swimPayloadMessage",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "swim_payload"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "swimPayloadMessagePayer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "redeemer",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "this used to be \"to_owner\".",
            "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "redeemerEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenIdMap",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "deserialized as a `TokenIdMap`. if it does exist, then engine should have called",
            "propeller_create_owner_token_accounts instead"
          ]
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userSwimUsdAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "memo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "this is \"to_fees\"",
            "recipient of fees for executing complete transfer (e.g. relayer)"
          ]
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "marginalPricePool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_0_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_1_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "marginal_price_pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "marginalPricePoolToken0Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolToken1Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "This is for transferring lamports for kickstart"
          ]
        }
      ],
      "args": [],
      "returns": "u64"
    }
  ],
  "accounts": [
    {
      "name": "feeTracker",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "payer",
            "type": "publicKey"
          },
          {
            "name": "feesOwed",
            "type": "u64"
          },
          {
            "name": "feesMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "targetChainMap",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "targetChain",
            "type": "u16"
          },
          {
            "name": "targetAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "tokenIdMap",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "outputTokenIndex",
            "type": "u16"
          },
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "poolTokenIndex",
            "type": "u8"
          },
          {
            "name": "poolTokenMint",
            "type": "publicKey"
          },
          {
            "name": "poolIx",
            "type": {
              "defined": "PoolInstruction"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "propeller",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "nonce",
            "type": "u32"
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "wormhole",
            "type": "publicKey"
          },
          {
            "name": "tokenBridge",
            "type": "publicKey"
          },
          {
            "name": "swimUsdMint",
            "type": "publicKey"
          },
          {
            "name": "senderBump",
            "type": "u8"
          },
          {
            "name": "redeemerBump",
            "type": "u8"
          },
          {
            "name": "gasKickstartAmount",
            "type": "u64"
          },
          {
            "name": "secpVerifyInitFee",
            "type": "u64"
          },
          {
            "name": "secpVerifyFee",
            "type": "u64"
          },
          {
            "name": "postVaaFee",
            "type": "u64"
          },
          {
            "name": "initAtaFee",
            "type": "u64"
          },
          {
            "name": "completeWithPayloadFee",
            "type": "u64"
          },
          {
            "name": "processSwimPayloadFee",
            "type": "u64"
          },
          {
            "name": "marginalPricePool",
            "type": "publicKey"
          },
          {
            "name": "marginalPricePoolTokenMint",
            "type": "publicKey"
          },
          {
            "name": "marginalPricePoolTokenIndex",
            "type": "u8"
          },
          {
            "name": "feeVault",
            "type": "publicKey"
          },
          {
            "name": "aggregator",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "swimClaim",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "claimed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "swimPayloadMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "swimPayloadMessagePayer",
            "docs": [
              "payer of `CompleteWithPayload` that will get the lamports",
              "when `SwimPayloadMessage` is closed after `ProcessSwimPayload`"
            ],
            "type": "publicKey"
          },
          {
            "name": "claim",
            "type": "publicKey"
          },
          {
            "name": "vaaEmitterAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "vaaEmitterChain",
            "type": "u16"
          },
          {
            "name": "vaaSequence",
            "type": "u64"
          },
          {
            "name": "transferAmount",
            "type": "u64"
          },
          {
            "name": "swimPayloadVersion",
            "type": "u8"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "propellerEnabled",
            "type": "bool"
          },
          {
            "name": "gasKickstart",
            "type": "bool"
          },
          {
            "name": "maxFee",
            "type": "u64"
          },
          {
            "name": "targetTokenId",
            "type": "u16"
          },
          {
            "name": "memo",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitializeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gasKickstartAmount",
            "type": "u64"
          },
          {
            "name": "secpVerifyInitFee",
            "type": "u64"
          },
          {
            "name": "secpVerifyFee",
            "type": "u64"
          },
          {
            "name": "postVaaFee",
            "type": "u64"
          },
          {
            "name": "completeWithPayloadFee",
            "type": "u64"
          },
          {
            "name": "initAtaFee",
            "type": "u64"
          },
          {
            "name": "processSwimPayloadFee",
            "type": "u64"
          },
          {
            "name": "marginalPricePool",
            "type": "publicKey"
          },
          {
            "name": "marginalPricePoolTokenIndex",
            "type": "u8"
          },
          {
            "name": "marginalPricePoolTokenMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "CompleteNativeWithPayloadData",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "VerifySignaturesData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "signers",
            "docs": [
              "instruction indices of signers (-1 for missing)"
            ],
            "type": {
              "array": [
                "i8",
                19
              ]
            }
          }
        ]
      }
    },
    {
      "name": "TransferWithPayloadData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "type": "u32"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "targetAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "targetChain",
            "type": "u16"
          },
          {
            "name": "payload",
            "type": "bytes"
          },
          {
            "name": "cpiProgramId",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "PostMessageData",
      "docs": [
        "Data that goes into a [`wormhole::Instruction::PostMessage`]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "docs": [
              "Unique nonce for this message"
            ],
            "type": "u32"
          },
          {
            "name": "payload",
            "docs": [
              "Message payload"
            ],
            "type": "bytes"
          },
          {
            "name": "consistencyLevel",
            "docs": [
              "Commitment Level required for an attestation to be produced"
            ],
            "type": {
              "defined": "ConsistencyLevel"
            }
          }
        ]
      }
    },
    {
      "name": "BridgeData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "guardianSetIndex",
            "docs": [
              "The current guardian set index, used to decide which signature sets to accept."
            ],
            "type": "u32"
          },
          {
            "name": "lastLamports",
            "docs": [
              "Lamports in the collection account"
            ],
            "type": "u64"
          },
          {
            "name": "config",
            "docs": [
              "Bridge configuration, which is set once upon initialization."
            ],
            "type": {
              "defined": "BridgeConfig"
            }
          }
        ]
      }
    },
    {
      "name": "BridgeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "guardianSetExpirationTime",
            "docs": [
              "Period for how long a guardian set is valid after it has been replaced by a new one.  This",
              "guarantees that VAAs issued by that set can still be submitted for a certain period.  In",
              "this period we still trust the old guardian set."
            ],
            "type": "u32"
          },
          {
            "name": "fee",
            "docs": [
              "Amount of lamports that needs to be paid to the protocol to post a message"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "MessageData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaaVersion",
            "docs": [
              "Header of the posted VAA"
            ],
            "type": "u8"
          },
          {
            "name": "consistencyLevel",
            "docs": [
              "Level of consistency requested by the emitter"
            ],
            "type": "u8"
          },
          {
            "name": "vaaTime",
            "docs": [
              "Time the vaa was submitted"
            ],
            "type": "u32"
          },
          {
            "name": "vaaSignatureAccount",
            "docs": [
              "Account where signatures are stored"
            ],
            "type": "publicKey"
          },
          {
            "name": "submissionTime",
            "docs": [
              "Time the posted message was created"
            ],
            "type": "u32"
          },
          {
            "name": "nonce",
            "docs": [
              "Unique nonce for this message"
            ],
            "type": "u32"
          },
          {
            "name": "sequence",
            "docs": [
              "Sequence number of this message"
            ],
            "type": "u64"
          },
          {
            "name": "emitterChain",
            "docs": [
              "Emitter of the message"
            ],
            "type": "u16"
          },
          {
            "name": "emitterAddress",
            "docs": [
              "Emitter of the message"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "payload",
            "docs": [
              "Message payload aka `PayloadTransferWithPayload`"
            ],
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "ClaimData",
      "docs": [
        "Wormhole Claim Account data"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "claimed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "PostVAAData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "guardianSetIndex",
            "type": "u32"
          },
          {
            "name": "timestamp",
            "type": "u32"
          },
          {
            "name": "nonce",
            "type": "u32"
          },
          {
            "name": "emitterChain",
            "type": "u16"
          },
          {
            "name": "emitterAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "sequence",
            "type": "u64"
          },
          {
            "name": "consistencyLevel",
            "type": "u8"
          },
          {
            "name": "payload",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "PoolInstruction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Transfer"
          },
          {
            "name": "RemoveExactBurn"
          },
          {
            "name": "SwapExactInput"
          }
        ]
      }
    },
    {
      "name": "SwimPayloadVersion",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "V0"
          },
          {
            "name": "V1"
          }
        ]
      }
    },
    {
      "name": "ConsistencyLevel",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Confirmed"
          },
          {
            "name": "Finalized"
          }
        ]
      }
    },
    {
      "name": "Instruction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Initialize"
          },
          {
            "name": "PostMessage"
          },
          {
            "name": "PostVAA"
          },
          {
            "name": "SetFees"
          },
          {
            "name": "TransferFees"
          },
          {
            "name": "UpgradeContract"
          },
          {
            "name": "UpgradeGuardianSet"
          },
          {
            "name": "VerifySignatures"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InsufficientFunds",
      "msg": "InsufficientFunds"
    },
    {
      "code": 6001,
      "name": "InvalidAccount",
      "msg": "InvalidAccount"
    },
    {
      "code": 6002,
      "name": "InvalidRemainingAccounts",
      "msg": "InvalidRemainingAccounts"
    },
    {
      "code": 6003,
      "name": "InvalidTokenBridgeAddress",
      "msg": "InvalidTokenBridgeAddress"
    },
    {
      "code": 6004,
      "name": "InvalidTokenDecimals",
      "msg": "InvalidTokenDecimals"
    },
    {
      "code": 6005,
      "name": "InvalidTokenIndex",
      "msg": "InvalidTokenIndex"
    },
    {
      "code": 6006,
      "name": "InvalidVaaAction",
      "msg": "InvalidVaaAction"
    },
    {
      "code": 6007,
      "name": "InvalidWormholeAddress",
      "msg": "InvalidWormholeAddress"
    },
    {
      "code": 6008,
      "name": "InvalidVaaPayload",
      "msg": "InvalidVaaPayload"
    },
    {
      "code": 6009,
      "name": "NothingToClaim",
      "msg": "NothingToClaim"
    },
    {
      "code": 6010,
      "name": "TransferNotAllowed",
      "msg": "TransferNotAllowed"
    },
    {
      "code": 6011,
      "name": "InvalidCpiReturnProgramId",
      "msg": "Incorrect ProgramId for CPI return value"
    },
    {
      "code": 6012,
      "name": "InvalidCpiReturnValue",
      "msg": "Invalid CPI Return value"
    },
    {
      "code": 6013,
      "name": "InvalidMint",
      "msg": "Invalid Mint"
    },
    {
      "code": 6014,
      "name": "InvalidAddAndWormholeTransferMint",
      "msg": "Invalid Mint for AddAndWormholeTransfer"
    },
    {
      "code": 6015,
      "name": "InvalidSwapExactInputOutputTokenIndex",
      "msg": "Invalid output token index for SwapExactInput params"
    },
    {
      "code": 6016,
      "name": "InvalidSwapExactInputInputAmount",
      "msg": "Invalid input amount for SwapExactInput params"
    },
    {
      "code": 6017,
      "name": "InvalidSwimUsdMint",
      "msg": "Invalid SwimUSD Mint"
    },
    {
      "code": 6018,
      "name": "InvalidPayloadTypeInVaa",
      "msg": "Invalid Payload Type in VAA"
    },
    {
      "code": 6019,
      "name": "SerializeError",
      "msg": "Serializing error"
    },
    {
      "code": 6020,
      "name": "DeserializeError",
      "msg": "Deserializing error"
    },
    {
      "code": 6021,
      "name": "UserRedeemerSignatureNotDetected",
      "msg": "User redeemer needs to be signer"
    },
    {
      "code": 6022,
      "name": "InvalidSwitchboardAccount",
      "msg": "Not a valid Switchboard account"
    },
    {
      "code": 6023,
      "name": "StaleFeed",
      "msg": "Switchboard feed has not been updated in 5 minutes"
    },
    {
      "code": 6024,
      "name": "ConfidenceIntervalExceeded",
      "msg": "Switchboard feed exceeded provided confidence interval"
    },
    {
      "code": 6025,
      "name": "InsufficientAmount",
      "msg": "Insufficient Amount being transferred"
    },
    {
      "code": 6026,
      "name": "InvalidClaimData",
      "msg": "Invalid claim data"
    },
    {
      "code": 6027,
      "name": "ClaimNotClaimed",
      "msg": "Claim Account not claimed"
    },
    {
      "code": 6028,
      "name": "InvalidPropellerAdmin",
      "msg": "Invalid Propeller Admin"
    },
    {
      "code": 6029,
      "name": "InvalidTokenIdMapPool",
      "msg": "Invalid Pool for Token Id Map"
    },
    {
      "code": 6030,
      "name": "InvalidOutputTokenIndex",
      "msg": "Invalid Output Token Index"
    },
    {
      "code": 6031,
      "name": "InvalidTokenIdMapPoolTokenIndex",
      "msg": "Invalid Pool Token Index for Token Id Map"
    },
    {
      "code": 6032,
      "name": "InvalidTokenIdMapPoolTokenMint",
      "msg": "Invalid Pool Token Mint for Token Id Map"
    },
    {
      "code": 6033,
      "name": "InvalidTokenIdMapPoolIx",
      "msg": "Invalid Pool Ix for Token Id Map"
    },
    {
      "code": 6034,
      "name": "InvalidSwimPayloadGasKickstart",
      "msg": "Invalid Gas Kickstart parameter in Swim Payload"
    },
    {
      "code": 6035,
      "name": "InvalidMarginalPricePoolAccounts",
      "msg": "Invalid Marginal Price Pool Accounts"
    },
    {
      "code": 6036,
      "name": "NotPropellerEnabled",
      "msg": "Propeller Not Enabled in payload"
    },
    {
      "code": 6037,
      "name": "InvalidRoutingContractAddress",
      "msg": "Invalid Routing Contract Address"
    },
    {
      "code": 6038,
      "name": "IntegerOverflow",
      "msg": "Integer Overflow"
    },
    {
      "code": 6039,
      "name": "ConversionError",
      "msg": "Conversion Error"
    },
    {
      "code": 6040,
      "name": "UnableToRetrieveSwimUsdMintDecimals",
      "msg": "Unable to retrieve SwimUSD mint decimals from marginal price pool information"
    },
    {
      "code": 6041,
      "name": "InvalidMetapoolTokenMint",
      "msg": "Invalid Metapool Token Mint. token_mint[0] should == swim_usd_mint"
    },
    {
      "code": 6042,
      "name": "UnableToDeserializeTokenAccount",
      "msg": "Unable to deserialize account info as token account"
    },
    {
      "code": 6043,
      "name": "InvalidTokenAccountDataLen",
      "msg": "Invalid token account data length. != 0 && != TokenAccount::LEN"
    },
    {
      "code": 6044,
      "name": "PayerInsufficientFundsForGasKickstart",
      "msg": "Payer has insufficient funds for gas kickstart"
    },
    {
      "code": 6045,
      "name": "IncorrectOwnerForCreateTokenAccount",
      "msg": "Owner of token account != swimPayload.owner"
    },
    {
      "code": 6046,
      "name": "TokenIdMapExists",
      "msg": "TokenIdMap exists. Please use the correct instruction"
    },
    {
      "code": 6047,
      "name": "InvalidTokenIdMapAccountAddress",
      "msg": "Invalid address for TokenIdMap account"
    },
    {
      "code": 6048,
      "name": "InvalidSwimPayloadVersion",
      "msg": "Invalid Swim Payload version"
    },
    {
      "code": 6049,
      "name": "InvalidAggregator",
      "msg": "Invalid Aggregator"
    }
  ]
};

export const IDL: Propeller = {
  "version": "0.1.0",
  "name": "propeller",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "propeller",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "propellerSender",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "sender"
              }
            ]
          }
        },
        {
          "name": "propellerRedeemer",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "propellerRedeemerEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "propellerFeeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_token_mint_0"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_token_mint_1"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenMint0",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolTokenMint1",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "InitializeParams"
          }
        }
      ]
    },
    {
      "name": "createTokenIdMap",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "arg",
                "type": "publicKey",
                "path": "pool"
              },
              {
                "kind": "arg",
                "type": "publicKey",
                "path": "pool"
              },
              {
                "kind": "arg",
                "type": "publicKey",
                "path": "pool.lp_mint_key"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "tokenIdMap",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "token_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "arg",
                "type": "u16",
                "path": "target_token_index"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targetTokenIndex",
          "type": "u16"
        },
        {
          "name": "pool",
          "type": "publicKey"
        },
        {
          "name": "poolTokenIndex",
          "type": "u8"
        },
        {
          "name": "poolTokenMint",
          "type": "publicKey"
        },
        {
          "name": "poolIx",
          "type": {
            "defined": "PoolInstruction"
          }
        }
      ]
    },
    {
      "name": "createTargetChainMap",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "targetChainMap",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "arg",
                "type": "u16",
                "path": "target_chain"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targetChain",
          "type": "u16"
        },
        {
          "name": "targetAddress",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "updateTargetChainMap",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "targetChainMap",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "TargetChainMap",
                "path": "target_chain_map.target_chain"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "routingContract",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "initializeFeeTracker",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "swim_usd_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimFees",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "FeeTracker",
                "path": "fee_tracker.fees_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "FeeTracker",
                "path": "fee_tracker.payer"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "feeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "crossChainAdd",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_1.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "governanceFee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        },
        {
          "name": "minimumMintAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "propellerAdd",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_1.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "governanceFee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        },
        {
          "name": "maxFee",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "crossChainSwapExactInput",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_1.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "governanceFee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "exactInputAmount",
          "type": "u64"
        },
        {
          "name": "minimumOutputAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "propellerSwapExactInput",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_1.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "governanceFee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "exactInputAmount",
          "type": "u64"
        },
        {
          "name": "maxFee",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "crossChainTransferNativeWithPayload",
      "accounts": [
        {
          "name": "propeller",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenBridgeConfig",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "config"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "userSwimUsdAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swimUsdMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "custody",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBridge",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "custodySigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "custody_signer"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_bridge"
            }
          }
        },
        {
          "name": "authoritySigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "authority_signer"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_bridge"
            }
          }
        },
        {
          "name": "wormholeConfig",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Bridge"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeMessage",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "wormholeEmitter",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "emitter"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeSequence",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Sequence"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "wormhole_emitter"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeFeeCollector",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "fee_collector"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "sender",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Transfers with payload also include the address of the account or contract",
            "that sent the transfer. Semantically this is identical to \"msg.sender\" on",
            "EVM chains, i.e. it is the address of the immediate caller of the token",
            "bridge transaction.",
            "Since on Solana, a transaction can have multiple different signers, getting",
            "this information is not so straightforward.",
            "The strategy we use to figure out the sender of the transaction is to",
            "require an additional signer ([`SenderAccount`]) for the transaction.",
            "If the transaction was sent by a user wallet directly, then this may just be",
            "the wallet's pubkey. If, however, the transaction was initiated by a",
            "program, then we require this to be a PDA derived from the sender program's",
            "id and the string \"sender\". In this case, the sender program must also",
            "attach its program id to the instruction data. If the PDA verification",
            "succeeds (thereby proving that [[`cpi_program_id`]] indeed signed the",
            "transaction), then the program's id is attached to the VAA as the sender,",
            "otherwise the transaction is rejected.",
            "",
            "Note that a program may opt to forego the PDA derivation and instead just",
            "pass on the original wallet as the wallet account (or any other signer, as",
            "long as they don't provide their program_id in the instruction data). The",
            "sender address is provided as a means for protocols to verify on the",
            "receiving end that the message was emitted by a contract they trust, so",
            "foregoing this check is not advised. If the receiving contract needs to know",
            "the sender wallet's address too, then that information can be included in",
            "the additional payload, along with any other data that the protocol needs to",
            "send across. The legitimacy of the attached data can be verified by checking",
            "that the sender contract is a trusted one.",
            "",
            "Also note that attaching the correct PDA as [[`SenderAccount`]] but missing the",
            "[[`cpi_program_id`]] field will result in a successful transaction, but in",
            "that case the PDA's address will directly be encoded into the payload",
            "instead of the sender program's id."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "sender"
              }
            ]
          }
        },
        {
          "name": "wormhole",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "targetChainMap",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "arg",
                "type": "u16",
                "path": "target_chain"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "targetChain",
          "type": "u16"
        },
        {
          "name": "owner",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "propellerTransferNativeWithPayload",
      "accounts": [
        {
          "name": "propeller",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenBridgeConfig",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "config"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "userSwimUsdAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swimUsdMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "custody",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBridge",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "custodySigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "custody_signer"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_bridge"
            }
          }
        },
        {
          "name": "authoritySigner",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "authority_signer"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_bridge"
            }
          }
        },
        {
          "name": "wormholeConfig",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Bridge"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeMessage",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "wormholeEmitter",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "emitter"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeSequence",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Sequence"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "wormhole_emitter"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "wormholeFeeCollector",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "fee_collector"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "sender",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Transfers with payload also include the address of the account or contract",
            "that sent the transfer. Semantically this is identical to \"msg.sender\" on",
            "EVM chains, i.e. it is the address of the immediate caller of the token",
            "bridge transaction.",
            "Since on Solana, a transaction can have multiple different signers, getting",
            "this information is not so straightforward.",
            "The strategy we use to figure out the sender of the transaction is to",
            "require an additional signer ([`SenderAccount`]) for the transaction.",
            "If the transaction was sent by a user wallet directly, then this may just be",
            "the wallet's pubkey. If, however, the transaction was initiated by a",
            "program, then we require this to be a PDA derived from the sender program's",
            "id and the string \"sender\". In this case, the sender program must also",
            "attach its program id to the instruction data. If the PDA verification",
            "succeeds (thereby proving that [[`cpi_program_id`]] indeed signed the",
            "transaction), then the program's id is attached to the VAA as the sender,",
            "otherwise the transaction is rejected.",
            "",
            "Note that a program may opt to forego the PDA derivation and instead just",
            "pass on the original wallet as the wallet account (or any other signer, as",
            "long as they don't provide their program_id in the instruction data). The",
            "sender address is provided as a means for protocols to verify on the",
            "receiving end that the message was emitted by a contract they trust, so",
            "foregoing this check is not advised. If the receiving contract needs to know",
            "the sender wallet's address too, then that information can be included in",
            "the additional payload, along with any other data that the protocol needs to",
            "send across. The legitimacy of the attached data can be verified by checking",
            "that the sender contract is a trusted one.",
            "",
            "Also note that attaching the correct PDA as [[`SenderAccount`]] but missing the",
            "[[`cpi_program_id`]] field will result in a successful transaction, but in",
            "that case the PDA's address will directly be encoded into the payload",
            "instead of the sender program's id."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "sender"
              }
            ]
          }
        },
        {
          "name": "wormhole",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "targetChainMap",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "arg",
                "type": "u16",
                "path": "target_chain"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "targetChain",
          "type": "u16"
        },
        {
          "name": "owner",
          "type": "bytes"
        },
        {
          "name": "gasKickstart",
          "type": "bool"
        },
        {
          "name": "maxFee",
          "type": "u64"
        },
        {
          "name": "targetTokenId",
          "type": "u16"
        },
        {
          "name": "memo",
          "type": {
            "option": {
              "array": [
                "u8",
                16
              ]
            }
          }
        }
      ]
    },
    {
      "name": "completeNativeWithPayload",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenBridgeConfig",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "config"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "message",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "contains the VAA",
            "{",
            "...MessageData:",
            "payload: PayloadTransferWithPayload = {",
            "pub amount: U256,",
            "}",
            "}"
          ]
        },
        {
          "name": "claim",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "seeds = [",
            "vaa.emitter_address, vaa.emitter_chain, vaa.sequence",
            "],",
            "seeds::program = token_bridge"
          ]
        },
        {
          "name": "endpoint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "owned by redeemer. \"redeemerEscrow\""
          ]
        },
        {
          "name": "redeemer",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)",
            "TODO: this is a little weird. i think we can safely assume that the `vaa.to` will be this programId",
            "and that the `redeemer` account will be the PDA derived from [\"redeemer\"], seeds::program = propeller::id()"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "feeRecipient",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "this is \"to_fees\"",
            "recipient of fees for executing complete transfer (e.g. relayer)"
          ]
        },
        {
          "name": "custody",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "custodySigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wormhole",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBridge",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "swimPayloadMessage",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "swim_payload"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "processSwimPayload",
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "claim",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                },
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_address"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_chain"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_sequence"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "swimClaim",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "claim"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "swimPayloadMessage",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "swim_payload"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "swimPayloadMessagePayer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "redeemer",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "this used to be \"to_owner\".",
            "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "redeemerEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenIdMap",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "token_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "arg",
                "type": "u16",
                "path": "target_token_id"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_0.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "pool_token_account_1.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "governanceFee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTokenAccount0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targetTokenId",
          "type": "u16"
        },
        {
          "name": "minOutputAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "propellerCompleteNativeWithPayload",
      "accounts": [
        {
          "name": "completeNativeWithPayload",
          "accounts": [
            {
              "name": "propeller",
              "isMut": false,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "Propeller",
                    "path": "propeller.swim_usd_mint"
                  }
                ]
              }
            },
            {
              "name": "payer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "tokenBridgeConfig",
              "isMut": true,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "config"
                  }
                ],
                "programId": {
                  "kind": "account",
                  "type": "publicKey",
                  "account": "Propeller",
                  "path": "propeller"
                }
              }
            },
            {
              "name": "message",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "contains the VAA",
                "{",
                "...MessageData:",
                "payload: PayloadTransferWithPayload = {",
                "pub amount: U256,",
                "}",
                "}"
              ]
            },
            {
              "name": "claim",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "seeds = [",
                "vaa.emitter_address, vaa.emitter_chain, vaa.sequence",
                "],",
                "seeds::program = token_bridge"
              ]
            },
            {
              "name": "endpoint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "to",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "owned by redeemer. \"redeemerEscrow\""
              ]
            },
            {
              "name": "redeemer",
              "isMut": false,
              "isSigner": false,
              "docs": [
                "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
                "will have to be signed when it invokes complete_transfer_with_payload",
                "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
                "(NOT the `to` account)",
                "TODO: this is a little weird. i think we can safely assume that the `vaa.to` will be this programId",
                "and that the `redeemer` account will be the PDA derived from [\"redeemer\"], seeds::program = propeller::id()"
              ],
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "redeemer"
                  }
                ]
              }
            },
            {
              "name": "feeRecipient",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "this is \"to_fees\"",
                "recipient of fees for executing complete transfer (e.g. relayer)"
              ]
            },
            {
              "name": "custody",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "swimUsdMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "custodySigner",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "rent",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "systemProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "wormhole",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenBridge",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "swimPayloadMessage",
              "isMut": true,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "swim_payload"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "path": "claim"
                  }
                ]
              }
            }
          ]
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": {
                  "defined": "Box<Account<'info,Mint>>"
                },
                "account": "CompleteNativeWithPayload",
                "path": "complete_native_with_payload.swim_usd_mint"
              },
              {
                "kind": "account",
                "type": {
                  "defined": "Signer<'info>"
                },
                "account": "CompleteNativeWithPayload",
                "path": "complete_native_with_payload.payer"
              }
            ]
          }
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_0_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_1_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "marginal_price_pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "marginalPricePoolToken0Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolToken1Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "memo",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "propellerCreateOwnerTokenAccounts",
      "docs": [
        "Valid target_token_id *"
      ],
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "redeemer",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "this used to be \"to_owner\".",
            "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "redeemerEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "claim",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                },
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_address"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_chain"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_sequence"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "swimPayloadMessage",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "swim_payload"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "tokenIdMap",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "token_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.target_token_id"
              }
            ]
          }
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_token_0_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_token_1_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "poolToken0Mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolToken1Mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPoolToken0Account",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPoolToken1Account",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_0_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_1_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "marginal_price_pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "marginalPricePoolToken0Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolToken1Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "memo",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "propellerProcessSwimPayload",
      "docs": [
        "Note: passing in target_token_id here due to PDA seed derivation.",
        "for propeller_process_swim_payload, require_eq!(target_token_id, propeller_message.target_token_id);"
      ],
      "accounts": [
        {
          "name": "processSwimPayload",
          "accounts": [
            {
              "name": "propeller",
              "isMut": false,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "Propeller",
                    "path": "propeller.swim_usd_mint"
                  }
                ]
              }
            },
            {
              "name": "payer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "claim",
              "isMut": false,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "type": {
                      "array": [
                        "u8",
                        32
                      ]
                    },
                    "account": "SwimPayloadMessage",
                    "path": "swim_payload_message.vaa_emitter_address"
                  },
                  {
                    "kind": "account",
                    "type": "u16",
                    "account": "SwimPayloadMessage",
                    "path": "swim_payload_message.vaa_emitter_chain"
                  },
                  {
                    "kind": "account",
                    "type": "u64",
                    "account": "SwimPayloadMessage",
                    "path": "swim_payload_message.vaa_sequence"
                  }
                ],
                "programId": {
                  "kind": "account",
                  "type": "publicKey",
                  "account": "Propeller",
                  "path": "propeller"
                }
              }
            },
            {
              "name": "swimClaim",
              "isMut": true,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "claim"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "path": "claim"
                  }
                ]
              }
            },
            {
              "name": "swimPayloadMessage",
              "isMut": true,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "swim_payload"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "path": "claim"
                  }
                ]
              }
            },
            {
              "name": "swimPayloadMessagePayer",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "redeemer",
              "isMut": false,
              "isSigner": false,
              "docs": [
                "this used to be \"to_owner\".",
                "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
                "will have to be signed when it invokes complete_transfer_with_payload",
                "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
                "(NOT the `to` account)"
              ],
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "redeemer"
                  }
                ]
              }
            },
            {
              "name": "redeemerEscrow",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenIdMap",
              "isMut": false,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "propeller"
                  },
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "token_id"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "Propeller",
                    "path": "propeller"
                  },
                  {
                    "kind": "arg",
                    "type": "u16",
                    "path": "target_token_id"
                  }
                ]
              }
            },
            {
              "name": "pool",
              "isMut": true,
              "isSigner": false,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "type": "string",
                    "value": "two_pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TokenAccount",
                    "path": "pool_token_account_0.mint"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TokenAccount",
                    "path": "pool_token_account_1.mint"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "Mint",
                    "path": "lp_mint"
                  }
                ],
                "programId": {
                  "kind": "account",
                  "type": "publicKey",
                  "path": "two_pool_program"
                }
              }
            },
            {
              "name": "poolTokenAccount0",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "poolTokenAccount1",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "lpMint",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "governanceFee",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTransferAuthority",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "userTokenAccount0",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTokenAccount1",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userLpTokenAccount",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "twoPoolProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "systemProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Assuming that USD:USDC 1:1"
          ]
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "this is \"to_fees\"",
            "recipient of fees for executing complete transfer (e.g. relayer)"
          ]
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "ProcessSwimPayload",
                "path": "process_swim_payload"
              },
              {
                "kind": "account",
                "type": {
                  "defined": "Signer<'info>"
                },
                "account": "ProcessSwimPayload",
                "path": "process_swim_payload.payer"
              }
            ]
          }
        },
        {
          "name": "marginalPricePool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_0_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_1_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "marginal_price_pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": {
                "defined": "Program<'info,two_pool::program::TwoPool>"
              },
              "account": "ProcessSwimPayload",
              "path": "process_swim_payload.two_pool_program"
            }
          }
        },
        {
          "name": "marginalPricePoolToken0Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolToken1Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "This is for transferring lamports for kickstart"
          ]
        },
        {
          "name": "memo",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targetTokenId",
          "type": "u16"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "propellerCreateOwnerSwimUsdAta",
      "docs": [
        "This ix is used if a propeller engine detects (off-chain) that the target_token_id is not valid",
        "\"Fallback\" behavior is to check/create just the token bridge mint (swimUSD) token account for the owner",
        "then call propeller_process_swim_payload_fallback to finish transferring the swimUSD to the owner."
      ],
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "redeemer",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "this used to be \"to_owner\".",
            "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "redeemerEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "claim",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                },
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_address"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_chain"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_sequence"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "swimPayloadMessage",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "swim_payload"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "tokenIdMap",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "deseraizlied as a `TokenIdMap`. if it does exist, then engine should have called",
            "propeller_create_owner_token_accounts instead"
          ]
        },
        {
          "name": "swimUsdMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerSwimUsdAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Note: specifying TokenAccount type here since only one token account to initialize so no need to",
            "\"guess and check\" which token accounts need to be initialized"
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_0_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_1_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "marginal_price_pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "marginalPricePoolToken0Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolToken1Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "memo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "propellerProcessSwimPayloadFallback",
      "docs": [
        "This ix is used if a propeller engine detects (off-chain) that the payload.target_token_id is not valid",
        "this will transfer the swimUSD to the owner (will still kickstart if requested)"
      ],
      "accounts": [
        {
          "name": "propeller",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              }
            ]
          }
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "claim",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                },
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_address"
              },
              {
                "kind": "account",
                "type": "u16",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_emitter_chain"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "SwimPayloadMessage",
                "path": "swim_payload_message.vaa_sequence"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "account": "Propeller",
              "path": "propeller"
            }
          }
        },
        {
          "name": "swimClaim",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "claim"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "swimPayloadMessage",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "swim_payload"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "claim"
              }
            ]
          }
        },
        {
          "name": "swimPayloadMessagePayer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "redeemer",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "this used to be \"to_owner\".",
            "redeemer will be PDA derived from [\"redeemer\"], seeds::program = propeller::id()",
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              }
            ]
          }
        },
        {
          "name": "redeemerEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenIdMap",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "deserialized as a `TokenIdMap`. if it does exist, then engine should have called",
            "propeller_create_owner_token_accounts instead"
          ]
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userSwimUsdAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "twoPoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "memo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "aggregator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "this is \"to_fees\"",
            "recipient of fees for executing complete transfer (e.g. relayer)"
          ]
        },
        {
          "name": "feeTracker",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "propeller"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "fee"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Propeller",
                "path": "propeller.swim_usd_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "marginalPricePool",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "two_pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_0_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "marginal_price_pool_token_1_account.mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "marginal_price_pool_lp_mint"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "two_pool_program"
            }
          }
        },
        {
          "name": "marginalPricePoolToken0Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolToken1Account",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginalPricePoolLpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "This is for transferring lamports for kickstart"
          ]
        }
      ],
      "args": [],
      "returns": "u64"
    }
  ],
  "accounts": [
    {
      "name": "feeTracker",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "payer",
            "type": "publicKey"
          },
          {
            "name": "feesOwed",
            "type": "u64"
          },
          {
            "name": "feesMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "targetChainMap",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "targetChain",
            "type": "u16"
          },
          {
            "name": "targetAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "tokenIdMap",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "outputTokenIndex",
            "type": "u16"
          },
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "poolTokenIndex",
            "type": "u8"
          },
          {
            "name": "poolTokenMint",
            "type": "publicKey"
          },
          {
            "name": "poolIx",
            "type": {
              "defined": "PoolInstruction"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "propeller",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "nonce",
            "type": "u32"
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "wormhole",
            "type": "publicKey"
          },
          {
            "name": "tokenBridge",
            "type": "publicKey"
          },
          {
            "name": "swimUsdMint",
            "type": "publicKey"
          },
          {
            "name": "senderBump",
            "type": "u8"
          },
          {
            "name": "redeemerBump",
            "type": "u8"
          },
          {
            "name": "gasKickstartAmount",
            "type": "u64"
          },
          {
            "name": "secpVerifyInitFee",
            "type": "u64"
          },
          {
            "name": "secpVerifyFee",
            "type": "u64"
          },
          {
            "name": "postVaaFee",
            "type": "u64"
          },
          {
            "name": "initAtaFee",
            "type": "u64"
          },
          {
            "name": "completeWithPayloadFee",
            "type": "u64"
          },
          {
            "name": "processSwimPayloadFee",
            "type": "u64"
          },
          {
            "name": "marginalPricePool",
            "type": "publicKey"
          },
          {
            "name": "marginalPricePoolTokenMint",
            "type": "publicKey"
          },
          {
            "name": "marginalPricePoolTokenIndex",
            "type": "u8"
          },
          {
            "name": "feeVault",
            "type": "publicKey"
          },
          {
            "name": "aggregator",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "swimClaim",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "claimed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "swimPayloadMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "swimPayloadMessagePayer",
            "docs": [
              "payer of `CompleteWithPayload` that will get the lamports",
              "when `SwimPayloadMessage` is closed after `ProcessSwimPayload`"
            ],
            "type": "publicKey"
          },
          {
            "name": "claim",
            "type": "publicKey"
          },
          {
            "name": "vaaEmitterAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "vaaEmitterChain",
            "type": "u16"
          },
          {
            "name": "vaaSequence",
            "type": "u64"
          },
          {
            "name": "transferAmount",
            "type": "u64"
          },
          {
            "name": "swimPayloadVersion",
            "type": "u8"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "propellerEnabled",
            "type": "bool"
          },
          {
            "name": "gasKickstart",
            "type": "bool"
          },
          {
            "name": "maxFee",
            "type": "u64"
          },
          {
            "name": "targetTokenId",
            "type": "u16"
          },
          {
            "name": "memo",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitializeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gasKickstartAmount",
            "type": "u64"
          },
          {
            "name": "secpVerifyInitFee",
            "type": "u64"
          },
          {
            "name": "secpVerifyFee",
            "type": "u64"
          },
          {
            "name": "postVaaFee",
            "type": "u64"
          },
          {
            "name": "completeWithPayloadFee",
            "type": "u64"
          },
          {
            "name": "initAtaFee",
            "type": "u64"
          },
          {
            "name": "processSwimPayloadFee",
            "type": "u64"
          },
          {
            "name": "marginalPricePool",
            "type": "publicKey"
          },
          {
            "name": "marginalPricePoolTokenIndex",
            "type": "u8"
          },
          {
            "name": "marginalPricePoolTokenMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "CompleteNativeWithPayloadData",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "VerifySignaturesData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "signers",
            "docs": [
              "instruction indices of signers (-1 for missing)"
            ],
            "type": {
              "array": [
                "i8",
                19
              ]
            }
          }
        ]
      }
    },
    {
      "name": "TransferWithPayloadData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "type": "u32"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "targetAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "targetChain",
            "type": "u16"
          },
          {
            "name": "payload",
            "type": "bytes"
          },
          {
            "name": "cpiProgramId",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "PostMessageData",
      "docs": [
        "Data that goes into a [`wormhole::Instruction::PostMessage`]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "docs": [
              "Unique nonce for this message"
            ],
            "type": "u32"
          },
          {
            "name": "payload",
            "docs": [
              "Message payload"
            ],
            "type": "bytes"
          },
          {
            "name": "consistencyLevel",
            "docs": [
              "Commitment Level required for an attestation to be produced"
            ],
            "type": {
              "defined": "ConsistencyLevel"
            }
          }
        ]
      }
    },
    {
      "name": "BridgeData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "guardianSetIndex",
            "docs": [
              "The current guardian set index, used to decide which signature sets to accept."
            ],
            "type": "u32"
          },
          {
            "name": "lastLamports",
            "docs": [
              "Lamports in the collection account"
            ],
            "type": "u64"
          },
          {
            "name": "config",
            "docs": [
              "Bridge configuration, which is set once upon initialization."
            ],
            "type": {
              "defined": "BridgeConfig"
            }
          }
        ]
      }
    },
    {
      "name": "BridgeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "guardianSetExpirationTime",
            "docs": [
              "Period for how long a guardian set is valid after it has been replaced by a new one.  This",
              "guarantees that VAAs issued by that set can still be submitted for a certain period.  In",
              "this period we still trust the old guardian set."
            ],
            "type": "u32"
          },
          {
            "name": "fee",
            "docs": [
              "Amount of lamports that needs to be paid to the protocol to post a message"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "MessageData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaaVersion",
            "docs": [
              "Header of the posted VAA"
            ],
            "type": "u8"
          },
          {
            "name": "consistencyLevel",
            "docs": [
              "Level of consistency requested by the emitter"
            ],
            "type": "u8"
          },
          {
            "name": "vaaTime",
            "docs": [
              "Time the vaa was submitted"
            ],
            "type": "u32"
          },
          {
            "name": "vaaSignatureAccount",
            "docs": [
              "Account where signatures are stored"
            ],
            "type": "publicKey"
          },
          {
            "name": "submissionTime",
            "docs": [
              "Time the posted message was created"
            ],
            "type": "u32"
          },
          {
            "name": "nonce",
            "docs": [
              "Unique nonce for this message"
            ],
            "type": "u32"
          },
          {
            "name": "sequence",
            "docs": [
              "Sequence number of this message"
            ],
            "type": "u64"
          },
          {
            "name": "emitterChain",
            "docs": [
              "Emitter of the message"
            ],
            "type": "u16"
          },
          {
            "name": "emitterAddress",
            "docs": [
              "Emitter of the message"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "payload",
            "docs": [
              "Message payload aka `PayloadTransferWithPayload`"
            ],
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "ClaimData",
      "docs": [
        "Wormhole Claim Account data"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "claimed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "PostVAAData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "guardianSetIndex",
            "type": "u32"
          },
          {
            "name": "timestamp",
            "type": "u32"
          },
          {
            "name": "nonce",
            "type": "u32"
          },
          {
            "name": "emitterChain",
            "type": "u16"
          },
          {
            "name": "emitterAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "sequence",
            "type": "u64"
          },
          {
            "name": "consistencyLevel",
            "type": "u8"
          },
          {
            "name": "payload",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "PoolInstruction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Transfer"
          },
          {
            "name": "RemoveExactBurn"
          },
          {
            "name": "SwapExactInput"
          }
        ]
      }
    },
    {
      "name": "SwimPayloadVersion",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "V0"
          },
          {
            "name": "V1"
          }
        ]
      }
    },
    {
      "name": "ConsistencyLevel",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Confirmed"
          },
          {
            "name": "Finalized"
          }
        ]
      }
    },
    {
      "name": "Instruction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Initialize"
          },
          {
            "name": "PostMessage"
          },
          {
            "name": "PostVAA"
          },
          {
            "name": "SetFees"
          },
          {
            "name": "TransferFees"
          },
          {
            "name": "UpgradeContract"
          },
          {
            "name": "UpgradeGuardianSet"
          },
          {
            "name": "VerifySignatures"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InsufficientFunds",
      "msg": "InsufficientFunds"
    },
    {
      "code": 6001,
      "name": "InvalidAccount",
      "msg": "InvalidAccount"
    },
    {
      "code": 6002,
      "name": "InvalidRemainingAccounts",
      "msg": "InvalidRemainingAccounts"
    },
    {
      "code": 6003,
      "name": "InvalidTokenBridgeAddress",
      "msg": "InvalidTokenBridgeAddress"
    },
    {
      "code": 6004,
      "name": "InvalidTokenDecimals",
      "msg": "InvalidTokenDecimals"
    },
    {
      "code": 6005,
      "name": "InvalidTokenIndex",
      "msg": "InvalidTokenIndex"
    },
    {
      "code": 6006,
      "name": "InvalidVaaAction",
      "msg": "InvalidVaaAction"
    },
    {
      "code": 6007,
      "name": "InvalidWormholeAddress",
      "msg": "InvalidWormholeAddress"
    },
    {
      "code": 6008,
      "name": "InvalidVaaPayload",
      "msg": "InvalidVaaPayload"
    },
    {
      "code": 6009,
      "name": "NothingToClaim",
      "msg": "NothingToClaim"
    },
    {
      "code": 6010,
      "name": "TransferNotAllowed",
      "msg": "TransferNotAllowed"
    },
    {
      "code": 6011,
      "name": "InvalidCpiReturnProgramId",
      "msg": "Incorrect ProgramId for CPI return value"
    },
    {
      "code": 6012,
      "name": "InvalidCpiReturnValue",
      "msg": "Invalid CPI Return value"
    },
    {
      "code": 6013,
      "name": "InvalidMint",
      "msg": "Invalid Mint"
    },
    {
      "code": 6014,
      "name": "InvalidAddAndWormholeTransferMint",
      "msg": "Invalid Mint for AddAndWormholeTransfer"
    },
    {
      "code": 6015,
      "name": "InvalidSwapExactInputOutputTokenIndex",
      "msg": "Invalid output token index for SwapExactInput params"
    },
    {
      "code": 6016,
      "name": "InvalidSwapExactInputInputAmount",
      "msg": "Invalid input amount for SwapExactInput params"
    },
    {
      "code": 6017,
      "name": "InvalidSwimUsdMint",
      "msg": "Invalid SwimUSD Mint"
    },
    {
      "code": 6018,
      "name": "InvalidPayloadTypeInVaa",
      "msg": "Invalid Payload Type in VAA"
    },
    {
      "code": 6019,
      "name": "SerializeError",
      "msg": "Serializing error"
    },
    {
      "code": 6020,
      "name": "DeserializeError",
      "msg": "Deserializing error"
    },
    {
      "code": 6021,
      "name": "UserRedeemerSignatureNotDetected",
      "msg": "User redeemer needs to be signer"
    },
    {
      "code": 6022,
      "name": "InvalidSwitchboardAccount",
      "msg": "Not a valid Switchboard account"
    },
    {
      "code": 6023,
      "name": "StaleFeed",
      "msg": "Switchboard feed has not been updated in 5 minutes"
    },
    {
      "code": 6024,
      "name": "ConfidenceIntervalExceeded",
      "msg": "Switchboard feed exceeded provided confidence interval"
    },
    {
      "code": 6025,
      "name": "InsufficientAmount",
      "msg": "Insufficient Amount being transferred"
    },
    {
      "code": 6026,
      "name": "InvalidClaimData",
      "msg": "Invalid claim data"
    },
    {
      "code": 6027,
      "name": "ClaimNotClaimed",
      "msg": "Claim Account not claimed"
    },
    {
      "code": 6028,
      "name": "InvalidPropellerAdmin",
      "msg": "Invalid Propeller Admin"
    },
    {
      "code": 6029,
      "name": "InvalidTokenIdMapPool",
      "msg": "Invalid Pool for Token Id Map"
    },
    {
      "code": 6030,
      "name": "InvalidOutputTokenIndex",
      "msg": "Invalid Output Token Index"
    },
    {
      "code": 6031,
      "name": "InvalidTokenIdMapPoolTokenIndex",
      "msg": "Invalid Pool Token Index for Token Id Map"
    },
    {
      "code": 6032,
      "name": "InvalidTokenIdMapPoolTokenMint",
      "msg": "Invalid Pool Token Mint for Token Id Map"
    },
    {
      "code": 6033,
      "name": "InvalidTokenIdMapPoolIx",
      "msg": "Invalid Pool Ix for Token Id Map"
    },
    {
      "code": 6034,
      "name": "InvalidSwimPayloadGasKickstart",
      "msg": "Invalid Gas Kickstart parameter in Swim Payload"
    },
    {
      "code": 6035,
      "name": "InvalidMarginalPricePoolAccounts",
      "msg": "Invalid Marginal Price Pool Accounts"
    },
    {
      "code": 6036,
      "name": "NotPropellerEnabled",
      "msg": "Propeller Not Enabled in payload"
    },
    {
      "code": 6037,
      "name": "InvalidRoutingContractAddress",
      "msg": "Invalid Routing Contract Address"
    },
    {
      "code": 6038,
      "name": "IntegerOverflow",
      "msg": "Integer Overflow"
    },
    {
      "code": 6039,
      "name": "ConversionError",
      "msg": "Conversion Error"
    },
    {
      "code": 6040,
      "name": "UnableToRetrieveSwimUsdMintDecimals",
      "msg": "Unable to retrieve SwimUSD mint decimals from marginal price pool information"
    },
    {
      "code": 6041,
      "name": "InvalidMetapoolTokenMint",
      "msg": "Invalid Metapool Token Mint. token_mint[0] should == swim_usd_mint"
    },
    {
      "code": 6042,
      "name": "UnableToDeserializeTokenAccount",
      "msg": "Unable to deserialize account info as token account"
    },
    {
      "code": 6043,
      "name": "InvalidTokenAccountDataLen",
      "msg": "Invalid token account data length. != 0 && != TokenAccount::LEN"
    },
    {
      "code": 6044,
      "name": "PayerInsufficientFundsForGasKickstart",
      "msg": "Payer has insufficient funds for gas kickstart"
    },
    {
      "code": 6045,
      "name": "IncorrectOwnerForCreateTokenAccount",
      "msg": "Owner of token account != swimPayload.owner"
    },
    {
      "code": 6046,
      "name": "TokenIdMapExists",
      "msg": "TokenIdMap exists. Please use the correct instruction"
    },
    {
      "code": 6047,
      "name": "InvalidTokenIdMapAccountAddress",
      "msg": "Invalid address for TokenIdMap account"
    },
    {
      "code": 6048,
      "name": "InvalidSwimPayloadVersion",
      "msg": "Invalid Swim Payload version"
    },
    {
      "code": 6049,
      "name": "InvalidAggregator",
      "msg": "Invalid Aggregator"
    }
  ]
};

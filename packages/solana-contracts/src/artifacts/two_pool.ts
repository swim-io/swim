export type TwoPool = {
  "version": "0.1.0",
  "name": "two_pool",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
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
                "path": "pool_mint_0"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_mint_1"
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
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "poolMint0",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolMint1",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": true
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
          "name": "pauseKey",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "governanceAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "governanceFeeAccount",
          "isMut": true,
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
          "name": "ampFactor",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        },
        {
          "name": "lpFee",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        },
        {
          "name": "governanceFee",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        }
      ]
    },
    {
      "name": "add",
      "accounts": [
        {
          "name": "swap",
          "accounts": [
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
                ]
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
            }
          ]
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
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
      "name": "swapExactInput",
      "accounts": [
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
            ]
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
        }
      ],
      "args": [
        {
          "name": "exactInputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        },
        {
          "name": "outputTokenIndex",
          "type": "u8"
        },
        {
          "name": "minimumOutputAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "swapExactOutput",
      "accounts": [
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
            ]
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
        }
      ],
      "args": [
        {
          "name": "maximumInputAmount",
          "type": "u64"
        },
        {
          "name": "inputTokenIndex",
          "type": "u8"
        },
        {
          "name": "exactOutputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        }
      ],
      "returns": {
        "vec": "u64"
      }
    },
    {
      "name": "removeUniform",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Note: RemoveUniform is the only ix that is allowed even if the pool is paused",
            "which is why we don't check the is_paused value here."
          ],
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
            ]
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
        }
      ],
      "args": [
        {
          "name": "exactBurnAmount",
          "type": "u64"
        },
        {
          "name": "minimumOutputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        }
      ],
      "returns": {
        "vec": "u64"
      }
    },
    {
      "name": "removeExactBurn",
      "accounts": [
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
            ]
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
        }
      ],
      "args": [
        {
          "name": "exactBurnAmount",
          "type": "u64"
        },
        {
          "name": "outputTokenIndex",
          "type": "u8"
        },
        {
          "name": "minimumOutputAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "removeExactOutput",
      "accounts": [
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
            ]
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
        }
      ],
      "args": [
        {
          "name": "maximumBurnAmount",
          "type": "u64"
        },
        {
          "name": "exactOutputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        }
      ],
      "returns": {
        "vec": "u64"
      }
    },
    {
      "name": "marginalPrices",
      "accounts": [
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
            ]
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": {
        "array": [
          {
            "defined": "BorshDecimal"
          },
          2
        ]
      }
    },
    {
      "name": "prepareGovernanceTransition",
      "docs": [
        "Governance Ixs *"
      ],
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": [
        {
          "name": "upcomingGovernanceKey",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "enactGovernanceTransition",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": []
    },
    {
      "name": "prepareFeeChange",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": [
        {
          "name": "lpFee",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        },
        {
          "name": "governanceFee",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        }
      ]
    },
    {
      "name": "enactFeeChange",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": []
    },
    {
      "name": "changeGovernanceFeeAccount",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        },
        {
          "name": "newGovernanceFee",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newGovernanceFeeKey",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "adjustAmpFactor",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": [
        {
          "name": "targetTs",
          "type": "i64"
        },
        {
          "name": "targetValue",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        }
      ]
    },
    {
      "name": "setPaused",
      "accounts": [
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
                "account": "TwoPool",
                "path": "pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TwoPool",
                "path": "pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TwoPool",
                "path": "pool.lp_mint_key"
              }
            ]
          }
        },
        {
          "name": "pauseKey",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "paused",
          "type": "bool"
        }
      ]
    },
    {
      "name": "changePauseKey",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": [
        {
          "name": "newPauseKey",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createLpMetadata",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        },
        {
          "name": "createMetadataAccounts",
          "accounts": [
            {
              "name": "metadata",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "mint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "mintAuthority",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "payer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "updateAuthority",
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
          ]
        },
        {
          "name": "mplTokenMetadata",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "data",
          "type": {
            "defined": "AnchorDataV2"
          }
        },
        {
          "name": "isMutable",
          "type": "bool"
        },
        {
          "name": "updateAuthorityIsSigner",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateLpMetadata",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        },
        {
          "name": "updateMetadataAccounts",
          "accounts": [
            {
              "name": "metadata",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "updateAuthority",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "mplTokenMetadata",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newUpdateAuthority",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "data",
          "type": {
            "option": {
              "defined": "AnchorDataV2"
            }
          }
        },
        {
          "name": "primarySaleHappened",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "isMutable",
          "type": {
            "option": "bool"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "twoPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "ampFactor",
            "type": {
              "defined": "AmpFactor"
            }
          },
          {
            "name": "lpFee",
            "type": {
              "defined": "PoolFee"
            }
          },
          {
            "name": "governanceFee",
            "type": {
              "defined": "PoolFee"
            }
          },
          {
            "name": "lpMintKey",
            "type": "publicKey"
          },
          {
            "name": "lpDecimalEqualizer",
            "type": "u8"
          },
          {
            "name": "tokenMintKeys",
            "type": {
              "array": [
                "publicKey",
                2
              ]
            }
          },
          {
            "name": "tokenDecimalEqualizers",
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "tokenKeys",
            "type": {
              "array": [
                "publicKey",
                2
              ]
            }
          },
          {
            "name": "pauseKey",
            "type": "publicKey"
          },
          {
            "name": "governanceKey",
            "type": "publicKey"
          },
          {
            "name": "governanceFeeKey",
            "type": "publicKey"
          },
          {
            "name": "preparedGovernanceKey",
            "type": "publicKey"
          },
          {
            "name": "governanceTransitionTs",
            "type": "i64"
          },
          {
            "name": "preparedLpFee",
            "type": {
              "defined": "PoolFee"
            }
          },
          {
            "name": "preparedGovernanceFee",
            "type": {
              "defined": "PoolFee"
            }
          },
          {
            "name": "feeTransitionTs",
            "type": "i64"
          },
          {
            "name": "previousDepth",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "AmpFactor",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialValue",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          },
          {
            "name": "initialTs",
            "type": "i64"
          },
          {
            "name": "targetValue",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          },
          {
            "name": "targetTs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "AddParams",
      "type": {
        "kind": "struct",
        "fields": [
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
        ]
      }
    },
    {
      "name": "AdjustAmpFactorParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "targetTs",
            "type": "i64"
          },
          {
            "name": "targetValue",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          }
        ]
      }
    },
    {
      "name": "CreateLpMetadataParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "data",
            "type": {
              "defined": "AnchorDataV2"
            }
          },
          {
            "name": "isMutable",
            "type": "bool"
          },
          {
            "name": "updateAuthorityIsSigner",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "AnchorDataV2",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "docs": [
              "The name of the asset"
            ],
            "type": "string"
          },
          {
            "name": "symbol",
            "docs": [
              "The symbol for the asset"
            ],
            "type": "string"
          },
          {
            "name": "uri",
            "docs": [
              "URI pointing to JSON representing the asset"
            ],
            "type": "string"
          },
          {
            "name": "sellerFeeBasisPoints",
            "docs": [
              "Royalty basis points that goes to creators in secondary sales (0-10000)"
            ],
            "type": "u16"
          },
          {
            "name": "creators",
            "docs": [
              "Array of creators, optional"
            ],
            "type": {
              "option": {
                "vec": {
                  "defined": "AnchorCreator"
                }
              }
            }
          },
          {
            "name": "collection",
            "docs": [
              "Collection"
            ],
            "type": {
              "option": {
                "defined": "AnchorCollection"
              }
            }
          },
          {
            "name": "uses",
            "docs": [
              "Uses"
            ],
            "type": {
              "option": {
                "defined": "AnchorUses"
              }
            }
          }
        ]
      }
    },
    {
      "name": "AnchorCreator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "verified",
            "type": "bool"
          },
          {
            "name": "share",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "AnchorUses",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "useMethod",
            "type": {
              "defined": "AnchorUseMethod"
            }
          },
          {
            "name": "remaining",
            "type": "u64"
          },
          {
            "name": "total",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "AnchorCollection",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "verified",
            "type": "bool"
          },
          {
            "name": "key",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "PrepareFeeChangeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lpFee",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          },
          {
            "name": "governanceFee",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          }
        ]
      }
    },
    {
      "name": "UpdateLpMetadataParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "newUpdateAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "data",
            "type": {
              "option": {
                "defined": "AnchorDataV2"
              }
            }
          },
          {
            "name": "primarySaleHappened",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "isMutable",
            "type": {
              "option": "bool"
            }
          }
        ]
      }
    },
    {
      "name": "InitializeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ampFactor",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          },
          {
            "name": "lpFee",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          },
          {
            "name": "governanceFee",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          }
        ]
      }
    },
    {
      "name": "RemoveExactBurnParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exactBurnAmount",
            "type": "u64"
          },
          {
            "name": "outputTokenIndex",
            "type": "u8"
          },
          {
            "name": "minimumOutputAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "RemoveExactOutputParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maximumBurnAmount",
            "type": "u64"
          },
          {
            "name": "exactOutputAmounts",
            "type": {
              "array": [
                "u64",
                2
              ]
            }
          }
        ]
      }
    },
    {
      "name": "RemoveUniformParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exactBurnAmount",
            "type": "u64"
          },
          {
            "name": "minimumOutputAmounts",
            "type": {
              "array": [
                "u64",
                2
              ]
            }
          }
        ]
      }
    },
    {
      "name": "SwapExactInputParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exactInputAmounts",
            "type": {
              "array": [
                "u64",
                2
              ]
            }
          },
          {
            "name": "outputTokenIndex",
            "type": "u8"
          },
          {
            "name": "minimumOutputAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "SwapExactOutputParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maximumInputAmount",
            "type": "u64"
          },
          {
            "name": "inputTokenIndex",
            "type": "u8"
          },
          {
            "name": "exactOutputAmounts",
            "type": {
              "array": [
                "u64",
                2
              ]
            }
          }
        ]
      }
    },
    {
      "name": "PoolFee",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "DecimalU64Anchor",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "u64"
          },
          {
            "name": "decimals",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "BorshDecimal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mantissa",
            "type": "i128"
          },
          {
            "name": "scale",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "AnchorUseMethod",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Burn"
          },
          {
            "name": "Multiple"
          },
          {
            "name": "Single"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAmpFactorValue",
      "msg": "Specified amp factor is out of bounds"
    },
    {
      "code": 6001,
      "name": "InvalidAmpFactorTimestamp",
      "msg": "Amp factor adjustment window is too short"
    },
    {
      "code": 6002,
      "name": "InvalidFeeInput",
      "msg": "Given fee is invalid"
    },
    {
      "code": 6003,
      "name": "DuplicateAccount",
      "msg": "Can't pass the same account twice here"
    },
    {
      "code": 6004,
      "name": "MintHasBalance",
      "msg": "LP token mint has a positive balance"
    },
    {
      "code": 6005,
      "name": "InvalidMintAuthority",
      "msg": "Pool does not have mint authority of LP token mint"
    },
    {
      "code": 6006,
      "name": "MintHasFreezeAuthority",
      "msg": "LP token mint's freeze authority is set"
    },
    {
      "code": 6007,
      "name": "TokenAccountHasBalance",
      "msg": "Token account has a positive balance"
    },
    {
      "code": 6008,
      "name": "TokenAccountHasDelegate",
      "msg": "Token account's delegate is set"
    },
    {
      "code": 6009,
      "name": "TokenAccountHasCloseAuthority",
      "msg": "Token account's close authority is set"
    },
    {
      "code": 6010,
      "name": "InvalidGovernanceAccount",
      "msg": "Invalid governance account"
    },
    {
      "code": 6011,
      "name": "InvalidGovernanceFeeAccount",
      "msg": "Invalid governance fee account"
    },
    {
      "code": 6012,
      "name": "InvalidPoolAuthorityAccount",
      "msg": "Invalid pool authority account"
    },
    {
      "code": 6013,
      "name": "InvalidMintAccount",
      "msg": "Invalid mint account"
    },
    {
      "code": 6014,
      "name": "InsufficientDelay",
      "msg": "Not enough time has passed since prepare instruction"
    },
    {
      "code": 6015,
      "name": "InvalidEnact",
      "msg": "Nothing to enact"
    },
    {
      "code": 6016,
      "name": "PoolIsPaused",
      "msg": "Pool is paused"
    },
    {
      "code": 6017,
      "name": "PoolTokenAccountExpected",
      "msg": "Expected a token account that belongs to the pool"
    },
    {
      "code": 6018,
      "name": "OutsideSpecifiedLimits",
      "msg": "The instruction could not be completed within the specified limits"
    },
    {
      "code": 6019,
      "name": "InitialAddRequiresAllTokens",
      "msg": "Initial add to pool must include all tokens"
    },
    {
      "code": 6020,
      "name": "ImpossibleRemove",
      "msg": "Remove can't be completed due to the approximative nature of fee math implementation"
    },
    {
      "code": 6021,
      "name": "MaxDecimalDifferenceExceeded",
      "msg": "The maximum difference in decimals between tokens in the pool has been exceeded"
    },
    {
      "code": 6022,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp from Clock sysvar"
    },
    {
      "code": 6023,
      "name": "AddRequiresAtLeastOneToken",
      "msg": "Add Requires at least one token"
    },
    {
      "code": 6024,
      "name": "InvalidSwapExactInputParameters",
      "msg": "Invalid parameters for Swap Exact Input"
    },
    {
      "code": 6025,
      "name": "InvalidSwapExactOutputParameters",
      "msg": "Invalid parameters for Swap Exact Output"
    },
    {
      "code": 6026,
      "name": "InvalidRemoveUniformParameters",
      "msg": "Invalid parameters for Remove Uniform"
    },
    {
      "code": 6027,
      "name": "InvalidRemoveExactBurnParameters",
      "msg": "Invalid parameters for Remove Exact Burn"
    },
    {
      "code": 6028,
      "name": "InvalidRemoveExactOutputParameters",
      "msg": "Invalid parameters for Remove Exact Output"
    },
    {
      "code": 6029,
      "name": "InsufficientPoolTokenAccountBalance",
      "msg": "Invalid parameters for Remove Exact Output"
    },
    {
      "code": 6030,
      "name": "InvalidTokenIndex",
      "msg": "Invalid Token Index"
    },
    {
      "code": 6031,
      "name": "InvalidPauseKey",
      "msg": "Invalid Pause Key"
    },
    {
      "code": 6032,
      "name": "InvalidSwitchboardAccount",
      "msg": "Not a valid Switchboard account"
    },
    {
      "code": 6033,
      "name": "StaleFeed",
      "msg": "Switchboard feed has not been updated in 5 minutes"
    },
    {
      "code": 6034,
      "name": "ConfidenceIntervalExceeded",
      "msg": "Switchboard feed exceeded provided confidence interval"
    },
    {
      "code": 6035,
      "name": "MaxDecimalsExceeded",
      "msg": "Maximum decimals exceeded"
    },
    {
      "code": 6036,
      "name": "ConversionError",
      "msg": "Conversion error"
    }
  ]
};

export const IDL: TwoPool = {
  "version": "0.1.0",
  "name": "two_pool",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
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
                "path": "pool_mint_0"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "pool_mint_1"
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
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "poolMint0",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolMint1",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": true
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
          "name": "pauseKey",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "governanceAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "governanceFeeAccount",
          "isMut": true,
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
          "name": "ampFactor",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        },
        {
          "name": "lpFee",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        },
        {
          "name": "governanceFee",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        }
      ]
    },
    {
      "name": "add",
      "accounts": [
        {
          "name": "swap",
          "accounts": [
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
                ]
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
            }
          ]
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
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
      "name": "swapExactInput",
      "accounts": [
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
            ]
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
        }
      ],
      "args": [
        {
          "name": "exactInputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        },
        {
          "name": "outputTokenIndex",
          "type": "u8"
        },
        {
          "name": "minimumOutputAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "swapExactOutput",
      "accounts": [
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
            ]
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
        }
      ],
      "args": [
        {
          "name": "maximumInputAmount",
          "type": "u64"
        },
        {
          "name": "inputTokenIndex",
          "type": "u8"
        },
        {
          "name": "exactOutputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        }
      ],
      "returns": {
        "vec": "u64"
      }
    },
    {
      "name": "removeUniform",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Note: RemoveUniform is the only ix that is allowed even if the pool is paused",
            "which is why we don't check the is_paused value here."
          ],
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
            ]
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
        }
      ],
      "args": [
        {
          "name": "exactBurnAmount",
          "type": "u64"
        },
        {
          "name": "minimumOutputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        }
      ],
      "returns": {
        "vec": "u64"
      }
    },
    {
      "name": "removeExactBurn",
      "accounts": [
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
            ]
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
        }
      ],
      "args": [
        {
          "name": "exactBurnAmount",
          "type": "u64"
        },
        {
          "name": "outputTokenIndex",
          "type": "u8"
        },
        {
          "name": "minimumOutputAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "removeExactOutput",
      "accounts": [
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
            ]
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
        }
      ],
      "args": [
        {
          "name": "maximumBurnAmount",
          "type": "u64"
        },
        {
          "name": "exactOutputAmounts",
          "type": {
            "array": [
              "u64",
              2
            ]
          }
        }
      ],
      "returns": {
        "vec": "u64"
      }
    },
    {
      "name": "marginalPrices",
      "accounts": [
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
            ]
          }
        },
        {
          "name": "poolTokenAccount0",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount1",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": {
        "array": [
          {
            "defined": "BorshDecimal"
          },
          2
        ]
      }
    },
    {
      "name": "prepareGovernanceTransition",
      "docs": [
        "Governance Ixs *"
      ],
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": [
        {
          "name": "upcomingGovernanceKey",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "enactGovernanceTransition",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": []
    },
    {
      "name": "prepareFeeChange",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": [
        {
          "name": "lpFee",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        },
        {
          "name": "governanceFee",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        }
      ]
    },
    {
      "name": "enactFeeChange",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": []
    },
    {
      "name": "changeGovernanceFeeAccount",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        },
        {
          "name": "newGovernanceFee",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newGovernanceFeeKey",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "adjustAmpFactor",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": [
        {
          "name": "targetTs",
          "type": "i64"
        },
        {
          "name": "targetValue",
          "type": {
            "defined": "DecimalU64Anchor"
          }
        }
      ]
    },
    {
      "name": "setPaused",
      "accounts": [
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
                "account": "TwoPool",
                "path": "pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TwoPool",
                "path": "pool"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TwoPool",
                "path": "pool.lp_mint_key"
              }
            ]
          }
        },
        {
          "name": "pauseKey",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "paused",
          "type": "bool"
        }
      ]
    },
    {
      "name": "changePauseKey",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        }
      ],
      "args": [
        {
          "name": "newPauseKey",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createLpMetadata",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        },
        {
          "name": "createMetadataAccounts",
          "accounts": [
            {
              "name": "metadata",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "mint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "mintAuthority",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "payer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "updateAuthority",
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
          ]
        },
        {
          "name": "mplTokenMetadata",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "data",
          "type": {
            "defined": "AnchorDataV2"
          }
        },
        {
          "name": "isMutable",
          "type": "bool"
        },
        {
          "name": "updateAuthorityIsSigner",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateLpMetadata",
      "accounts": [
        {
          "name": "commonGovernance",
          "accounts": [
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
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "type": "publicKey",
                    "account": "TwoPool",
                    "path": "pool.lp_mint_key"
                  }
                ]
              }
            },
            {
              "name": "governance",
              "isMut": false,
              "isSigner": true
            }
          ]
        },
        {
          "name": "updateMetadataAccounts",
          "accounts": [
            {
              "name": "metadata",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "updateAuthority",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "mplTokenMetadata",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newUpdateAuthority",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "data",
          "type": {
            "option": {
              "defined": "AnchorDataV2"
            }
          }
        },
        {
          "name": "primarySaleHappened",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "isMutable",
          "type": {
            "option": "bool"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "twoPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "ampFactor",
            "type": {
              "defined": "AmpFactor"
            }
          },
          {
            "name": "lpFee",
            "type": {
              "defined": "PoolFee"
            }
          },
          {
            "name": "governanceFee",
            "type": {
              "defined": "PoolFee"
            }
          },
          {
            "name": "lpMintKey",
            "type": "publicKey"
          },
          {
            "name": "lpDecimalEqualizer",
            "type": "u8"
          },
          {
            "name": "tokenMintKeys",
            "type": {
              "array": [
                "publicKey",
                2
              ]
            }
          },
          {
            "name": "tokenDecimalEqualizers",
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "tokenKeys",
            "type": {
              "array": [
                "publicKey",
                2
              ]
            }
          },
          {
            "name": "pauseKey",
            "type": "publicKey"
          },
          {
            "name": "governanceKey",
            "type": "publicKey"
          },
          {
            "name": "governanceFeeKey",
            "type": "publicKey"
          },
          {
            "name": "preparedGovernanceKey",
            "type": "publicKey"
          },
          {
            "name": "governanceTransitionTs",
            "type": "i64"
          },
          {
            "name": "preparedLpFee",
            "type": {
              "defined": "PoolFee"
            }
          },
          {
            "name": "preparedGovernanceFee",
            "type": {
              "defined": "PoolFee"
            }
          },
          {
            "name": "feeTransitionTs",
            "type": "i64"
          },
          {
            "name": "previousDepth",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "AmpFactor",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialValue",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          },
          {
            "name": "initialTs",
            "type": "i64"
          },
          {
            "name": "targetValue",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          },
          {
            "name": "targetTs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "AddParams",
      "type": {
        "kind": "struct",
        "fields": [
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
        ]
      }
    },
    {
      "name": "AdjustAmpFactorParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "targetTs",
            "type": "i64"
          },
          {
            "name": "targetValue",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          }
        ]
      }
    },
    {
      "name": "CreateLpMetadataParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "data",
            "type": {
              "defined": "AnchorDataV2"
            }
          },
          {
            "name": "isMutable",
            "type": "bool"
          },
          {
            "name": "updateAuthorityIsSigner",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "AnchorDataV2",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "docs": [
              "The name of the asset"
            ],
            "type": "string"
          },
          {
            "name": "symbol",
            "docs": [
              "The symbol for the asset"
            ],
            "type": "string"
          },
          {
            "name": "uri",
            "docs": [
              "URI pointing to JSON representing the asset"
            ],
            "type": "string"
          },
          {
            "name": "sellerFeeBasisPoints",
            "docs": [
              "Royalty basis points that goes to creators in secondary sales (0-10000)"
            ],
            "type": "u16"
          },
          {
            "name": "creators",
            "docs": [
              "Array of creators, optional"
            ],
            "type": {
              "option": {
                "vec": {
                  "defined": "AnchorCreator"
                }
              }
            }
          },
          {
            "name": "collection",
            "docs": [
              "Collection"
            ],
            "type": {
              "option": {
                "defined": "AnchorCollection"
              }
            }
          },
          {
            "name": "uses",
            "docs": [
              "Uses"
            ],
            "type": {
              "option": {
                "defined": "AnchorUses"
              }
            }
          }
        ]
      }
    },
    {
      "name": "AnchorCreator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "verified",
            "type": "bool"
          },
          {
            "name": "share",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "AnchorUses",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "useMethod",
            "type": {
              "defined": "AnchorUseMethod"
            }
          },
          {
            "name": "remaining",
            "type": "u64"
          },
          {
            "name": "total",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "AnchorCollection",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "verified",
            "type": "bool"
          },
          {
            "name": "key",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "PrepareFeeChangeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lpFee",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          },
          {
            "name": "governanceFee",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          }
        ]
      }
    },
    {
      "name": "UpdateLpMetadataParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "newUpdateAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "data",
            "type": {
              "option": {
                "defined": "AnchorDataV2"
              }
            }
          },
          {
            "name": "primarySaleHappened",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "isMutable",
            "type": {
              "option": "bool"
            }
          }
        ]
      }
    },
    {
      "name": "InitializeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ampFactor",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          },
          {
            "name": "lpFee",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          },
          {
            "name": "governanceFee",
            "type": {
              "defined": "DecimalU64Anchor"
            }
          }
        ]
      }
    },
    {
      "name": "RemoveExactBurnParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exactBurnAmount",
            "type": "u64"
          },
          {
            "name": "outputTokenIndex",
            "type": "u8"
          },
          {
            "name": "minimumOutputAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "RemoveExactOutputParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maximumBurnAmount",
            "type": "u64"
          },
          {
            "name": "exactOutputAmounts",
            "type": {
              "array": [
                "u64",
                2
              ]
            }
          }
        ]
      }
    },
    {
      "name": "RemoveUniformParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exactBurnAmount",
            "type": "u64"
          },
          {
            "name": "minimumOutputAmounts",
            "type": {
              "array": [
                "u64",
                2
              ]
            }
          }
        ]
      }
    },
    {
      "name": "SwapExactInputParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exactInputAmounts",
            "type": {
              "array": [
                "u64",
                2
              ]
            }
          },
          {
            "name": "outputTokenIndex",
            "type": "u8"
          },
          {
            "name": "minimumOutputAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "SwapExactOutputParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maximumInputAmount",
            "type": "u64"
          },
          {
            "name": "inputTokenIndex",
            "type": "u8"
          },
          {
            "name": "exactOutputAmounts",
            "type": {
              "array": [
                "u64",
                2
              ]
            }
          }
        ]
      }
    },
    {
      "name": "PoolFee",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "DecimalU64Anchor",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "u64"
          },
          {
            "name": "decimals",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "BorshDecimal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mantissa",
            "type": "i128"
          },
          {
            "name": "scale",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "AnchorUseMethod",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Burn"
          },
          {
            "name": "Multiple"
          },
          {
            "name": "Single"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAmpFactorValue",
      "msg": "Specified amp factor is out of bounds"
    },
    {
      "code": 6001,
      "name": "InvalidAmpFactorTimestamp",
      "msg": "Amp factor adjustment window is too short"
    },
    {
      "code": 6002,
      "name": "InvalidFeeInput",
      "msg": "Given fee is invalid"
    },
    {
      "code": 6003,
      "name": "DuplicateAccount",
      "msg": "Can't pass the same account twice here"
    },
    {
      "code": 6004,
      "name": "MintHasBalance",
      "msg": "LP token mint has a positive balance"
    },
    {
      "code": 6005,
      "name": "InvalidMintAuthority",
      "msg": "Pool does not have mint authority of LP token mint"
    },
    {
      "code": 6006,
      "name": "MintHasFreezeAuthority",
      "msg": "LP token mint's freeze authority is set"
    },
    {
      "code": 6007,
      "name": "TokenAccountHasBalance",
      "msg": "Token account has a positive balance"
    },
    {
      "code": 6008,
      "name": "TokenAccountHasDelegate",
      "msg": "Token account's delegate is set"
    },
    {
      "code": 6009,
      "name": "TokenAccountHasCloseAuthority",
      "msg": "Token account's close authority is set"
    },
    {
      "code": 6010,
      "name": "InvalidGovernanceAccount",
      "msg": "Invalid governance account"
    },
    {
      "code": 6011,
      "name": "InvalidGovernanceFeeAccount",
      "msg": "Invalid governance fee account"
    },
    {
      "code": 6012,
      "name": "InvalidPoolAuthorityAccount",
      "msg": "Invalid pool authority account"
    },
    {
      "code": 6013,
      "name": "InvalidMintAccount",
      "msg": "Invalid mint account"
    },
    {
      "code": 6014,
      "name": "InsufficientDelay",
      "msg": "Not enough time has passed since prepare instruction"
    },
    {
      "code": 6015,
      "name": "InvalidEnact",
      "msg": "Nothing to enact"
    },
    {
      "code": 6016,
      "name": "PoolIsPaused",
      "msg": "Pool is paused"
    },
    {
      "code": 6017,
      "name": "PoolTokenAccountExpected",
      "msg": "Expected a token account that belongs to the pool"
    },
    {
      "code": 6018,
      "name": "OutsideSpecifiedLimits",
      "msg": "The instruction could not be completed within the specified limits"
    },
    {
      "code": 6019,
      "name": "InitialAddRequiresAllTokens",
      "msg": "Initial add to pool must include all tokens"
    },
    {
      "code": 6020,
      "name": "ImpossibleRemove",
      "msg": "Remove can't be completed due to the approximative nature of fee math implementation"
    },
    {
      "code": 6021,
      "name": "MaxDecimalDifferenceExceeded",
      "msg": "The maximum difference in decimals between tokens in the pool has been exceeded"
    },
    {
      "code": 6022,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp from Clock sysvar"
    },
    {
      "code": 6023,
      "name": "AddRequiresAtLeastOneToken",
      "msg": "Add Requires at least one token"
    },
    {
      "code": 6024,
      "name": "InvalidSwapExactInputParameters",
      "msg": "Invalid parameters for Swap Exact Input"
    },
    {
      "code": 6025,
      "name": "InvalidSwapExactOutputParameters",
      "msg": "Invalid parameters for Swap Exact Output"
    },
    {
      "code": 6026,
      "name": "InvalidRemoveUniformParameters",
      "msg": "Invalid parameters for Remove Uniform"
    },
    {
      "code": 6027,
      "name": "InvalidRemoveExactBurnParameters",
      "msg": "Invalid parameters for Remove Exact Burn"
    },
    {
      "code": 6028,
      "name": "InvalidRemoveExactOutputParameters",
      "msg": "Invalid parameters for Remove Exact Output"
    },
    {
      "code": 6029,
      "name": "InsufficientPoolTokenAccountBalance",
      "msg": "Invalid parameters for Remove Exact Output"
    },
    {
      "code": 6030,
      "name": "InvalidTokenIndex",
      "msg": "Invalid Token Index"
    },
    {
      "code": 6031,
      "name": "InvalidPauseKey",
      "msg": "Invalid Pause Key"
    },
    {
      "code": 6032,
      "name": "InvalidSwitchboardAccount",
      "msg": "Not a valid Switchboard account"
    },
    {
      "code": 6033,
      "name": "StaleFeed",
      "msg": "Switchboard feed has not been updated in 5 minutes"
    },
    {
      "code": 6034,
      "name": "ConfidenceIntervalExceeded",
      "msg": "Switchboard feed exceeded provided confidence interval"
    },
    {
      "code": 6035,
      "name": "MaxDecimalsExceeded",
      "msg": "Maximum decimals exceeded"
    },
    {
      "code": 6036,
      "name": "ConversionError",
      "msg": "Conversion error"
    }
  ]
};

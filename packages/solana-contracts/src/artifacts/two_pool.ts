export type TwoPool = {
  readonly version: "0.1.0";
  readonly name: "two_pool";
  readonly instructions: readonly [
    {
      readonly name: "initialize";
      readonly accounts: readonly [
        {
          readonly name: "pool";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "two_pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "pool_mint_0";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "pool_mint_1";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "lp_mint";
              },
            ];
          };
        },
        {
          readonly name: "payer";
          readonly isMut: true;
          readonly isSigner: true;
        },
        {
          readonly name: "poolMint0";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "poolMint1";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "lpMint";
          readonly isMut: true;
          readonly isSigner: true;
        },
        {
          readonly name: "poolTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "poolTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "pauseKey";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "governanceAccount";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "governanceFeeAccount";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "associatedTokenProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "systemProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "rent";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "ampFactor";
          readonly type: {
            readonly defined: "DecimalU64Anchor";
          };
        },
        {
          readonly name: "lpFee";
          readonly type: {
            readonly defined: "DecimalU64Anchor";
          };
        },
        {
          readonly name: "governanceFee";
          readonly type: {
            readonly defined: "DecimalU64Anchor";
          };
        },
      ];
    },
    {
      readonly name: "add";
      readonly accounts: readonly [
        {
          readonly name: "pool";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "two_pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_0.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_1.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "lp_mint";
              },
            ];
          };
        },
        {
          readonly name: "poolTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "poolTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "lpMint";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "governanceFee";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTransferAuthority";
          readonly isMut: false;
          readonly isSigner: true;
        },
        {
          readonly name: "userTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userLpTokenAccount";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "inputAmounts";
          readonly type: {
            readonly array: readonly ["u64", 2];
          };
        },
        {
          readonly name: "minimumMintAmount";
          readonly type: "u64";
        },
      ];
      readonly returns: "u64";
    },
    {
      readonly name: "swapExactInput";
      readonly accounts: readonly [
        {
          readonly name: "pool";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "two_pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_0.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_1.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "lp_mint";
              },
            ];
          };
        },
        {
          readonly name: "poolTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "poolTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "lpMint";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "governanceFee";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTransferAuthority";
          readonly isMut: false;
          readonly isSigner: true;
        },
        {
          readonly name: "userTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "exactInputAmounts";
          readonly type: {
            readonly array: readonly ["u64", 2];
          };
        },
        {
          readonly name: "outputTokenIndex";
          readonly type: "u8";
        },
        {
          readonly name: "minimumOutputAmount";
          readonly type: "u64";
        },
      ];
      readonly returns: "u64";
    },
    {
      readonly name: "swapExactOutput";
      readonly accounts: readonly [
        {
          readonly name: "pool";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "two_pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_0.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_1.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "lp_mint";
              },
            ];
          };
        },
        {
          readonly name: "poolTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "poolTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "lpMint";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "governanceFee";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTransferAuthority";
          readonly isMut: false;
          readonly isSigner: true;
        },
        {
          readonly name: "userTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "maximumInputAmount";
          readonly type: "u64";
        },
        {
          readonly name: "inputTokenIndex";
          readonly type: "u8";
        },
        {
          readonly name: "exactOutputAmounts";
          readonly type: {
            readonly array: readonly ["u64", 2];
          };
        },
      ];
      readonly returns: {
        readonly vec: "u64";
      };
    },
    {
      readonly name: "removeUniform";
      readonly accounts: readonly [
        {
          readonly name: "pool";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "two_pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_0.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_1.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "lp_mint";
              },
            ];
          };
        },
        {
          readonly name: "poolTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "poolTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "lpMint";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "governanceFee";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTransferAuthority";
          readonly isMut: false;
          readonly isSigner: true;
        },
        {
          readonly name: "userTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userLpTokenAccount";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "exactBurnAmount";
          readonly type: "u64";
        },
        {
          readonly name: "minimumOutputAmounts";
          readonly type: {
            readonly array: readonly ["u64", 2];
          };
        },
      ];
      readonly returns: {
        readonly vec: "u64";
      };
    },
    {
      readonly name: "removeExactBurn";
      readonly accounts: readonly [
        {
          readonly name: "pool";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "two_pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_0.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_1.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "lp_mint";
              },
            ];
          };
        },
        {
          readonly name: "poolTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "poolTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "lpMint";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "governanceFee";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTransferAuthority";
          readonly isMut: false;
          readonly isSigner: true;
        },
        {
          readonly name: "userTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userLpTokenAccount";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "exactBurnAmount";
          readonly type: "u64";
        },
        {
          readonly name: "outputTokenIndex";
          readonly type: "u8";
        },
        {
          readonly name: "minimumOutputAmount";
          readonly type: "u64";
        },
      ];
      readonly returns: "u64";
    },
    {
      readonly name: "removeExactOutput";
      readonly accounts: readonly [
        {
          readonly name: "pool";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "two_pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_0.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_1.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "lp_mint";
              },
            ];
          };
        },
        {
          readonly name: "poolTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "poolTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "lpMint";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "governanceFee";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTransferAuthority";
          readonly isMut: false;
          readonly isSigner: true;
        },
        {
          readonly name: "userTokenAccount0";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userTokenAccount1";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "userLpTokenAccount";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "maximumBurnAmount";
          readonly type: "u64";
        },
        {
          readonly name: "exactOutputAmounts";
          readonly type: {
            readonly array: readonly ["u64", 2];
          };
        },
      ];
      readonly returns: {
        readonly vec: "u64";
      };
    },
    {
      readonly name: "marginalPrices";
      readonly accounts: readonly [
        {
          readonly name: "pool";
          readonly isMut: false;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "two_pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_0.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TokenAccount";
                readonly path: "pool_token_account_1.mint";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "lp_mint";
              },
            ];
          };
        },
        {
          readonly name: "poolTokenAccount0";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "poolTokenAccount1";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "lpMint";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [];
      readonly returns: {
        readonly array: readonly [
          {
            readonly defined: "DecimalU64Anchor";
          },
          2,
        ];
      };
    },
    {
      readonly name: "prepareGovernanceTransition";
      readonly docs: readonly ["Governance Ixs *"];
      readonly accounts: readonly [
        {
          readonly name: "commonGovernance";
          readonly accounts: readonly [
            {
              readonly name: "pool";
              readonly isMut: true;
              readonly isSigner: false;
              readonly pda: {
                readonly seeds: readonly [
                  {
                    readonly kind: "const";
                    readonly type: "string";
                    readonly value: "two_pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              readonly name: "governance";
              readonly isMut: false;
              readonly isSigner: true;
            },
          ];
        },
      ];
      readonly args: readonly [
        {
          readonly name: "upcomingGovernanceKey";
          readonly type: "publicKey";
        },
      ];
    },
    {
      readonly name: "enactGovernanceTransition";
      readonly accounts: readonly [
        {
          readonly name: "commonGovernance";
          readonly accounts: readonly [
            {
              readonly name: "pool";
              readonly isMut: true;
              readonly isSigner: false;
              readonly pda: {
                readonly seeds: readonly [
                  {
                    readonly kind: "const";
                    readonly type: "string";
                    readonly value: "two_pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              readonly name: "governance";
              readonly isMut: false;
              readonly isSigner: true;
            },
          ];
        },
      ];
      readonly args: readonly [];
    },
    {
      readonly name: "prepareFeeChange";
      readonly accounts: readonly [
        {
          readonly name: "commonGovernance";
          readonly accounts: readonly [
            {
              readonly name: "pool";
              readonly isMut: true;
              readonly isSigner: false;
              readonly pda: {
                readonly seeds: readonly [
                  {
                    readonly kind: "const";
                    readonly type: "string";
                    readonly value: "two_pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              readonly name: "governance";
              readonly isMut: false;
              readonly isSigner: true;
            },
          ];
        },
      ];
      readonly args: readonly [
        {
          readonly name: "lpFee";
          readonly type: {
            readonly defined: "DecimalU64Anchor";
          };
        },
        {
          readonly name: "governanceFee";
          readonly type: {
            readonly defined: "DecimalU64Anchor";
          };
        },
      ];
    },
    {
      readonly name: "enactFeeChange";
      readonly accounts: readonly [
        {
          readonly name: "commonGovernance";
          readonly accounts: readonly [
            {
              readonly name: "pool";
              readonly isMut: true;
              readonly isSigner: false;
              readonly pda: {
                readonly seeds: readonly [
                  {
                    readonly kind: "const";
                    readonly type: "string";
                    readonly value: "two_pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              readonly name: "governance";
              readonly isMut: false;
              readonly isSigner: true;
            },
          ];
        },
      ];
      readonly args: readonly [];
    },
    {
      readonly name: "changeGovernanceFeeAccount";
      readonly accounts: readonly [
        {
          readonly name: "commonGovernance";
          readonly accounts: readonly [
            {
              readonly name: "pool";
              readonly isMut: true;
              readonly isSigner: false;
              readonly pda: {
                readonly seeds: readonly [
                  {
                    readonly kind: "const";
                    readonly type: "string";
                    readonly value: "two_pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              readonly name: "governance";
              readonly isMut: false;
              readonly isSigner: true;
            },
          ];
        },
        {
          readonly name: "newGovernanceFee";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "newGovernanceFeeKey";
          readonly type: "publicKey";
        },
      ];
    },
    {
      readonly name: "adjustAmpFactor";
      readonly accounts: readonly [
        {
          readonly name: "commonGovernance";
          readonly accounts: readonly [
            {
              readonly name: "pool";
              readonly isMut: true;
              readonly isSigner: false;
              readonly pda: {
                readonly seeds: readonly [
                  {
                    readonly kind: "const";
                    readonly type: "string";
                    readonly value: "two_pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              readonly name: "governance";
              readonly isMut: false;
              readonly isSigner: true;
            },
          ];
        },
      ];
      readonly args: readonly [
        {
          readonly name: "targetTs";
          readonly type: "i64";
        },
        {
          readonly name: "targetValue";
          readonly type: {
            readonly defined: "DecimalU64Anchor";
          };
        },
      ];
    },
    {
      readonly name: "setPaused";
      readonly accounts: readonly [
        {
          readonly name: "pool";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "two_pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TwoPool";
                readonly path: "pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TwoPool";
                readonly path: "pool";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "TwoPool";
                readonly path: "pool.lp_mint_key";
              },
            ];
          };
        },
        {
          readonly name: "pauseKey";
          readonly isMut: false;
          readonly isSigner: true;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "paused";
          readonly type: "bool";
        },
      ];
    },
    {
      readonly name: "changePauseKey";
      readonly accounts: readonly [
        {
          readonly name: "commonGovernance";
          readonly accounts: readonly [
            {
              readonly name: "pool";
              readonly isMut: true;
              readonly isSigner: false;
              readonly pda: {
                readonly seeds: readonly [
                  {
                    readonly kind: "const";
                    readonly type: "string";
                    readonly value: "two_pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              readonly name: "governance";
              readonly isMut: false;
              readonly isSigner: true;
            },
          ];
        },
      ];
      readonly args: readonly [
        {
          readonly name: "newPauseKey";
          readonly type: "publicKey";
        },
      ];
    },
    {
      readonly name: "createLpMetadata";
      readonly accounts: readonly [
        {
          readonly name: "commonGovernance";
          readonly accounts: readonly [
            {
              readonly name: "pool";
              readonly isMut: true;
              readonly isSigner: false;
              readonly pda: {
                readonly seeds: readonly [
                  {
                    readonly kind: "const";
                    readonly type: "string";
                    readonly value: "two_pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              readonly name: "governance";
              readonly isMut: false;
              readonly isSigner: true;
            },
          ];
        },
        {
          readonly name: "createMetadataAccounts";
          readonly accounts: readonly [
            {
              readonly name: "metadata";
              readonly isMut: true;
              readonly isSigner: false;
            },
            {
              readonly name: "mint";
              readonly isMut: false;
              readonly isSigner: false;
            },
            {
              readonly name: "mintAuthority";
              readonly isMut: false;
              readonly isSigner: false;
            },
            {
              readonly name: "payer";
              readonly isMut: true;
              readonly isSigner: true;
            },
            {
              readonly name: "updateAuthority";
              readonly isMut: false;
              readonly isSigner: false;
            },
            {
              readonly name: "systemProgram";
              readonly isMut: false;
              readonly isSigner: false;
            },
            {
              readonly name: "rent";
              readonly isMut: false;
              readonly isSigner: false;
            },
          ];
        },
        {
          readonly name: "mplTokenMetadata";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "data";
          readonly type: {
            readonly defined: "AnchorDataV2";
          };
        },
        {
          readonly name: "isMutable";
          readonly type: "bool";
        },
        {
          readonly name: "updateAuthorityIsSigner";
          readonly type: "bool";
        },
      ];
    },
    {
      readonly name: "updateLpMetadata";
      readonly accounts: readonly [
        {
          readonly name: "commonGovernance";
          readonly accounts: readonly [
            {
              readonly name: "pool";
              readonly isMut: true;
              readonly isSigner: false;
              readonly pda: {
                readonly seeds: readonly [
                  {
                    readonly kind: "const";
                    readonly type: "string";
                    readonly value: "two_pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool";
                  },
                  {
                    readonly kind: "account";
                    readonly type: "publicKey";
                    readonly account: "TwoPool";
                    readonly path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              readonly name: "governance";
              readonly isMut: false;
              readonly isSigner: true;
            },
          ];
        },
        {
          readonly name: "updateMetadataAccounts";
          readonly accounts: readonly [
            {
              readonly name: "metadata";
              readonly isMut: true;
              readonly isSigner: false;
            },
            {
              readonly name: "updateAuthority";
              readonly isMut: false;
              readonly isSigner: false;
            },
          ];
        },
        {
          readonly name: "mplTokenMetadata";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "newUpdateAuthority";
          readonly type: {
            readonly option: "publicKey";
          };
        },
        {
          readonly name: "data";
          readonly type: {
            readonly option: {
              readonly defined: "AnchorDataV2";
            };
          };
        },
        {
          readonly name: "primarySaleHappened";
          readonly type: {
            readonly option: "bool";
          };
        },
        {
          readonly name: "isMutable";
          readonly type: {
            readonly option: "bool";
          };
        },
      ];
    },
  ];
  readonly accounts: readonly [
    {
      readonly name: "twoPool";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "bump";
            readonly type: "u8";
          },
          {
            readonly name: "isPaused";
            readonly type: "bool";
          },
          {
            readonly name: "ampFactor";
            readonly type: {
              readonly defined: "AmpFactor";
            };
          },
          {
            readonly name: "lpFee";
            readonly type: {
              readonly defined: "PoolFee";
            };
          },
          {
            readonly name: "governanceFee";
            readonly type: {
              readonly defined: "PoolFee";
            };
          },
          {
            readonly name: "lpMintKey";
            readonly type: "publicKey";
          },
          {
            readonly name: "lpDecimalEqualizer";
            readonly type: "u8";
          },
          {
            readonly name: "tokenMintKeys";
            readonly type: {
              readonly array: readonly ["publicKey", 2];
            };
          },
          {
            readonly name: "tokenDecimalEqualizers";
            readonly type: {
              readonly array: readonly ["u8", 2];
            };
          },
          {
            readonly name: "tokenKeys";
            readonly type: {
              readonly array: readonly ["publicKey", 2];
            };
          },
          {
            readonly name: "pauseKey";
            readonly type: "publicKey";
          },
          {
            readonly name: "governanceKey";
            readonly type: "publicKey";
          },
          {
            readonly name: "governanceFeeKey";
            readonly type: "publicKey";
          },
          {
            readonly name: "preparedGovernanceKey";
            readonly type: "publicKey";
          },
          {
            readonly name: "governanceTransitionTs";
            readonly type: "i64";
          },
          {
            readonly name: "preparedLpFee";
            readonly type: {
              readonly defined: "PoolFee";
            };
          },
          {
            readonly name: "preparedGovernanceFee";
            readonly type: {
              readonly defined: "PoolFee";
            };
          },
          {
            readonly name: "feeTransitionTs";
            readonly type: "i64";
          },
          {
            readonly name: "previousDepth";
            readonly type: "u128";
          },
        ];
      };
    },
  ];
  readonly types: readonly [
    {
      readonly name: "AmpFactor";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "initialValue";
            readonly type: {
              readonly defined: "DecimalU64Anchor";
            };
          },
          {
            readonly name: "initialTs";
            readonly type: "i64";
          },
          {
            readonly name: "targetValue";
            readonly type: {
              readonly defined: "DecimalU64Anchor";
            };
          },
          {
            readonly name: "targetTs";
            readonly type: "i64";
          },
        ];
      };
    },
    {
      readonly name: "AddParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "inputAmounts";
            readonly type: {
              readonly array: readonly ["u64", 2];
            };
          },
          {
            readonly name: "minimumMintAmount";
            readonly type: "u64";
          },
        ];
      };
    },
    {
      readonly name: "AdjustAmpFactorParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "targetTs";
            readonly type: "i64";
          },
          {
            readonly name: "targetValue";
            readonly type: {
              readonly defined: "DecimalU64Anchor";
            };
          },
        ];
      };
    },
    {
      readonly name: "CreateLpMetadataParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "data";
            readonly type: {
              readonly defined: "AnchorDataV2";
            };
          },
          {
            readonly name: "isMutable";
            readonly type: "bool";
          },
          {
            readonly name: "updateAuthorityIsSigner";
            readonly type: "bool";
          },
        ];
      };
    },
    {
      readonly name: "AnchorDataV2";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "name";
            readonly docs: readonly ["The name of the asset"];
            readonly type: "string";
          },
          {
            readonly name: "symbol";
            readonly docs: readonly ["The symbol for the asset"];
            readonly type: "string";
          },
          {
            readonly name: "uri";
            readonly docs: readonly [
              "URI pointing to JSON representing the asset",
            ];
            readonly type: "string";
          },
          {
            readonly name: "sellerFeeBasisPoints";
            readonly docs: readonly [
              "Royalty basis points that goes to creators in secondary sales (0-10000)",
            ];
            readonly type: "u16";
          },
          {
            readonly name: "creators";
            readonly docs: readonly ["Array of creators, optional"];
            readonly type: {
              readonly option: {
                readonly vec: {
                  readonly defined: "AnchorCreator";
                };
              };
            };
          },
          {
            readonly name: "collection";
            readonly docs: readonly ["Collection"];
            readonly type: {
              readonly option: {
                readonly defined: "AnchorCollection";
              };
            };
          },
          {
            readonly name: "uses";
            readonly docs: readonly ["Uses"];
            readonly type: {
              readonly option: {
                readonly defined: "AnchorUses";
              };
            };
          },
        ];
      };
    },
    {
      readonly name: "AnchorCreator";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "address";
            readonly type: "publicKey";
          },
          {
            readonly name: "verified";
            readonly type: "bool";
          },
          {
            readonly name: "share";
            readonly type: "u8";
          },
        ];
      };
    },
    {
      readonly name: "AnchorUses";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "useMethod";
            readonly type: {
              readonly defined: "AnchorUseMethod";
            };
          },
          {
            readonly name: "remaining";
            readonly type: "u64";
          },
          {
            readonly name: "total";
            readonly type: "u64";
          },
        ];
      };
    },
    {
      readonly name: "AnchorCollection";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "verified";
            readonly type: "bool";
          },
          {
            readonly name: "key";
            readonly type: "publicKey";
          },
        ];
      };
    },
    {
      readonly name: "PrepareFeeChangeParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "lpFee";
            readonly type: {
              readonly defined: "DecimalU64Anchor";
            };
          },
          {
            readonly name: "governanceFee";
            readonly type: {
              readonly defined: "DecimalU64Anchor";
            };
          },
        ];
      };
    },
    {
      readonly name: "UpdateLpMetadataParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "newUpdateAuthority";
            readonly type: {
              readonly option: "publicKey";
            };
          },
          {
            readonly name: "data";
            readonly type: {
              readonly option: {
                readonly defined: "AnchorDataV2";
              };
            };
          },
          {
            readonly name: "primarySaleHappened";
            readonly type: {
              readonly option: "bool";
            };
          },
          {
            readonly name: "isMutable";
            readonly type: {
              readonly option: "bool";
            };
          },
        ];
      };
    },
    {
      readonly name: "InitializeParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "ampFactor";
            readonly type: {
              readonly defined: "DecimalU64Anchor";
            };
          },
          {
            readonly name: "lpFee";
            readonly type: {
              readonly defined: "DecimalU64Anchor";
            };
          },
          {
            readonly name: "governanceFee";
            readonly type: {
              readonly defined: "DecimalU64Anchor";
            };
          },
        ];
      };
    },
    {
      readonly name: "RemoveExactBurnParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "exactBurnAmount";
            readonly type: "u64";
          },
          {
            readonly name: "outputTokenIndex";
            readonly type: "u8";
          },
          {
            readonly name: "minimumOutputAmount";
            readonly type: "u64";
          },
        ];
      };
    },
    {
      readonly name: "RemoveExactOutputParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "maximumBurnAmount";
            readonly type: "u64";
          },
          {
            readonly name: "exactOutputAmounts";
            readonly type: {
              readonly array: readonly ["u64", 2];
            };
          },
        ];
      };
    },
    {
      readonly name: "RemoveUniformParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "exactBurnAmount";
            readonly type: "u64";
          },
          {
            readonly name: "minimumOutputAmounts";
            readonly type: {
              readonly array: readonly ["u64", 2];
            };
          },
        ];
      };
    },
    {
      readonly name: "SwapExactInputParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "exactInputAmounts";
            readonly type: {
              readonly array: readonly ["u64", 2];
            };
          },
          {
            readonly name: "outputTokenIndex";
            readonly type: "u8";
          },
          {
            readonly name: "minimumOutputAmount";
            readonly type: "u64";
          },
        ];
      };
    },
    {
      readonly name: "SwapExactOutputParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "maximumInputAmount";
            readonly type: "u64";
          },
          {
            readonly name: "inputTokenIndex";
            readonly type: "u8";
          },
          {
            readonly name: "exactOutputAmounts";
            readonly type: {
              readonly array: readonly ["u64", 2];
            };
          },
        ];
      };
    },
    {
      readonly name: "PoolFee";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "value";
            readonly type: "u32";
          },
        ];
      };
    },
    {
      readonly name: "DecimalU64Anchor";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "value";
            readonly type: "u64";
          },
          {
            readonly name: "decimals";
            readonly type: "u8";
          },
        ];
      };
    },
    {
      readonly name: "PoolError";
      readonly type: {
        readonly kind: "enum";
        readonly variants: readonly [
          {
            readonly name: "InvalidAmpFactorValue";
          },
          {
            readonly name: "InvalidAmpFactorTimestamp";
          },
          {
            readonly name: "InvalidFeeInput";
          },
          {
            readonly name: "DuplicateAccount";
          },
          {
            readonly name: "MintHasBalance";
          },
          {
            readonly name: "InvalidMintAuthority";
          },
          {
            readonly name: "MintHasFreezeAuthority";
          },
          {
            readonly name: "TokenAccountHasBalance";
          },
          {
            readonly name: "TokenAccountHasDelegate";
          },
          {
            readonly name: "TokenAccountHasCloseAuthority";
          },
          {
            readonly name: "InvalidGovernanceAccount";
          },
          {
            readonly name: "InvalidGovernanceFeeAccount";
          },
          {
            readonly name: "InvalidPoolAuthorityAccount";
          },
          {
            readonly name: "InvalidMintAccount";
          },
          {
            readonly name: "InsufficientDelay";
          },
          {
            readonly name: "InvalidEnact";
          },
          {
            readonly name: "PoolIsPaused";
          },
          {
            readonly name: "PoolTokenAccountExpected";
          },
          {
            readonly name: "OutsideSpecifiedLimits";
          },
          {
            readonly name: "InitialAddRequiresAllTokens";
          },
          {
            readonly name: "ImpossibleRemove";
          },
          {
            readonly name: "MaxDecimalDifferenceExceeded";
          },
          {
            readonly name: "InvalidTimestamp";
          },
          {
            readonly name: "AddRequiresAtLeastOneToken";
          },
          {
            readonly name: "InvalidSwapExactInputParameters";
          },
          {
            readonly name: "InvalidSwapExactOutputParameters";
          },
          {
            readonly name: "InvalidRemoveUniformParameters";
          },
          {
            readonly name: "InvalidRemoveExactBurnParameters";
          },
          {
            readonly name: "InvalidRemoveExactOutputParameters";
          },
          {
            readonly name: "InsufficientPoolTokenAccountBalance";
          },
          {
            readonly name: "InvalidTokenIndex";
          },
          {
            readonly name: "InvalidPauseKey";
          },
          {
            readonly name: "InvalidSwitchboardAccount";
          },
          {
            readonly name: "StaleFeed";
          },
          {
            readonly name: "ConfidenceIntervalExceeded";
          },
        ];
      };
    },
    {
      readonly name: "AnchorUseMethod";
      readonly type: {
        readonly kind: "enum";
        readonly variants: readonly [
          {
            readonly name: "Burn";
          },
          {
            readonly name: "Multiple";
          },
          {
            readonly name: "Single";
          },
        ];
      };
    },
  ];
  readonly errors: readonly [
    {
      readonly code: 6000;
      readonly name: "MaxDecimalsExceeded";
      readonly msg: "Maximum decimals exceeded";
    },
    {
      readonly code: 6001;
      readonly name: "ConversionError";
      readonly msg: "Conversion error";
    },
  ];
};

export const IDL: TwoPool = {
  version: "0.1.0",
  name: "two_pool",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "two_pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "pool_mint_0",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "pool_mint_1",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "lp_mint",
              },
            ],
          },
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poolMint0",
          isMut: false,
          isSigner: false,
        },
        {
          name: "poolMint1",
          isMut: false,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poolTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "pauseKey",
          isMut: false,
          isSigner: false,
        },
        {
          name: "governanceAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "governanceFeeAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ampFactor",
          type: {
            defined: "DecimalU64Anchor",
          },
        },
        {
          name: "lpFee",
          type: {
            defined: "DecimalU64Anchor",
          },
        },
        {
          name: "governanceFee",
          type: {
            defined: "DecimalU64Anchor",
          },
        },
      ],
    },
    {
      name: "add",
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "two_pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_0.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_1.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "lp_mint",
              },
            ],
          },
        },
        {
          name: "poolTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "governanceFee",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "userTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userLpTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "inputAmounts",
          type: {
            array: ["u64", 2],
          },
        },
        {
          name: "minimumMintAmount",
          type: "u64",
        },
      ],
      returns: "u64",
    },
    {
      name: "swapExactInput",
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "two_pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_0.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_1.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "lp_mint",
              },
            ],
          },
        },
        {
          name: "poolTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "governanceFee",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "userTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "exactInputAmounts",
          type: {
            array: ["u64", 2],
          },
        },
        {
          name: "outputTokenIndex",
          type: "u8",
        },
        {
          name: "minimumOutputAmount",
          type: "u64",
        },
      ],
      returns: "u64",
    },
    {
      name: "swapExactOutput",
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "two_pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_0.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_1.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "lp_mint",
              },
            ],
          },
        },
        {
          name: "poolTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "governanceFee",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "userTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "maximumInputAmount",
          type: "u64",
        },
        {
          name: "inputTokenIndex",
          type: "u8",
        },
        {
          name: "exactOutputAmounts",
          type: {
            array: ["u64", 2],
          },
        },
      ],
      returns: {
        vec: "u64",
      },
    },
    {
      name: "removeUniform",
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "two_pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_0.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_1.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "lp_mint",
              },
            ],
          },
        },
        {
          name: "poolTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "governanceFee",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "userTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userLpTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "exactBurnAmount",
          type: "u64",
        },
        {
          name: "minimumOutputAmounts",
          type: {
            array: ["u64", 2],
          },
        },
      ],
      returns: {
        vec: "u64",
      },
    },
    {
      name: "removeExactBurn",
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "two_pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_0.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_1.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "lp_mint",
              },
            ],
          },
        },
        {
          name: "poolTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "governanceFee",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "userTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userLpTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "exactBurnAmount",
          type: "u64",
        },
        {
          name: "outputTokenIndex",
          type: "u8",
        },
        {
          name: "minimumOutputAmount",
          type: "u64",
        },
      ],
      returns: "u64",
    },
    {
      name: "removeExactOutput",
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "two_pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_0.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_1.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "lp_mint",
              },
            ],
          },
        },
        {
          name: "poolTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "governanceFee",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "userTokenAccount0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userLpTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "maximumBurnAmount",
          type: "u64",
        },
        {
          name: "exactOutputAmounts",
          type: {
            array: ["u64", 2],
          },
        },
      ],
      returns: {
        vec: "u64",
      },
    },
    {
      name: "marginalPrices",
      accounts: [
        {
          name: "pool",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "two_pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_0.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TokenAccount",
                path: "pool_token_account_1.mint",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "lp_mint",
              },
            ],
          },
        },
        {
          name: "poolTokenAccount0",
          isMut: false,
          isSigner: false,
        },
        {
          name: "poolTokenAccount1",
          isMut: false,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
      returns: {
        array: [
          {
            defined: "DecimalU64Anchor",
          },
          2,
        ],
      },
    },
    {
      name: "prepareGovernanceTransition",
      docs: ["Governance Ixs *"],
      accounts: [
        {
          name: "commonGovernance",
          accounts: [
            {
              name: "pool",
              isMut: true,
              isSigner: false,
              pda: {
                seeds: [
                  {
                    kind: "const",
                    type: "string",
                    value: "two_pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool.lp_mint_key",
                  },
                ],
              },
            },
            {
              name: "governance",
              isMut: false,
              isSigner: true,
            },
          ],
        },
      ],
      args: [
        {
          name: "upcomingGovernanceKey",
          type: "publicKey",
        },
      ],
    },
    {
      name: "enactGovernanceTransition",
      accounts: [
        {
          name: "commonGovernance",
          accounts: [
            {
              name: "pool",
              isMut: true,
              isSigner: false,
              pda: {
                seeds: [
                  {
                    kind: "const",
                    type: "string",
                    value: "two_pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool.lp_mint_key",
                  },
                ],
              },
            },
            {
              name: "governance",
              isMut: false,
              isSigner: true,
            },
          ],
        },
      ],
      args: [],
    },
    {
      name: "prepareFeeChange",
      accounts: [
        {
          name: "commonGovernance",
          accounts: [
            {
              name: "pool",
              isMut: true,
              isSigner: false,
              pda: {
                seeds: [
                  {
                    kind: "const",
                    type: "string",
                    value: "two_pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool.lp_mint_key",
                  },
                ],
              },
            },
            {
              name: "governance",
              isMut: false,
              isSigner: true,
            },
          ],
        },
      ],
      args: [
        {
          name: "lpFee",
          type: {
            defined: "DecimalU64Anchor",
          },
        },
        {
          name: "governanceFee",
          type: {
            defined: "DecimalU64Anchor",
          },
        },
      ],
    },
    {
      name: "enactFeeChange",
      accounts: [
        {
          name: "commonGovernance",
          accounts: [
            {
              name: "pool",
              isMut: true,
              isSigner: false,
              pda: {
                seeds: [
                  {
                    kind: "const",
                    type: "string",
                    value: "two_pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool.lp_mint_key",
                  },
                ],
              },
            },
            {
              name: "governance",
              isMut: false,
              isSigner: true,
            },
          ],
        },
      ],
      args: [],
    },
    {
      name: "changeGovernanceFeeAccount",
      accounts: [
        {
          name: "commonGovernance",
          accounts: [
            {
              name: "pool",
              isMut: true,
              isSigner: false,
              pda: {
                seeds: [
                  {
                    kind: "const",
                    type: "string",
                    value: "two_pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool.lp_mint_key",
                  },
                ],
              },
            },
            {
              name: "governance",
              isMut: false,
              isSigner: true,
            },
          ],
        },
        {
          name: "newGovernanceFee",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "newGovernanceFeeKey",
          type: "publicKey",
        },
      ],
    },
    {
      name: "adjustAmpFactor",
      accounts: [
        {
          name: "commonGovernance",
          accounts: [
            {
              name: "pool",
              isMut: true,
              isSigner: false,
              pda: {
                seeds: [
                  {
                    kind: "const",
                    type: "string",
                    value: "two_pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool.lp_mint_key",
                  },
                ],
              },
            },
            {
              name: "governance",
              isMut: false,
              isSigner: true,
            },
          ],
        },
      ],
      args: [
        {
          name: "targetTs",
          type: "i64",
        },
        {
          name: "targetValue",
          type: {
            defined: "DecimalU64Anchor",
          },
        },
      ],
    },
    {
      name: "setPaused",
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "two_pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TwoPool",
                path: "pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TwoPool",
                path: "pool",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "TwoPool",
                path: "pool.lp_mint_key",
              },
            ],
          },
        },
        {
          name: "pauseKey",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "paused",
          type: "bool",
        },
      ],
    },
    {
      name: "changePauseKey",
      accounts: [
        {
          name: "commonGovernance",
          accounts: [
            {
              name: "pool",
              isMut: true,
              isSigner: false,
              pda: {
                seeds: [
                  {
                    kind: "const",
                    type: "string",
                    value: "two_pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool.lp_mint_key",
                  },
                ],
              },
            },
            {
              name: "governance",
              isMut: false,
              isSigner: true,
            },
          ],
        },
      ],
      args: [
        {
          name: "newPauseKey",
          type: "publicKey",
        },
      ],
    },
    {
      name: "createLpMetadata",
      accounts: [
        {
          name: "commonGovernance",
          accounts: [
            {
              name: "pool",
              isMut: true,
              isSigner: false,
              pda: {
                seeds: [
                  {
                    kind: "const",
                    type: "string",
                    value: "two_pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool.lp_mint_key",
                  },
                ],
              },
            },
            {
              name: "governance",
              isMut: false,
              isSigner: true,
            },
          ],
        },
        {
          name: "createMetadataAccounts",
          accounts: [
            {
              name: "metadata",
              isMut: true,
              isSigner: false,
            },
            {
              name: "mint",
              isMut: false,
              isSigner: false,
            },
            {
              name: "mintAuthority",
              isMut: false,
              isSigner: false,
            },
            {
              name: "payer",
              isMut: true,
              isSigner: true,
            },
            {
              name: "updateAuthority",
              isMut: false,
              isSigner: false,
            },
            {
              name: "systemProgram",
              isMut: false,
              isSigner: false,
            },
            {
              name: "rent",
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: "mplTokenMetadata",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "data",
          type: {
            defined: "AnchorDataV2",
          },
        },
        {
          name: "isMutable",
          type: "bool",
        },
        {
          name: "updateAuthorityIsSigner",
          type: "bool",
        },
      ],
    },
    {
      name: "updateLpMetadata",
      accounts: [
        {
          name: "commonGovernance",
          accounts: [
            {
              name: "pool",
              isMut: true,
              isSigner: false,
              pda: {
                seeds: [
                  {
                    kind: "const",
                    type: "string",
                    value: "two_pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool",
                  },
                  {
                    kind: "account",
                    type: "publicKey",
                    account: "TwoPool",
                    path: "pool.lp_mint_key",
                  },
                ],
              },
            },
            {
              name: "governance",
              isMut: false,
              isSigner: true,
            },
          ],
        },
        {
          name: "updateMetadataAccounts",
          accounts: [
            {
              name: "metadata",
              isMut: true,
              isSigner: false,
            },
            {
              name: "updateAuthority",
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: "mplTokenMetadata",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "newUpdateAuthority",
          type: {
            option: "publicKey",
          },
        },
        {
          name: "data",
          type: {
            option: {
              defined: "AnchorDataV2",
            },
          },
        },
        {
          name: "primarySaleHappened",
          type: {
            option: "bool",
          },
        },
        {
          name: "isMutable",
          type: {
            option: "bool",
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "twoPool",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "isPaused",
            type: "bool",
          },
          {
            name: "ampFactor",
            type: {
              defined: "AmpFactor",
            },
          },
          {
            name: "lpFee",
            type: {
              defined: "PoolFee",
            },
          },
          {
            name: "governanceFee",
            type: {
              defined: "PoolFee",
            },
          },
          {
            name: "lpMintKey",
            type: "publicKey",
          },
          {
            name: "lpDecimalEqualizer",
            type: "u8",
          },
          {
            name: "tokenMintKeys",
            type: {
              array: ["publicKey", 2],
            },
          },
          {
            name: "tokenDecimalEqualizers",
            type: {
              array: ["u8", 2],
            },
          },
          {
            name: "tokenKeys",
            type: {
              array: ["publicKey", 2],
            },
          },
          {
            name: "pauseKey",
            type: "publicKey",
          },
          {
            name: "governanceKey",
            type: "publicKey",
          },
          {
            name: "governanceFeeKey",
            type: "publicKey",
          },
          {
            name: "preparedGovernanceKey",
            type: "publicKey",
          },
          {
            name: "governanceTransitionTs",
            type: "i64",
          },
          {
            name: "preparedLpFee",
            type: {
              defined: "PoolFee",
            },
          },
          {
            name: "preparedGovernanceFee",
            type: {
              defined: "PoolFee",
            },
          },
          {
            name: "feeTransitionTs",
            type: "i64",
          },
          {
            name: "previousDepth",
            type: "u128",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "AmpFactor",
      type: {
        kind: "struct",
        fields: [
          {
            name: "initialValue",
            type: {
              defined: "DecimalU64Anchor",
            },
          },
          {
            name: "initialTs",
            type: "i64",
          },
          {
            name: "targetValue",
            type: {
              defined: "DecimalU64Anchor",
            },
          },
          {
            name: "targetTs",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "AddParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "inputAmounts",
            type: {
              array: ["u64", 2],
            },
          },
          {
            name: "minimumMintAmount",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "AdjustAmpFactorParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "targetTs",
            type: "i64",
          },
          {
            name: "targetValue",
            type: {
              defined: "DecimalU64Anchor",
            },
          },
        ],
      },
    },
    {
      name: "CreateLpMetadataParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "data",
            type: {
              defined: "AnchorDataV2",
            },
          },
          {
            name: "isMutable",
            type: "bool",
          },
          {
            name: "updateAuthorityIsSigner",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "AnchorDataV2",
      type: {
        kind: "struct",
        fields: [
          {
            name: "name",
            docs: ["The name of the asset"],
            type: "string",
          },
          {
            name: "symbol",
            docs: ["The symbol for the asset"],
            type: "string",
          },
          {
            name: "uri",
            docs: ["URI pointing to JSON representing the asset"],
            type: "string",
          },
          {
            name: "sellerFeeBasisPoints",
            docs: [
              "Royalty basis points that goes to creators in secondary sales (0-10000)",
            ],
            type: "u16",
          },
          {
            name: "creators",
            docs: ["Array of creators, optional"],
            type: {
              option: {
                vec: {
                  defined: "AnchorCreator",
                },
              },
            },
          },
          {
            name: "collection",
            docs: ["Collection"],
            type: {
              option: {
                defined: "AnchorCollection",
              },
            },
          },
          {
            name: "uses",
            docs: ["Uses"],
            type: {
              option: {
                defined: "AnchorUses",
              },
            },
          },
        ],
      },
    },
    {
      name: "AnchorCreator",
      type: {
        kind: "struct",
        fields: [
          {
            name: "address",
            type: "publicKey",
          },
          {
            name: "verified",
            type: "bool",
          },
          {
            name: "share",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "AnchorUses",
      type: {
        kind: "struct",
        fields: [
          {
            name: "useMethod",
            type: {
              defined: "AnchorUseMethod",
            },
          },
          {
            name: "remaining",
            type: "u64",
          },
          {
            name: "total",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "AnchorCollection",
      type: {
        kind: "struct",
        fields: [
          {
            name: "verified",
            type: "bool",
          },
          {
            name: "key",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "PrepareFeeChangeParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "lpFee",
            type: {
              defined: "DecimalU64Anchor",
            },
          },
          {
            name: "governanceFee",
            type: {
              defined: "DecimalU64Anchor",
            },
          },
        ],
      },
    },
    {
      name: "UpdateLpMetadataParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "newUpdateAuthority",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "data",
            type: {
              option: {
                defined: "AnchorDataV2",
              },
            },
          },
          {
            name: "primarySaleHappened",
            type: {
              option: "bool",
            },
          },
          {
            name: "isMutable",
            type: {
              option: "bool",
            },
          },
        ],
      },
    },
    {
      name: "InitializeParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "ampFactor",
            type: {
              defined: "DecimalU64Anchor",
            },
          },
          {
            name: "lpFee",
            type: {
              defined: "DecimalU64Anchor",
            },
          },
          {
            name: "governanceFee",
            type: {
              defined: "DecimalU64Anchor",
            },
          },
        ],
      },
    },
    {
      name: "RemoveExactBurnParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "exactBurnAmount",
            type: "u64",
          },
          {
            name: "outputTokenIndex",
            type: "u8",
          },
          {
            name: "minimumOutputAmount",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "RemoveExactOutputParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "maximumBurnAmount",
            type: "u64",
          },
          {
            name: "exactOutputAmounts",
            type: {
              array: ["u64", 2],
            },
          },
        ],
      },
    },
    {
      name: "RemoveUniformParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "exactBurnAmount",
            type: "u64",
          },
          {
            name: "minimumOutputAmounts",
            type: {
              array: ["u64", 2],
            },
          },
        ],
      },
    },
    {
      name: "SwapExactInputParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "exactInputAmounts",
            type: {
              array: ["u64", 2],
            },
          },
          {
            name: "outputTokenIndex",
            type: "u8",
          },
          {
            name: "minimumOutputAmount",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "SwapExactOutputParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "maximumInputAmount",
            type: "u64",
          },
          {
            name: "inputTokenIndex",
            type: "u8",
          },
          {
            name: "exactOutputAmounts",
            type: {
              array: ["u64", 2],
            },
          },
        ],
      },
    },
    {
      name: "PoolFee",
      type: {
        kind: "struct",
        fields: [
          {
            name: "value",
            type: "u32",
          },
        ],
      },
    },
    {
      name: "DecimalU64Anchor",
      type: {
        kind: "struct",
        fields: [
          {
            name: "value",
            type: "u64",
          },
          {
            name: "decimals",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "PoolError",
      type: {
        kind: "enum",
        variants: [
          {
            name: "InvalidAmpFactorValue",
          },
          {
            name: "InvalidAmpFactorTimestamp",
          },
          {
            name: "InvalidFeeInput",
          },
          {
            name: "DuplicateAccount",
          },
          {
            name: "MintHasBalance",
          },
          {
            name: "InvalidMintAuthority",
          },
          {
            name: "MintHasFreezeAuthority",
          },
          {
            name: "TokenAccountHasBalance",
          },
          {
            name: "TokenAccountHasDelegate",
          },
          {
            name: "TokenAccountHasCloseAuthority",
          },
          {
            name: "InvalidGovernanceAccount",
          },
          {
            name: "InvalidGovernanceFeeAccount",
          },
          {
            name: "InvalidPoolAuthorityAccount",
          },
          {
            name: "InvalidMintAccount",
          },
          {
            name: "InsufficientDelay",
          },
          {
            name: "InvalidEnact",
          },
          {
            name: "PoolIsPaused",
          },
          {
            name: "PoolTokenAccountExpected",
          },
          {
            name: "OutsideSpecifiedLimits",
          },
          {
            name: "InitialAddRequiresAllTokens",
          },
          {
            name: "ImpossibleRemove",
          },
          {
            name: "MaxDecimalDifferenceExceeded",
          },
          {
            name: "InvalidTimestamp",
          },
          {
            name: "AddRequiresAtLeastOneToken",
          },
          {
            name: "InvalidSwapExactInputParameters",
          },
          {
            name: "InvalidSwapExactOutputParameters",
          },
          {
            name: "InvalidRemoveUniformParameters",
          },
          {
            name: "InvalidRemoveExactBurnParameters",
          },
          {
            name: "InvalidRemoveExactOutputParameters",
          },
          {
            name: "InsufficientPoolTokenAccountBalance",
          },
          {
            name: "InvalidTokenIndex",
          },
          {
            name: "InvalidPauseKey",
          },
          {
            name: "InvalidSwitchboardAccount",
          },
          {
            name: "StaleFeed",
          },
          {
            name: "ConfidenceIntervalExceeded",
          },
        ],
      },
    },
    {
      name: "AnchorUseMethod",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Burn",
          },
          {
            name: "Multiple",
          },
          {
            name: "Single",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "MaxDecimalsExceeded",
      msg: "Maximum decimals exceeded",
    },
    {
      code: 6001,
      name: "ConversionError",
      msg: "Conversion error",
    },
  ],
};

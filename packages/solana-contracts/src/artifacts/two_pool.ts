export type TwoPool = {
  version: "0.1.0";
  name: "two_pool";
  instructions: [
    {
      name: "initialize";
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "two_pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "pool_mint_0";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "pool_mint_1";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "lp_mint";
              },
            ];
          };
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poolMint0";
          isMut: false;
          isSigner: false;
        },
        {
          name: "poolMint1";
          isMut: false;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poolTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "pauseKey";
          isMut: false;
          isSigner: false;
        },
        {
          name: "governanceAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "governanceFeeAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "ampFactor";
          type: {
            defined: "DecimalU64Anchor";
          };
        },
        {
          name: "lpFee";
          type: {
            defined: "DecimalU64Anchor";
          };
        },
        {
          name: "governanceFee";
          type: {
            defined: "DecimalU64Anchor";
          };
        },
      ];
    },
    {
      name: "add";
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "two_pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_0.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_1.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "lp_mint";
              },
            ];
          };
        },
        {
          name: "poolTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "governanceFee";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTransferAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "userTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userLpTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "inputAmounts";
          type: {
            array: ["u64", 2];
          };
        },
        {
          name: "minimumMintAmount";
          type: "u64";
        },
      ];
      returns: "u64";
    },
    {
      name: "swapExactInput";
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "two_pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_0.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_1.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "lp_mint";
              },
            ];
          };
        },
        {
          name: "poolTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "governanceFee";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTransferAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "userTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "exactInputAmounts";
          type: {
            array: ["u64", 2];
          };
        },
        {
          name: "outputTokenIndex";
          type: "u8";
        },
        {
          name: "minimumOutputAmount";
          type: "u64";
        },
      ];
      returns: "u64";
    },
    {
      name: "swapExactOutput";
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "two_pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_0.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_1.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "lp_mint";
              },
            ];
          };
        },
        {
          name: "poolTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "governanceFee";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTransferAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "userTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "maximumInputAmount";
          type: "u64";
        },
        {
          name: "inputTokenIndex";
          type: "u8";
        },
        {
          name: "exactOutputAmounts";
          type: {
            array: ["u64", 2];
          };
        },
      ];
      returns: {
        vec: "u64";
      };
    },
    {
      name: "removeUniform";
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "two_pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_0.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_1.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "lp_mint";
              },
            ];
          };
        },
        {
          name: "poolTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "governanceFee";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTransferAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "userTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userLpTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "exactBurnAmount";
          type: "u64";
        },
        {
          name: "minimumOutputAmounts";
          type: {
            array: ["u64", 2];
          };
        },
      ];
      returns: {
        vec: "u64";
      };
    },
    {
      name: "removeExactBurn";
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "two_pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_0.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_1.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "lp_mint";
              },
            ];
          };
        },
        {
          name: "poolTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "governanceFee";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTransferAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "userTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userLpTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "exactBurnAmount";
          type: "u64";
        },
        {
          name: "outputTokenIndex";
          type: "u8";
        },
        {
          name: "minimumOutputAmount";
          type: "u64";
        },
      ];
      returns: "u64";
    },
    {
      name: "removeExactOutput";
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "two_pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_0.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_1.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "lp_mint";
              },
            ];
          };
        },
        {
          name: "poolTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "governanceFee";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTransferAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "userTokenAccount0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userLpTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "maximumBurnAmount";
          type: "u64";
        },
        {
          name: "exactOutputAmounts";
          type: {
            array: ["u64", 2];
          };
        },
      ];
      returns: {
        vec: "u64";
      };
    },
    {
      name: "marginalPrices";
      accounts: [
        {
          name: "pool";
          isMut: false;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "two_pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_0.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TokenAccount";
                path: "pool_token_account_1.mint";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "Mint";
                path: "lp_mint";
              },
            ];
          };
        },
        {
          name: "poolTokenAccount0";
          isMut: false;
          isSigner: false;
        },
        {
          name: "poolTokenAccount1";
          isMut: false;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
      returns: {
        array: [
          {
            defined: "DecimalU64Anchor";
          },
          2,
        ];
      };
    },
    {
      name: "prepareGovernanceTransition";
      docs: ["Governance Ixs *"];
      accounts: [
        {
          name: "commonGovernance";
          accounts: [
            {
              name: "pool";
              isMut: true;
              isSigner: false;
              pda: {
                seeds: [
                  {
                    kind: "const";
                    type: "string";
                    value: "two_pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              name: "governance";
              isMut: false;
              isSigner: true;
            },
          ];
        },
      ];
      args: [
        {
          name: "upcomingGovernanceKey";
          type: "publicKey";
        },
      ];
    },
    {
      name: "enactGovernanceTransition";
      accounts: [
        {
          name: "commonGovernance";
          accounts: [
            {
              name: "pool";
              isMut: true;
              isSigner: false;
              pda: {
                seeds: [
                  {
                    kind: "const";
                    type: "string";
                    value: "two_pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              name: "governance";
              isMut: false;
              isSigner: true;
            },
          ];
        },
      ];
      args: [];
    },
    {
      name: "prepareFeeChange";
      accounts: [
        {
          name: "commonGovernance";
          accounts: [
            {
              name: "pool";
              isMut: true;
              isSigner: false;
              pda: {
                seeds: [
                  {
                    kind: "const";
                    type: "string";
                    value: "two_pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              name: "governance";
              isMut: false;
              isSigner: true;
            },
          ];
        },
      ];
      args: [
        {
          name: "lpFee";
          type: {
            defined: "DecimalU64Anchor";
          };
        },
        {
          name: "governanceFee";
          type: {
            defined: "DecimalU64Anchor";
          };
        },
      ];
    },
    {
      name: "enactFeeChange";
      accounts: [
        {
          name: "commonGovernance";
          accounts: [
            {
              name: "pool";
              isMut: true;
              isSigner: false;
              pda: {
                seeds: [
                  {
                    kind: "const";
                    type: "string";
                    value: "two_pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              name: "governance";
              isMut: false;
              isSigner: true;
            },
          ];
        },
      ];
      args: [];
    },
    {
      name: "changeGovernanceFeeAccount";
      accounts: [
        {
          name: "commonGovernance";
          accounts: [
            {
              name: "pool";
              isMut: true;
              isSigner: false;
              pda: {
                seeds: [
                  {
                    kind: "const";
                    type: "string";
                    value: "two_pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              name: "governance";
              isMut: false;
              isSigner: true;
            },
          ];
        },
        {
          name: "newGovernanceFee";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "newGovernanceFeeKey";
          type: "publicKey";
        },
      ];
    },
    {
      name: "adjustAmpFactor";
      accounts: [
        {
          name: "commonGovernance";
          accounts: [
            {
              name: "pool";
              isMut: true;
              isSigner: false;
              pda: {
                seeds: [
                  {
                    kind: "const";
                    type: "string";
                    value: "two_pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              name: "governance";
              isMut: false;
              isSigner: true;
            },
          ];
        },
      ];
      args: [
        {
          name: "targetTs";
          type: "i64";
        },
        {
          name: "targetValue";
          type: {
            defined: "DecimalU64Anchor";
          };
        },
      ];
    },
    {
      name: "setPaused";
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: "const";
                type: "string";
                value: "two_pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TwoPool";
                path: "pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TwoPool";
                path: "pool";
              },
              {
                kind: "account";
                type: "publicKey";
                account: "TwoPool";
                path: "pool.lp_mint_key";
              },
            ];
          };
        },
        {
          name: "pauseKey";
          isMut: false;
          isSigner: true;
        },
      ];
      args: [
        {
          name: "paused";
          type: "bool";
        },
      ];
    },
    {
      name: "changePauseKey";
      accounts: [
        {
          name: "commonGovernance";
          accounts: [
            {
              name: "pool";
              isMut: true;
              isSigner: false;
              pda: {
                seeds: [
                  {
                    kind: "const";
                    type: "string";
                    value: "two_pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              name: "governance";
              isMut: false;
              isSigner: true;
            },
          ];
        },
      ];
      args: [
        {
          name: "newPauseKey";
          type: "publicKey";
        },
      ];
    },
    {
      name: "createLpMetadata";
      accounts: [
        {
          name: "commonGovernance";
          accounts: [
            {
              name: "pool";
              isMut: true;
              isSigner: false;
              pda: {
                seeds: [
                  {
                    kind: "const";
                    type: "string";
                    value: "two_pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              name: "governance";
              isMut: false;
              isSigner: true;
            },
          ];
        },
        {
          name: "createMetadataAccounts";
          accounts: [
            {
              name: "metadata";
              isMut: true;
              isSigner: false;
            },
            {
              name: "mint";
              isMut: false;
              isSigner: false;
            },
            {
              name: "mintAuthority";
              isMut: false;
              isSigner: false;
            },
            {
              name: "payer";
              isMut: true;
              isSigner: true;
            },
            {
              name: "updateAuthority";
              isMut: false;
              isSigner: false;
            },
            {
              name: "systemProgram";
              isMut: false;
              isSigner: false;
            },
            {
              name: "rent";
              isMut: false;
              isSigner: false;
            },
          ];
        },
        {
          name: "mplTokenMetadata";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "data";
          type: {
            defined: "AnchorDataV2";
          };
        },
        {
          name: "isMutable";
          type: "bool";
        },
        {
          name: "updateAuthorityIsSigner";
          type: "bool";
        },
      ];
    },
    {
      name: "updateLpMetadata";
      accounts: [
        {
          name: "commonGovernance";
          accounts: [
            {
              name: "pool";
              isMut: true;
              isSigner: false;
              pda: {
                seeds: [
                  {
                    kind: "const";
                    type: "string";
                    value: "two_pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool";
                  },
                  {
                    kind: "account";
                    type: "publicKey";
                    account: "TwoPool";
                    path: "pool.lp_mint_key";
                  },
                ];
              };
            },
            {
              name: "governance";
              isMut: false;
              isSigner: true;
            },
          ];
        },
        {
          name: "updateMetadataAccounts";
          accounts: [
            {
              name: "metadata";
              isMut: true;
              isSigner: false;
            },
            {
              name: "updateAuthority";
              isMut: false;
              isSigner: false;
            },
          ];
        },
        {
          name: "mplTokenMetadata";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "newUpdateAuthority";
          type: {
            option: "publicKey";
          };
        },
        {
          name: "data";
          type: {
            option: {
              defined: "AnchorDataV2";
            };
          };
        },
        {
          name: "primarySaleHappened";
          type: {
            option: "bool";
          };
        },
        {
          name: "isMutable";
          type: {
            option: "bool";
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: "twoPool";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "isPaused";
            type: "bool";
          },
          {
            name: "ampFactor";
            type: {
              defined: "AmpFactor";
            };
          },
          {
            name: "lpFee";
            type: {
              defined: "PoolFee";
            };
          },
          {
            name: "governanceFee";
            type: {
              defined: "PoolFee";
            };
          },
          {
            name: "lpMintKey";
            type: "publicKey";
          },
          {
            name: "lpDecimalEqualizer";
            type: "u8";
          },
          {
            name: "tokenMintKeys";
            type: {
              array: ["publicKey", 2];
            };
          },
          {
            name: "tokenDecimalEqualizers";
            type: {
              array: ["u8", 2];
            };
          },
          {
            name: "tokenKeys";
            type: {
              array: ["publicKey", 2];
            };
          },
          {
            name: "pauseKey";
            type: "publicKey";
          },
          {
            name: "governanceKey";
            type: "publicKey";
          },
          {
            name: "governanceFeeKey";
            type: "publicKey";
          },
          {
            name: "preparedGovernanceKey";
            type: "publicKey";
          },
          {
            name: "governanceTransitionTs";
            type: "i64";
          },
          {
            name: "preparedLpFee";
            type: {
              defined: "PoolFee";
            };
          },
          {
            name: "preparedGovernanceFee";
            type: {
              defined: "PoolFee";
            };
          },
          {
            name: "feeTransitionTs";
            type: "i64";
          },
          {
            name: "previousDepth";
            type: "u128";
          },
        ];
      };
    },
  ];
  types: [
    {
      name: "AmpFactor";
      type: {
        kind: "struct";
        fields: [
          {
            name: "initialValue";
            type: {
              defined: "DecimalU64Anchor";
            };
          },
          {
            name: "initialTs";
            type: "i64";
          },
          {
            name: "targetValue";
            type: {
              defined: "DecimalU64Anchor";
            };
          },
          {
            name: "targetTs";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "AddParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "inputAmounts";
            type: {
              array: ["u64", 2];
            };
          },
          {
            name: "minimumMintAmount";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "AdjustAmpFactorParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "targetTs";
            type: "i64";
          },
          {
            name: "targetValue";
            type: {
              defined: "DecimalU64Anchor";
            };
          },
        ];
      };
    },
    {
      name: "CreateLpMetadataParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "data";
            type: {
              defined: "AnchorDataV2";
            };
          },
          {
            name: "isMutable";
            type: "bool";
          },
          {
            name: "updateAuthorityIsSigner";
            type: "bool";
          },
        ];
      };
    },
    {
      name: "AnchorDataV2";
      type: {
        kind: "struct";
        fields: [
          {
            name: "name";
            docs: ["The name of the asset"];
            type: "string";
          },
          {
            name: "symbol";
            docs: ["The symbol for the asset"];
            type: "string";
          },
          {
            name: "uri";
            docs: ["URI pointing to JSON representing the asset"];
            type: "string";
          },
          {
            name: "sellerFeeBasisPoints";
            docs: [
              "Royalty basis points that goes to creators in secondary sales (0-10000)",
            ];
            type: "u16";
          },
          {
            name: "creators";
            docs: ["Array of creators, optional"];
            type: {
              option: {
                vec: {
                  defined: "AnchorCreator";
                };
              };
            };
          },
          {
            name: "collection";
            docs: ["Collection"];
            type: {
              option: {
                defined: "AnchorCollection";
              };
            };
          },
          {
            name: "uses";
            docs: ["Uses"];
            type: {
              option: {
                defined: "AnchorUses";
              };
            };
          },
        ];
      };
    },
    {
      name: "AnchorCreator";
      type: {
        kind: "struct";
        fields: [
          {
            name: "address";
            type: "publicKey";
          },
          {
            name: "verified";
            type: "bool";
          },
          {
            name: "share";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "AnchorUses";
      type: {
        kind: "struct";
        fields: [
          {
            name: "useMethod";
            type: {
              defined: "AnchorUseMethod";
            };
          },
          {
            name: "remaining";
            type: "u64";
          },
          {
            name: "total";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "AnchorCollection";
      type: {
        kind: "struct";
        fields: [
          {
            name: "verified";
            type: "bool";
          },
          {
            name: "key";
            type: "publicKey";
          },
        ];
      };
    },
    {
      name: "PrepareFeeChangeParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "lpFee";
            type: {
              defined: "DecimalU64Anchor";
            };
          },
          {
            name: "governanceFee";
            type: {
              defined: "DecimalU64Anchor";
            };
          },
        ];
      };
    },
    {
      name: "UpdateLpMetadataParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "newUpdateAuthority";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "data";
            type: {
              option: {
                defined: "AnchorDataV2";
              };
            };
          },
          {
            name: "primarySaleHappened";
            type: {
              option: "bool";
            };
          },
          {
            name: "isMutable";
            type: {
              option: "bool";
            };
          },
        ];
      };
    },
    {
      name: "InitializeParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "ampFactor";
            type: {
              defined: "DecimalU64Anchor";
            };
          },
          {
            name: "lpFee";
            type: {
              defined: "DecimalU64Anchor";
            };
          },
          {
            name: "governanceFee";
            type: {
              defined: "DecimalU64Anchor";
            };
          },
        ];
      };
    },
    {
      name: "RemoveExactBurnParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "exactBurnAmount";
            type: "u64";
          },
          {
            name: "outputTokenIndex";
            type: "u8";
          },
          {
            name: "minimumOutputAmount";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "RemoveExactOutputParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "maximumBurnAmount";
            type: "u64";
          },
          {
            name: "exactOutputAmounts";
            type: {
              array: ["u64", 2];
            };
          },
        ];
      };
    },
    {
      name: "RemoveUniformParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "exactBurnAmount";
            type: "u64";
          },
          {
            name: "minimumOutputAmounts";
            type: {
              array: ["u64", 2];
            };
          },
        ];
      };
    },
    {
      name: "SwapExactInputParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "exactInputAmounts";
            type: {
              array: ["u64", 2];
            };
          },
          {
            name: "outputTokenIndex";
            type: "u8";
          },
          {
            name: "minimumOutputAmount";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "SwapExactOutputParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "maximumInputAmount";
            type: "u64";
          },
          {
            name: "inputTokenIndex";
            type: "u8";
          },
          {
            name: "exactOutputAmounts";
            type: {
              array: ["u64", 2];
            };
          },
        ];
      };
    },
    {
      name: "PoolFee";
      type: {
        kind: "struct";
        fields: [
          {
            name: "value";
            type: "u32";
          },
        ];
      };
    },
    {
      name: "DecimalU64Anchor";
      type: {
        kind: "struct";
        fields: [
          {
            name: "value";
            type: "u64";
          },
          {
            name: "decimals";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "PoolError";
      type: {
        kind: "enum";
        variants: [
          {
            name: "InvalidAmpFactorValue";
          },
          {
            name: "InvalidAmpFactorTimestamp";
          },
          {
            name: "InvalidFeeInput";
          },
          {
            name: "DuplicateAccount";
          },
          {
            name: "MintHasBalance";
          },
          {
            name: "InvalidMintAuthority";
          },
          {
            name: "MintHasFreezeAuthority";
          },
          {
            name: "TokenAccountHasBalance";
          },
          {
            name: "TokenAccountHasDelegate";
          },
          {
            name: "TokenAccountHasCloseAuthority";
          },
          {
            name: "InvalidGovernanceAccount";
          },
          {
            name: "InvalidGovernanceFeeAccount";
          },
          {
            name: "InvalidPoolAuthorityAccount";
          },
          {
            name: "InvalidMintAccount";
          },
          {
            name: "InsufficientDelay";
          },
          {
            name: "InvalidEnact";
          },
          {
            name: "PoolIsPaused";
          },
          {
            name: "PoolTokenAccountExpected";
          },
          {
            name: "OutsideSpecifiedLimits";
          },
          {
            name: "InitialAddRequiresAllTokens";
          },
          {
            name: "ImpossibleRemove";
          },
          {
            name: "MaxDecimalDifferenceExceeded";
          },
          {
            name: "InvalidTimestamp";
          },
          {
            name: "AddRequiresAtLeastOneToken";
          },
          {
            name: "InvalidSwapExactInputParameters";
          },
          {
            name: "InvalidSwapExactOutputParameters";
          },
          {
            name: "InvalidRemoveUniformParameters";
          },
          {
            name: "InvalidRemoveExactBurnParameters";
          },
          {
            name: "InvalidRemoveExactOutputParameters";
          },
          {
            name: "InsufficientPoolTokenAccountBalance";
          },
          {
            name: "InvalidTokenIndex";
          },
          {
            name: "InvalidPauseKey";
          },
          {
            name: "InvalidSwitchboardAccount";
          },
          {
            name: "StaleFeed";
          },
          {
            name: "ConfidenceIntervalExceeded";
          },
        ];
      };
    },
    {
      name: "AnchorUseMethod";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Burn";
          },
          {
            name: "Multiple";
          },
          {
            name: "Single";
          },
        ];
      };
    },
  ];
  errors: [
    {
      code: 6000;
      name: "MaxDecimalsExceeded";
      msg: "Maximum decimals exceeded";
    },
    {
      code: 6001;
      name: "ConversionError";
      msg: "Conversion error";
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

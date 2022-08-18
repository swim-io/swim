export type Propeller = {
  readonly version: "0.1.0";
  readonly name: "propeller";
  readonly instructions: readonly [
    {
      readonly name: "initialize";
      readonly accounts: readonly [
        {
          readonly name: "propeller";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "propeller";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "token_bridge_mint";
              },
            ];
          };
        },
        {
          readonly name: "propellerSender";
          readonly isMut: false;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "sender";
              },
            ];
          };
        },
        {
          readonly name: "propellerRedeemer";
          readonly isMut: false;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "redeemer";
              },
            ];
          };
        },
        {
          readonly name: "propellerRedeemerEscrow";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "admin";
          readonly isMut: false;
          readonly isSigner: true;
        },
        {
          readonly name: "tokenBridgeMint";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "payer";
          readonly isMut: true;
          readonly isSigner: true;
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
                readonly path: "pool_token_mint_0";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "pool_token_mint_1";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "lp_mint";
              },
            ];
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly path: "two_pool_program";
            };
          };
        },
        {
          readonly name: "poolTokenMint0";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "poolTokenMint1";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "lpMint";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "twoPoolProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "params";
          readonly type: {
            readonly defined: "InitializeParams";
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
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly path: "two_pool_program";
            };
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
        {
          readonly name: "memo";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "twoPoolProgram";
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
        {
          readonly name: "memo";
          readonly type: "bytes";
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
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly path: "two_pool_program";
            };
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
        {
          readonly name: "memo";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "twoPoolProgram";
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
        {
          readonly name: "memo";
          readonly type: "bytes";
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
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly path: "two_pool_program";
            };
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
        {
          readonly name: "memo";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "twoPoolProgram";
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
        {
          readonly name: "memo";
          readonly type: "bytes";
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
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly path: "two_pool_program";
            };
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
        {
          readonly name: "memo";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "twoPoolProgram";
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
        {
          readonly name: "memo";
          readonly type: "bytes";
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
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly path: "two_pool_program";
            };
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
        {
          readonly name: "memo";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "twoPoolProgram";
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
        {
          readonly name: "memo";
          readonly type: "bytes";
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
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly path: "two_pool_program";
            };
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
        {
          readonly name: "memo";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "twoPoolProgram";
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
        {
          readonly name: "memo";
          readonly type: "bytes";
        },
      ];
      readonly returns: {
        readonly vec: "u64";
      };
    },
    {
      readonly name: "transferNativeWithPayload";
      readonly accounts: readonly [
        {
          readonly name: "propeller";
          readonly isMut: false;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "propeller";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Mint";
                readonly path: "token_bridge_mint";
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
          readonly name: "tokenBridgeConfig";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "config";
              },
            ];
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly account: "Propeller";
              readonly path: "propeller";
            };
          };
        },
        {
          readonly name: "userTokenBridgeAccount";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenBridgeMint";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "custody";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenBridge";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "custodySigner";
          readonly isMut: false;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "custody_signer";
              },
            ];
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly path: "token_bridge";
            };
          };
        },
        {
          readonly name: "authoritySigner";
          readonly isMut: false;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "authority_signer";
              },
            ];
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly path: "token_bridge";
            };
          };
        },
        {
          readonly name: "wormholeConfig";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "Bridge";
              },
            ];
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly account: "Propeller";
              readonly path: "propeller";
            };
          };
        },
        {
          readonly name: "wormholeMessage";
          readonly isMut: true;
          readonly isSigner: true;
          readonly docs: readonly [
            "Note:",
            "switched to using a `Signer`",
            "instead of a PDA since a normal token bridge transfer",
            "uses a Keypair.generate()",
            "",
            "A new one needs to be used for every transfer",
            "",
            "WH expects this to be an uninitialized account so might",
            "be able to use a PDA still in the future.",
            'maybe [b"propeller".as_ref(), payer, sequence_value]',
          ];
        },
        {
          readonly name: "wormholeEmitter";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "emitter";
              },
            ];
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly account: "Propeller";
              readonly path: "propeller";
            };
          };
        },
        {
          readonly name: "wormholeSequence";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "Sequence";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly path: "wormhole_emitter";
              },
            ];
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly account: "Propeller";
              readonly path: "propeller";
            };
          };
        },
        {
          readonly name: "wormholeFeeCollector";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "fee_collector";
              },
            ];
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly account: "Propeller";
              readonly path: "propeller";
            };
          };
        },
        {
          readonly name: "clock";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "sender";
          readonly isMut: false;
          readonly isSigner: false;
          readonly docs: readonly [
            "Transfers with payload also include the address of the account or contract",
            'that sent the transfer. Semantically this is identical to "msg.sender" on',
            "EVM chains, i.e. it is the address of the immediate caller of the token",
            "bridge transaction.",
            "Since on Solana, a transaction can have multiple different signers, getting",
            "this information is not so straightforward.",
            "The strategy we use to figure out the sender of the transaction is to",
            "require an additional signer ([`SenderAccount`]) for the transaction.",
            "If the transaction was sent by a user wallet directly, then this may just be",
            "the wallet's pubkey. If, however, the transaction was initiated by a",
            "program, then we require this to be a PDA derived from the sender program's",
            'id and the string "sender". In this case, the sender program must also',
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
            "instead of the sender program's id.",
          ];
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "sender";
              },
            ];
          };
        },
        {
          readonly name: "rent";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "systemProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "wormhole";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "memo";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [
        {
          readonly name: "nonce";
          readonly type: "u32";
        },
        {
          readonly name: "targetChain";
          readonly type: "u16";
        },
        {
          readonly name: "amount";
          readonly type: "u64";
        },
        {
          readonly name: "targetTokenId";
          readonly type: "u16";
        },
        {
          readonly name: "targetToken";
          readonly type: "bytes";
        },
        {
          readonly name: "owner";
          readonly type: "bytes";
        },
        {
          readonly name: "gasKickstart";
          readonly type: "bool";
        },
        {
          readonly name: "propellerEnabled";
          readonly type: "bool";
        },
        {
          readonly name: "memo";
          readonly type: "bytes";
        },
      ];
    },
    {
      readonly name: "completeNativeWithPayload";
      readonly accounts: readonly [
        {
          readonly name: "propeller";
          readonly isMut: false;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "propeller";
              },
              {
                readonly kind: "account";
                readonly type: "publicKey";
                readonly account: "Propeller";
                readonly path: "propeller.token_bridge_mint";
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
          readonly name: "tokenBridgeConfig";
          readonly isMut: true;
          readonly isSigner: false;
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "config";
              },
            ];
            readonly programId: {
              readonly kind: "account";
              readonly type: "publicKey";
              readonly account: "Propeller";
              readonly path: "propeller";
            };
          };
        },
        {
          readonly name: "message";
          readonly isMut: false;
          readonly isSigner: false;
          readonly docs: readonly [
            "contains the VAA",
            "{",
            "...MessageData:",
            "payload: PayloadTransferWithPayload = {",
            "pub amount: U256,",
            "}",
            "}",
          ];
        },
        {
          readonly name: "claim";
          readonly isMut: true;
          readonly isSigner: false;
          readonly docs: readonly [
            "seeds = [",
            "vaa.emitter_address, vaa.emitter_chain, vaa.sequence",
            "],",
            "seeds::program = token_bridge",
          ];
        },
        {
          readonly name: "endpoint";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "to";
          readonly isMut: true;
          readonly isSigner: false;
          readonly docs: readonly ["owned by redeemer"];
        },
        {
          readonly name: "redeemer";
          readonly isMut: false;
          readonly isSigner: false;
          readonly docs: readonly [
            'redeemer will be PDA derived from ["redeemer"], seeds::program = propeller::id()',
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)",
          ];
          readonly pda: {
            readonly seeds: readonly [
              {
                readonly kind: "const";
                readonly type: "string";
                readonly value: "redeemer";
              },
            ];
          };
        },
        {
          readonly name: "feeRecipient";
          readonly isMut: true;
          readonly isSigner: false;
          readonly docs: readonly [
            'this is "to_fees"',
            "TODO: type as TokenAccount?",
          ];
        },
        {
          readonly name: "custody";
          readonly isMut: true;
          readonly isSigner: false;
        },
        {
          readonly name: "mint";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "custodySigner";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "rent";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "systemProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "wormhole";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenProgram";
          readonly isMut: false;
          readonly isSigner: false;
        },
        {
          readonly name: "tokenBridge";
          readonly isMut: false;
          readonly isSigner: false;
        },
      ];
      readonly args: readonly [];
    },
  ];
  readonly accounts: readonly [
    {
      readonly name: "tokenIdMapping";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "outputTokenIndex";
            readonly type: "u16";
          },
          {
            readonly name: "pool";
            readonly type: "publicKey";
          },
          {
            readonly name: "poolTokenIndex";
            readonly type: "u8";
          },
          {
            readonly name: "poolTokenMint";
            readonly type: "publicKey";
          },
          {
            readonly name: "poolIx";
            readonly type: {
              readonly defined: "PoolInstruction";
            };
          },
          {
            readonly name: "bump";
            readonly type: "u8";
          },
        ];
      };
    },
    {
      readonly name: "propellerSender";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "bump";
            readonly type: "u8";
          },
        ];
      };
    },
    {
      readonly name: "propellerRedeemer";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "bump";
            readonly type: "u8";
          },
        ];
      };
    },
    {
      readonly name: "propeller";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "bump";
            readonly type: "u8";
          },
          {
            readonly name: "nonce";
            readonly type: "u32";
          },
          {
            readonly name: "admin";
            readonly type: "publicKey";
          },
          {
            readonly name: "wormhole";
            readonly type: "publicKey";
          },
          {
            readonly name: "tokenBridge";
            readonly type: "publicKey";
          },
          {
            readonly name: "tokenBridgeMint";
            readonly type: "publicKey";
          },
          {
            readonly name: "senderBump";
            readonly type: "u8";
          },
          {
            readonly name: "redeemerBump";
            readonly type: "u8";
          },
          {
            readonly name: "gasKickstartAmount";
            readonly type: "u64";
          },
          {
            readonly name: "propellerFee";
            readonly docs: readonly [
              "TODO: should this be in swimUSD or native gas?",
              "fee that payer of complete txn will take from transferred amount",
            ];
            readonly type: "u64";
          },
          {
            readonly name: "propellerMinThreshold";
            readonly type: "u64";
          },
          {
            readonly name: "marginalPricePool";
            readonly type: "publicKey";
          },
          {
            readonly name: "marginalPricePoolTokenMint";
            readonly type: "publicKey";
          },
          {
            readonly name: "marginalPricePoolTokenIndex";
            readonly type: "u8";
          },
        ];
      };
    },
    {
      readonly name: "chainMap";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "chainId";
            readonly type: "u16";
          },
          {
            readonly name: "targetAddress";
            readonly type: {
              readonly array: readonly ["u8", 32];
            };
          },
          {
            readonly name: "bump";
            readonly type: "u8";
          },
        ];
      };
    },
  ];
  readonly types: readonly [
    {
      readonly name: "InitializeParams";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "gasKickstartAmount";
            readonly type: "u64";
          },
          {
            readonly name: "propellerFee";
            readonly type: "u64";
          },
          {
            readonly name: "propellerMinThreshold";
            readonly type: "u64";
          },
          {
            readonly name: "marginalPricePool";
            readonly type: "publicKey";
          },
          {
            readonly name: "marginalPricePoolTokenIndex";
            readonly type: "u8";
          },
          {
            readonly name: "marginalPricePoolTokenMint";
            readonly type: "publicKey";
          },
        ];
      };
    },
    {
      readonly name: "AnchorSwimPayloadVAA";
      readonly docs: readonly [
        'This is "raw" VAA directly from guardian network',
        "probably not needed.",
      ];
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "version";
            readonly type: "u8";
          },
          {
            readonly name: "guardianSetIndex";
            readonly type: "u32";
          },
          {
            readonly name: "signatures";
            readonly type: {
              readonly vec: {
                readonly defined: "AnchorVAASignature";
              };
            };
          },
          {
            readonly name: "timestamp";
            readonly type: "u32";
          },
          {
            readonly name: "nonce";
            readonly type: "u32";
          },
          {
            readonly name: "emitterChain";
            readonly type: "u16";
          },
          {
            readonly name: "emitterAddress";
            readonly type: {
              readonly array: readonly ["u8", 32];
            };
          },
          {
            readonly name: "sequence";
            readonly type: "u64";
          },
          {
            readonly name: "consistencyLevel";
            readonly type: "u8";
          },
          {
            readonly name: "payload";
            readonly type: "bytes";
          },
        ];
      };
    },
    {
      readonly name: "AnchorVAASignature";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "signature";
            readonly type: "bytes";
          },
          {
            readonly name: "guardianIndex";
            readonly type: "u8";
          },
        ];
      };
    },
    {
      readonly name: "CompleteNativeWithPayloadData";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [];
      };
    },
    {
      readonly name: "VerifySignaturesData";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "signers";
            readonly docs: readonly [
              "instruction indices of signers (-1 for missing)",
            ];
            readonly type: {
              readonly array: readonly ["i8", 19];
            };
          },
        ];
      };
    },
    {
      readonly name: "TransferData";
      readonly docs: readonly [
        "* Same as TransferNative & TransferWrapped Data.",
      ];
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "nonce";
            readonly type: "u32";
          },
          {
            readonly name: "amount";
            readonly type: "u64";
          },
          {
            readonly name: "fee";
            readonly type: "u64";
          },
          {
            readonly name: "targetAddress";
            readonly type: {
              readonly array: readonly ["u8", 32];
            };
          },
          {
            readonly name: "targetChain";
            readonly type: "u16";
          },
        ];
      };
    },
    {
      readonly name: "TransferWithPayloadData";
      readonly docs: readonly [
        "* Same as TransferNativeWithPayloadData & TransferWrappedWithPayloadData.\n* this is the data that goes into the Instruction.",
      ];
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "nonce";
            readonly type: "u32";
          },
          {
            readonly name: "amount";
            readonly type: "u64";
          },
          {
            readonly name: "targetAddress";
            readonly type: {
              readonly array: readonly ["u8", 32];
            };
          },
          {
            readonly name: "targetChain";
            readonly type: "u16";
          },
          {
            readonly name: "payload";
            readonly type: "bytes";
          },
          {
            readonly name: "cpiProgramId";
            readonly type: {
              readonly option: "publicKey";
            };
          },
        ];
      };
    },
    {
      readonly name: "PostMessageData";
      readonly docs: readonly [
        "Data that goes into a [`wormhole::Instruction::PostMessage`]",
      ];
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "nonce";
            readonly docs: readonly ["Unique nonce for this message"];
            readonly type: "u32";
          },
          {
            readonly name: "payload";
            readonly docs: readonly ["Message payload"];
            readonly type: "bytes";
          },
          {
            readonly name: "consistencyLevel";
            readonly docs: readonly [
              "Commitment Level required for an attestation to be produced",
            ];
            readonly type: {
              readonly defined: "ConsistencyLevel";
            };
          },
        ];
      };
    },
    {
      readonly name: "BridgeData";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "guardianSetIndex";
            readonly docs: readonly [
              "The current guardian set index, used to decide which signature sets to accept.",
            ];
            readonly type: "u32";
          },
          {
            readonly name: "lastLamports";
            readonly docs: readonly ["Lamports in the collection account"];
            readonly type: "u64";
          },
          {
            readonly name: "config";
            readonly docs: readonly [
              "Bridge configuration, which is set once upon initialization.",
            ];
            readonly type: {
              readonly defined: "BridgeConfig";
            };
          },
        ];
      };
    },
    {
      readonly name: "BridgeConfig";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "guardianSetExpirationTime";
            readonly docs: readonly [
              "Period for how long a guardian set is valid after it has been replaced by a new one.  This",
              "guarantees that VAAs issued by that set can still be submitted for a certain period.  In",
              "this period we still trust the old guardian set.",
            ];
            readonly type: "u32";
          },
          {
            readonly name: "fee";
            readonly docs: readonly [
              "Amount of lamports that needs to be paid to the protocol to post a message",
            ];
            readonly type: "u64";
          },
        ];
      };
    },
    {
      readonly name: "MessageData";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "vaaVersion";
            readonly docs: readonly ["Header of the posted VAA"];
            readonly type: "u8";
          },
          {
            readonly name: "consistencyLevel";
            readonly docs: readonly [
              "Level of consistency requested by the emitter",
            ];
            readonly type: "u8";
          },
          {
            readonly name: "vaaTime";
            readonly docs: readonly ["Time the vaa was submitted"];
            readonly type: "u32";
          },
          {
            readonly name: "vaaSignatureAccount";
            readonly docs: readonly ["Account where signatures are stored"];
            readonly type: "publicKey";
          },
          {
            readonly name: "submissionTime";
            readonly docs: readonly ["Time the posted message was created"];
            readonly type: "u32";
          },
          {
            readonly name: "nonce";
            readonly docs: readonly ["Unique nonce for this message"];
            readonly type: "u32";
          },
          {
            readonly name: "sequence";
            readonly docs: readonly ["Sequence number of this message"];
            readonly type: "u64";
          },
          {
            readonly name: "emitterChain";
            readonly docs: readonly ["Emitter of the message"];
            readonly type: "u16";
          },
          {
            readonly name: "emitterAddress";
            readonly docs: readonly ["Emitter of the message"];
            readonly type: {
              readonly array: readonly ["u8", 32];
            };
          },
          {
            readonly name: "payload";
            readonly docs: readonly [
              "Message payload aka `PayloadTransferWithPayload`",
            ];
            readonly type: "bytes";
          },
        ];
      };
    },
    {
      readonly name: "ClaimData";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "claimed";
            readonly type: "bool";
          },
        ];
      };
    },
    {
      readonly name: "PostVAAData";
      readonly type: {
        readonly kind: "struct";
        readonly fields: readonly [
          {
            readonly name: "version";
            readonly type: "u8";
          },
          {
            readonly name: "guardianSetIndex";
            readonly type: "u32";
          },
          {
            readonly name: "timestamp";
            readonly type: "u32";
          },
          {
            readonly name: "nonce";
            readonly type: "u32";
          },
          {
            readonly name: "emitterChain";
            readonly type: "u16";
          },
          {
            readonly name: "emitterAddress";
            readonly type: {
              readonly array: readonly ["u8", 32];
            };
          },
          {
            readonly name: "sequence";
            readonly type: "u64";
          },
          {
            readonly name: "consistencyLevel";
            readonly type: "u8";
          },
          {
            readonly name: "payload";
            readonly type: "bytes";
          },
        ];
      };
    },
    {
      readonly name: "PoolInstruction";
      readonly type: {
        readonly kind: "enum";
        readonly variants: readonly [
          {
            readonly name: "RemoveExactBurn";
          },
          {
            readonly name: "SwapExactInput";
          },
        ];
      };
    },
    {
      readonly name: "SwimPayloadVersion";
      readonly type: {
        readonly kind: "enum";
        readonly variants: readonly [
          {
            readonly name: "V0";
          },
          {
            readonly name: "V1";
          },
        ];
      };
    },
    {
      readonly name: "ConsistencyLevel";
      readonly type: {
        readonly kind: "enum";
        readonly variants: readonly [
          {
            readonly name: "Confirmed";
          },
          {
            readonly name: "Finalized";
          },
        ];
      };
    },
    {
      readonly name: "Instruction";
      readonly type: {
        readonly kind: "enum";
        readonly variants: readonly [
          {
            readonly name: "Initialize";
          },
          {
            readonly name: "PostMessage";
          },
          {
            readonly name: "PostVAA";
          },
          {
            readonly name: "SetFees";
          },
          {
            readonly name: "TransferFees";
          },
          {
            readonly name: "UpgradeContract";
          },
          {
            readonly name: "UpgradeGuardianSet";
          },
          {
            readonly name: "VerifySignatures";
          },
        ];
      };
    },
  ];
  readonly errors: readonly [
    {
      readonly code: 6000;
      readonly name: "InsufficientFunds";
      readonly msg: "InsufficientFunds";
    },
    {
      readonly code: 6001;
      readonly name: "InvalidAccount";
      readonly msg: "InvalidAccount";
    },
    {
      readonly code: 6002;
      readonly name: "InvalidRemainingAccounts";
      readonly msg: "InvalidRemainingAccounts";
    },
    {
      readonly code: 6003;
      readonly name: "InvalidTokenBridgeAddress";
      readonly msg: "InvalidTokenBridgeAddress";
    },
    {
      readonly code: 6004;
      readonly name: "InvalidTokenDecimals";
      readonly msg: "InvalidTokenDecimals";
    },
    {
      readonly code: 6005;
      readonly name: "InvalidTokenIndex";
      readonly msg: "InvalidTokenIndex";
    },
    {
      readonly code: 6006;
      readonly name: "InvalidVaaAction";
      readonly msg: "InvalidVaaAction";
    },
    {
      readonly code: 6007;
      readonly name: "InvalidWormholeAddress";
      readonly msg: "InvalidWormholeAddress";
    },
    {
      readonly code: 6008;
      readonly name: "InvalidVaaPayload";
      readonly msg: "InvalidVaaPayload";
    },
    {
      readonly code: 6009;
      readonly name: "NothingToClaim";
      readonly msg: "NothingToClaim";
    },
    {
      readonly code: 6010;
      readonly name: "TransferNotAllowed";
      readonly msg: "TransferNotAllowed";
    },
    {
      readonly code: 6011;
      readonly name: "InvalidCpiReturnProgramId";
      readonly msg: "Incorrect ProgramId for CPI return value";
    },
    {
      readonly code: 6012;
      readonly name: "InvalidCpiReturnValue";
      readonly msg: "Invalid CPI Return value";
    },
    {
      readonly code: 6013;
      readonly name: "InvalidMint";
      readonly msg: "Invalid Mint";
    },
    {
      readonly code: 6014;
      readonly name: "InvalidAddAndWormholeTransferMint";
      readonly msg: "Invalid Mint for AddAndWormholeTransfer";
    },
    {
      readonly code: 6015;
      readonly name: "InvalidSwapExactInputOutputTokenIndex";
      readonly msg: "Invalid output token index for SwapExactInput params";
    },
    {
      readonly code: 6016;
      readonly name: "InvalidSwapExactInputInputAmount";
      readonly msg: "Invalid input amount for SwapExactInput params";
    },
    {
      readonly code: 6017;
      readonly name: "InvalidTokenBridgeMint";
      readonly msg: "Invalid Token Bridge Mint";
    },
    {
      readonly code: 6018;
      readonly name: "InvalidPayloadTypeInVaa";
      readonly msg: "Invalid Payload Type in VAA";
    },
    {
      readonly code: 6019;
      readonly name: "SerializeError";
      readonly msg: "Serializing error";
    },
    {
      readonly code: 6020;
      readonly name: "DeserializeError";
      readonly msg: "Deserializing error";
    },
    {
      readonly code: 6021;
      readonly name: "UserRedeemerSignatureNotDetected";
      readonly msg: "User redeemer needs to be signer";
    },
    {
      readonly code: 6022;
      readonly name: "InvalidSwitchboardAccount";
      readonly msg: "Not a valid Switchboard account";
    },
    {
      readonly code: 6023;
      readonly name: "StaleFeed";
      readonly msg: "Switchboard feed has not been updated in 5 minutes";
    },
    {
      readonly code: 6024;
      readonly name: "ConfidenceIntervalExceeded";
      readonly msg: "Switchboard feed exceeded provided confidence interval";
    },
    {
      readonly code: 6025;
      readonly name: "InsufficientAmount";
      readonly msg: "Insufficient Amount being transferred";
    },
    {
      readonly code: 6026;
      readonly name: "InvalidClaimData";
      readonly msg: "Invalid claim data";
    },
    {
      readonly code: 6027;
      readonly name: "ClaimNotClaimed";
      readonly msg: "Claim Account not claimed";
    },
  ];
};

export const IDL: Propeller = {
  version: "0.1.0",
  name: "propeller",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "propeller",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "propeller",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "token_bridge_mint",
              },
            ],
          },
        },
        {
          name: "propellerSender",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "sender",
              },
            ],
          },
        },
        {
          name: "propellerRedeemer",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "redeemer",
              },
            ],
          },
        },
        {
          name: "propellerRedeemerEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenBridgeMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
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
                path: "pool_token_mint_0",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "pool_token_mint_1",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "lp_mint",
              },
            ],
            programId: {
              kind: "account",
              type: "publicKey",
              path: "two_pool_program",
            },
          },
        },
        {
          name: "poolTokenMint0",
          isMut: false,
          isSigner: false,
        },
        {
          name: "poolTokenMint1",
          isMut: false,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "twoPoolProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "InitializeParams",
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
            programId: {
              kind: "account",
              type: "publicKey",
              path: "two_pool_program",
            },
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
        {
          name: "memo",
          isMut: false,
          isSigner: false,
        },
        {
          name: "twoPoolProgram",
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
        {
          name: "memo",
          type: "bytes",
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
            programId: {
              kind: "account",
              type: "publicKey",
              path: "two_pool_program",
            },
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
        {
          name: "memo",
          isMut: false,
          isSigner: false,
        },
        {
          name: "twoPoolProgram",
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
        {
          name: "memo",
          type: "bytes",
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
            programId: {
              kind: "account",
              type: "publicKey",
              path: "two_pool_program",
            },
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
        {
          name: "memo",
          isMut: false,
          isSigner: false,
        },
        {
          name: "twoPoolProgram",
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
        {
          name: "memo",
          type: "bytes",
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
            programId: {
              kind: "account",
              type: "publicKey",
              path: "two_pool_program",
            },
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
        {
          name: "memo",
          isMut: false,
          isSigner: false,
        },
        {
          name: "twoPoolProgram",
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
        {
          name: "memo",
          type: "bytes",
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
            programId: {
              kind: "account",
              type: "publicKey",
              path: "two_pool_program",
            },
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
        {
          name: "memo",
          isMut: false,
          isSigner: false,
        },
        {
          name: "twoPoolProgram",
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
        {
          name: "memo",
          type: "bytes",
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
            programId: {
              kind: "account",
              type: "publicKey",
              path: "two_pool_program",
            },
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
        {
          name: "memo",
          isMut: false,
          isSigner: false,
        },
        {
          name: "twoPoolProgram",
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
        {
          name: "memo",
          type: "bytes",
        },
      ],
      returns: {
        vec: "u64",
      },
    },
    {
      name: "transferNativeWithPayload",
      accounts: [
        {
          name: "propeller",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "propeller",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Mint",
                path: "token_bridge_mint",
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
          name: "tokenBridgeConfig",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "config",
              },
            ],
            programId: {
              kind: "account",
              type: "publicKey",
              account: "Propeller",
              path: "propeller",
            },
          },
        },
        {
          name: "userTokenBridgeAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenBridgeMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "custody",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenBridge",
          isMut: false,
          isSigner: false,
        },
        {
          name: "custodySigner",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "custody_signer",
              },
            ],
            programId: {
              kind: "account",
              type: "publicKey",
              path: "token_bridge",
            },
          },
        },
        {
          name: "authoritySigner",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "authority_signer",
              },
            ],
            programId: {
              kind: "account",
              type: "publicKey",
              path: "token_bridge",
            },
          },
        },
        {
          name: "wormholeConfig",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "Bridge",
              },
            ],
            programId: {
              kind: "account",
              type: "publicKey",
              account: "Propeller",
              path: "propeller",
            },
          },
        },
        {
          name: "wormholeMessage",
          isMut: true,
          isSigner: true,
          docs: [
            "Note:",
            "switched to using a `Signer`",
            "instead of a PDA since a normal token bridge transfer",
            "uses a Keypair.generate()",
            "",
            "A new one needs to be used for every transfer",
            "",
            "WH expects this to be an uninitialized account so might",
            "be able to use a PDA still in the future.",
            'maybe [b"propeller".as_ref(), payer, sequence_value]',
          ],
        },
        {
          name: "wormholeEmitter",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "emitter",
              },
            ],
            programId: {
              kind: "account",
              type: "publicKey",
              account: "Propeller",
              path: "propeller",
            },
          },
        },
        {
          name: "wormholeSequence",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "Sequence",
              },
              {
                kind: "account",
                type: "publicKey",
                path: "wormhole_emitter",
              },
            ],
            programId: {
              kind: "account",
              type: "publicKey",
              account: "Propeller",
              path: "propeller",
            },
          },
        },
        {
          name: "wormholeFeeCollector",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "fee_collector",
              },
            ],
            programId: {
              kind: "account",
              type: "publicKey",
              account: "Propeller",
              path: "propeller",
            },
          },
        },
        {
          name: "clock",
          isMut: false,
          isSigner: false,
        },
        {
          name: "sender",
          isMut: false,
          isSigner: false,
          docs: [
            "Transfers with payload also include the address of the account or contract",
            'that sent the transfer. Semantically this is identical to "msg.sender" on',
            "EVM chains, i.e. it is the address of the immediate caller of the token",
            "bridge transaction.",
            "Since on Solana, a transaction can have multiple different signers, getting",
            "this information is not so straightforward.",
            "The strategy we use to figure out the sender of the transaction is to",
            "require an additional signer ([`SenderAccount`]) for the transaction.",
            "If the transaction was sent by a user wallet directly, then this may just be",
            "the wallet's pubkey. If, however, the transaction was initiated by a",
            "program, then we require this to be a PDA derived from the sender program's",
            'id and the string "sender". In this case, the sender program must also',
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
            "instead of the sender program's id.",
          ],
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "sender",
              },
            ],
          },
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "wormhole",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "memo",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "nonce",
          type: "u32",
        },
        {
          name: "targetChain",
          type: "u16",
        },
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "targetTokenId",
          type: "u16",
        },
        {
          name: "targetToken",
          type: "bytes",
        },
        {
          name: "owner",
          type: "bytes",
        },
        {
          name: "gasKickstart",
          type: "bool",
        },
        {
          name: "propellerEnabled",
          type: "bool",
        },
        {
          name: "memo",
          type: "bytes",
        },
      ],
    },
    {
      name: "completeNativeWithPayload",
      accounts: [
        {
          name: "propeller",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "propeller",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Propeller",
                path: "propeller.token_bridge_mint",
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
          name: "tokenBridgeConfig",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "config",
              },
            ],
            programId: {
              kind: "account",
              type: "publicKey",
              account: "Propeller",
              path: "propeller",
            },
          },
        },
        {
          name: "message",
          isMut: false,
          isSigner: false,
          docs: [
            "contains the VAA",
            "{",
            "...MessageData:",
            "payload: PayloadTransferWithPayload = {",
            "pub amount: U256,",
            "}",
            "}",
          ],
        },
        {
          name: "claim",
          isMut: true,
          isSigner: false,
          docs: [
            "seeds = [",
            "vaa.emitter_address, vaa.emitter_chain, vaa.sequence",
            "],",
            "seeds::program = token_bridge",
          ],
        },
        {
          name: "endpoint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "to",
          isMut: true,
          isSigner: false,
          docs: ["owned by redeemer"],
        },
        {
          name: "redeemer",
          isMut: false,
          isSigner: false,
          docs: [
            'redeemer will be PDA derived from ["redeemer"], seeds::program = propeller::id()',
            "will have to be signed when it invokes complete_transfer_with_payload",
            "if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to",
            "(NOT the `to` account)",
          ],
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "redeemer",
              },
            ],
          },
        },
        {
          name: "feeRecipient",
          isMut: true,
          isSigner: false,
          docs: ['this is "to_fees"', "TODO: type as TokenAccount?"],
        },
        {
          name: "custody",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "custodySigner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "wormhole",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenBridge",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "tokenIdMapping",
      type: {
        kind: "struct",
        fields: [
          {
            name: "outputTokenIndex",
            type: "u16",
          },
          {
            name: "pool",
            type: "publicKey",
          },
          {
            name: "poolTokenIndex",
            type: "u8",
          },
          {
            name: "poolTokenMint",
            type: "publicKey",
          },
          {
            name: "poolIx",
            type: {
              defined: "PoolInstruction",
            },
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "propellerSender",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "propellerRedeemer",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "propeller",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "nonce",
            type: "u32",
          },
          {
            name: "admin",
            type: "publicKey",
          },
          {
            name: "wormhole",
            type: "publicKey",
          },
          {
            name: "tokenBridge",
            type: "publicKey",
          },
          {
            name: "tokenBridgeMint",
            type: "publicKey",
          },
          {
            name: "senderBump",
            type: "u8",
          },
          {
            name: "redeemerBump",
            type: "u8",
          },
          {
            name: "gasKickstartAmount",
            type: "u64",
          },
          {
            name: "propellerFee",
            docs: [
              "TODO: should this be in swimUSD or native gas?",
              "fee that payer of complete txn will take from transferred amount",
            ],
            type: "u64",
          },
          {
            name: "propellerMinThreshold",
            type: "u64",
          },
          {
            name: "marginalPricePool",
            type: "publicKey",
          },
          {
            name: "marginalPricePoolTokenMint",
            type: "publicKey",
          },
          {
            name: "marginalPricePoolTokenIndex",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "chainMap",
      type: {
        kind: "struct",
        fields: [
          {
            name: "chainId",
            type: "u16",
          },
          {
            name: "targetAddress",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "InitializeParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "gasKickstartAmount",
            type: "u64",
          },
          {
            name: "propellerFee",
            type: "u64",
          },
          {
            name: "propellerMinThreshold",
            type: "u64",
          },
          {
            name: "marginalPricePool",
            type: "publicKey",
          },
          {
            name: "marginalPricePoolTokenIndex",
            type: "u8",
          },
          {
            name: "marginalPricePoolTokenMint",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "AnchorSwimPayloadVAA",
      docs: [
        'This is "raw" VAA directly from guardian network',
        "probably not needed.",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "version",
            type: "u8",
          },
          {
            name: "guardianSetIndex",
            type: "u32",
          },
          {
            name: "signatures",
            type: {
              vec: {
                defined: "AnchorVAASignature",
              },
            },
          },
          {
            name: "timestamp",
            type: "u32",
          },
          {
            name: "nonce",
            type: "u32",
          },
          {
            name: "emitterChain",
            type: "u16",
          },
          {
            name: "emitterAddress",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "sequence",
            type: "u64",
          },
          {
            name: "consistencyLevel",
            type: "u8",
          },
          {
            name: "payload",
            type: "bytes",
          },
        ],
      },
    },
    {
      name: "AnchorVAASignature",
      type: {
        kind: "struct",
        fields: [
          {
            name: "signature",
            type: "bytes",
          },
          {
            name: "guardianIndex",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "CompleteNativeWithPayloadData",
      type: {
        kind: "struct",
        fields: [],
      },
    },
    {
      name: "VerifySignaturesData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "signers",
            docs: ["instruction indices of signers (-1 for missing)"],
            type: {
              array: ["i8", 19],
            },
          },
        ],
      },
    },
    {
      name: "TransferData",
      docs: ["* Same as TransferNative & TransferWrapped Data."],
      type: {
        kind: "struct",
        fields: [
          {
            name: "nonce",
            type: "u32",
          },
          {
            name: "amount",
            type: "u64",
          },
          {
            name: "fee",
            type: "u64",
          },
          {
            name: "targetAddress",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "targetChain",
            type: "u16",
          },
        ],
      },
    },
    {
      name: "TransferWithPayloadData",
      docs: [
        "* Same as TransferNativeWithPayloadData & TransferWrappedWithPayloadData.\n* this is the data that goes into the Instruction.",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "nonce",
            type: "u32",
          },
          {
            name: "amount",
            type: "u64",
          },
          {
            name: "targetAddress",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "targetChain",
            type: "u16",
          },
          {
            name: "payload",
            type: "bytes",
          },
          {
            name: "cpiProgramId",
            type: {
              option: "publicKey",
            },
          },
        ],
      },
    },
    {
      name: "PostMessageData",
      docs: ["Data that goes into a [`wormhole::Instruction::PostMessage`]"],
      type: {
        kind: "struct",
        fields: [
          {
            name: "nonce",
            docs: ["Unique nonce for this message"],
            type: "u32",
          },
          {
            name: "payload",
            docs: ["Message payload"],
            type: "bytes",
          },
          {
            name: "consistencyLevel",
            docs: [
              "Commitment Level required for an attestation to be produced",
            ],
            type: {
              defined: "ConsistencyLevel",
            },
          },
        ],
      },
    },
    {
      name: "BridgeData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "guardianSetIndex",
            docs: [
              "The current guardian set index, used to decide which signature sets to accept.",
            ],
            type: "u32",
          },
          {
            name: "lastLamports",
            docs: ["Lamports in the collection account"],
            type: "u64",
          },
          {
            name: "config",
            docs: [
              "Bridge configuration, which is set once upon initialization.",
            ],
            type: {
              defined: "BridgeConfig",
            },
          },
        ],
      },
    },
    {
      name: "BridgeConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "guardianSetExpirationTime",
            docs: [
              "Period for how long a guardian set is valid after it has been replaced by a new one.  This",
              "guarantees that VAAs issued by that set can still be submitted for a certain period.  In",
              "this period we still trust the old guardian set.",
            ],
            type: "u32",
          },
          {
            name: "fee",
            docs: [
              "Amount of lamports that needs to be paid to the protocol to post a message",
            ],
            type: "u64",
          },
        ],
      },
    },
    {
      name: "MessageData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "vaaVersion",
            docs: ["Header of the posted VAA"],
            type: "u8",
          },
          {
            name: "consistencyLevel",
            docs: ["Level of consistency requested by the emitter"],
            type: "u8",
          },
          {
            name: "vaaTime",
            docs: ["Time the vaa was submitted"],
            type: "u32",
          },
          {
            name: "vaaSignatureAccount",
            docs: ["Account where signatures are stored"],
            type: "publicKey",
          },
          {
            name: "submissionTime",
            docs: ["Time the posted message was created"],
            type: "u32",
          },
          {
            name: "nonce",
            docs: ["Unique nonce for this message"],
            type: "u32",
          },
          {
            name: "sequence",
            docs: ["Sequence number of this message"],
            type: "u64",
          },
          {
            name: "emitterChain",
            docs: ["Emitter of the message"],
            type: "u16",
          },
          {
            name: "emitterAddress",
            docs: ["Emitter of the message"],
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "payload",
            docs: ["Message payload aka `PayloadTransferWithPayload`"],
            type: "bytes",
          },
        ],
      },
    },
    {
      name: "ClaimData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "claimed",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "PostVAAData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "version",
            type: "u8",
          },
          {
            name: "guardianSetIndex",
            type: "u32",
          },
          {
            name: "timestamp",
            type: "u32",
          },
          {
            name: "nonce",
            type: "u32",
          },
          {
            name: "emitterChain",
            type: "u16",
          },
          {
            name: "emitterAddress",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "sequence",
            type: "u64",
          },
          {
            name: "consistencyLevel",
            type: "u8",
          },
          {
            name: "payload",
            type: "bytes",
          },
        ],
      },
    },
    {
      name: "PoolInstruction",
      type: {
        kind: "enum",
        variants: [
          {
            name: "RemoveExactBurn",
          },
          {
            name: "SwapExactInput",
          },
        ],
      },
    },
    {
      name: "SwimPayloadVersion",
      type: {
        kind: "enum",
        variants: [
          {
            name: "V0",
          },
          {
            name: "V1",
          },
        ],
      },
    },
    {
      name: "ConsistencyLevel",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Confirmed",
          },
          {
            name: "Finalized",
          },
        ],
      },
    },
    {
      name: "Instruction",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Initialize",
          },
          {
            name: "PostMessage",
          },
          {
            name: "PostVAA",
          },
          {
            name: "SetFees",
          },
          {
            name: "TransferFees",
          },
          {
            name: "UpgradeContract",
          },
          {
            name: "UpgradeGuardianSet",
          },
          {
            name: "VerifySignatures",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InsufficientFunds",
      msg: "InsufficientFunds",
    },
    {
      code: 6001,
      name: "InvalidAccount",
      msg: "InvalidAccount",
    },
    {
      code: 6002,
      name: "InvalidRemainingAccounts",
      msg: "InvalidRemainingAccounts",
    },
    {
      code: 6003,
      name: "InvalidTokenBridgeAddress",
      msg: "InvalidTokenBridgeAddress",
    },
    {
      code: 6004,
      name: "InvalidTokenDecimals",
      msg: "InvalidTokenDecimals",
    },
    {
      code: 6005,
      name: "InvalidTokenIndex",
      msg: "InvalidTokenIndex",
    },
    {
      code: 6006,
      name: "InvalidVaaAction",
      msg: "InvalidVaaAction",
    },
    {
      code: 6007,
      name: "InvalidWormholeAddress",
      msg: "InvalidWormholeAddress",
    },
    {
      code: 6008,
      name: "InvalidVaaPayload",
      msg: "InvalidVaaPayload",
    },
    {
      code: 6009,
      name: "NothingToClaim",
      msg: "NothingToClaim",
    },
    {
      code: 6010,
      name: "TransferNotAllowed",
      msg: "TransferNotAllowed",
    },
    {
      code: 6011,
      name: "InvalidCpiReturnProgramId",
      msg: "Incorrect ProgramId for CPI return value",
    },
    {
      code: 6012,
      name: "InvalidCpiReturnValue",
      msg: "Invalid CPI Return value",
    },
    {
      code: 6013,
      name: "InvalidMint",
      msg: "Invalid Mint",
    },
    {
      code: 6014,
      name: "InvalidAddAndWormholeTransferMint",
      msg: "Invalid Mint for AddAndWormholeTransfer",
    },
    {
      code: 6015,
      name: "InvalidSwapExactInputOutputTokenIndex",
      msg: "Invalid output token index for SwapExactInput params",
    },
    {
      code: 6016,
      name: "InvalidSwapExactInputInputAmount",
      msg: "Invalid input amount for SwapExactInput params",
    },
    {
      code: 6017,
      name: "InvalidTokenBridgeMint",
      msg: "Invalid Token Bridge Mint",
    },
    {
      code: 6018,
      name: "InvalidPayloadTypeInVaa",
      msg: "Invalid Payload Type in VAA",
    },
    {
      code: 6019,
      name: "SerializeError",
      msg: "Serializing error",
    },
    {
      code: 6020,
      name: "DeserializeError",
      msg: "Deserializing error",
    },
    {
      code: 6021,
      name: "UserRedeemerSignatureNotDetected",
      msg: "User redeemer needs to be signer",
    },
    {
      code: 6022,
      name: "InvalidSwitchboardAccount",
      msg: "Not a valid Switchboard account",
    },
    {
      code: 6023,
      name: "StaleFeed",
      msg: "Switchboard feed has not been updated in 5 minutes",
    },
    {
      code: 6024,
      name: "ConfidenceIntervalExceeded",
      msg: "Switchboard feed exceeded provided confidence interval",
    },
    {
      code: 6025,
      name: "InsufficientAmount",
      msg: "Insufficient Amount being transferred",
    },
    {
      code: 6026,
      name: "InvalidClaimData",
      msg: "Invalid claim data",
    },
    {
      code: 6027,
      name: "ClaimNotClaimed",
      msg: "Claim Account not claimed",
    },
  ],
};

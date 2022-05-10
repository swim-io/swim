export const interaction = {
  instruction: 1,
  params: {
    exactInputAmounts: ["0", "0", "0", "10000", "0", "0"],
    outputTokenIndex: 5,
    minimumOutputAmount: "9946.0176290906374",
  },
  id: "03c8f1cde6467d4326a959edb247d53c",
  submittedAt: 1652175805949,
  env: "CustomLocalnet",
  poolId: "hexapool",
  signatureSetKeypairs: {},
  previousSignatureSetAddresses: {
    "localnet-ethereum-usdt": "AcWXKfHmrrcXzyk7oWZV5S9VwgLPtGK9bGQHkQjA3c8S",
  },
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    bsc: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    terra: null,
    avalanche: null,
    polygon: null,
  },
  version: 1,
};

export const recentIxs = {
  solana: [
    // Bridge tokens to Solana - Transfer Tether USD from Ethereum to Solana[1]
    {
      ecosystem: "solana",
      txId: "4nAiueSdaGS6RxSBiS7BjZ17PCbhPpvj69rhaJmR8MEFuYgWdKP8U1NnbWvpjzno4xf2TaKYYzRza12ZcUFjuFB8",
      timestamp: 1652175847,
      interactionId: "03c8f1cde6467d4326a959edb247d53c",
      parsedTx: {
        blockTime: 1652175847,
        meta: {
          err: null,
          fee: 15000,
          innerInstructions: [
            {
              index: 1,
              instructions: [
                {
                  parsed: {
                    info: {
                      lamports: 1176240,
                      newAccount:
                        "AcWXKfHmrrcXzyk7oWZV5S9VwgLPtGK9bGQHkQjA3c8S",
                      owner: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                      source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                      space: 41,
                    },
                    type: "createAccount",
                  },
                  program: "system",
                  programId: "11111111111111111111111111111111",
                },
              ],
            },
          ],
          logMessages: [
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o invoke [1]",
            "Program 11111111111111111111111111111111 invoke [2]",
            "Program 11111111111111111111111111111111 success",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o consumed 21466 of 200000 compute units",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o success",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
            'Program log: Memo (len 32): "03c8f1cde6467d4326a959edb247d53c"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 178534 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999664462800, 1176240, 1, 1141440, 1, 1, 1, 0, 1009200,
          ],
          postTokenBalances: [],
          preBalances: [999665654040, 0, 1, 1141440, 1, 1, 1, 0, 1009200],
          preTokenBalances: [],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 438161,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                signer: true,
                writable: true,
              },
              {
                pubkey: "AcWXKfHmrrcXzyk7oWZV5S9VwgLPtGK9bGQHkQjA3c8S",
                signer: true,
                writable: true,
              },
              {
                pubkey: "11111111111111111111111111111111",
                signer: false,
                writable: false,
              },
              {
                pubkey: "6MxkvoEwgB9EqQRLNhvYaPGhfcLtBtpBqdQugr3AZUgD",
                signer: false,
                writable: false,
              },
              {
                pubkey: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                signer: false,
                writable: false,
              },
              {
                pubkey: "KeccakSecp256k11111111111111111111111111111",
                signer: false,
                writable: false,
              },
              {
                pubkey: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
                signer: false,
                writable: false,
              },
              {
                pubkey: "Sysvar1nstructions1111111111111111111111111",
                signer: false,
                writable: false,
              },
              {
                pubkey: "SysvarRent111111111111111111111111111111111",
                signer: false,
                writable: false,
              },
            ],
            instructions: [
              {
                accounts: [],
                data: "URdBsfgPjtD1n2sAoE6QomoN843m8xpG7k4vNC4eAJtgjt1d24GeoybJD69c6mExyGXksT3JriNPfBjaJKHRiHzm36JWmy7iVuhYMH6zJZWE6WmnJLJGfp4mthbnkg1bEtZQWMKQseFuKLDRaz8Jqa6UHkW4zkhjZFxo6fXYPvzQNqx",
                programId: "KeccakSecp256k11111111111111111111111111111",
              },
              {
                accounts: [
                  "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  "6MxkvoEwgB9EqQRLNhvYaPGhfcLtBtpBqdQugr3AZUgD",
                  "AcWXKfHmrrcXzyk7oWZV5S9VwgLPtGK9bGQHkQjA3c8S",
                  "Sysvar1nstructions1111111111111111111111111",
                  "SysvarRent111111111111111111111111111111111",
                  "11111111111111111111111111111111",
                ],
                data: "6fFHX88LjDnco26UT64ypchaL5c",
                programId: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
              },
              {
                parsed: "03c8f1cde6467d4326a959edb247d53c",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "3THy614CgfezdcT6YSyv89fMyHDw4CzCdDySJvfdXnvm",
          },
          signatures: [
            "4nAiueSdaGS6RxSBiS7BjZ17PCbhPpvj69rhaJmR8MEFuYgWdKP8U1NnbWvpjzno4xf2TaKYYzRza12ZcUFjuFB8",
            "5T1nbm2Jyo4AAkkEfLPRXsYHk33QzbtbJnckQJtVc87j2XnehaXAZ2aHMX4RNwBDKPVj7yDxxWZejANnMsw3i21Z",
          ],
        },
      },
    },
    // Bridge tokens to Solana - Transfer Tether USD from Ethereum to Solana[2]
    {
      ecosystem: "solana",
      txId: "3edvnWEHAq79uDcnrpEXCAKQt5MFACN4P9J1iC8b8DUFQG5vZVR9A3mkpLnk2WK8PHTJAX7WtZfsfkNmWirpBQkm",
      timestamp: 1652175857,
      interactionId: "03c8f1cde6467d4326a959edb247d53c",
      parsedTx: {
        blockTime: 1652175857,
        meta: {
          err: null,
          fee: 5000,
          innerInstructions: [
            {
              index: 0,
              instructions: [
                {
                  parsed: {
                    info: {
                      lamports: 2477760,
                      newAccount:
                        "E3Ky3xjZ3VQQAPd9f5mBiBxrgvPCLA5L8HWrubo2i4z6",
                      owner: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                      source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                      space: 228,
                    },
                    type: "createAccount",
                  },
                  program: "system",
                  programId: "11111111111111111111111111111111",
                },
              ],
            },
          ],
          logMessages: [
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o invoke [1]",
            "Program 11111111111111111111111111111111 invoke [2]",
            "Program 11111111111111111111111111111111 success",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o consumed 73323 of 200000 compute units",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o success",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
            'Program log: Memo (len 32): "03c8f1cde6467d4326a959edb247d53c"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 126677 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999661980040, 2477760, 1, 1141440, 1176240, 1, 1057920, 1, 1169280,
            1009200,
          ],
          postTokenBalances: [],
          preBalances: [
            999664462800, 0, 1, 1141440, 1176240, 1, 1057920, 1, 1169280,
            1009200,
          ],
          preTokenBalances: [],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 438177,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                signer: true,
                writable: true,
              },
              {
                pubkey: "E3Ky3xjZ3VQQAPd9f5mBiBxrgvPCLA5L8HWrubo2i4z6",
                signer: false,
                writable: true,
              },
              {
                pubkey: "11111111111111111111111111111111",
                signer: false,
                writable: false,
              },
              {
                pubkey: "6MxkvoEwgB9EqQRLNhvYaPGhfcLtBtpBqdQugr3AZUgD",
                signer: false,
                writable: false,
              },
              {
                pubkey: "AcWXKfHmrrcXzyk7oWZV5S9VwgLPtGK9bGQHkQjA3c8S",
                signer: false,
                writable: false,
              },
              {
                pubkey: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                signer: false,
                writable: false,
              },
              {
                pubkey: "FKoMTctsC7vJbEqyRiiPskPnuQx2tX1kurmvWByq5uZP",
                signer: false,
                writable: false,
              },
              {
                pubkey: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
                signer: false,
                writable: false,
              },
              {
                pubkey: "SysvarC1ock11111111111111111111111111111111",
                signer: false,
                writable: false,
              },
              {
                pubkey: "SysvarRent111111111111111111111111111111111",
                signer: false,
                writable: false,
              },
            ],
            instructions: [
              {
                accounts: [
                  "6MxkvoEwgB9EqQRLNhvYaPGhfcLtBtpBqdQugr3AZUgD",
                  "FKoMTctsC7vJbEqyRiiPskPnuQx2tX1kurmvWByq5uZP",
                  "AcWXKfHmrrcXzyk7oWZV5S9VwgLPtGK9bGQHkQjA3c8S",
                  "E3Ky3xjZ3VQQAPd9f5mBiBxrgvPCLA5L8HWrubo2i4z6",
                  "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  "SysvarC1ock11111111111111111111111111111111",
                  "SysvarRent111111111111111111111111111111111",
                  "11111111111111111111111111111111",
                ],
                data: "MSvX3sKSJtH6MECF82Wyuw5zWXC4EW7WReDndFa5gSa8UZSSdqCjVcj4xeH3dQpe44WTv61Y5tSh3GoX9j6Ee89xLbrjfwjP2hTUwCtEqtT5P375JuAtu1pEguxPzB3hDUYawSoKip4DwxrGcEUEPzsGmYEMcHSqMBf5GNxV9nozU4o1hpq5KJSPDhBJZsV9thFz7QwZFjTQ4SftLmcARAmkhRXdvBH6dLySH9SLQGjx7DgTxJWFMvv7atMgWkaTMtxdS9MH",
                programId: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
              },
              {
                parsed: "03c8f1cde6467d4326a959edb247d53c",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "8AfLEoo8Gh3AheuWiwjCjzWAfD3a51cUts4REgvzbVWD",
          },
          signatures: [
            "3edvnWEHAq79uDcnrpEXCAKQt5MFACN4P9J1iC8b8DUFQG5vZVR9A3mkpLnk2WK8PHTJAX7WtZfsfkNmWirpBQkm",
          ],
        },
      },
    },
    // Bridge tokens to Solana - Transfer Tether USD from Ethereum to Solana[3]
    {
      ecosystem: "solana",
      txId: "4jhjS99mwFEDtGarMb4gh5KR266Cj19iHZUbDqjUAQ3L136rktLrAGA2WAsPgiBEjJWinzb6faWLd4QbdyMpj9XT",
      timestamp: 1652175862,
      interactionId: "03c8f1cde6467d4326a959edb247d53c",
      parsedTx: {
        blockTime: 1652175862,
        meta: {
          err: null,
          fee: 5000,
          innerInstructions: [
            {
              index: 0,
              instructions: [
                {
                  parsed: {
                    info: {
                      lamports: 897840,
                      newAccount:
                        "6dees28Hhop6TzYpMHK6fxK4ebm2bRr1hw2mbSEWFCep",
                      owner: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
                      source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                      space: 1,
                    },
                    type: "createAccount",
                  },
                  program: "system",
                  programId: "11111111111111111111111111111111",
                },
                {
                  parsed: {
                    info: {
                      account: "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                      amount: "10000000000",
                      mint: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
                      mintAuthority:
                        "8P2wAnHr2t4pAVEyJftzz7k6wuCE7aP1VugNwehzCJJY",
                    },
                    type: "mintTo",
                  },
                  program: "spl-token",
                  programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                },
                {
                  parsed: {
                    info: {
                      account: "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                      amount: "0",
                      mint: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
                      mintAuthority:
                        "8P2wAnHr2t4pAVEyJftzz7k6wuCE7aP1VugNwehzCJJY",
                    },
                    type: "mintTo",
                  },
                  program: "spl-token",
                  programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                },
              ],
            },
          ],
          logMessages: [
            "Program B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE invoke [1]",
            "Program 11111111111111111111111111111111 invoke [2]",
            "Program 11111111111111111111111111111111 success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: MintTo",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2779 of 129570 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: MintTo",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2779 of 117486 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE consumed 87463 of 200000 compute units",
            "Program B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE success",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
            'Program log: Memo (len 32): "03c8f1cde6467d4326a959edb247d53c"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 112537 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999661077200, 897840, 2039280, 1461600, 1, 1134480, 1113600,
            1127520, 0, 1, 1, 2477760, 1, 1009200, 1,
          ],
          postTokenBalances: [
            {
              accountIndex: 2,
              mint: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "10000000000",
                decimals: 6,
                uiAmount: 10000,
                uiAmountString: "10000",
              },
            },
          ],
          preBalances: [
            999661980040, 0, 2039280, 1461600, 1, 1134480, 1113600, 1127520, 0,
            1, 1, 2477760, 1, 1009200, 1,
          ],
          preTokenBalances: [
            {
              accountIndex: 2,
              mint: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "0",
                decimals: 6,
                uiAmount: null,
                uiAmountString: "0",
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 438184,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                signer: true,
                writable: true,
              },
              {
                pubkey: "6dees28Hhop6TzYpMHK6fxK4ebm2bRr1hw2mbSEWFCep",
                signer: false,
                writable: true,
              },
              {
                pubkey: "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                signer: false,
                writable: true,
              },
              {
                pubkey: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
                signer: false,
                writable: true,
              },
              {
                pubkey: "11111111111111111111111111111111",
                signer: false,
                writable: false,
              },
              {
                pubkey: "22cs85vxeoBRvdgwvn5GrE4qn5iqjQCe51VvFAhwdgho",
                signer: false,
                writable: false,
              },
              {
                pubkey: "3GwVs8GSLdo4RUsoXTkGQhojauQ1sXcDNjm7LSDicw19",
                signer: false,
                writable: false,
              },
              {
                pubkey: "7UqWgfVW1TrjrqauMfDoNMcw8kEStSsQXWNoT2BbhDS5",
                signer: false,
                writable: false,
              },
              {
                pubkey: "8P2wAnHr2t4pAVEyJftzz7k6wuCE7aP1VugNwehzCJJY",
                signer: false,
                writable: false,
              },
              {
                pubkey: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
                signer: false,
                writable: false,
              },
              {
                pubkey: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                signer: false,
                writable: false,
              },
              {
                pubkey: "E3Ky3xjZ3VQQAPd9f5mBiBxrgvPCLA5L8HWrubo2i4z6",
                signer: false,
                writable: false,
              },
              {
                pubkey: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
                signer: false,
                writable: false,
              },
              {
                pubkey: "SysvarRent111111111111111111111111111111111",
                signer: false,
                writable: false,
              },
              {
                pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                signer: false,
                writable: false,
              },
            ],
            instructions: [
              {
                accounts: [
                  "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  "3GwVs8GSLdo4RUsoXTkGQhojauQ1sXcDNjm7LSDicw19",
                  "E3Ky3xjZ3VQQAPd9f5mBiBxrgvPCLA5L8HWrubo2i4z6",
                  "6dees28Hhop6TzYpMHK6fxK4ebm2bRr1hw2mbSEWFCep",
                  "7UqWgfVW1TrjrqauMfDoNMcw8kEStSsQXWNoT2BbhDS5",
                  "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                  "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                  "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
                  "22cs85vxeoBRvdgwvn5GrE4qn5iqjQCe51VvFAhwdgho",
                  "8P2wAnHr2t4pAVEyJftzz7k6wuCE7aP1VugNwehzCJJY",
                  "SysvarRent111111111111111111111111111111111",
                  "11111111111111111111111111111111",
                  "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ],
                data: "4",
                programId: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
              },
              {
                parsed: "03c8f1cde6467d4326a959edb247d53c",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "BLR55iUXPeuBaLjeucsRaHyJvQSUM8SCXQy3HeS6Ei3J",
          },
          signatures: [
            "4jhjS99mwFEDtGarMb4gh5KR266Cj19iHZUbDqjUAQ3L136rktLrAGA2WAsPgiBEjJWinzb6faWLd4QbdyMpj9XT",
          ],
        },
      },
    },
    // Interact with pool on Solana - Swap tokens[0]
    {
      ecosystem: "solana",
      txId: "cSFZ9JT18YEUF4v2hZMCaur17sMn9bkyXUWHYiD9HXDwwLbG3EXEpy9yLVgcRuWqVofdCdmJs7bn4isz3RihoyJ",
      timestamp: 1652175866,
      interactionId: "03c8f1cde6467d4326a959edb247d53c",
      parsedTx: {
        blockTime: 1652175866,
        meta: {
          err: null,
          fee: 10000,
          innerInstructions: [
            {
              index: 1,
              instructions: [
                {
                  parsed: {
                    info: {
                      amount: "10000000000",
                      authority: "4sFh6m5BMoGAXECqh1Ze254tARcpV3kKrWJoHs3WGtDd",
                      destination:
                        "TP4VVUhiHKBxzT6N3ThsivkHZtNtJTyx9HzYwLherjQ",
                      source: "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                    },
                    type: "transfer",
                  },
                  program: "spl-token",
                  programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                },
                {
                  parsed: {
                    info: {
                      amount: "999599761696",
                      authority: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
                      destination:
                        "9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm",
                      source: "TP6DaXSavPoCHKrKb5dcwtAkxM9b4Dwh4isd7fQ8hCb",
                    },
                    type: "transfer",
                  },
                  program: "spl-token",
                  programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                },
                {
                  parsed: {
                    info: {
                      account: "6vQZbArmuXmapqpVSpcB3EBpyTcrvw7yGJ6kJRmweX6x",
                      amount: "99999967",
                      mint: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
                      mintAuthority:
                        "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
                    },
                    type: "mintTo",
                  },
                  program: "spl-token",
                  programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                },
              ],
            },
          ],
          logMessages: [
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
            "Program log: Instruction: Approve",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2297 of 200000 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi invoke [1]",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: Transfer",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3248 of 129953 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: Transfer",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3121 of 123470 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: MintTo",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2779 of 117124 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi consumed 87310 of 197703 compute units",
            "Program SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi success",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
            'Program log: Memo (len 32): "03c8f1cde6467d4326a959edb247d53c"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 110393 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999661067200, 0, 2039280, 2039280, 2039280, 2039280, 2039280,
            2039280, 2039280, 1461600, 5087760, 2039280, 2039280, 2039280,
            2039280, 2039280, 2039280, 0, 1, 1, 1,
          ],
          postTokenBalances: [
            {
              accountIndex: 2,
              mint: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "750000001047490",
                decimals: 6,
                uiAmount: 750000001.04749,
                uiAmountString: "750000001.04749",
              },
            },
            {
              accountIndex: 3,
              mint: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "150000003400710027",
                decimals: 8,
                uiAmount: 1500000034.0071,
                uiAmountString: "1500000034.00710027",
              },
            },
            {
              accountIndex: 4,
              mint: "4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "0",
                decimals: 8,
                uiAmount: null,
                uiAmountString: "0",
              },
            },
            {
              accountIndex: 5,
              mint: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "0",
                decimals: 6,
                uiAmount: null,
                uiAmountString: "0",
              },
            },
            {
              accountIndex: 6,
              mint: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "999599761696",
                decimals: 8,
                uiAmount: 9995.99761696,
                uiAmountString: "9995.99761696",
              },
            },
            {
              accountIndex: 7,
              mint: "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "749999949048290",
                decimals: 6,
                uiAmount: 749999949.04829,
                uiAmountString: "749999949.04829",
              },
            },
            {
              accountIndex: 8,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "0",
                decimals: 6,
                uiAmount: null,
                uiAmountString: "0",
              },
            },
            {
              accountIndex: 11,
              mint: "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "250000050951710",
                decimals: 6,
                uiAmount: 250000050.95171,
                uiAmountString: "250000050.95171",
              },
            },
            {
              accountIndex: 12,
              mint: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "249999998952510",
                decimals: 6,
                uiAmount: 249999998.95251,
                uiAmountString: "249999998.95251",
              },
            },
            {
              accountIndex: 13,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "250000002951710",
                decimals: 6,
                uiAmount: 250000002.95171,
                uiAmountString: "250000002.95171",
              },
            },
            {
              accountIndex: 14,
              mint: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "250009998952110",
                decimals: 6,
                uiAmount: 250009998.95211,
                uiAmountString: "250009998.95211",
              },
            },
            {
              accountIndex: 15,
              mint: "4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "25000000637241462",
                decimals: 8,
                uiAmount: 250000006.37241465,
                uiAmountString: "250000006.37241462",
              },
            },
            {
              accountIndex: 16,
              mint: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "24999000695409239",
                decimals: 8,
                uiAmount: 249990006.9540924,
                uiAmountString: "249990006.95409239",
              },
            },
          ],
          preBalances: [
            999661077200, 0, 2039280, 2039280, 2039280, 2039280, 2039280,
            2039280, 2039280, 1461600, 5087760, 2039280, 2039280, 2039280,
            2039280, 2039280, 2039280, 0, 1, 1, 1,
          ],
          preTokenBalances: [
            {
              accountIndex: 2,
              mint: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "750000001047490",
                decimals: 6,
                uiAmount: 750000001.04749,
                uiAmountString: "750000001.04749",
              },
            },
            {
              accountIndex: 3,
              mint: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "150000003300710060",
                decimals: 8,
                uiAmount: 1500000033.0071006,
                uiAmountString: "1500000033.0071006",
              },
            },
            {
              accountIndex: 4,
              mint: "4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "0",
                decimals: 8,
                uiAmount: null,
                uiAmountString: "0",
              },
            },
            {
              accountIndex: 5,
              mint: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "10000000000",
                decimals: 6,
                uiAmount: 10000,
                uiAmountString: "10000",
              },
            },
            {
              accountIndex: 6,
              mint: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "0",
                decimals: 8,
                uiAmount: null,
                uiAmountString: "0",
              },
            },
            {
              accountIndex: 7,
              mint: "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "749999949048290",
                decimals: 6,
                uiAmount: 749999949.04829,
                uiAmountString: "749999949.04829",
              },
            },
            {
              accountIndex: 8,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "0",
                decimals: 6,
                uiAmount: null,
                uiAmountString: "0",
              },
            },
            {
              accountIndex: 11,
              mint: "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "250000050951710",
                decimals: 6,
                uiAmount: 250000050.95171,
                uiAmountString: "250000050.95171",
              },
            },
            {
              accountIndex: 12,
              mint: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "249999998952510",
                decimals: 6,
                uiAmount: 249999998.95251,
                uiAmountString: "249999998.95251",
              },
            },
            {
              accountIndex: 13,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "250000002951710",
                decimals: 6,
                uiAmount: 250000002.95171,
                uiAmountString: "250000002.95171",
              },
            },
            {
              accountIndex: 14,
              mint: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "249999998952110",
                decimals: 6,
                uiAmount: 249999998.95211,
                uiAmountString: "249999998.95211",
              },
            },
            {
              accountIndex: 15,
              mint: "4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "25000000637241462",
                decimals: 8,
                uiAmount: 250000006.37241465,
                uiAmountString: "250000006.37241462",
              },
            },
            {
              accountIndex: 16,
              mint: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "25000000295170935",
                decimals: 8,
                uiAmount: 250000002.95170936,
                uiAmountString: "250000002.95170935",
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 438191,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                signer: true,
                writable: true,
              },
              {
                pubkey: "4sFh6m5BMoGAXECqh1Ze254tARcpV3kKrWJoHs3WGtDd",
                signer: true,
                writable: false,
              },
              {
                pubkey: "3f77zu2FHFXdXjYZ8E8LPQq4cU67yYkRw3xvDG6P27Jy",
                signer: false,
                writable: true,
              },
              {
                pubkey: "6vQZbArmuXmapqpVSpcB3EBpyTcrvw7yGJ6kJRmweX6x",
                signer: false,
                writable: true,
              },
              {
                pubkey: "8asHr5Bf6hWBU6Pg7Hi9PKeo9mFj6iYGALySJRKq6FRE",
                signer: false,
                writable: true,
              },
              {
                pubkey: "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                signer: false,
                writable: true,
              },
              {
                pubkey: "9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm",
                signer: false,
                writable: true,
              },
              {
                pubkey: "BBtg88Fo2JPs9DE2PxSieezKsvzoNWwCu6eWU3tBzLm1",
                signer: false,
                writable: true,
              },
              {
                pubkey: "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                signer: false,
                writable: true,
              },
              {
                pubkey: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
                signer: false,
                writable: true,
              },
              {
                pubkey: "PLSVJHkSe1wQgocGJx9d7KnfjXsPykq7cgLFHwXFRxV",
                signer: false,
                writable: true,
              },
              {
                pubkey: "TP19UrkLUihiEg3y98VjM8Gmh7GjWayucsbpyo195wC",
                signer: false,
                writable: true,
              },
              {
                pubkey: "TP2gzosaKJNf5UjM8eWKKnN7Yni1uLbYJr88rvEvgPA",
                signer: false,
                writable: true,
              },
              {
                pubkey: "TP3feUviS5XoqEpzz2d9iHhYip1wFaP7Zf4gmEXRVZ7",
                signer: false,
                writable: true,
              },
              {
                pubkey: "TP4VVUhiHKBxzT6N3ThsivkHZtNtJTyx9HzYwLherjQ",
                signer: false,
                writable: true,
              },
              {
                pubkey: "TP5Zu7nEzkif6zyz5pQaC3G9aPJ1PFSTfpvhQfDC2yr",
                signer: false,
                writable: true,
              },
              {
                pubkey: "TP6DaXSavPoCHKrKb5dcwtAkxM9b4Dwh4isd7fQ8hCb",
                signer: false,
                writable: true,
              },
              {
                pubkey: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
                signer: false,
                writable: false,
              },
              {
                pubkey: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
                signer: false,
                writable: false,
              },
              {
                pubkey: "SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi",
                signer: false,
                writable: false,
              },
              {
                pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                signer: false,
                writable: false,
              },
            ],
            instructions: [
              {
                parsed: {
                  info: {
                    amount: "10000000000",
                    delegate: "4sFh6m5BMoGAXECqh1Ze254tARcpV3kKrWJoHs3WGtDd",
                    owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                    source: "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                  },
                  type: "approve",
                },
                program: "spl-token",
                programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              },
              {
                accounts: [
                  "PLSVJHkSe1wQgocGJx9d7KnfjXsPykq7cgLFHwXFRxV",
                  "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
                  "TP19UrkLUihiEg3y98VjM8Gmh7GjWayucsbpyo195wC",
                  "TP2gzosaKJNf5UjM8eWKKnN7Yni1uLbYJr88rvEvgPA",
                  "TP3feUviS5XoqEpzz2d9iHhYip1wFaP7Zf4gmEXRVZ7",
                  "TP4VVUhiHKBxzT6N3ThsivkHZtNtJTyx9HzYwLherjQ",
                  "TP5Zu7nEzkif6zyz5pQaC3G9aPJ1PFSTfpvhQfDC2yr",
                  "TP6DaXSavPoCHKrKb5dcwtAkxM9b4Dwh4isd7fQ8hCb",
                  "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
                  "6vQZbArmuXmapqpVSpcB3EBpyTcrvw7yGJ6kJRmweX6x",
                  "4sFh6m5BMoGAXECqh1Ze254tARcpV3kKrWJoHs3WGtDd",
                  "BBtg88Fo2JPs9DE2PxSieezKsvzoNWwCu6eWU3tBzLm1",
                  "3f77zu2FHFXdXjYZ8E8LPQq4cU67yYkRw3xvDG6P27Jy",
                  "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                  "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                  "8asHr5Bf6hWBU6Pg7Hi9PKeo9mFj6iYGALySJRKq6FRE",
                  "9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm",
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ],
                data: "3LbDkKMJLnVYL3JombCdBAWKytLbdi21JPnJo5iQEcMbNZvijL6ATkzAkwzawUrzLbuDACigCbkPRAb9",
                programId: "SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi",
              },
              {
                parsed: "03c8f1cde6467d4326a959edb247d53c",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "3PR8Y2n3tQUR1piPg4nsT49x39nSKJXVQkrKJKepKwfw",
          },
          signatures: [
            "cSFZ9JT18YEUF4v2hZMCaur17sMn9bkyXUWHYiD9HXDwwLbG3EXEpy9yLVgcRuWqVofdCdmJs7bn4isz3RihoyJ",
            "4XGDhkhKws62t3vz3inPV3KCst8ujWZtvUA9xu8By6DwYsRV1foYKBp4XgKYNhvejmCMiVEqvRNLXEo8HkndcYzj",
          ],
        },
      },
    },
    // Bridge tokens from Solana - Transfer Tether USD from Solana to BNB Chain[0]
    {
      ecosystem: "solana",
      txId: "4vgbpZZxLCdnuddGbwHWNHD5fYuEnhS3kmqRDM2HEu7XN9BwtMzNMmxaijxtsu7L1YprcN5SzwKcgZArU9v48LVP",
      timestamp: 1652175871,
      interactionId: "03c8f1cde6467d4326a959edb247d53c",
      parsedTx: {
        blockTime: 1652175871,
        meta: {
          err: null,
          fee: 10000,
          innerInstructions: [
            {
              index: 2,
              instructions: [
                {
                  parsed: {
                    info: {
                      account: "9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm",
                      amount: "999599761696",
                      authority: "C1AVBd8PpfHGe1zW42XXVbHsAQf6q5khiRKuGPLbwHkh",
                      mint: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
                    },
                    type: "burn",
                  },
                  program: "spl-token",
                  programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                },
                {
                  parsed: {
                    info: {
                      destination:
                        "GXBsgBD3LDn3vkRZF6TfY5RqgajVZ4W5bMAdiAaaUARs",
                      lamports: 100,
                      source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                    },
                    type: "transfer",
                  },
                  program: "system",
                  programId: "11111111111111111111111111111111",
                },
                {
                  accounts: [
                    "FKoMTctsC7vJbEqyRiiPskPnuQx2tX1kurmvWByq5uZP",
                    "HvTs264VbcrzJfr1H8B9h1gwMVoBhLouK1gKxWafHW2Y",
                    "ENG1wQ7CQKH8ibAJ1hSLmJgL9Ucg6DRDbj752ZAfidLA",
                    "7F4RNrCkBJxs1uidvF96iPieZ8upkEnc8NdpHoJ8YjxH",
                    "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                    "GXBsgBD3LDn3vkRZF6TfY5RqgajVZ4W5bMAdiAaaUARs",
                    "SysvarC1ock11111111111111111111111111111111",
                    "11111111111111111111111111111111",
                    "SysvarRent111111111111111111111111111111111",
                  ],
                  data: "212cQHQMDAtEsnejqBPgjpXpbs3WweZpaQuWVe1nGrBXsyCAfSHDwzBJfWRinRAvkvyYKDZ8Dv3wYBde9Gon9Ak4L2PkNCynF849taHCj59uyyEXDRsUGdko61qW5Wtbji17cF6tD5SVfQQZ2SnnLqoHnqveojfkK5pLoEbWgtWZsqS5V6dNCaCx6wTYYE2oK4k",
                  programId: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                },
                {
                  parsed: {
                    info: {
                      lamports: 2477760,
                      newAccount:
                        "HvTs264VbcrzJfr1H8B9h1gwMVoBhLouK1gKxWafHW2Y",
                      owner: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                      source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                      space: 228,
                    },
                    type: "createAccount",
                  },
                  program: "system",
                  programId: "11111111111111111111111111111111",
                },
              ],
            },
          ],
          logMessages: [
            "Program 11111111111111111111111111111111 invoke [1]",
            "Program 11111111111111111111111111111111 success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
            "Program log: Instruction: Approve",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2298 of 200000 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE invoke [1]",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: Burn",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2886 of 156865 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program 11111111111111111111111111111111 invoke [2]",
            "Program 11111111111111111111111111111111 success",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o invoke [2]",
            "Program log: Sequence: 27",
            "Program 11111111111111111111111111111111 invoke [3]",
            "Program 11111111111111111111111111111111 success",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o consumed 26628 of 139447 compute units",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o success",
            "Program B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE consumed 87091 of 197702 compute units",
            "Program B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE success",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
            'Program log: Memo (len 32): "03c8f1cde6467d4326a959edb247d53c"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 110611 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999658579240, 2477760, 946560, 1461600, 2039280, 1057920, 896480, 1,
            1113600, 1134480, 1, 1, 0, 0, 1, 1169280, 1009200, 1,
          ],
          postTokenBalances: [
            {
              accountIndex: 4,
              mint: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "0",
                decimals: 8,
                uiAmount: null,
                uiAmountString: "0",
              },
            },
          ],
          preBalances: [
            999661067200, 0, 946560, 1461600, 2039280, 1057920, 896280, 1,
            1113600, 1134480, 1, 1, 0, 0, 1, 1169280, 1009200, 1,
          ],
          preTokenBalances: [
            {
              accountIndex: 4,
              mint: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "999599761696",
                decimals: 8,
                uiAmount: 9995.99761696,
                uiAmountString: "9995.99761696",
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 438197,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                signer: true,
                writable: true,
              },
              {
                pubkey: "HvTs264VbcrzJfr1H8B9h1gwMVoBhLouK1gKxWafHW2Y",
                signer: true,
                writable: true,
              },
              {
                pubkey: "7F4RNrCkBJxs1uidvF96iPieZ8upkEnc8NdpHoJ8YjxH",
                signer: false,
                writable: true,
              },
              {
                pubkey: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
                signer: false,
                writable: true,
              },
              {
                pubkey: "9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm",
                signer: false,
                writable: true,
              },
              {
                pubkey: "FKoMTctsC7vJbEqyRiiPskPnuQx2tX1kurmvWByq5uZP",
                signer: false,
                writable: true,
              },
              {
                pubkey: "GXBsgBD3LDn3vkRZF6TfY5RqgajVZ4W5bMAdiAaaUARs",
                signer: false,
                writable: true,
              },
              {
                pubkey: "11111111111111111111111111111111",
                signer: false,
                writable: false,
              },
              {
                pubkey: "3GwVs8GSLdo4RUsoXTkGQhojauQ1sXcDNjm7LSDicw19",
                signer: false,
                writable: false,
              },
              {
                pubkey: "3Jfrtkh5Aa94mfyNXddpKQkKJ3VuBHEUV3vMffP6WH7F",
                signer: false,
                writable: false,
              },
              {
                pubkey: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
                signer: false,
                writable: false,
              },
              {
                pubkey: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                signer: false,
                writable: false,
              },
              {
                pubkey: "C1AVBd8PpfHGe1zW42XXVbHsAQf6q5khiRKuGPLbwHkh",
                signer: false,
                writable: false,
              },
              {
                pubkey: "ENG1wQ7CQKH8ibAJ1hSLmJgL9Ucg6DRDbj752ZAfidLA",
                signer: false,
                writable: false,
              },
              {
                pubkey: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
                signer: false,
                writable: false,
              },
              {
                pubkey: "SysvarC1ock11111111111111111111111111111111",
                signer: false,
                writable: false,
              },
              {
                pubkey: "SysvarRent111111111111111111111111111111111",
                signer: false,
                writable: false,
              },
              {
                pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                signer: false,
                writable: false,
              },
            ],
            instructions: [
              {
                parsed: {
                  info: {
                    destination: "GXBsgBD3LDn3vkRZF6TfY5RqgajVZ4W5bMAdiAaaUARs",
                    lamports: 100,
                    source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  },
                  type: "transfer",
                },
                program: "system",
                programId: "11111111111111111111111111111111",
              },
              {
                parsed: {
                  info: {
                    amount: "999599761696",
                    delegate: "C1AVBd8PpfHGe1zW42XXVbHsAQf6q5khiRKuGPLbwHkh",
                    owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                    source: "9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm",
                  },
                  type: "approve",
                },
                program: "spl-token",
                programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              },
              {
                accounts: [
                  "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  "3GwVs8GSLdo4RUsoXTkGQhojauQ1sXcDNjm7LSDicw19",
                  "9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm",
                  "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
                  "3Jfrtkh5Aa94mfyNXddpKQkKJ3VuBHEUV3vMffP6WH7F",
                  "C1AVBd8PpfHGe1zW42XXVbHsAQf6q5khiRKuGPLbwHkh",
                  "FKoMTctsC7vJbEqyRiiPskPnuQx2tX1kurmvWByq5uZP",
                  "HvTs264VbcrzJfr1H8B9h1gwMVoBhLouK1gKxWafHW2Y",
                  "ENG1wQ7CQKH8ibAJ1hSLmJgL9Ucg6DRDbj752ZAfidLA",
                  "7F4RNrCkBJxs1uidvF96iPieZ8upkEnc8NdpHoJ8YjxH",
                  "GXBsgBD3LDn3vkRZF6TfY5RqgajVZ4W5bMAdiAaaUARs",
                  "SysvarC1ock11111111111111111111111111111111",
                  "SysvarRent111111111111111111111111111111111",
                  "11111111111111111111111111111111",
                  "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ],
                data: "2Z6c2ngEBbNaxBsqkf6PCDuMHnUrkuByyaGH9Gk4iQurgeTq2Yg7EtpfddM29BNzJ2VysdXvZwV",
                programId: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
              },
              {
                parsed: "03c8f1cde6467d4326a959edb247d53c",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "wr7t3YrhLHPi96TUuphymTX8zZbYsfH52tHZbn6aT7i",
          },
          signatures: [
            "4vgbpZZxLCdnuddGbwHWNHD5fYuEnhS3kmqRDM2HEu7XN9BwtMzNMmxaijxtsu7L1YprcN5SzwKcgZArU9v48LVP",
            "3PL44YXMXx6hWxHChbi1R43tFniYagkGNy1yxiZnS2GrtvehG7y1UnRoppuv5zuVjhjEfGK5Tvv8JrwfpFEEeZyT",
          ],
        },
      },
    },
  ],
  ethereum: [
    // Bridge tokens to Solana - Transfer Tether USD from Ethereum to Solana[0]
    {
      ecosystem: "ethereum",
      txId: "0x241a7cafea930bb57bd527fbd0d59871bb95adc8170caf43021f36afdae7f5c5",
      timestamp: null,
      interactionId: "03c8f1cde6467d4326a959edb247d53c",
      txResponse: {
        hash: "0x241a7cafea930bb57bd527fbd0d59871bb95adc8170caf43021f36afdae7f5c5",
        type: 0,
        accessList: null,
        blockHash: null,
        blockNumber: null,
        transactionIndex: null,
        confirmations: 0,
        from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        gasPrice: {
          type: "BigNumber",
          hex: "0x04a817c800",
        },
        gasLimit: {
          type: "BigNumber",
          hex: "0x017bd7",
        },
        to: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
        value: {
          type: "BigNumber",
          hex: "0x00",
        },
        nonce: 74,
        data: "0x0f5287b0000000000000000000000000daa71fbba28c946258dd3d5fcc9001401f72270f00000000000000000000000000000000000000000000000000000002540be40000000000000000000000000000000000000000000000000000000000000000017607c9d15af58ce7d7bcc803efe02c531dbd5cc5708370e640d7b699009e62bb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000509e000003c8f1cde6467d4326a959edb247d53c",
        r: "0xc19ba67deda83f50034ee690fb1c5fc60296764e1aeefc078b2e0cc4adec0422",
        s: "0x7f877b7aa1b06b84e12f124bc418c4f3483b3e430296de19c06e54dd29a3ba45",
        v: 2710,
        creates: null,
        chainId: 1337,
      },
      txReceipt: {
        to: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
        from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        contractAddress: null,
        transactionIndex: 0,
        gasUsed: {
          type: "BigNumber",
          hex: "0x0161bb",
        },
        logsBloom:
          "0x400000000001000000000000000000000000000000000000000000000000000000180000000000000000802000000000000000000000000000000000082000000010000000000000000000080000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000002000000001000000a0004000400000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000010000000000001000000000000000000000000000000000000000000000000",
        blockHash:
          "0x3a7da87d017f477b5cce1b478aefc49dd33099ab979bbc03490d1adb2f270366",
        transactionHash:
          "0x241a7cafea930bb57bd527fbd0d59871bb95adc8170caf43021f36afdae7f5c5",
        logs: [
          {
            transactionIndex: 0,
            blockNumber: 210077,
            transactionHash:
              "0x241a7cafea930bb57bd527fbd0d59871bb95adc8170caf43021f36afdae7f5c5",
            address: "0xdAA71FBBA28C946258DD3d5FcC9001401f72270F",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x00000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1",
              "0x0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16",
            ],
            data: "0x00000000000000000000000000000000000000000000000000000002540be400",
            logIndex: 0,
            blockHash:
              "0x3a7da87d017f477b5cce1b478aefc49dd33099ab979bbc03490d1adb2f270366",
          },
          {
            transactionIndex: 0,
            blockNumber: 210077,
            transactionHash:
              "0x241a7cafea930bb57bd527fbd0d59871bb95adc8170caf43021f36afdae7f5c5",
            address: "0xdAA71FBBA28C946258DD3d5FcC9001401f72270F",
            topics: [
              "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
              "0x00000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1",
              "0x0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16",
            ],
            data: "0x00000000000000000000000000000000000004ee2d6d415b85ac0c1f02c27c00",
            logIndex: 1,
            blockHash:
              "0x3a7da87d017f477b5cce1b478aefc49dd33099ab979bbc03490d1adb2f270366",
          },
          {
            transactionIndex: 0,
            blockNumber: 210077,
            transactionHash:
              "0x241a7cafea930bb57bd527fbd0d59871bb95adc8170caf43021f36afdae7f5c5",
            address: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
            topics: [
              "0x6eb224fb001ed210e379b335e35efe88672a8ce935d981a6896b27ffdf52a3b2",
              "0x0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16",
            ],
            data: "0x000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000509e00000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000f00000000000000000000000000000000000000000000000000000000000000850100000000000000000000000000000000000000000000000000000002540be400000000000000000000000000daa71fbba28c946258dd3d5fcc9001401f72270f00027607c9d15af58ce7d7bcc803efe02c531dbd5cc5708370e640d7b699009e62bb00010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            logIndex: 2,
            blockHash:
              "0x3a7da87d017f477b5cce1b478aefc49dd33099ab979bbc03490d1adb2f270366",
          },
        ],
        blockNumber: 210077,
        confirmations: 3,
        cumulativeGasUsed: {
          type: "BigNumber",
          hex: "0x0161bb",
        },
        status: 1,
        type: 0,
        byzantium: true,
      },
    },
  ],
  bsc: [
    // Bridge tokens from Solana - Transfer Tether USD from Solana to BNB Chain[1]
    {
      ecosystem: "bsc",
      txId: "0x6940b86553307159bcea8eb7f904c9c4aae8e972e5c348a7c9d101c92c468af9",
      timestamp: null,
      interactionId: "03c8f1cde6467d4326a959edb247d53c",
      txResponse: {
        hash: "0x6940b86553307159bcea8eb7f904c9c4aae8e972e5c348a7c9d101c92c468af9",
        type: 0,
        accessList: null,
        blockHash: null,
        blockNumber: null,
        transactionIndex: null,
        confirmations: 0,
        from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        gasPrice: {
          type: "BigNumber",
          hex: "0x04a817c800",
        },
        gasLimit: {
          type: "BigNumber",
          hex: "0x01ad34",
        },
        to: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
        value: {
          type: "BigNumber",
          hex: "0x00",
        },
        nonce: 102,
        data: "0xc68785190000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000010001000000000100d23a3038396db3d969d5ca22080cad7e4e55ca83cab8d161c0e520742575af942775b915f314a6d10c1acfac46c623d5228741019b4fe1d5c62d530692b52e3501627a33ff0000775d0001c69a1b1a65dd336bf1df6a77afb501fc25db7fc0938cb08595a9ef473265cb4f000000000000001b2001000000000000000000000000000000000000000000000000000000e8bcc9e920000000000000000000000000988b6cfbf3332ff98ffbded665b1f53a61f92612000400000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c10004000000000000000000000000000000000000000000000000000000000000000003c8f1cde6467d4326a959edb247d53c",
        r: "0x87206ba18df235219f428282706f7bb22747c9637aa8775a2a1fd15641496e55",
        s: "0x4acf7bca29aa1250cd7add34ec3da7b91bdac2666a0857b173c2d3815f4f274b",
        v: 2829,
        creates: null,
        chainId: 1397,
      },
      txReceipt: {
        to: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
        from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        contractAddress: null,
        transactionIndex: 0,
        gasUsed: {
          type: "BigNumber",
          hex: "0x01a775",
        },
        logsBloom:
          "0x00000000000000000000000000000000000000000000000001000000000000080000000000000000000080200000000000000000000000000000000000000000001000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000200000000000000080004000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000",
        blockHash:
          "0x6a1ee172cc267aa59cc1c5d60edd9b3df5cfa228854b434d6c49158b4f97a8d4",
        transactionHash:
          "0x6940b86553307159bcea8eb7f904c9c4aae8e972e5c348a7c9d101c92c468af9",
        logs: [
          {
            transactionIndex: 0,
            blockNumber: 210269,
            transactionHash:
              "0x6940b86553307159bcea8eb7f904c9c4aae8e972e5c348a7c9d101c92c468af9",
            address: "0x988B6CFBf3332FF98FFBdED665b1F53a61f92612",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16",
              "0x00000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1",
            ],
            data: "0x00000000000000000000000000000000000000000000021de255778f58008000",
            logIndex: 0,
            blockHash:
              "0x6a1ee172cc267aa59cc1c5d60edd9b3df5cfa228854b434d6c49158b4f97a8d4",
          },
        ],
        blockNumber: 210269,
        confirmations: 2,
        cumulativeGasUsed: {
          type: "BigNumber",
          hex: "0x01a775",
        },
        status: 1,
        type: 0,
        byzantium: true,
      },
    },
  ],
  terra: null,
  avalanche: null,
  polygon: null,
};

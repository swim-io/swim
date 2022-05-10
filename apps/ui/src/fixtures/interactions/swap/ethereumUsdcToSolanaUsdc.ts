export const interaction = {
  instruction: 1,
  params: {
    exactInputAmounts: ["0", "0", "1002", "0", "0", "0"],
    outputTokenIndex: 0,
    minimumOutputAmount: "996.592504",
  },
  id: "72460fa2442303371ff9a84624056851",
  submittedAt: 1651852538664,
  env: "CustomLocalnet",
  poolId: "hexapool",
  signatureSetKeypairs: {},
  previousSignatureSetAddresses: {
    "localnet-ethereum-usdc": "CwM2R3cQDz5pf31SU95zT7112xbT12H1VdBfy2gD4i6p",
  },
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    bsc: null,
    terra: null,
    avalanche: null,
    polygon: null,
  },
  version: 1,
};

export const recentTxs = {
  solana: [
    // Interact with pool on Solana - Swap tokens[0]
    {
      ecosystem: "solana",
      txId: "4rut3R6xmnyNAXVD5Dhb7dry1V3AKe5tJSnsoTg38jPEK54pmmqTmKFC5v2kATxZFoP865tfQaEiwdJdnYDgRbiE",
      timestamp: 1651852600,
      interactionId: "72460fa2442303371ff9a84624056851",
      parsedTx: {
        blockTime: 1651852600,
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
                      amount: "1002000000",
                      authority: "Gya6QZACjePALZcFuQYj9YFK22yEdNw2MZmSrd61ocgZ",
                      destination:
                        "TP3feUviS5XoqEpzz2d9iHhYip1wFaP7Zf4gmEXRVZ7",
                      source: "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                    },
                    type: "transfer",
                  },
                  program: "spl-token",
                  programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                },
                {
                  parsed: {
                    info: {
                      amount: "1001600507",
                      authority: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
                      destination:
                        "BBtg88Fo2JPs9DE2PxSieezKsvzoNWwCu6eWU3tBzLm1",
                      source: "TP19UrkLUihiEg3y98VjM8Gmh7GjWayucsbpyo195wC",
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
                      amount: "10019999",
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
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3248 of 112465 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: Transfer",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3121 of 105980 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: MintTo",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2779 of 99634 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi consumed 104800 of 197703 compute units",
            "Program SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi success",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
            'Program log: Memo (len 32): "72460fa2442303371ff9a84624056851"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 92903 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999704534400, 0, 2039280, 2039280, 2039280, 2039280, 2039280,
            2039280, 2039280, 1461600, 5087760, 2039280, 2039280, 2039280,
            2039280, 2039280, 2039280, 0, 1, 1, 1,
          ],
          postTokenBalances: [
            {
              accountIndex: 2,
              mint: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "990001238503107",
                decimals: 6,
                uiAmount: 990001238.503107,
                uiAmountString: "990001238.503107",
              },
            },
            {
              accountIndex: 3,
              mint: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "6000001532429976",
                decimals: 8,
                uiAmount: 60000015.32429976,
                uiAmountString: "60000015.32429976",
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
                amount: "989998790600507",
                decimals: 6,
                uiAmount: 989998790.600507,
                uiAmountString: "989998790.600507",
              },
            },
            {
              accountIndex: 8,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "10000000000",
                decimals: 6,
                uiAmount: 10000,
                uiAmountString: "10000",
              },
            },
            {
              accountIndex: 11,
              mint: "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "10001209399493",
                decimals: 6,
                uiAmount: 10001209.399493,
                uiAmountString: "10001209.399493",
              },
            },
            {
              accountIndex: 12,
              mint: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "9998761496893",
                decimals: 6,
                uiAmount: 9998761.496893,
                uiAmountString: "9998761.496893",
              },
            },
            {
              accountIndex: 13,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "10000023401706",
                decimals: 6,
                uiAmount: 10000023.401706,
                uiAmountString: "10000023.401706",
              },
            },
            {
              accountIndex: 14,
              mint: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "10000003000000",
                decimals: 6,
                uiAmount: 10000003,
                uiAmountString: "10000003",
              },
            },
            {
              accountIndex: 15,
              mint: "4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "1000001400000000",
                decimals: 8,
                uiAmount: 10000014,
                uiAmountString: "10000014",
              },
            },
            {
              accountIndex: 16,
              mint: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "1000000500000000",
                decimals: 8,
                uiAmount: 10000005,
                uiAmountString: "10000005",
              },
            },
          ],
          preBalances: [
            999704544400, 0, 2039280, 2039280, 2039280, 2039280, 2039280,
            2039280, 2039280, 1461600, 5087760, 2039280, 2039280, 2039280,
            2039280, 2039280, 2039280, 0, 1, 1, 1,
          ],
          preTokenBalances: [
            {
              accountIndex: 2,
              mint: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "990001238503107",
                decimals: 6,
                uiAmount: 990001238.503107,
                uiAmountString: "990001238.503107",
              },
            },
            {
              accountIndex: 3,
              mint: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "6000001522409977",
                decimals: 8,
                uiAmount: 60000015.22409977,
                uiAmountString: "60000015.22409977",
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
                amount: "989997789000000",
                decimals: 6,
                uiAmount: 989997789,
                uiAmountString: "989997789",
              },
            },
            {
              accountIndex: 8,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "11002000000",
                decimals: 6,
                uiAmount: 11002,
                uiAmountString: "11002",
              },
            },
            {
              accountIndex: 11,
              mint: "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "10002211000000",
                decimals: 6,
                uiAmount: 10002211,
                uiAmountString: "10002211",
              },
            },
            {
              accountIndex: 12,
              mint: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "9998761496893",
                decimals: 6,
                uiAmount: 9998761.496893,
                uiAmountString: "9998761.496893",
              },
            },
            {
              accountIndex: 13,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "9999021401706",
                decimals: 6,
                uiAmount: 9999021.401706,
                uiAmountString: "9999021.401706",
              },
            },
            {
              accountIndex: 14,
              mint: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "10000003000000",
                decimals: 6,
                uiAmount: 10000003,
                uiAmountString: "10000003",
              },
            },
            {
              accountIndex: 15,
              mint: "4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "1000001400000000",
                decimals: 8,
                uiAmount: 10000014,
                uiAmountString: "10000014",
              },
            },
            {
              accountIndex: 16,
              mint: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
              owner: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
              uiTokenAmount: {
                amount: "1000000500000000",
                decimals: 8,
                uiAmount: 10000005,
                uiAmountString: "10000005",
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 93672,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                signer: true,
                writable: true,
              },
              {
                pubkey: "Gya6QZACjePALZcFuQYj9YFK22yEdNw2MZmSrd61ocgZ",
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
                    amount: "1002000000",
                    delegate: "Gya6QZACjePALZcFuQYj9YFK22yEdNw2MZmSrd61ocgZ",
                    owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                    source: "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
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
                  "Gya6QZACjePALZcFuQYj9YFK22yEdNw2MZmSrd61ocgZ",
                  "BBtg88Fo2JPs9DE2PxSieezKsvzoNWwCu6eWU3tBzLm1",
                  "3f77zu2FHFXdXjYZ8E8LPQq4cU67yYkRw3xvDG6P27Jy",
                  "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                  "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                  "8asHr5Bf6hWBU6Pg7Hi9PKeo9mFj6iYGALySJRKq6FRE",
                  "9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm",
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ],
                data: "3LbDkKMJLnVYL3JombCdBAWLU2QiWHw9eyuPztBRwv6udi7uueoVC6pwMeKu6ZmDnvF4mL7r8LsKgnXh",
                programId: "SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi",
              },
              {
                parsed: "72460fa2442303371ff9a84624056851",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "6zCmzmLEzHiTQYyzfTtHPQ46Js4qkyWfXvLsqWbPemQH",
          },
          signatures: [
            "4rut3R6xmnyNAXVD5Dhb7dry1V3AKe5tJSnsoTg38jPEK54pmmqTmKFC5v2kATxZFoP865tfQaEiwdJdnYDgRbiE",
            "5yfHqxdLpy1K3uY9PMVgFNvYq82GNJZ71VdqwP86Vw4NCKe4opmK8PBpnFeXSQJkTgjytivtCT9MbsqtzvAnXLRC",
          ],
        },
      },
    },
    // Bridge tokens to Solana - Transfer USD Coin from Ethereum to Solana[3]
    {
      ecosystem: "solana",
      txId: "5hdpJR4KtksY6FbytAVSAibR1nTL4ggxgQzz1U9QL1dZBrPQq7BZbdttHz5WhyuboRJtB88LbsLWiuE86hGUZzGL",
      timestamp: 1651852594,
      interactionId: "72460fa2442303371ff9a84624056851",
      parsedTx: {
        blockTime: 1651852594,
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
                      account: "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                      amount: "1002000000",
                      mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
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
                      account: "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                      amount: "0",
                      mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
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
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2779 of 125070 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: MintTo",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2779 of 112986 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE consumed 91963 of 200000 compute units",
            "Program B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE success",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
            'Program log: Memo (len 32): "72460fa2442303371ff9a84624056851"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 108037 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999704544400, 897840, 2039280, 1461600, 1, 1113600, 1134480,
            1127520, 0, 1, 1, 2477760, 1, 1009200, 1,
          ],
          postTokenBalances: [
            {
              accountIndex: 2,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "11002000000",
                decimals: 6,
                uiAmount: 11002,
                uiAmountString: "11002",
              },
            },
          ],
          preBalances: [
            999705447240, 0, 2039280, 1461600, 1, 1113600, 1134480, 1127520, 0,
            1, 1, 2477760, 1, 1009200, 1,
          ],
          preTokenBalances: [
            {
              accountIndex: 2,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "10000000000",
                decimals: 6,
                uiAmount: 10000,
                uiAmountString: "10000",
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 93658,
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
                pubkey: "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                signer: false,
                writable: true,
              },
              {
                pubkey: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
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
                pubkey: "7peq6tmxMcyyHHQCevJ1mz9TvApWxjdFbNSyp5c8Lu6q",
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
                pubkey: "Gzmj3uBQeCRH2D5coxuRHjWAEnG7BAgDoYH8iDXZXirX",
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
                  "Gzmj3uBQeCRH2D5coxuRHjWAEnG7BAgDoYH8iDXZXirX",
                  "6dees28Hhop6TzYpMHK6fxK4ebm2bRr1hw2mbSEWFCep",
                  "7UqWgfVW1TrjrqauMfDoNMcw8kEStSsQXWNoT2BbhDS5",
                  "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                  "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                  "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
                  "7peq6tmxMcyyHHQCevJ1mz9TvApWxjdFbNSyp5c8Lu6q",
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
                parsed: "72460fa2442303371ff9a84624056851",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "2aHaa4zpaXrjYyGM282zLTiiHB4jM7axjutK8jjoFdZK",
          },
          signatures: [
            "5hdpJR4KtksY6FbytAVSAibR1nTL4ggxgQzz1U9QL1dZBrPQq7BZbdttHz5WhyuboRJtB88LbsLWiuE86hGUZzGL",
          ],
        },
      },
    },
    // Bridge tokens to Solana - Transfer USD Coin from Ethereum to Solana[2]
    {
      ecosystem: "solana",
      txId: "4J3BUuhXpCSnuunM3na2at9mxUhhgnG6nNVWkfYEsNkfPrnYaS2DhYVVTPxZsrqR6Dgisgg5gzXXJ9NT2DbnBa27",
      timestamp: 1651852587,
      interactionId: "72460fa2442303371ff9a84624056851",
      parsedTx: {
        blockTime: 1651852587,
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
                        "Gzmj3uBQeCRH2D5coxuRHjWAEnG7BAgDoYH8iDXZXirX",
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
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o consumed 67323 of 200000 compute units",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o success",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
            'Program log: Memo (len 32): "72460fa2442303371ff9a84624056851"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 132677 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999705447240, 2477760, 1, 1141440, 1, 1176240, 1057920, 1, 1169280,
            1009200,
          ],
          postTokenBalances: [],
          preBalances: [
            999707930000, 0, 1, 1141440, 1, 1176240, 1057920, 1, 1169280,
            1009200,
          ],
          preTokenBalances: [],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 93643,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                signer: true,
                writable: true,
              },
              {
                pubkey: "Gzmj3uBQeCRH2D5coxuRHjWAEnG7BAgDoYH8iDXZXirX",
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
                pubkey: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                signer: false,
                writable: false,
              },
              {
                pubkey: "CwM2R3cQDz5pf31SU95zT7112xbT12H1VdBfy2gD4i6p",
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
                  "CwM2R3cQDz5pf31SU95zT7112xbT12H1VdBfy2gD4i6p",
                  "Gzmj3uBQeCRH2D5coxuRHjWAEnG7BAgDoYH8iDXZXirX",
                  "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  "SysvarC1ock11111111111111111111111111111111",
                  "SysvarRent111111111111111111111111111111111",
                  "11111111111111111111111111111111",
                ],
                data: "MSvX3sKMvnnNhWVKkm4Bqf1RGCPkPujhbAyVAL1StZzyWLq6t5UGtqsp4Hpdsm6cR7pce6PUkGNmtNzXp2AJd79afUeXbyzfieB6T1f4EkDeyzUWRknMAYttSmVutc8Mdz8hGpmwRZwQRQqvQ1suo9W1L3yKAUMR9qG8m122JLbVa3erSo6HspkCkfx1hveG5438BkfJwiJMFG4YbGEYPB4Lpvffb5PRRokR9G4QTE47iSc6zNs2Sd5XY3VX7hp8Y59nEQib",
                programId: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
              },
              {
                parsed: "72460fa2442303371ff9a84624056851",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "52aeUV1mafbezd3vK9y4enabVxWknRFc67JLv5ciVm5X",
          },
          signatures: [
            "4J3BUuhXpCSnuunM3na2at9mxUhhgnG6nNVWkfYEsNkfPrnYaS2DhYVVTPxZsrqR6Dgisgg5gzXXJ9NT2DbnBa27",
          ],
        },
      },
    },
    // Bridge tokens to Solana - Transfer USD Coin from Ethereum to Solana[1]
    {
      ecosystem: "solana",
      txId: "31fA45nx9w4nrkcsdf4gkNC2BL5rAqWGDfWucy3s3MNRRnB8s96Xy2mNLRpdkSXUiZJnQqbKXSiRXENizfnMQkm6",
      timestamp: 1651852581,
      interactionId: "72460fa2442303371ff9a84624056851",
      parsedTx: {
        blockTime: 1651852581,
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
                        "CwM2R3cQDz5pf31SU95zT7112xbT12H1VdBfy2gD4i6p",
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
            'Program log: Memo (len 32): "72460fa2442303371ff9a84624056851"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 178534 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999707930000, 1176240, 1, 1141440, 1, 1, 1, 0, 1009200,
          ],
          postTokenBalances: [],
          preBalances: [999709121240, 0, 1, 1141440, 1, 1, 1, 0, 1009200],
          preTokenBalances: [],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 93629,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                signer: true,
                writable: true,
              },
              {
                pubkey: "CwM2R3cQDz5pf31SU95zT7112xbT12H1VdBfy2gD4i6p",
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
                data: "URdBsfgPjtD1n2sMBoJvfG3zo89ssd9EQgVpg5LMM4vtEDLVux2Scr315VguvyyqjdZKx5b9zsh9XiS4Ne28X18nZJVhMwWuCzZPyZduE2ogYgYHe4CzFvz4ewJzT5JQEN4CSVt7rehWRhkEVmTgBvfnUZuz6bo7NaVYQNDFs2BcTik",
                programId: "KeccakSecp256k11111111111111111111111111111",
              },
              {
                accounts: [
                  "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  "6MxkvoEwgB9EqQRLNhvYaPGhfcLtBtpBqdQugr3AZUgD",
                  "CwM2R3cQDz5pf31SU95zT7112xbT12H1VdBfy2gD4i6p",
                  "Sysvar1nstructions1111111111111111111111111",
                  "SysvarRent111111111111111111111111111111111",
                  "11111111111111111111111111111111",
                ],
                data: "6fFHX88LjDnco26UT64ypchaL5c",
                programId: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
              },
              {
                parsed: "72460fa2442303371ff9a84624056851",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "DoHfGHN3hZye1xafppgsWj3USrTH5XXVPyqcMzMQeZLR",
          },
          signatures: [
            "31fA45nx9w4nrkcsdf4gkNC2BL5rAqWGDfWucy3s3MNRRnB8s96Xy2mNLRpdkSXUiZJnQqbKXSiRXENizfnMQkm6",
            "4TpabaSsXsk73XXmmai8aNtonUb9DjU8bZxHAgWVce5kjdhpotjoBvo18gQoyc5KNvYtPaFuyqTbk7KGbgkcWypg",
          ],
        },
      },
    },
  ],
  ethereum: [
    // Bridge tokens to Solana - Transfer USD Coin from Ethereum to Solana[0]
    {
      ecosystem: "ethereum",
      txId: "0x3bd74606727261d000a227b5203abf9115a85cfc7627a008a40b9a6182171056",
      timestamp: 41089,
      interactionId: "72460fa2442303371ff9a84624056851",
      txResponse: {
        hash: "0x3bd74606727261d000a227b5203abf9115a85cfc7627a008a40b9a6182171056",
        type: 0,
        accessList: null,
        blockHash:
          "0xdad72b66f918db114ca94acc4396995b8da188d41a9d02c4ada55091a0429459",
        blockNumber: 39995,
        transactionIndex: 0,
        confirmations: 60,
        from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        gasPrice: {
          type: "BigNumber",
          hex: "0x04a817c800",
        },
        gasLimit: {
          type: "BigNumber",
          hex: "0x017be3",
        },
        to: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
        value: {
          type: "BigNumber",
          hex: "0x00",
        },
        nonce: 77,
        data: "0x0f5287b0000000000000000000000000fcced5e997e7fb1d0594518d3ed57245bb8ed17e000000000000000000000000000000000000000000000000000000003bb94e8000000000000000000000000000000000000000000000000000000000000000019ea1eab677653edddfff8fd4a89d35c1fb95edc9339efc9d288ad70e1553d7d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000023d4000072460fa2442303371ff9a84624056851",
        r: "0x4e26fd38a0f117702d0933c7046214a7aeac32f84b067483af44f53cc487a06c",
        s: "0x5a9d5dcf2882569de55daa81148b89f27024df2ed1bed03d6b056b0c9b356b45",
        v: 2710,
        creates: null,
        chainId: 1337,
        timestamp: 41089,
      },
      txReceipt: {
        to: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
        from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        contractAddress: null,
        transactionIndex: 0,
        gasUsed: {
          type: "BigNumber",
          hex: "0x01272f",
        },
        logsBloom:
          "0x000000000001000000000000000000000000000000000000000000000000000000180000000000000000802000000000000000000000000000000000002000000010000000000000000000080000000000000000000000000000080000000000000000000000000200000000000000000010000000000000000000100000000000000000000000000000000000000000000000000000000002000000001000000a0004000400000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000080000000",
        blockHash:
          "0xdad72b66f918db114ca94acc4396995b8da188d41a9d02c4ada55091a0429459",
        transactionHash:
          "0x3bd74606727261d000a227b5203abf9115a85cfc7627a008a40b9a6182171056",
        logs: [
          {
            transactionIndex: 0,
            blockNumber: 39995,
            transactionHash:
              "0x3bd74606727261d000a227b5203abf9115a85cfc7627a008a40b9a6182171056",
            address: "0xFcCeD5E997E7fb1D0594518D3eD57245bB8ed17E",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x00000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1",
              "0x0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16",
            ],
            data: "0x000000000000000000000000000000000000000000000000000000003bb94e80",
            logIndex: 0,
            blockHash:
              "0xdad72b66f918db114ca94acc4396995b8da188d41a9d02c4ada55091a0429459",
          },
          {
            transactionIndex: 0,
            blockNumber: 39995,
            transactionHash:
              "0x3bd74606727261d000a227b5203abf9115a85cfc7627a008a40b9a6182171056",
            address: "0xFcCeD5E997E7fb1D0594518D3eD57245bB8ed17E",
            topics: [
              "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
              "0x00000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1",
              "0x0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16",
            ],
            data: "0x0000000000000000000000000000000000000000000000000000000000000000",
            logIndex: 1,
            blockHash:
              "0xdad72b66f918db114ca94acc4396995b8da188d41a9d02c4ada55091a0429459",
          },
          {
            transactionIndex: 0,
            blockNumber: 39995,
            transactionHash:
              "0x3bd74606727261d000a227b5203abf9115a85cfc7627a008a40b9a6182171056",
            address: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
            topics: [
              "0x6eb224fb001ed210e379b335e35efe88672a8ce935d981a6896b27ffdf52a3b2",
              "0x0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16",
            ],
            data: "0x00000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000023d400000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000f000000000000000000000000000000000000000000000000000000000000008501000000000000000000000000000000000000000000000000000000003bb94e80000000000000000000000000fcced5e997e7fb1d0594518d3ed57245bb8ed17e00029ea1eab677653edddfff8fd4a89d35c1fb95edc9339efc9d288ad70e1553d7d000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            logIndex: 2,
            blockHash:
              "0xdad72b66f918db114ca94acc4396995b8da188d41a9d02c4ada55091a0429459",
          },
        ],
        blockNumber: 39995,
        confirmations: 70,
        cumulativeGasUsed: {
          type: "BigNumber",
          hex: "0x01272f",
        },
        status: 1,
        type: 0,
        byzantium: true,
      },
    },
  ],
  bsc: null,
  terra: null,
  avalanche: null,
  polygon: null,
};

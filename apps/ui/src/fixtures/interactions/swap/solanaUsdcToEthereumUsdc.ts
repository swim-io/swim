export const interaction = {
  instruction: 1,
  params: {
    exactInputAmounts: ["1001", "0", "0", "0", "0", "0"],
    outputTokenIndex: 2,
    minimumOutputAmount: "995.595302",
  },
  id: "bc99d982ad0afa3380f6277dd26d12f1",
  submittedAt: 1651852000400,
  env: "CustomLocalnet",
  poolId: "hexapool",
  signatureSetKeypairs: {},
  previousSignatureSetAddresses: {},
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
    // Bridge tokens from Solana - Transfer USD Coin from Solana to Ethereum[0]
    {
      ecosystem: "solana",
      txId: "4hkwUDAm8SrkHXUrpbmCzW6TBNBNp5nmoA6pf7Hxn3uV6FeeckbpyVmNRMDZuDkxZmiBcxXwmuoLWmS4kqQV6agb",
      timestamp: 1651852013,
      interactionId: "bc99d982ad0afa3380f6277dd26d12f1",
      parsedTx: {
        blockTime: 1651852013,
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
                      account: "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                      amount: "1000598294",
                      authority: "C1AVBd8PpfHGe1zW42XXVbHsAQf6q5khiRKuGPLbwHkh",
                      mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
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
                    "DQ8wjdP8fNvLUuUuEjVx6gWuDd9NqoNjZ5iXWK2p1XcX",
                    "ENG1wQ7CQKH8ibAJ1hSLmJgL9Ucg6DRDbj752ZAfidLA",
                    "7F4RNrCkBJxs1uidvF96iPieZ8upkEnc8NdpHoJ8YjxH",
                    "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                    "GXBsgBD3LDn3vkRZF6TfY5RqgajVZ4W5bMAdiAaaUARs",
                    "SysvarC1ock11111111111111111111111111111111",
                    "11111111111111111111111111111111",
                    "SysvarRent111111111111111111111111111111111",
                  ],
                  data: "nozrSzLQVr1YyxGJsv3B7yFGA3r2T4tdBJT9YSn9oDBmZvrZdmNmjE1FCww1XK4DnvRCtxp1t8TdaZasL1Gmj48bTUY7Hs5gzAShrvoVkGZQPdCrQQAKYmADpTPZzV4xtNYwx63TJBe3oXsxEGxTBAKM18gb29TQRGCiXiSmNtY6maiNLgyYPuzS7vSkNazDm2",
                  programId: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                },
                {
                  parsed: {
                    info: {
                      lamports: 2477760,
                      newAccount:
                        "DQ8wjdP8fNvLUuUuEjVx6gWuDd9NqoNjZ5iXWK2p1XcX",
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
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2886 of 147865 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program 11111111111111111111111111111111 invoke [2]",
            "Program 11111111111111111111111111111111 success",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o invoke [2]",
            "Program log: Sequence: 12",
            "Program 11111111111111111111111111111111 invoke [3]",
            "Program 11111111111111111111111111111111 success",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o consumed 26628 of 130447 compute units",
            "Program Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o success",
            "Program B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE consumed 96091 of 197702 compute units",
            "Program B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE success",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
            'Program log: Memo (len 32): "bc99d982ad0afa3380f6277dd26d12f1"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 101611 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999709121240, 2477760, 946560, 2039280, 1461600, 1057920, 893480, 1,
            1113600, 1134480, 1, 1, 0, 0, 1, 1169280, 1009200, 1,
          ],
          postTokenBalances: [
            {
              accountIndex: 3,
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
          preBalances: [
            999711609200, 0, 946560, 2039280, 1461600, 1057920, 893280, 1,
            1113600, 1134480, 1, 1, 0, 0, 1, 1169280, 1009200, 1,
          ],
          preTokenBalances: [
            {
              accountIndex: 3,
              mint: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
              owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              uiTokenAmount: {
                amount: "11000598294",
                decimals: 6,
                uiAmount: 11000.598294,
                uiAmountString: "11000.598294",
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 92327,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                signer: true,
                writable: true,
              },
              {
                pubkey: "DQ8wjdP8fNvLUuUuEjVx6gWuDd9NqoNjZ5iXWK2p1XcX",
                signer: true,
                writable: true,
              },
              {
                pubkey: "7F4RNrCkBJxs1uidvF96iPieZ8upkEnc8NdpHoJ8YjxH",
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
                pubkey: "7peq6tmxMcyyHHQCevJ1mz9TvApWxjdFbNSyp5c8Lu6q",
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
                    amount: "1000598294",
                    delegate: "C1AVBd8PpfHGe1zW42XXVbHsAQf6q5khiRKuGPLbwHkh",
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
                  "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  "3GwVs8GSLdo4RUsoXTkGQhojauQ1sXcDNjm7LSDicw19",
                  "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                  "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
                  "7peq6tmxMcyyHHQCevJ1mz9TvApWxjdFbNSyp5c8Lu6q",
                  "C1AVBd8PpfHGe1zW42XXVbHsAQf6q5khiRKuGPLbwHkh",
                  "FKoMTctsC7vJbEqyRiiPskPnuQx2tX1kurmvWByq5uZP",
                  "DQ8wjdP8fNvLUuUuEjVx6gWuDd9NqoNjZ5iXWK2p1XcX",
                  "ENG1wQ7CQKH8ibAJ1hSLmJgL9Ucg6DRDbj752ZAfidLA",
                  "7F4RNrCkBJxs1uidvF96iPieZ8upkEnc8NdpHoJ8YjxH",
                  "GXBsgBD3LDn3vkRZF6TfY5RqgajVZ4W5bMAdiAaaUARs",
                  "SysvarC1ock11111111111111111111111111111111",
                  "SysvarRent111111111111111111111111111111111",
                  "11111111111111111111111111111111",
                  "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ],
                data: "2TAXmDydJELRGJSKXQUrr585QqsChzaKpm82xYxZKStEdc9MFqVb2RCypShh3nddxv7rHtgu7vw",
                programId: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
              },
              {
                parsed: "bc99d982ad0afa3380f6277dd26d12f1",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "3Dv8UNhUQzmyfPygxwvCsXLhJ5ZA5nwydz1FqiRxwg97",
          },
          signatures: [
            "4hkwUDAm8SrkHXUrpbmCzW6TBNBNp5nmoA6pf7Hxn3uV6FeeckbpyVmNRMDZuDkxZmiBcxXwmuoLWmS4kqQV6agb",
            "4V79RJYKvQyKbKS1LWPLtjnP5RCrmfkaDKYuF1EKvLT2SKnsvrQ1tQdX34aSY9CWhBqJ9pvDkMs2wytFJejKtX8V",
          ],
        },
      },
    },
    // Interact with pool on Solana - Swap tokens[0]
    {
      ecosystem: "solana",
      txId: "435ZXiebGvNJkKX2dV3ZxsuEawjNTRkz9hwVe4W6epD1KxGYg6dqKznFZ57bKm3qv1qjG5ww9JG6qSkXSracEw9A",
      timestamp: 1651852006,
      interactionId: "bc99d982ad0afa3380f6277dd26d12f1",
      parsedTx: {
        blockTime: 1651852006,
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
                      amount: "1001000000",
                      authority: "2RkfT2NnXzV5KJijEbdkA6E9jLbstvTezKM6vPfa2UvS",
                      destination:
                        "TP19UrkLUihiEg3y98VjM8Gmh7GjWayucsbpyo195wC",
                      source: "BBtg88Fo2JPs9DE2PxSieezKsvzoNWwCu6eWU3tBzLm1",
                    },
                    type: "transfer",
                  },
                  program: "spl-token",
                  programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                },
                {
                  parsed: {
                    info: {
                      amount: "1000598294",
                      authority: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
                      destination:
                        "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                      source: "TP3feUviS5XoqEpzz2d9iHhYip1wFaP7Zf4gmEXRVZ7",
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
                      amount: "10009986",
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
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3248 of 100096 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: Transfer",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3121 of 93607 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: MintTo",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2779 of 87261 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi consumed 117173 of 197703 compute units",
            "Program SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi success",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
            'Program log: Memo (len 32): "bc99d982ad0afa3380f6277dd26d12f1"',
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 80530 compute units",
            "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
          ],
          postBalances: [
            999711609200, 0, 2039280, 2039280, 2039280, 2039280, 2039280,
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
                amount: "11000598294",
                decimals: 6,
                uiAmount: 11000.598294,
                uiAmountString: "11000.598294",
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
          preBalances: [
            999711619200, 0, 2039280, 2039280, 2039280, 2039280, 2039280,
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
                amount: "6000001512399991",
                decimals: 8,
                uiAmount: 60000015.12399991,
                uiAmountString: "60000015.12399991",
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
                amount: "989998790000000",
                decimals: 6,
                uiAmount: 989998790,
                uiAmountString: "989998790",
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
                amount: "10001210000000",
                decimals: 6,
                uiAmount: 10001210,
                uiAmountString: "10001210",
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
                amount: "10000022000000",
                decimals: 6,
                uiAmount: 10000022,
                uiAmountString: "10000022",
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
        slot: 92310,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                signer: true,
                writable: true,
              },
              {
                pubkey: "2RkfT2NnXzV5KJijEbdkA6E9jLbstvTezKM6vPfa2UvS",
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
                    amount: "1001000000",
                    delegate: "2RkfT2NnXzV5KJijEbdkA6E9jLbstvTezKM6vPfa2UvS",
                    owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                    source: "BBtg88Fo2JPs9DE2PxSieezKsvzoNWwCu6eWU3tBzLm1",
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
                  "2RkfT2NnXzV5KJijEbdkA6E9jLbstvTezKM6vPfa2UvS",
                  "BBtg88Fo2JPs9DE2PxSieezKsvzoNWwCu6eWU3tBzLm1",
                  "3f77zu2FHFXdXjYZ8E8LPQq4cU67yYkRw3xvDG6P27Jy",
                  "BgEckKfTdfb1a1ifrHvFFqMrb9rN7ZZsRQCu3W1ao86s",
                  "8wjznsBEWAnEkcUjV6Diu52CDKRpVrCRZzSfny9PMLYA",
                  "8asHr5Bf6hWBU6Pg7Hi9PKeo9mFj6iYGALySJRKq6FRE",
                  "9xDYy7dmSEQePAurpoQTW43ubKuKh67PaUwmUwfkcNm",
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ],
                data: "3Lisnshkxe26Dh64q3Dw2TnGbAXp4nF3P8eN7caGBWuZbqk4G9eB7HJcdmkMbXyyewEsLx3paUPUv8ET",
                programId: "SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi",
              },
              {
                parsed: "bc99d982ad0afa3380f6277dd26d12f1",
                program: "spl-memo",
                programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              },
            ],
            recentBlockhash: "HDZLQ9DsmvAmh2cstNRjMGYLj9tjPbzDZYFj1Y3zk6it",
          },
          signatures: [
            "435ZXiebGvNJkKX2dV3ZxsuEawjNTRkz9hwVe4W6epD1KxGYg6dqKznFZ57bKm3qv1qjG5ww9JG6qSkXSracEw9A",
            "56jTSs5hNFMq5WDU11HPTkW3NC9SYbgmC8HfxU1JjF3Rqez8D5yRSPGjZGkX9ycERFVFSaDHK1fg9k9XNR9HUQ1R",
          ],
        },
      },
    },
  ],
  ethereum: [
    // Bridge tokens from Solana - Transfer USD Coin from Solana to Ethereum[1]
    {
      ecosystem: "ethereum",
      txId: "0xd8316b797e8b73b47c4a187289b01cc52ab2d1f2fe74651f50fefb3ad9b6caba",
      timestamp: 40570,
      interactionId: "bc99d982ad0afa3380f6277dd26d12f1",
      txResponse: {
        hash: "0xd8316b797e8b73b47c4a187289b01cc52ab2d1f2fe74651f50fefb3ad9b6caba",
        type: 0,
        accessList: null,
        blockHash:
          "0xe9c63a758c91627679e97193ac541b89af5b3d9ba179c0d3969214d28d56b3c7",
        blockNumber: 39486,
        transactionIndex: 0,
        confirmations: 100,
        from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        gasPrice: {
          type: "BigNumber",
          hex: "0x04a817c800",
        },
        gasLimit: {
          type: "BigNumber",
          hex: "0x01a910",
        },
        to: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
        value: {
          type: "BigNumber",
          hex: "0x00",
        },
        nonce: 75,
        data: "0xc68785190000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000010001000000000100baf8aea430ffce16d5f5368f2dcf43acd48a8717fafc9e36287cd3fac3abc568194848c76d39fb195a879040dedb7ea85661d907e7820a6bc5822e170da7406e00627542ed0000e3130001c69a1b1a65dd336bf1df6a77afb501fc25db7fc0938cb08595a9ef473265cb4f000000000000000c2001000000000000000000000000000000000000000000000000000000003ba3eb16000000000000000000000000fcced5e997e7fb1d0594518d3ed57245bb8ed17e000200000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c100020000000000000000000000000000000000000000000000000000000000000000bc99d982ad0afa3380f6277dd26d12f1",
        r: "0x3c1b42f91bb6f3b4bf908cf80ff732452c193b9cdb4a03ce596a77220d518e50",
        s: "0x7a33e7e1ff8bce93794c59a27d4184018654f656df8e8ffd3393f6653b124d55",
        v: 2709,
        creates: null,
        chainId: 1337,
        timestamp: 40570,
      },
      txReceipt: {
        to: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
        from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        contractAddress: null,
        transactionIndex: 0,
        gasUsed: {
          type: "BigNumber",
          hex: "0x01a361",
        },
        logsBloom:
          "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000080200000000000000000000000000000000000000000001000000000000000000008000000000000000000000000000008000000000000000000000000000000000000000000001000000000000000000010000000000000000000000000000000000000000000000000000000000200000000000000080004000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000",
        blockHash:
          "0xe9c63a758c91627679e97193ac541b89af5b3d9ba179c0d3969214d28d56b3c7",
        transactionHash:
          "0xd8316b797e8b73b47c4a187289b01cc52ab2d1f2fe74651f50fefb3ad9b6caba",
        logs: [
          {
            transactionIndex: 0,
            blockNumber: 39486,
            transactionHash:
              "0xd8316b797e8b73b47c4a187289b01cc52ab2d1f2fe74651f50fefb3ad9b6caba",
            address: "0xFcCeD5E997E7fb1D0594518D3eD57245bB8ed17E",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16",
              "0x00000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1",
            ],
            data: "0x000000000000000000000000000000000000000000000000000000003ba3eb16",
            logIndex: 0,
            blockHash:
              "0xe9c63a758c91627679e97193ac541b89af5b3d9ba179c0d3969214d28d56b3c7",
          },
        ],
        blockNumber: 39486,
        confirmations: 100,
        cumulativeGasUsed: {
          type: "BigNumber",
          hex: "0x01a361",
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

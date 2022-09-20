import { PublicKey } from "@solana/web3.js";
import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { Env } from "@swim-io/core";
import type { EvmTx } from "@swim-io/evm";
import { EvmEcosystemId } from "@swim-io/evm";
import type { SolanaTx } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import Decimal from "decimal.js";

import { findTokenById } from "../../config";
import type { InteractionState } from "../../models";
import { Amount } from "../../models";

export const SOLANA_USDC = findTokenById("devnet-solana-usdc", Env.Devnet);
export const SOLANA_USDT = findTokenById("devnet-solana-usdt", Env.Devnet);
export const ETHEREUM_USDC = findTokenById("devnet-ethereum-usdc", Env.Devnet);
export const ETHEREUM_USDT = findTokenById("devnet-ethereum-usdt", Env.Devnet);
export const BNB_USDT = findTokenById("devnet-bnb-usdt", Env.Devnet);
export const BNB_BUSD = findTokenById("devnet-bnb-busd", Env.Devnet);
export const SOLANA_LP_HEXAPOOL = findTokenById(
  "devnet-solana-lp-hexapool",
  Env.Devnet,
);
const AVALANCHE_USDC = findTokenById("devnet-avalanche-usdc", Env.Devnet);

/**
 * This mock data are created by
 * - create interaction in UI
 * - then copy the state from IndexedDB
 */
export const MOCK_INTERACTION_STATE_FOR_RELOAD_INTERACTION: InteractionState = {
  version: undefined,
  interaction: {
    type: 0,
    params: {
      exactInputAmount: Amount.fromHumanString(ETHEREUM_USDC, "727.45"),
      minimumOutputAmount: Amount.fromHumanString(AVALANCHE_USDC, "787.855181"),
    },
    id: "a9747f341d116e592f6eac839b7f222d",
    poolIds: ["hexapool", "meta-avalanche-usdc"],
    env: Env.Devnet,
    submittedAt: 1656406521938,
    connectedWallets: {
      [APTOS_ECOSYSTEM_ID]: null,
      [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
      [EvmEcosystemId.Bnb]: null,
      [EvmEcosystemId.Ethereum]: "0xb0a05611328d1068c91f58e2c83ab4048de8cd7f",
      [EvmEcosystemId.Acala]: null,
      [EvmEcosystemId.Aurora]: null,
      [EvmEcosystemId.Avalanche]: "0xb0a05611328d1068c91f58e2c83ab4048de8cd7f",
      [EvmEcosystemId.Fantom]: null,
      [EvmEcosystemId.Karura]: null,
      [EvmEcosystemId.Polygon]: null,
    },
  },
  requiredSplTokenAccounts: {},
  toSolanaTransfers: [
    {
      token: ETHEREUM_USDC,
      value: new Decimal(727),
      signatureSetAddress: "5yLwHjdScM1urQwVkzLuw627BSoaNmQTS1ymmT691DYZ",
      txIds: {
        approveAndTransferEvmToken: [],
        postVaaOnSolana: [],
        claimTokenOnSolana: null,
      },
    },
  ],
  solanaPoolOperations: [
    {
      operation: {
        interactionId: "a9747f341d116e592f6eac839b7f222d",
        poolId: "hexapool",
        instruction: 0,
        params: {
          inputAmounts: [
            Amount.fromHumanString(ETHEREUM_USDC, "727.45"),
            Amount.fromHumanString(ETHEREUM_USDT, "0"),
            Amount.fromHumanString(BNB_BUSD, "0"),
            Amount.fromHumanString(BNB_USDT, "0"),
            Amount.fromHumanString(SOLANA_USDC, "0"),
            Amount.fromHumanString(SOLANA_USDT, "0"),
          ],
          minimumMintAmount: Amount.fromHumanString(
            SOLANA_LP_HEXAPOOL,
            "788.39965407",
          ),
        },
      },
      txId: null,
    },
    {
      operation: {
        interactionId: "a9747f341d116e592f6eac839b7f222d",
        poolId: "meta-avalanche-usdc",
        instruction: 1,
        params: {
          exactInputAmounts: [
            Amount.fromHumanString(AVALANCHE_USDC, "0"),
            Amount.fromHumanString(SOLANA_LP_HEXAPOOL, "727.45"),
          ],
          outputTokenIndex: 0,
          minimumOutputAmount: Amount.fromHumanString(
            AVALANCHE_USDC,
            "787.855181",
          ),
        },
      },
      txId: null,
    },
  ],
  fromSolanaTransfers: [
    {
      token: AVALANCHE_USDC,
      value: null,
      txIds: {
        transferSplToken: null,
        claimTokenOnEvm: null,
      },
    },
  ],
};

export const SOLANA_TXS_FOR_RELOAD_INTERACTION: readonly SolanaTx[] = [
  {
    ecosystemId: "solana",
    id: "53PBEMpqPraH1KFGSQfGn8JR62kndfU6iv6XqeJdDtpuEyD9FLkGjtnUZUB6TPv4H8A7kVxk2WiyEJPY7bLCNQGC",
    timestamp: 1656406854,
    interactionId: "a9747f341d116e592f6eac839b7f222d",
    parsedTx: {
      blockTime: 1656406854,
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
                    account: "65baNxhhAAiZHx2PRnf4iNZDcX3QT4z3kjaUn11kVRg8",
                    amount: "791814252",
                    authority: "3VFdJkFuzrcwCwdxhKRETGxrDtUVAipNmYcLvRBDcQeH",
                    mint: "2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka",
                  },
                  type: "burn",
                },
                program: "spl-token",
                programId: new PublicKey(
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ),
              },
              {
                parsed: {
                  info: {
                    destination: "7s3a1ycs16d6SNDumaRtjcoyMaTDZPavzgsmS3uUZYWX",
                    lamports: 10,
                    source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  },
                  type: "transfer",
                },
                program: "system",
                programId: new PublicKey("11111111111111111111111111111111"),
              },
              {
                accounts: [
                  new PublicKey("6bi4JGDoRwUs9TYBuvoA7dUVyikTJDrJsJU1ew6KVLiu"),
                  new PublicKey("5ZhSdZpKHKbELF5PFDvMHoBcY8vumWLvnT3qcYhXCRKo"),
                  new PublicKey("4yttKWzRoNYS2HekxDfcZYmfQqnVWpKiJ8eydYRuFRgs"),
                  new PublicKey("9QzqZZvhxoHzXbNY9y2hyAUfJUzDwyDb7fbDs9RXwH3"),
                  new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
                  new PublicKey("7s3a1ycs16d6SNDumaRtjcoyMaTDZPavzgsmS3uUZYWX"),
                  new PublicKey("SysvarC1ock11111111111111111111111111111111"),
                  new PublicKey("11111111111111111111111111111111"),
                  new PublicKey("SysvarRent111111111111111111111111111111111"),
                ],
                data: "2QLLhBzeVtePchgN87nAFLaXnP1QzeDYwR4cHRSQH2ao85RHykh7nPWRApeHKHGLXFVjuJwNs91vcgLpTeUtDEFBeM3e4QdjjsNDfu5B1rGGwZakPivJbFZEqZat1yvj8FBkzon2N81aYhqoiH6gvYwRmasKxeQiXrJCmaH2FPbKvqT2YDdb6GhQ4niakUV2PgC",
                programId: new PublicKey(
                  "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
                ),
              },
              {
                parsed: {
                  info: {
                    lamports: 2477760,
                    newAccount: new PublicKey(
                      "5ZhSdZpKHKbELF5PFDvMHoBcY8vumWLvnT3qcYhXCRKo",
                    ),
                    owner: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
                    source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                    space: 228,
                  },
                  type: "createAccount",
                },
                program: "system",
                programId: new PublicKey("11111111111111111111111111111111"),
              },
            ],
          },
        ],
        loadedAddresses: {
          readonly: [],
          writable: [],
        },
        logMessages: [
          "Program 11111111111111111111111111111111 invoke [1]",
          "Program 11111111111111111111111111111111 success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
          "Program log: Instruction: Approve",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2285 of 800000 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe invoke [1]",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: Burn",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3051 of 746473 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program 11111111111111111111111111111111 invoke [2]",
          "Program 11111111111111111111111111111111 success",
          "Program 3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5 invoke [2]",
          "Program log: Sequence: 1909",
          "Program data: bXNnACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABGw7pi6dIAAHUHAAAAAAAAAQA7JkCfiq3tP13coYRpWqag+oKbDIXK+EhWMkiW0hTKmIUAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC8yIGwAAAAAAAAAAAAAAACSk0qLEN34XoG2W+HWgQVEdEcA3AAGAAAAAAAAAAAAAAAAsKBWETKNEGjJH1jiyDq0BI3ozX8ABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          "Program 11111111111111111111111111111111 invoke [3]",
          "Program 11111111111111111111111111111111 success",
          "Program 3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5 consumed 36184 of 728802 compute units",
          "Program 3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5 success",
          "Program DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe consumed 107266 of 797715 compute units",
          "Program DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe success",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
          'Program log: Memo (len 32): "a9747f341d116e592f6eac839b7f222d"',
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12775 of 690449 compute units",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
        ],
        postBalances: [
          7483851096, 2477760, 1461600, 2039280, 1057920, 9119580, 946560, 1,
          1141440, 0, 0, 1113600, 1141440, 1134480, 521498880, 1169280, 1009200,
          953185920,
        ],
        postTokenBalances: [
          {
            accountIndex: 3,
            mint: "2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "1835022434",
              decimals: 6,
              uiAmount: 1835.022434,
              uiAmountString: "1835.022434",
            },
          },
        ],
        preBalances: [
          7486338876, 0, 1461600, 2039280, 1057920, 9119560, 946560, 1, 1141440,
          0, 0, 1113600, 1141440, 1134480, 521498880, 1169280, 1009200,
          953185920,
        ],
        preTokenBalances: [
          {
            accountIndex: 3,
            mint: "2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "2626836686",
              decimals: 6,
              uiAmount: 2626.836686,
              uiAmountString: "2626.836686",
            },
          },
        ],
        rewards: [],
        status: {
          Ok: null,
        },
      },
      slot: 144235132,
      transaction: {
        message: {
          accountKeys: [
            {
              pubkey: new PublicKey(
                "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              ),
              signer: true,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "5ZhSdZpKHKbELF5PFDvMHoBcY8vumWLvnT3qcYhXCRKo",
              ),
              signer: true,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "65baNxhhAAiZHx2PRnf4iNZDcX3QT4z3kjaUn11kVRg8",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "6bi4JGDoRwUs9TYBuvoA7dUVyikTJDrJsJU1ew6KVLiu",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "7s3a1ycs16d6SNDumaRtjcoyMaTDZPavzgsmS3uUZYWX",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "9QzqZZvhxoHzXbNY9y2hyAUfJUzDwyDb7fbDs9RXwH3",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey("11111111111111111111111111111111"),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "3VFdJkFuzrcwCwdxhKRETGxrDtUVAipNmYcLvRBDcQeH",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "4yttKWzRoNYS2HekxDfcZYmfQqnVWpKiJ8eydYRuFRgs",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "8PFZNjn19BBYVHNp4H31bEW7eAmu78Yf2RKV8EeA461K",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "EL9JpLJf1tjhvPi5cuaCfoSy6DEiZsPXU1E9B2fmuNNF",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "SysvarC1ock11111111111111111111111111111111",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "SysvarRent111111111111111111111111111111111",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              ),
              signer: false,
              writable: false,
            },
          ],
          addressTableLookups: null,
          instructions: [
            {
              parsed: {
                info: {
                  destination: "7s3a1ycs16d6SNDumaRtjcoyMaTDZPavzgsmS3uUZYWX",
                  lamports: 10,
                  source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                },
                type: "transfer",
              },
              program: "system",
              programId: new PublicKey("11111111111111111111111111111111"),
            },
            {
              parsed: {
                info: {
                  amount: "791814252",
                  delegate: "3VFdJkFuzrcwCwdxhKRETGxrDtUVAipNmYcLvRBDcQeH",
                  owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  source: "65baNxhhAAiZHx2PRnf4iNZDcX3QT4z3kjaUn11kVRg8",
                },
                type: "approve",
              },
              program: "spl-token",
              programId: new PublicKey(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              ),
            },
            {
              accounts: [
                new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
                new PublicKey("8PFZNjn19BBYVHNp4H31bEW7eAmu78Yf2RKV8EeA461K"),
                new PublicKey("65baNxhhAAiZHx2PRnf4iNZDcX3QT4z3kjaUn11kVRg8"),
                new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
                new PublicKey("2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka"),
                new PublicKey("EL9JpLJf1tjhvPi5cuaCfoSy6DEiZsPXU1E9B2fmuNNF"),
                new PublicKey("3VFdJkFuzrcwCwdxhKRETGxrDtUVAipNmYcLvRBDcQeH"),
                new PublicKey("6bi4JGDoRwUs9TYBuvoA7dUVyikTJDrJsJU1ew6KVLiu"),
                new PublicKey("5ZhSdZpKHKbELF5PFDvMHoBcY8vumWLvnT3qcYhXCRKo"),
                new PublicKey("4yttKWzRoNYS2HekxDfcZYmfQqnVWpKiJ8eydYRuFRgs"),
                new PublicKey("9QzqZZvhxoHzXbNY9y2hyAUfJUzDwyDb7fbDs9RXwH3"),
                new PublicKey("7s3a1ycs16d6SNDumaRtjcoyMaTDZPavzgsmS3uUZYWX"),
                new PublicKey("SysvarC1ock11111111111111111111111111111111"),
                new PublicKey("SysvarRent111111111111111111111111111111111"),
                new PublicKey("11111111111111111111111111111111"),
                new PublicKey("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5"),
                new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
              ],
              data: "2kQx2GHbkKsVctubKNuAhurLMh6rvNSRQezMk8gxw5XWaR5vteG5uXai7CVywgt5ggrQBaux7Mh",
              programId: new PublicKey(
                "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
              ),
            },
            {
              parsed: "a9747f341d116e592f6eac839b7f222d",
              program: "spl-memo",
              programId: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
            },
          ],
          recentBlockhash: "NzsmMX8vhkAMJ6sA9oeVV8gHjb5VGrPhUyjHEbsHZmK",
        },
        signatures: [
          "53PBEMpqPraH1KFGSQfGn8JR62kndfU6iv6XqeJdDtpuEyD9FLkGjtnUZUB6TPv4H8A7kVxk2WiyEJPY7bLCNQGC",
          "2fUz6czVwYab7Lt54nXVGt1z91WPJUL8pTqbPs68e23M61F2g6VTbeUEatoMzePwbhNGdAjjFCrUpYKmDYvvUcHG",
        ],
      },
    },
  },
  {
    ecosystemId: "solana",
    id: "53mCCVJEvoERa1anMkJxm5JD3doRcMBoQVyw8ZgtJ5sMuDZsw1QaW8worMbsbWBqAhwAheURKNKA7xrafSHyDEjA",
    timestamp: 1656406848,
    interactionId: "a9747f341d116e592f6eac839b7f222d",
    parsedTx: {
      blockTime: 1656406848,
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
                    amount: "79236146843",
                    authority: "E5QYVPUFHHPSWQWj9JRVpt9wt128hTL4e5bjmyLsCLW8",
                    destination: "14j3ek3AD7UHgQYpvvRM8265Vh4SdXsvxNLyhgYuRTtb",
                    source: "475oicF2Rh2SUQkLP5fQxLCviwoBzmrZ2Z1JAqaXCmSY",
                  },
                  type: "transfer",
                },
                program: "spl-token",
                programId: new PublicKey(
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ),
              },
              {
                parsed: {
                  info: {
                    amount: "791814252",
                    authority: "3cvyGruDFQ3uyxGPNHXLEQyZe3rLPiLsjvNkvSFTTURg",
                    destination: "65baNxhhAAiZHx2PRnf4iNZDcX3QT4z3kjaUn11kVRg8",
                    source: "4wVFKRTNK5RriQaRfMBm6BjRdnb5yqUFKmthQXmkCgho",
                  },
                  type: "transfer",
                },
                program: "spl-token",
                programId: new PublicKey(
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ),
              },
              {
                parsed: {
                  info: {
                    account: "5Ff7vNkjqFA944eysiR8CPWfjUL29DwxjFib7psYBaa9",
                    amount: "7922440",
                    mint: "DU15RXzuPWTLC4tbAcQvtXbDkHFrY8u6CxgTdhz2Mt8c",
                    mintAuthority:
                      "3cvyGruDFQ3uyxGPNHXLEQyZe3rLPiLsjvNkvSFTTURg",
                  },
                  type: "mintTo",
                },
                program: "spl-token",
                programId: new PublicKey(
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ),
              },
            ],
          },
        ],
        loadedAddresses: {
          readonly: [],
          writable: [],
        },
        logMessages: [
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
          "Program log: Instruction: Approve",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2284 of 600000 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs invoke [1]",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: Transfer",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3131 of 561693 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: Transfer",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3052 of 555966 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: MintTo",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2928 of 550324 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs consumed 52171 of 597716 compute units",
          "Program SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs success",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
          'Program log: Memo (len 32): "a9747f341d116e592f6eac839b7f222d"',
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12775 of 545545 compute units",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
        ],
        postBalances: [
          7486338876, 0, 2039280, 3278160, 2039280, 2039280, 2039280, 2039280,
          1461600, 0, 521498880, 1141440, 953185920,
        ],
        postTokenBalances: [
          {
            accountIndex: 2,
            mint: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
            owner: "3cvyGruDFQ3uyxGPNHXLEQyZe3rLPiLsjvNkvSFTTURg",
            uiTokenAmount: {
              amount: "306732828280074",
              decimals: 8,
              uiAmount: 3067328.28280074,
              uiAmountString: "3067328.28280074",
            },
          },
          {
            accountIndex: 4,
            mint: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "7300000000111135",
              decimals: 8,
              uiAmount: 73000000.00111134,
              uiAmountString: "73000000.00111135",
            },
          },
          {
            accountIndex: 5,
            mint: "2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka",
            owner: "3cvyGruDFQ3uyxGPNHXLEQyZe3rLPiLsjvNkvSFTTURg",
            uiTokenAmount: {
              amount: "2934892522149",
              decimals: 6,
              uiAmount: 2934892.522149,
              uiAmountString: "2934892.522149",
            },
          },
          {
            accountIndex: 6,
            mint: "DU15RXzuPWTLC4tbAcQvtXbDkHFrY8u6CxgTdhz2Mt8c",
            owner: "7sjKfq9m7S67SDjna31RECZubnyqZv4B88rbseTUZwoT",
            uiTokenAmount: {
              amount: "698895857",
              decimals: 8,
              uiAmount: 6.98895857,
              uiAmountString: "6.98895857",
            },
          },
          {
            accountIndex: 7,
            mint: "2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "2626836686",
              decimals: 6,
              uiAmount: 2626.836686,
              uiAmountString: "2626.836686",
            },
          },
        ],
        preBalances: [
          7486348876, 0, 2039280, 3278160, 2039280, 2039280, 2039280, 2039280,
          1461600, 0, 521498880, 1141440, 953185920,
        ],
        preTokenBalances: [
          {
            accountIndex: 2,
            mint: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
            owner: "3cvyGruDFQ3uyxGPNHXLEQyZe3rLPiLsjvNkvSFTTURg",
            uiTokenAmount: {
              amount: "306653592133231",
              decimals: 8,
              uiAmount: 3066535.92133231,
              uiAmountString: "3066535.92133231",
            },
          },
          {
            accountIndex: 4,
            mint: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "7300079236257978",
              decimals: 8,
              uiAmount: 73000792.36257978,
              uiAmountString: "73000792.36257978",
            },
          },
          {
            accountIndex: 5,
            mint: "2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka",
            owner: "3cvyGruDFQ3uyxGPNHXLEQyZe3rLPiLsjvNkvSFTTURg",
            uiTokenAmount: {
              amount: "2935684336401",
              decimals: 6,
              uiAmount: 2935684.336401,
              uiAmountString: "2935684.336401",
            },
          },
          {
            accountIndex: 6,
            mint: "DU15RXzuPWTLC4tbAcQvtXbDkHFrY8u6CxgTdhz2Mt8c",
            owner: "7sjKfq9m7S67SDjna31RECZubnyqZv4B88rbseTUZwoT",
            uiTokenAmount: {
              amount: "690973417",
              decimals: 8,
              uiAmount: 6.90973417,
              uiAmountString: "6.90973417",
            },
          },
          {
            accountIndex: 7,
            mint: "2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "1835022434",
              decimals: 6,
              uiAmount: 1835.022434,
              uiAmountString: "1835.022434",
            },
          },
        ],
        rewards: [],
        status: {
          Ok: null,
        },
      },
      slot: 144235118,
      transaction: {
        message: {
          accountKeys: [
            {
              pubkey: new PublicKey(
                "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              ),
              signer: true,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "E5QYVPUFHHPSWQWj9JRVpt9wt128hTL4e5bjmyLsCLW8",
              ),
              signer: true,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "14j3ek3AD7UHgQYpvvRM8265Vh4SdXsvxNLyhgYuRTtb",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "212ehpMyQZPfD5cNtZMxzwTmQHkDoFhZjT4UyBCzAxFU",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "475oicF2Rh2SUQkLP5fQxLCviwoBzmrZ2Z1JAqaXCmSY",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "4wVFKRTNK5RriQaRfMBm6BjRdnb5yqUFKmthQXmkCgho",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "5Ff7vNkjqFA944eysiR8CPWfjUL29DwxjFib7psYBaa9",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "65baNxhhAAiZHx2PRnf4iNZDcX3QT4z3kjaUn11kVRg8",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "DU15RXzuPWTLC4tbAcQvtXbDkHFrY8u6CxgTdhz2Mt8c",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "3cvyGruDFQ3uyxGPNHXLEQyZe3rLPiLsjvNkvSFTTURg",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              ),
              signer: false,
              writable: false,
            },
          ],
          addressTableLookups: null,
          instructions: [
            {
              parsed: {
                info: {
                  amount: "79236146843",
                  delegate: "E5QYVPUFHHPSWQWj9JRVpt9wt128hTL4e5bjmyLsCLW8",
                  owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  source: "475oicF2Rh2SUQkLP5fQxLCviwoBzmrZ2Z1JAqaXCmSY",
                },
                type: "approve",
              },
              program: "spl-token",
              programId: new PublicKey(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              ),
            },
            {
              accounts: [
                new PublicKey("212ehpMyQZPfD5cNtZMxzwTmQHkDoFhZjT4UyBCzAxFU"),
                new PublicKey("3cvyGruDFQ3uyxGPNHXLEQyZe3rLPiLsjvNkvSFTTURg"),
                new PublicKey("4wVFKRTNK5RriQaRfMBm6BjRdnb5yqUFKmthQXmkCgho"),
                new PublicKey("14j3ek3AD7UHgQYpvvRM8265Vh4SdXsvxNLyhgYuRTtb"),
                new PublicKey("DU15RXzuPWTLC4tbAcQvtXbDkHFrY8u6CxgTdhz2Mt8c"),
                new PublicKey("5Ff7vNkjqFA944eysiR8CPWfjUL29DwxjFib7psYBaa9"),
                new PublicKey("E5QYVPUFHHPSWQWj9JRVpt9wt128hTL4e5bjmyLsCLW8"),
                new PublicKey("65baNxhhAAiZHx2PRnf4iNZDcX3QT4z3kjaUn11kVRg8"),
                new PublicKey("475oicF2Rh2SUQkLP5fQxLCviwoBzmrZ2Z1JAqaXCmSY"),
                new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
              ],
              data: "8sSKmdqBfun5sPiEanA8NPd87atcTKHqwNK9",
              programId: new PublicKey(
                "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
              ),
            },
            {
              parsed: "a9747f341d116e592f6eac839b7f222d",
              program: "spl-memo",
              programId: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
            },
          ],
          recentBlockhash: "Espt9oHzrYfjcGg4F3sTDSD7iM2nRNNHq4RLDZh6cfre",
        },
        signatures: [
          "53mCCVJEvoERa1anMkJxm5JD3doRcMBoQVyw8ZgtJ5sMuDZsw1QaW8worMbsbWBqAhwAheURKNKA7xrafSHyDEjA",
          "4XPYheUNzMBTmcJ5qmtziYZsEFyQp6ucpEiSDWfxzrTmwUMovan3erSVJNkheBfRfWaqZeCffcmX7BKx4goowBi1",
        ],
      },
    },
  },
  {
    ecosystemId: "solana",
    id: "4LCZusMofy5oPLZe5cX5VCn4T1n6qgGsxCRhbwTVAcKSvZRvQLdeEWXJef2m5sD9u6XfRgRNRcBHJBwB48tun2eQ",
    timestamp: 1656406843,
    interactionId: "a9747f341d116e592f6eac839b7f222d",
    parsedTx: {
      blockTime: 1656406843,
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
                    amount: "727450000",
                    authority: "61p6xonZgbebzAF4e4pEqFG3n2nBxxQMwGczec7r49bZ",
                    destination: "EqhKYj5VQ8C3c4RWrfnm1UdoFPQoKYTWJdRWnSpN73sz",
                    source: "CGqaoanoKzAywATev1NrMQZCA6ApRGTnDCf6P4oN55NK",
                  },
                  type: "transfer",
                },
                program: "spl-token",
                programId: new PublicKey(
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ),
              },
              {
                parsed: {
                  info: {
                    account: "475oicF2Rh2SUQkLP5fQxLCviwoBzmrZ2Z1JAqaXCmSY",
                    amount: "79236146843",
                    mint: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
                    mintAuthority:
                      "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
                  },
                  type: "mintTo",
                },
                program: "spl-token",
                programId: new PublicKey(
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ),
              },
              {
                parsed: {
                  info: {
                    account: "9WTSiYW3etr7VkGE6rzsFPnDkqFSmHohk3MnUnasgyjr",
                    amount: "7411131",
                    mint: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
                    mintAuthority:
                      "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
                  },
                  type: "mintTo",
                },
                program: "spl-token",
                programId: new PublicKey(
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ),
              },
            ],
          },
        ],
        loadedAddresses: {
          readonly: [],
          writable: [],
        },
        logMessages: [
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
          "Program log: Instruction: Approve",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2284 of 600000 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC invoke [1]",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: Transfer",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3131 of 512026 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: MintTo",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2928 of 506296 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: MintTo",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2928 of 500778 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC consumed 102772 of 597716 compute units",
          "Program SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC success",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
          'Program log: Memo (len 32): "a9747f341d116e592f6eac839b7f222d"',
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12775 of 494944 compute units",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
        ],
        postBalances: [
          7486348876, 0, 2039280, 2039280, 2039280, 1461600, 2039280, 2039280,
          2039280, 2039280, 2039280, 2039280, 5087760, 0, 521498880, 1141440,
          953185920,
        ],
        postTokenBalances: [
          {
            accountIndex: 2,
            mint: "6KTvgrkLoPJdB3Grv4ZBUGt6JiLdVnKzJNo4HvLEgm6d",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "1015166327832496",
              decimals: 8,
              uiAmount: 10151663.27832496,
              uiAmountString: "10151663.27832496",
            },
          },
          {
            accountIndex: 3,
            mint: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "7300079236257978",
              decimals: 8,
              uiAmount: 73000792.36257978,
              uiAmountString: "73000792.36257978",
            },
          },
          {
            accountIndex: 4,
            mint: "DznJzVAjPHBvyyqXEQgPWTonF2nhwoSoutPNbXjmsUvY",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "10526120109204",
              decimals: 6,
              uiAmount: 10526120.109204,
              uiAmountString: "10526120.109204",
            },
          },
          {
            accountIndex: 6,
            mint: "4dr6ogcLsaFf2RDF4LJU1CvNtNKxonVqQvM6vuGdVR1e",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "9417816869442498",
              decimals: 8,
              uiAmount: 94178168.69442499,
              uiAmountString: "94178168.69442498",
            },
          },
          {
            accountIndex: 7,
            mint: "2w7wsGofEAvLiWXZgJySXZ4gofEhm8jQ9rtwXr1zbzUc",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "7314192829169",
              decimals: 6,
              uiAmount: 7314192.829169,
              uiAmountString: "7314192.829169",
            },
          },
          {
            accountIndex: 8,
            mint: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
            owner: "7sjKfq9m7S67SDjna31RECZubnyqZv4B88rbseTUZwoT",
            uiTokenAmount: {
              amount: "910040487436",
              decimals: 8,
              uiAmount: 9100.40487436,
              uiAmountString: "9100.40487436",
            },
          },
          {
            accountIndex: 9,
            mint: "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "64767408745",
              decimals: 6,
              uiAmount: 64767.408745,
              uiAmountString: "64767.408745",
            },
          },
          {
            accountIndex: 10,
            mint: "8Cfyi1mYXqKATUkMPvb9BMXikdbppJst6E7eQJkKjAtf",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "10047398289634",
              decimals: 6,
              uiAmount: 10047398.289634,
              uiAmountString: "10047398.289634",
            },
          },
          {
            accountIndex: 11,
            mint: "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "9195490987240",
              decimals: 6,
              uiAmount: 9195490.98724,
              uiAmountString: "9195490.98724",
            },
          },
        ],
        preBalances: [
          7486358876, 0, 2039280, 2039280, 2039280, 1461600, 2039280, 2039280,
          2039280, 2039280, 2039280, 2039280, 5087760, 0, 521498880, 1141440,
          953185920,
        ],
        preTokenBalances: [
          {
            accountIndex: 2,
            mint: "6KTvgrkLoPJdB3Grv4ZBUGt6JiLdVnKzJNo4HvLEgm6d",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "1015166327832496",
              decimals: 8,
              uiAmount: 10151663.27832496,
              uiAmountString: "10151663.27832496",
            },
          },
          {
            accountIndex: 3,
            mint: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "7300000000111135",
              decimals: 8,
              uiAmount: 73000000.00111134,
              uiAmountString: "73000000.00111135",
            },
          },
          {
            accountIndex: 4,
            mint: "DznJzVAjPHBvyyqXEQgPWTonF2nhwoSoutPNbXjmsUvY",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "10526120109204",
              decimals: 6,
              uiAmount: 10526120.109204,
              uiAmountString: "10526120.109204",
            },
          },
          {
            accountIndex: 6,
            mint: "4dr6ogcLsaFf2RDF4LJU1CvNtNKxonVqQvM6vuGdVR1e",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "9417816869442498",
              decimals: 8,
              uiAmount: 94178168.69442499,
              uiAmountString: "94178168.69442498",
            },
          },
          {
            accountIndex: 7,
            mint: "2w7wsGofEAvLiWXZgJySXZ4gofEhm8jQ9rtwXr1zbzUc",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "7314192829169",
              decimals: 6,
              uiAmount: 7314192.829169,
              uiAmountString: "7314192.829169",
            },
          },
          {
            accountIndex: 8,
            mint: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
            owner: "7sjKfq9m7S67SDjna31RECZubnyqZv4B88rbseTUZwoT",
            uiTokenAmount: {
              amount: "910033076305",
              decimals: 8,
              uiAmount: 9100.33076305,
              uiAmountString: "9100.33076305",
            },
          },
          {
            accountIndex: 9,
            mint: "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "65494858745",
              decimals: 6,
              uiAmount: 65494.858745,
              uiAmountString: "65494.858745",
            },
          },
          {
            accountIndex: 10,
            mint: "8Cfyi1mYXqKATUkMPvb9BMXikdbppJst6E7eQJkKjAtf",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "10047398289634",
              decimals: 6,
              uiAmount: 10047398.289634,
              uiAmountString: "10047398.289634",
            },
          },
          {
            accountIndex: 11,
            mint: "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
            owner: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
            uiTokenAmount: {
              amount: "9194763537240",
              decimals: 6,
              uiAmount: 9194763.53724,
              uiAmountString: "9194763.53724",
            },
          },
        ],
        rewards: [],
        status: {
          Ok: null,
        },
      },
      slot: 144235105,
      transaction: {
        message: {
          accountKeys: [
            {
              pubkey: new PublicKey(
                "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              ),
              signer: true,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "61p6xonZgbebzAF4e4pEqFG3n2nBxxQMwGczec7r49bZ",
              ),
              signer: true,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "24kq1sAEyYgoT2H6SZEMQ8eqanyt7mDDhEQ1pLEhXCch",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "475oicF2Rh2SUQkLP5fQxLCviwoBzmrZ2Z1JAqaXCmSY",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "4ZtpwjuxYC9VZBGAphBVpUVQzdy4anxF2ctJDp9xkpYA",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "63voUkHQrDfULcCKXwU6i9MoENhjVyMWXgxCxnnaKx37",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "66MCny16VUbuecNtvqXsLjdBSqVigeb31P14dtayH2jq",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "9WTSiYW3etr7VkGE6rzsFPnDkqFSmHohk3MnUnasgyjr",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "CGqaoanoKzAywATev1NrMQZCA6ApRGTnDCf6P4oN55NK",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "DR2pkTqM3bYHtcN6YDW4k9tnCDYbtrbwE61yzRMQn7h",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "EqhKYj5VQ8C3c4RWrfnm1UdoFPQoKYTWJdRWnSpN73sz",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "G4dYhqGrGwmx78ad8LXbGHRUfacRkmxycw3XJDWPW7Ec",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              ),
              signer: false,
              writable: false,
            },
          ],
          addressTableLookups: null,
          instructions: [
            {
              parsed: {
                info: {
                  amount: "727450000",
                  delegate: "61p6xonZgbebzAF4e4pEqFG3n2nBxxQMwGczec7r49bZ",
                  owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  source: "CGqaoanoKzAywATev1NrMQZCA6ApRGTnDCf6P4oN55NK",
                },
                type: "approve",
              },
              program: "spl-token",
              programId: new PublicKey(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              ),
            },
            {
              accounts: [
                new PublicKey("G4dYhqGrGwmx78ad8LXbGHRUfacRkmxycw3XJDWPW7Ec"),
                new PublicKey("B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A"),
                new PublicKey("EqhKYj5VQ8C3c4RWrfnm1UdoFPQoKYTWJdRWnSpN73sz"),
                new PublicKey("DR2pkTqM3bYHtcN6YDW4k9tnCDYbtrbwE61yzRMQn7h"),
                new PublicKey("24kq1sAEyYgoT2H6SZEMQ8eqanyt7mDDhEQ1pLEhXCch"),
                new PublicKey("63voUkHQrDfULcCKXwU6i9MoENhjVyMWXgxCxnnaKx37"),
                new PublicKey("66MCny16VUbuecNtvqXsLjdBSqVigeb31P14dtayH2jq"),
                new PublicKey("4ZtpwjuxYC9VZBGAphBVpUVQzdy4anxF2ctJDp9xkpYA"),
                new PublicKey("5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr"),
                new PublicKey("9WTSiYW3etr7VkGE6rzsFPnDkqFSmHohk3MnUnasgyjr"),
                new PublicKey("61p6xonZgbebzAF4e4pEqFG3n2nBxxQMwGczec7r49bZ"),
                new PublicKey("CGqaoanoKzAywATev1NrMQZCA6ApRGTnDCf6P4oN55NK"),
                new PublicKey("G4dYhqGrGwmx78ad8LXbGHRUfacRkmxycw3XJDWPW7Ec"),
                new PublicKey("G4dYhqGrGwmx78ad8LXbGHRUfacRkmxycw3XJDWPW7Ec"),
                new PublicKey("G4dYhqGrGwmx78ad8LXbGHRUfacRkmxycw3XJDWPW7Ec"),
                new PublicKey("G4dYhqGrGwmx78ad8LXbGHRUfacRkmxycw3XJDWPW7Ec"),
                new PublicKey("G4dYhqGrGwmx78ad8LXbGHRUfacRkmxycw3XJDWPW7Ec"),
                new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
                new PublicKey("475oicF2Rh2SUQkLP5fQxLCviwoBzmrZ2Z1JAqaXCmSY"),
              ],
              data: "XfhrLtXqzw3rwTze4ZjQwSMvTnPLzSviyK8dJH6VpSiBLRPtGni6mYD8EYFz1NNEVyTkAaNm6VJ9kT",
              programId: new PublicKey(
                "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC",
              ),
            },
            {
              parsed: "a9747f341d116e592f6eac839b7f222d",
              program: "spl-memo",
              programId: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
            },
          ],
          recentBlockhash: "8r6PJynT1w1fnvCd4spZ84boMBWcpgHDCWh7kw4SvWs3",
        },
        signatures: [
          "4LCZusMofy5oPLZe5cX5VCn4T1n6qgGsxCRhbwTVAcKSvZRvQLdeEWXJef2m5sD9u6XfRgRNRcBHJBwB48tun2eQ",
          "4qLvAf8skJb7GMDHB7MBFkKvvbSmYBssNKqr8nSmu3XxZpNhpSa33uVujXNDmSAqwBHfYLAPkZL5koH9KxWCPFmW",
        ],
      },
    },
  },
  {
    ecosystemId: "solana",
    id: "5UfH9wni8vGP8Ch2KQp2JjoPKyWssFjePVpxAduFErWQVFEfF7Av3iCK9wA7CyQTWUkHZtr6ThoWxZXjr73dVQqF",
    timestamp: 1656406839,
    interactionId: "a9747f341d116e592f6eac839b7f222d",
    parsedTx: {
      blockTime: 1656406839,
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
                    destination: "CoBrpNLMxdnNuJCohakU6SrLz2DB3npUktbAoL2Acepo",
                    lamports: 897840,
                    source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                  },
                  type: "transfer",
                },
                program: "system",
                programId: new PublicKey("11111111111111111111111111111111"),
              },
              {
                parsed: {
                  info: {
                    account: "CoBrpNLMxdnNuJCohakU6SrLz2DB3npUktbAoL2Acepo",
                    space: 1,
                  },
                  type: "allocate",
                },
                program: "system",
                programId: new PublicKey("11111111111111111111111111111111"),
              },
              {
                parsed: {
                  info: {
                    account: "CoBrpNLMxdnNuJCohakU6SrLz2DB3npUktbAoL2Acepo",
                    owner: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
                  },
                  type: "assign",
                },
                program: "system",
                programId: new PublicKey("11111111111111111111111111111111"),
              },
              {
                parsed: {
                  info: {
                    account: "CGqaoanoKzAywATev1NrMQZCA6ApRGTnDCf6P4oN55NK",
                    amount: "727450000",
                    mint: "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
                    mintAuthority:
                      "rRsXLHe7sBHdyKU3KY3wbcgWvoT1Ntqudf6e9PKusgb",
                  },
                  type: "mintTo",
                },
                program: "spl-token",
                programId: new PublicKey(
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ),
              },
              {
                parsed: {
                  info: {
                    account: "CGqaoanoKzAywATev1NrMQZCA6ApRGTnDCf6P4oN55NK",
                    amount: "0",
                    mint: "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
                    mintAuthority:
                      "rRsXLHe7sBHdyKU3KY3wbcgWvoT1Ntqudf6e9PKusgb",
                  },
                  type: "mintTo",
                },
                program: "spl-token",
                programId: new PublicKey(
                  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                ),
              },
            ],
          },
        ],
        loadedAddresses: {
          readonly: [],
          writable: [],
        },
        logMessages: [
          "Program DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe invoke [1]",
          "Program 11111111111111111111111111111111 invoke [2]",
          "Program 11111111111111111111111111111111 success",
          "Program 11111111111111111111111111111111 invoke [2]",
          "Program 11111111111111111111111111111111 success",
          "Program 11111111111111111111111111111111 invoke [2]",
          "Program 11111111111111111111111111111111 success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: MintTo",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2928 of 325335 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
          "Program log: Instruction: MintTo",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3005 of 316102 compute units",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
          "Program DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe consumed 89083 of 400000 compute units",
          "Program DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe success",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
          'Program log: Memo (len 32): "a9747f341d116e592f6eac839b7f222d"',
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12775 of 310917 compute units",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
        ],
        postBalances: [
          7486358876, 1461600, 2039280, 897840, 1, 1127520, 1141440, 1134480,
          1113600, 2477760, 1141440, 521498880, 0, 1009200, 953185920,
        ],
        postTokenBalances: [
          {
            accountIndex: 2,
            mint: "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "65494858745",
              decimals: 6,
              uiAmount: 65494.858745,
              uiAmountString: "65494.858745",
            },
          },
        ],
        preBalances: [
          7487261716, 1461600, 2039280, 0, 1, 1127520, 1141440, 1134480,
          1113600, 2477760, 1141440, 521498880, 0, 1009200, 953185920,
        ],
        preTokenBalances: [
          {
            accountIndex: 2,
            mint: "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
            owner: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
            uiTokenAmount: {
              amount: "64767408745",
              decimals: 6,
              uiAmount: 64767.408745,
              uiAmountString: "64767.408745",
            },
          },
        ],
        rewards: [],
        status: {
          Ok: null,
        },
      },
      slot: 144235093,
      transaction: {
        message: {
          accountKeys: [
            {
              pubkey: new PublicKey(
                "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              ),
              signer: true,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "CGqaoanoKzAywATev1NrMQZCA6ApRGTnDCf6P4oN55NK",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "CoBrpNLMxdnNuJCohakU6SrLz2DB3npUktbAoL2Acepo",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey("11111111111111111111111111111111"),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "2RpmGENZTXgrBoHLdocYVAJ4aoq8PfHmVQfvN7S2uVNq",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "69iQebESck8PQxqLqCoaXLAymYE4yNAvoLP6kVmP3efs",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "8PFZNjn19BBYVHNp4H31bEW7eAmu78Yf2RKV8EeA461K",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "DMFtZWvcUAmHShiPvTT69evhRYpmS5oTTWtTVkF3JpyS",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "rRsXLHe7sBHdyKU3KY3wbcgWvoT1Ntqudf6e9PKusgb",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "SysvarRent111111111111111111111111111111111",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              ),
              signer: false,
              writable: false,
            },
          ],
          addressTableLookups: null,
          instructions: [
            {
              accounts: [
                new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
                new PublicKey("8PFZNjn19BBYVHNp4H31bEW7eAmu78Yf2RKV8EeA461K"),
                new PublicKey("DMFtZWvcUAmHShiPvTT69evhRYpmS5oTTWtTVkF3JpyS"),
                new PublicKey("CoBrpNLMxdnNuJCohakU6SrLz2DB3npUktbAoL2Acepo"),
                new PublicKey("2RpmGENZTXgrBoHLdocYVAJ4aoq8PfHmVQfvN7S2uVNq"),
                new PublicKey("CGqaoanoKzAywATev1NrMQZCA6ApRGTnDCf6P4oN55NK"),
                new PublicKey("CGqaoanoKzAywATev1NrMQZCA6ApRGTnDCf6P4oN55NK"),
                new PublicKey("7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf"),
                new PublicKey("69iQebESck8PQxqLqCoaXLAymYE4yNAvoLP6kVmP3efs"),
                new PublicKey("rRsXLHe7sBHdyKU3KY3wbcgWvoT1Ntqudf6e9PKusgb"),
                new PublicKey("SysvarRent111111111111111111111111111111111"),
                new PublicKey("11111111111111111111111111111111"),
                new PublicKey("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5"),
                new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
              ],
              data: "4",
              programId: new PublicKey(
                "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
              ),
            },
            {
              parsed: "a9747f341d116e592f6eac839b7f222d",
              program: "spl-memo",
              programId: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
            },
          ],
          recentBlockhash: "2FRvU53ikGd81UkNqvwLqLq1XXyQXFfNfnvDZRHJAHhK",
        },
        signatures: [
          "5UfH9wni8vGP8Ch2KQp2JjoPKyWssFjePVpxAduFErWQVFEfF7Av3iCK9wA7CyQTWUkHZtr6ThoWxZXjr73dVQqF",
        ],
      },
    },
  },
  {
    ecosystemId: "solana",
    id: "reEurpv1vonjzLPpqoMWvcNV5bbJmhJwfPPM7d7PEEVcb8mN6DzZTqPtYMLcenJ6VLMa3naXe4gPzPkxurjQy4e",
    timestamp: 1656406836,
    interactionId: "a9747f341d116e592f6eac839b7f222d",
    parsedTx: {
      blockTime: 1656406836,
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
                    newAccount: new PublicKey(
                      "DMFtZWvcUAmHShiPvTT69evhRYpmS5oTTWtTVkF3JpyS",
                    ),
                    owner: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
                    source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                    space: 228,
                  },
                  type: "createAccount",
                },
                program: "system",
                programId: new PublicKey("11111111111111111111111111111111"),
              },
            ],
          },
        ],
        loadedAddresses: {
          readonly: [],
          writable: [],
        },
        logMessages: [
          "Program 3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5 invoke [1]",
          "Program 11111111111111111111111111111111 invoke [2]",
          "Program 11111111111111111111111111111111 success",
          "Program 3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5 consumed 67361 of 400000 compute units",
          "Program 3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5 success",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
          'Program log: Memo (len 32): "a9747f341d116e592f6eac839b7f222d"',
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12775 of 332639 compute units",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
        ],
        postBalances: [
          7487261716, 2477760, 1, 1141440, 1176240, 1057920, 1141440, 521498880,
          1169280, 1009200,
        ],
        postTokenBalances: [],
        preBalances: [
          7489744476, 0, 1, 1141440, 1176240, 1057920, 1141440, 521498880,
          1169280, 1009200,
        ],
        preTokenBalances: [],
        rewards: [],
        status: {
          Ok: null,
        },
      },
      slot: 144235085,
      transaction: {
        message: {
          accountKeys: [
            {
              pubkey: new PublicKey(
                "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              ),
              signer: true,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "DMFtZWvcUAmHShiPvTT69evhRYpmS5oTTWtTVkF3JpyS",
              ),
              signer: false,
              writable: true,
            },
            {
              pubkey: new PublicKey("11111111111111111111111111111111"),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "5yLwHjdScM1urQwVkzLuw627BSoaNmQTS1ymmT691DYZ",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "6bi4JGDoRwUs9TYBuvoA7dUVyikTJDrJsJU1ew6KVLiu",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "dxZtypiKT5D9LYzdPxjvSZER9MgYfeRVU5qpMTMTRs4",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "SysvarC1ock11111111111111111111111111111111",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "SysvarRent111111111111111111111111111111111",
              ),
              signer: false,
              writable: false,
            },
          ],
          addressTableLookups: null,
          instructions: [
            {
              accounts: [
                new PublicKey("dxZtypiKT5D9LYzdPxjvSZER9MgYfeRVU5qpMTMTRs4"),
                new PublicKey("6bi4JGDoRwUs9TYBuvoA7dUVyikTJDrJsJU1ew6KVLiu"),
                new PublicKey("5yLwHjdScM1urQwVkzLuw627BSoaNmQTS1ymmT691DYZ"),
                new PublicKey("DMFtZWvcUAmHShiPvTT69evhRYpmS5oTTWtTVkF3JpyS"),
                new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
                new PublicKey("SysvarC1ock11111111111111111111111111111111"),
                new PublicKey("SysvarRent111111111111111111111111111111111"),
                new PublicKey("11111111111111111111111111111111"),
              ],
              data: "MSvX3sKFY2wVs4TudGP6e89W35TLxLJ7AwfJuLYNoE79PE5UYiuvnEkF9YyxcGQBSYTAKMRCLL5r7xDbyVNSG419fkeFYpNE1m4cPhCLb7mKKzCLsvdSP44qbEuFcSxy5ARew4eZoukPVdEwqHJg7ABJgHMwwferdGmk3BDMtSrSGR5xeUJawTfZmQJU54sJRMJysDFdnuP91VV6b3urebcZKpDgt6LV2iyaCypgf2MoWfLnNu2zB2fWu7oKqrtfPupx1N6T",
              programId: new PublicKey(
                "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
              ),
            },
            {
              parsed: "a9747f341d116e592f6eac839b7f222d",
              program: "spl-memo",
              programId: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
            },
          ],
          recentBlockhash: "3JVXP4ue4fGSQnu3K1vfoqzrxoeEsTWoDGyRRFYUE2Bz",
        },
        signatures: [
          "reEurpv1vonjzLPpqoMWvcNV5bbJmhJwfPPM7d7PEEVcb8mN6DzZTqPtYMLcenJ6VLMa3naXe4gPzPkxurjQy4e",
        ],
      },
    },
  },
  {
    ecosystemId: "solana",
    id: "61FvZ4bp3Ua2ED6cv32rqZnLnW5hGDYMf6racBeoZXJaxzVUVZzEEqtut29aqeBoGwxk3Dhr7mbXY6ziVpCDiHTT",
    timestamp: 1656406832,
    interactionId: "a9747f341d116e592f6eac839b7f222d",
    parsedTx: {
      blockTime: 1656406832,
      meta: {
        err: null,
        fee: 15000,
        innerInstructions: [
          {
            index: 0,
            instructions: [
              {
                parsed: {
                  info: {
                    lamports: 1176240,
                    newAccount: new PublicKey(
                      "5yLwHjdScM1urQwVkzLuw627BSoaNmQTS1ymmT691DYZ",
                    ),
                    owner: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
                    source: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
                    space: 41,
                  },
                  type: "createAccount",
                },
                program: "system",
                programId: new PublicKey("11111111111111111111111111111111"),
              },
            ],
          },
        ],
        loadedAddresses: {
          readonly: [],
          writable: [],
        },
        logMessages: [
          "Program 3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5 invoke [1]",
          "Program 11111111111111111111111111111111 invoke [2]",
          "Program 11111111111111111111111111111111 success",
          "Program 3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5 consumed 18463 of 600000 compute units",
          "Program 3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5 success",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
          'Program log: Memo (len 32): "a9747f341d116e592f6eac839b7f222d"',
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12775 of 581537 compute units",
          "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
        ],
        postBalances: [
          7489744476, 1176240, 1, 1141440, 1141440, 1, 521498880, 0, 1009200,
        ],
        postTokenBalances: [],
        preBalances: [
          7490935716, 0, 1, 1141440, 1141440, 1, 521498880, 0, 1009200,
        ],
        preTokenBalances: [],
        rewards: [],
        status: {
          Ok: null,
        },
      },
      slot: 144235075,
      transaction: {
        message: {
          accountKeys: [
            {
              pubkey: new PublicKey(
                "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
              ),
              signer: true,
              writable: true,
            },
            {
              pubkey: new PublicKey(
                "5yLwHjdScM1urQwVkzLuw627BSoaNmQTS1ymmT691DYZ",
              ),
              signer: true,
              writable: true,
            },
            {
              pubkey: new PublicKey("11111111111111111111111111111111"),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "dxZtypiKT5D9LYzdPxjvSZER9MgYfeRVU5qpMTMTRs4",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "KeccakSecp256k11111111111111111111111111111",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "Sysvar1nstructions1111111111111111111111111",
              ),
              signer: false,
              writable: false,
            },
            {
              pubkey: new PublicKey(
                "SysvarRent111111111111111111111111111111111",
              ),
              signer: false,
              writable: false,
            },
          ],
          addressTableLookups: null,
          instructions: [
            {
              accounts: [],
              data: "URdBsfgPjtD1n2sWvcvvJPtdpmZUwRdbVVgQUVskwH4SyeaXjUmhpRe74XtVvgXjPr7RAq4XeeP1hqCJreHmrK5umykRRxEycRsXbxQ9ER9VwW83vWZpYzVrffaivmDX3VryykkEhB3Q76GAqDaGq6fVNi8KQ7mLCc1VEhbdDG177Ro",
              programId: new PublicKey(
                "KeccakSecp256k11111111111111111111111111111",
              ),
            },
            {
              accounts: [
                new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
                new PublicKey("dxZtypiKT5D9LYzdPxjvSZER9MgYfeRVU5qpMTMTRs4"),
                new PublicKey("5yLwHjdScM1urQwVkzLuw627BSoaNmQTS1ymmT691DYZ"),
                new PublicKey("Sysvar1nstructions1111111111111111111111111"),
                new PublicKey("SysvarRent111111111111111111111111111111111"),
                new PublicKey("11111111111111111111111111111111"),
              ],
              data: "6fFHX88LjDnco26UT64ypchaL5c",
              programId: new PublicKey(
                "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
              ),
            },
            {
              parsed: "a9747f341d116e592f6eac839b7f222d",
              program: "spl-memo",
              programId: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
            },
          ],
          recentBlockhash: "B5QxxujLp1m8rahM4Qw8fEj8EZm2aEKKq4mF2xZeZ1bF",
        },
        signatures: [
          "61FvZ4bp3Ua2ED6cv32rqZnLnW5hGDYMf6racBeoZXJaxzVUVZzEEqtut29aqeBoGwxk3Dhr7mbXY6ziVpCDiHTT",
          "3gBB1hqRVHoZAk11X1S5k22v2QMbYuZ6mHTUopQTMvJ1Bpx681qvkn5rExrJUyZgv6Z5SBKhumkPgEAi5cvWPGfq",
        ],
      },
    },
  },
] as unknown as readonly SolanaTx[];

export const EVM_TXS_FOR_RELOAD_INTERACTION = [
  {
    ecosystemId: "ethereum",
    id: "0xdacf9f474992e86e079b588573eff53542f1722386280c55aa71057e5771732f",
    timestamp: 1656406577,
    interactionId: "a9747f341d116e592f6eac839b7f222d",
    response: {
      hash: "0xdacf9f474992e86e079b588573eff53542f1722386280c55aa71057e5771732f",
      type: 0,
      accessList: null,
      blockHash:
        "0xa0cef0931f71340206080d50fd4f00fb1d924f3bd8a4ff436027f05147f2f2f2",
      blockNumber: 7132783,
      transactionIndex: 15,
      confirmations: 60,
      from: "0xb0A05611328d1068c91F58e2c83Ab4048De8CD7f",
      gasPrice: {
        type: "BigNumber",
        hex: "0x59682f07",
      },
      gasLimit: {
        type: "BigNumber",
        hex: "0x0191ca",
      },
      to: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
      value: {
        type: "BigNumber",
        hex: "0x00",
      },
      nonce: 41,
      data: "0x0f5287b000000000000000000000000045b167cf5b14007ca0490dcfb7c4b870ec0c0aa6000000000000000000000000000000000000000000000000000000002b5c01900000000000000000000000000000000000000000000000000000000000000001a77f337a7b4a9d31232af9108048171b0b120b5cf09e06469b980e64c97f0dd400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000059080100a9747f341d116e592f6eac839b7f222d",
      creates: null,
      chainId: 0,
      timestamp: 1656406577,
    },
    receipt: {
      to: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
      from: "0xb0A05611328d1068c91F58e2c83Ab4048De8CD7f",
      contractAddress: null,
      transactionIndex: 15,
      gasUsed: {
        type: "BigNumber",
        hex: "0x01677b",
      },
      logsBloom:
        "0x00000000000100000000000000000000000000000000000000000000000000000010000000000000000001000000000000000000000000000000000102200000040000000000000000000008000200000000000000000000000200000000000000000000000000000000000000008000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000020000000400000000000000000040000400000000000000000000000000000000000002000000000000000000000000000000000008000000000000000000000010000000000100000000000000000000000000000010000000000000000000",
      blockHash:
        "0xa0cef0931f71340206080d50fd4f00fb1d924f3bd8a4ff436027f05147f2f2f2",
      transactionHash:
        "0xdacf9f474992e86e079b588573eff53542f1722386280c55aa71057e5771732f",
      logs: [
        {
          transactionIndex: 15,
          blockNumber: 7132783,
          transactionHash:
            "0xdacf9f474992e86e079b588573eff53542f1722386280c55aa71057e5771732f",
          address: "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6",
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000b0a05611328d1068c91f58e2c83ab4048de8cd7f",
            "0x000000000000000000000000f890982f9310df57d00f659cf4fd87e65aded8d7",
          ],
          data: "0x000000000000000000000000000000000000000000000000000000002b5c0190",
          logIndex: 12,
          blockHash:
            "0xa0cef0931f71340206080d50fd4f00fb1d924f3bd8a4ff436027f05147f2f2f2",
        },
        {
          transactionIndex: 15,
          blockNumber: 7132783,
          transactionHash:
            "0xdacf9f474992e86e079b588573eff53542f1722386280c55aa71057e5771732f",
          address: "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6",
          topics: [
            "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
            "0x000000000000000000000000b0a05611328d1068c91f58e2c83ab4048de8cd7f",
            "0x000000000000000000000000f890982f9310df57d00f659cf4fd87e65aded8d7",
          ],
          data: "0x0000000000000000000000000000000000000000000000000000000000000000",
          logIndex: 13,
          blockHash:
            "0xa0cef0931f71340206080d50fd4f00fb1d924f3bd8a4ff436027f05147f2f2f2",
        },
        {
          transactionIndex: 15,
          blockNumber: 7132783,
          transactionHash:
            "0xdacf9f474992e86e079b588573eff53542f1722386280c55aa71057e5771732f",
          address: "0x706abc4E45D419950511e474C7B9Ed348A4a716c",
          topics: [
            "0x6eb224fb001ed210e379b335e35efe88672a8ce935d981a6896b27ffdf52a3b2",
            "0x000000000000000000000000f890982f9310df57d00f659cf4fd87e65aded8d7",
          ],
          data: "0x000000000000000000000000000000000000000000000000000000000000058a00000000000000000000000000000000000000000000000000000000590801000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000f000000000000000000000000000000000000000000000000000000000000008501000000000000000000000000000000000000000000000000000000002b5c019000000000000000000000000045b167cf5b14007ca0490dcfb7c4b870ec0c0aa60002a77f337a7b4a9d31232af9108048171b0b120b5cf09e06469b980e64c97f0dd400010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          logIndex: 14,
          blockHash:
            "0xa0cef0931f71340206080d50fd4f00fb1d924f3bd8a4ff436027f05147f2f2f2",
        },
      ],
      blockNumber: 7132783,
      confirmations: 60,
      cumulativeGasUsed: {
        type: "BigNumber",
        hex: "0x453be5",
      },
      effectiveGasPrice: {
        type: "BigNumber",
        hex: "0x59682f07",
      },
      status: 1,
      type: 2,
      byzantium: true,
    },
  },
  {
    ecosystemId: "avalanche",
    id: "0x5ddfb1925096babf7939393b62970700a4db183a5dd9ae36dfd2fc9c5d7da302",
    timestamp: 1656406883,
    interactionId: "a9747f341d116e592f6eac839b7f222d",
    response: {
      hash: "0x5ddfb1925096babf7939393b62970700a4db183a5dd9ae36dfd2fc9c5d7da302",
      type: 0,
      accessList: null,
      blockHash:
        "0x54d21312a280bff7c065a94a0f79c5d63067353ae3519a77127b661387d6c7f7",
      blockNumber: 11039320,
      transactionIndex: 1,
      confirmations: 232,
      from: "0xb0A05611328d1068c91F58e2c83Ab4048De8CD7f",
      gasPrice: {
        type: "BigNumber",
        hex: "0x062b85e900",
      },
      gasLimit: {
        type: "BigNumber",
        hex: "0x01ea1a",
      },
      to: "0x61E44E506Ca5659E6c0bba9b678586fA2d729756",
      value: {
        type: "BigNumber",
        hex: "0x00",
      },
      nonce: 4,
      data: "0xc687851900000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000100010000000001003c0275cf8e546d379e4af28406521092c8e7e4bc4854d9ee834f0c34cae36ae215eaedadf3f85e46ea9d0e865afc2af74998ab0c5112f8f492a5aeeef910dde20162bac3460000d2e900013b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca9800000000000007752001000000000000000000000000000000000000000000000000000000002f32206c00000000000000000000000092934a8b10ddf85e81b65be1d6810544744700dc0006000000000000000000000000b0a05611328d1068c91f58e2c83ab4048de8cd7f00060000000000000000000000000000000000000000000000000000000000000000a9747f341d116e592f6eac839b7f222d",
      creates: null,
      chainId: 0,
      timestamp: 1656406883,
    },
    receipt: {
      to: "0x61E44E506Ca5659E6c0bba9b678586fA2d729756",
      from: "0xb0A05611328d1068c91F58e2c83Ab4048De8CD7f",
      contractAddress: null,
      transactionIndex: 1,
      gasUsed: {
        type: "BigNumber",
        hex: "0x01e463",
      },
      logsBloom:
        "0x00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000040000000000000000000008000000000000800000000000000000000000000000000000000000002002000000008000000000000000000010000010000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      blockHash:
        "0x54d21312a280bff7c065a94a0f79c5d63067353ae3519a77127b661387d6c7f7",
      transactionHash:
        "0x5ddfb1925096babf7939393b62970700a4db183a5dd9ae36dfd2fc9c5d7da302",
      logs: [
        {
          transactionIndex: 1,
          blockNumber: 11039320,
          transactionHash:
            "0x5ddfb1925096babf7939393b62970700a4db183a5dd9ae36dfd2fc9c5d7da302",
          address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC",
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x00000000000000000000000061e44e506ca5659e6c0bba9b678586fa2d729756",
            "0x000000000000000000000000b0a05611328d1068c91f58e2c83ab4048de8cd7f",
          ],
          data: "0x000000000000000000000000000000000000000000000000000000002f32206c",
          logIndex: 2,
          blockHash:
            "0x54d21312a280bff7c065a94a0f79c5d63067353ae3519a77127b661387d6c7f7",
        },
      ],
      blockNumber: 11039320,
      confirmations: 231,
      cumulativeGasUsed: {
        type: "BigNumber",
        hex: "0x0299e2",
      },
      effectiveGasPrice: {
        type: "BigNumber",
        hex: "0x062b85e900",
      },
      status: 1,
      type: 2,
      byzantium: true,
    },
  },
] as unknown as readonly EvmTx[];

import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

/**
 * Taken from Mainnet-beta
 * https://explorer.solana.com/tx/2kqBQREYGZKKTA5HJjMzzXUiXKm8CEc3dnx2ocm5gi8GwCHrHAR8n9ZV491pZSX24B3BPamnCpxqxCbrCZSMGHJp
 */
export const parsedWormholeRedeemEvmUnlockWrappedTx: ParsedTransactionWithMeta =
  {
    blockTime: 1644864117,
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
                  newAccount: "2tvTWFayhzTNhxcZg8Td6Ksxgb4tT9mPy4opVikUjuVs",
                  owner: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
                  source: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
                  space: 1,
                },
                type: "createAccount",
              },
              program: "system",
              programId: new PublicKey("11111111111111111111111111111111"),
            },
            {
              parsed: {
                info: {
                  account: "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e",
                  amount: "10000000",
                  mint: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
                  mintAuthority: "BCD75RNBHrJJpW4dXVagL5mPjzRLnVZq4YirJdjEYMV7",
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
                  account: "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e",
                  amount: "0",
                  mint: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
                  mintAuthority: "BCD75RNBHrJJpW4dXVagL5mPjzRLnVZq4YirJdjEYMV7",
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
      logMessages: [
        "Program wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb invoke [1]",
        "Program 11111111111111111111111111111111 invoke [2]",
        "Program 11111111111111111111111111111111 success",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
        "Program log: Instruction: MintTo",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2517 of 131912 compute units",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
        "Program log: Instruction: MintTo",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2574 of 122146 compute units",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
        "Program wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb consumed 82996 of 200000 compute units",
        "Program wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb success",
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
        'Program log: Memo (len 32): "e45794d6c5a2750a589f875c84089f81"',
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 200000 compute units",
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
      ],
      postBalances: [
        421487531, 897840, 1461600, 2039280, 1, 1127520, 0, 1113600, 1134480,
        521498880, 1009200, 2477760, 953185920, 1141440, 1141440,
      ],
      postTokenBalances: [
        {
          accountIndex: 3,
          mint: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
          owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
          uiTokenAmount: {
            amount: "20922200",
            decimals: 8,
            uiAmount: 0.209222,
            uiAmountString: "0.209222",
          },
        },
      ],
      preBalances: [
        422390371, 0, 1461600, 2039280, 1, 1127520, 0, 1113600, 1134480,
        521498880, 1009200, 2477760, 953185920, 1141440, 1141440,
      ],
      preTokenBalances: [
        {
          accountIndex: 3,
          mint: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
          owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
          uiTokenAmount: {
            amount: "10922200",
            decimals: 8,
            uiAmount: 0.109222,
            uiAmountString: "0.109222",
          },
        },
      ],
      // NOTE: These exist on the fetched object but not on the type
      // rewards: [],
      // status: {
      //   Ok: null,
      // },
    },
    slot: 120834015,
    transaction: {
      message: {
        accountKeys: [
          {
            pubkey: new PublicKey(
              "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
            ),
            signer: true,
            writable: true,
          },
          {
            pubkey: new PublicKey(
              "2tvTWFayhzTNhxcZg8Td6Ksxgb4tT9mPy4opVikUjuVs",
            ),
            signer: false,
            writable: true,
          },
          {
            pubkey: new PublicKey(
              "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
            ),
            signer: false,
            writable: true,
          },
          {
            pubkey: new PublicKey(
              "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e",
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
              "5djXs8EgUfDMSVaE7DVrt6EtqsY7ebWVwjwx5WeczQYE",
            ),
            signer: false,
            writable: false,
          },
          {
            pubkey: new PublicKey(
              "BCD75RNBHrJJpW4dXVagL5mPjzRLnVZq4YirJdjEYMV7",
            ),
            signer: false,
            writable: false,
          },
          {
            pubkey: new PublicKey(
              "DapiQYH3BGonhN8cngWcXQ6SrqSm3cwysoznoHr6Sbsx",
            ),
            signer: false,
            writable: false,
          },
          {
            pubkey: new PublicKey(
              "Ht8Ap9ywMZsi672zr45X7Gk7H2BPddBbMp99vD3fY79o",
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
              "SysvarRent111111111111111111111111111111111",
            ),
            signer: false,
            writable: false,
          },
          {
            pubkey: new PublicKey(
              "tgeGxWBSAjtpgx4Hoyr2jgt1kdusYzHTPn9YivXTVZ6",
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
          {
            pubkey: new PublicKey(
              "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
            ),
            signer: false,
            writable: false,
          },
          {
            pubkey: new PublicKey(
              "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
            ),
            signer: false,
            writable: false,
          },
        ],
        instructions: [
          {
            accounts: [
              new PublicKey("HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL"),
              new PublicKey("DapiQYH3BGonhN8cngWcXQ6SrqSm3cwysoznoHr6Sbsx"),
              new PublicKey("tgeGxWBSAjtpgx4Hoyr2jgt1kdusYzHTPn9YivXTVZ6"),
              new PublicKey("2tvTWFayhzTNhxcZg8Td6Ksxgb4tT9mPy4opVikUjuVs"),
              new PublicKey("5djXs8EgUfDMSVaE7DVrt6EtqsY7ebWVwjwx5WeczQYE"),
              new PublicKey("Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e"),
              new PublicKey("Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e"),
              new PublicKey("5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2"),
              new PublicKey("Ht8Ap9ywMZsi672zr45X7Gk7H2BPddBbMp99vD3fY79o"),
              new PublicKey("BCD75RNBHrJJpW4dXVagL5mPjzRLnVZq4YirJdjEYMV7"),
              new PublicKey("SysvarRent111111111111111111111111111111111"),
              new PublicKey("11111111111111111111111111111111"),
              new PublicKey("worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth"),
              new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            ],
            data: "4",
            programId: new PublicKey(
              "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
            ),
          },
          {
            parsed: "e45794d6c5a2750a589f875c84089f81",
            program: "spl-memo",
            programId: new PublicKey(
              "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
            ),
          },
        ],
        recentBlockhash: "2PPiyXjMhSjQdBhAHdZtPkAv9S2mNHGA4Luy7KtRujnB",
      },
      signatures: [
        "2kqBQREYGZKKTA5HJjMzzXUiXKm8CEc3dnx2ocm5gi8GwCHrHAR8n9ZV491pZSX24B3BPamnCpxqxCbrCZSMGHJp",
      ],
    },
  };

export const parsedWormholePostVaaTxs: readonly ParsedTransactionWithMeta[] = [
  /**
   * Taken from Mainnet-beta
   * https://explorer.solana.com/tx/3BzcnFELqQTfRFTkCT2TfpvA1JiiDse4GWRXkPw42EpraQJ93gw76C7iMc41P574tCpH4tet61v1FSSWJc2YPnip
   */
  {
    blockTime: 1644863952,
    meta: {
      err: null,
      fee: 45000,
      innerInstructions: [
        {
          index: 1,
          instructions: [
            {
              parsed: {
                info: {
                  lamports: 1301520,
                  newAccount: "2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp",
                  owner: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
                  source: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
                  space: 59,
                },
                type: "createAccount",
              },
              program: "system",
              programId: new PublicKey("11111111111111111111111111111111"),
            },
          ],
        },
      ],
      logMessages: [
        "Program worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth invoke [1]",
        "Program 11111111111111111111111111111111 invoke [2]",
        "Program 11111111111111111111111111111111 success",
        "Program worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth consumed 34710 of 200000 compute units",
        "Program worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth success",
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
        'Program log: Memo (len 32): "e45794d6c5a2750a589f875c84089f81"',
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 200000 compute units",
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
      ],
      postBalances: [
        424913131, 1301520, 1, 1, 521498880, 0, 1009200, 1141440, 3647040,
      ],
      postTokenBalances: [],
      preBalances: [
        426259651, 0, 1, 1, 521498880, 0, 1009200, 1141440, 3647040,
      ],
      preTokenBalances: [],
      // NOTE: These exist on the fetched object but not on the type
      // rewards: [],
      // status: {
      //   Ok: null,
      // },
    },
    slot: 120833725,
    transaction: {
      message: {
        accountKeys: [
          {
            pubkey: new PublicKey(
              "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
            ),
            signer: true,
            writable: true,
          },
          {
            pubkey: new PublicKey(
              "2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp",
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
          {
            pubkey: new PublicKey(
              "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
            ),
            signer: false,
            writable: false,
          },
          {
            pubkey: new PublicKey(
              "ywSj8KSWAXavP8bCgjCgaLGWt4UBTF4bLBSksTzFJ3B",
            ),
            signer: false,
            writable: false,
          },
        ],
        instructions: [
          {
            accounts: [],
            data: "hm62hycs7UDQNrAfDW2YdfVAnH86Ezqr5FRGQQc5VbBR84unD6iT4dneGMkbvseGehcBCs36x7cb1aGui81EvGWnwgAkYRmo4RE4ccABa5K7uvoYuac3VGrq6SbE2wGVQqq5418Gb471DNXDr92pB3chTP7Z46r4F9VCzPJa5QmGEVNQka9FA7dN7m1MBN4gGof7ymEtQXkpQiikUu77X9kf5gijs36AtjyhjJkZPVpNN17XQZcpSP1zNdwoXRBCge614ukvw8FuWpgjtsz9WB86n47WzCxY3BaWeGBSA9WSQkzSaaGiWCv2v65th7E4HEp7z8bFKUFcBdybRfBQPERmft8aL53EujyZaXhoLrzeLaZuaBrCKuBx4jSgVWfVCefG7gXZwvxo6zSXGwrKb2CdQdK4YmEhsdG41oGM7rGw99q96h3oZdZykCq7eR7KD4o1MwrfRrKTbBgwksdZXtgZsGo4qb3utv6a5Br3GjvTCVtehAmPfpFEZ3gA1FrCnUdoxyX75aU4oDzo7n9ux2T5PVXULtiK2Cxoj1tGEHoJdHxGhdFQhrrRAa2zWDU4w6zTeNzM2YyFWntDMCuDsm7kLoupi1d2Rd65VF7zGbsGc2RouTHp7BGHk9xzrRGsy8YS62eSXBpFRp6WUWqsC2i7HRSRTJtmu3JreA9kkmAKGCfRTpQJSpGW3rH7MMnVsPjynfT2pHhVJSC56gm6naCfHzDpLMmgs6QPHMhkYh8NsDSkHuRmV1MvrSeBMcMuB21v7eLHSqDLBRgouYEhDwopCMipfCRCbmA216hfwzVJWkBsZNnD2Y3NgDbPBtqSegCm6Cjq9UMQzRQma3Cy44XE2qrqYcp7PftexoXkB1q743jVdbLXFFRGWkts83ZAYNNLRBAHvbUMZXueavycCxnCTQSPJLdavZDDL4LWxk4wiparEXwDZhoyyS4qasSGWm",
            programId: new PublicKey(
              "KeccakSecp256k11111111111111111111111111111",
            ),
          },
          {
            accounts: [
              new PublicKey("HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL"),
              new PublicKey("ywSj8KSWAXavP8bCgjCgaLGWt4UBTF4bLBSksTzFJ3B"),
              new PublicKey("2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp"),
              new PublicKey("Sysvar1nstructions1111111111111111111111111"),
              new PublicKey("SysvarRent111111111111111111111111111111111"),
              new PublicKey("11111111111111111111111111111111"),
            ],
            data: "7Tvs5DZycuTGpvGBzEUUE4mo4cN",
            programId: new PublicKey(
              "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
            ),
          },
          {
            parsed: "e45794d6c5a2750a589f875c84089f81",
            program: "spl-memo",
            programId: new PublicKey(
              "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
            ),
          },
        ],
        recentBlockhash: "Frk4g2Eo4xx1yTq6ZPRgM6BgQ8kTKRhsFg7u91PMwRPD",
      },
      signatures: [
        "3BzcnFELqQTfRFTkCT2TfpvA1JiiDse4GWRXkPw42EpraQJ93gw76C7iMc41P574tCpH4tet61v1FSSWJc2YPnip",
        "5a3ttuQ1kLAR74QL4MCmsJZW9pF1pHmMfBe52TbCwwbHEo6jjNRkfuV8TfiT7StRMEigD9tjoDQEg4nTcQuFwcTg",
      ],
    },
  },
  /**
   * Taken from Mainnet-beta
   * https://explorer.solana.com/tx/5SP5fEkHjiPJchCJEsTRJJ6M57G6mVL6VCrKsK4J3FzA7f7YLuvNErPSQfrfZCdLTayUUXb1XruCH4kPhFUXjdKP
   */
  {
    blockTime: 1644863996,
    meta: {
      err: null,
      fee: 40000,
      innerInstructions: [],
      logMessages: [
        "Program worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth invoke [1]",
        "Program worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth consumed 26710 of 200000 compute units",
        "Program worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth success",
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
        'Program log: Memo (len 32): "e45794d6c5a2750a589f875c84089f81"',
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 200000 compute units",
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
      ],
      postBalances: [
        424873131, 1301520, 1, 1, 521498880, 0, 1009200, 1141440, 3647040,
      ],
      postTokenBalances: [],
      preBalances: [
        424913131, 1301520, 1, 1, 521498880, 0, 1009200, 1141440, 3647040,
      ],
      preTokenBalances: [],
      // NOTE: These exist on the fetched object but not on the type
      // rewards: [],
      // status: {
      //   Ok: null,
      // },
    },
    slot: 120833802,
    transaction: {
      message: {
        accountKeys: [
          {
            pubkey: new PublicKey(
              "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
            ),
            signer: true,
            writable: true,
          },
          {
            pubkey: new PublicKey(
              "2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp",
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
          {
            pubkey: new PublicKey(
              "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
            ),
            signer: false,
            writable: false,
          },
          {
            pubkey: new PublicKey(
              "ywSj8KSWAXavP8bCgjCgaLGWt4UBTF4bLBSksTzFJ3B",
            ),
            signer: false,
            writable: false,
          },
        ],
        instructions: [
          {
            accounts: [],
            data: "Pys7A3fspjtPW7687QUsVUHNkKY2uKeTxX3hLDBtvzBbtZRW3J7zgABKS2KPggv56zcVufxvha71CYTuT1VmhpFuQt8HzkXEpwTurmiLys5KxohzhHtXALRPgniW2AKYTvKugAdxVSyCgCntqL5zzGNhF68CkUdzvb3QVzez6reuKQHQLLiZejHE9GTTtqTorrGyYgCmipCpRY1hcSVCQbNc89kwauSthNB8gxNcpFHnpkEj2GR95kDWgicftW7Yt91D7suxbgUQANJL8pxCzAEkmxVjbbSgQPCWc3HamKVhpVncJQKAxKHq5yAe2vKp3w3zqKv2mQaxZ9p3Va6qJGKfkRLA82rXpStYqRYVzUgmCPaGsYavJC1R2r7uQjotQUkFLAy4ESjDz7aCUwNaSNYbk9uSis6Qehu9v8jun1Z9H5mUFuskZLoPCCAWAkzDdUfNfe8XqVZGwAJe527vw88Q9hfcC5LnV9MS2TgkyBchauj6aMwUopeEqga8jt7rTWcQszWJ4ZUFZPty6DG5az92kVHVtah2C6Y8EyAZofj3g4h7bdq2tpvULFWpsUqPLjR1sps55SbmJJtbWbvAGGox8G3GiyHcJM5u4igXuS3vAyn2j43bBLLGDxJwmXUnj6xfg1hn4ECDsw4kg6tDryTdEqyegKkG7M49bNS9JYNwJuumRBspsczVxfDmhqwzKgGvaTvS3rAoWLEtNMpzwXPmHFyyDim8sUZoKMfdHdBGpATfkR5uyEt64TCFt76nUQjxy6y3EWAeSkS1HPAzZM4wcaX1TKcw47PWUw6JcGkTn9M6vNPTcUFKzJwD8Nd",
            programId: new PublicKey(
              "KeccakSecp256k11111111111111111111111111111",
            ),
          },
          {
            accounts: [
              new PublicKey("HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL"),
              new PublicKey("ywSj8KSWAXavP8bCgjCgaLGWt4UBTF4bLBSksTzFJ3B"),
              new PublicKey("2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp"),
              new PublicKey("Sysvar1nstructions1111111111111111111111111"),
              new PublicKey("SysvarRent111111111111111111111111111111111"),
              new PublicKey("11111111111111111111111111111111"),
            ],
            data: "7TvuUk7HKiyLrkTvUf7HpGbBaep",
            programId: new PublicKey(
              "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
            ),
          },
          {
            parsed: "e45794d6c5a2750a589f875c84089f81",
            program: "spl-memo",
            programId: new PublicKey(
              "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
            ),
          },
        ],
        recentBlockhash: "5naxjXkFK53GHiv5aWk5XZ6JmeV4jiAvmgWkTxwgVkHk",
      },
      signatures: [
        "5SP5fEkHjiPJchCJEsTRJJ6M57G6mVL6VCrKsK4J3FzA7f7YLuvNErPSQfrfZCdLTayUUXb1XruCH4kPhFUXjdKP",
        "2pp4QgaqWqAQSih7WwgaxoGWnsCYYtYs1WWJK65PwmTJgAiYJ3dgrmpSSb3uEkZB5a9o271vsFytMaJYYsd72tbW",
      ],
    },
  },
  /**
   * Taken from Mainnet-beta
   * https://explorer.solana.com/tx/47ayNss7omy5XBji7uZ7hQSzXa5zbAiJET2SAr4tU2aoRHGmpQvvDE5pkmXBaBymqiS1B2Afzu4WVS6bUUcJ3Suy
   */
  {
    blockTime: 1644864045,
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
                  newAccount: "tgeGxWBSAjtpgx4Hoyr2jgt1kdusYzHTPn9YivXTVZ6",
                  owner: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
                  source: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
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
      logMessages: [
        "Program worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth invoke [1]",
        "Program 11111111111111111111111111111111 invoke [2]",
        "Program 11111111111111111111111111111111 success",
        "Program worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth consumed 65811 of 200000 compute units",
        "Program worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth success",
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
        'Program log: Memo (len 32): "e45794d6c5a2750a589f875c84089f81"',
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 200000 compute units",
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
      ],
      postBalances: [
        422390371, 2477760, 1, 1301520, 1057920, 521498880, 1169280, 1009200,
        1141440, 3647040,
      ],
      postTokenBalances: [],
      preBalances: [
        424873131, 0, 1, 1301520, 1057920, 521498880, 1169280, 1009200, 1141440,
        3647040,
      ],
      preTokenBalances: [],
      // NOTE: These exist on the fetched object but not on the type
      // rewards: [],
      // status: {
      //   Ok: null,
      // },
    },
    slot: 120833893,
    transaction: {
      message: {
        accountKeys: [
          {
            pubkey: new PublicKey(
              "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
            ),
            signer: true,
            writable: true,
          },
          {
            pubkey: new PublicKey(
              "tgeGxWBSAjtpgx4Hoyr2jgt1kdusYzHTPn9YivXTVZ6",
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
              "2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp",
            ),
            signer: false,
            writable: false,
          },
          {
            pubkey: new PublicKey(
              "2yVjuQwpsvdsrywzsJJVs9Ueh4zayyo5DYJbBNc3DDpn",
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
              "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
            ),
            signer: false,
            writable: false,
          },
          {
            pubkey: new PublicKey(
              "ywSj8KSWAXavP8bCgjCgaLGWt4UBTF4bLBSksTzFJ3B",
            ),
            signer: false,
            writable: false,
          },
        ],
        instructions: [
          {
            accounts: [
              new PublicKey("ywSj8KSWAXavP8bCgjCgaLGWt4UBTF4bLBSksTzFJ3B"),
              new PublicKey("2yVjuQwpsvdsrywzsJJVs9Ueh4zayyo5DYJbBNc3DDpn"),
              new PublicKey("2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp"),
              new PublicKey("tgeGxWBSAjtpgx4Hoyr2jgt1kdusYzHTPn9YivXTVZ6"),
              new PublicKey("HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL"),
              new PublicKey("SysvarC1ock11111111111111111111111111111111"),
              new PublicKey("SysvarRent111111111111111111111111111111111"),
              new PublicKey("11111111111111111111111111111111"),
            ],
            data: "MSw3RmwKZmhS88vEGe5Wc5vLqND41NnJcBNNhH2GfFmsPRAYV73dgfT86bovSEoo75wQiQrFVBPQVVo8FSkNwPoSTFjXwcqzPEMYMHL9UgShDDRKDuHLjkoFDem2kFy3Nm3Xgwo8gmCy9n4zABw92RBMdS2oANvofjZ62v4mYBd7E8cjBroD7Vc57BKdHTFgT5Mi8RPjGzZ9QHYcPNoy5At271cXmRR2Ex6Yp9bH8JDzTDjrberjJNgfNHe1qCF4DcCsJnQF",
            programId: new PublicKey(
              "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
            ),
          },
          {
            parsed: "e45794d6c5a2750a589f875c84089f81",
            program: "spl-memo",
            programId: new PublicKey(
              "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
            ),
          },
        ],
        recentBlockhash: "9RVo6CDFqb8H97XHv3Umm71ngka6oURuaZ3hY41cmqoz",
      },
      signatures: [
        "47ayNss7omy5XBji7uZ7hQSzXa5zbAiJET2SAr4tU2aoRHGmpQvvDE5pkmXBaBymqiS1B2Afzu4WVS6bUUcJ3Suy",
      ],
    },
  },
];

/**
 * Taken from Mainnet-beta
 * https://explorer.solana.com/tx/2kqBQREYGZKKTA5HJjMzzXUiXKm8CEc3dnx2ocm5gi8GwCHrHAR8n9ZV491pZSX24B3BPamnCpxqxCbrCZSMGHJp
 */
export const parsedSwimSwapTx: ParsedTransactionWithMeta = {
  blockTime: 1644864444,
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
                amount: "10000000",
                authority: "8nomJAFd9YDYwrqRPyb4E983U9QmAk2R63v9BemRree4",
                destination: "DukQAFyxR41nbbq2FBUDMyrtF2CRmWBREjZaTVj4u9As",
                source: "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e",
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
                amount: "101620",
                authority: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
                destination: "D8Mh5U2pCPdCsPcccXaQCfXS1MpuiXBVDbg6Rekecfe7",
                source: "2DMUL42YEb4g1HAKXhUxL3Yjfgoj4VvRqKwheorfFcPV",
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
                account: "9Yau6DnqYasBUKcyxQJQZqThvUnqZ32ZQuUCcC2AdT9P",
                amount: "1014",
                mint: "BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1",
                mintAuthority: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
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
    logMessages: [
      "Program 11111111111111111111111111111111 invoke [1]",
      "Program 11111111111111111111111111111111 success",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
      "Program log: Instruction: Approve",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2023 of 200000 compute units",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
      "Program SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC invoke [1]",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
      "Program log: Instruction: Transfer",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2740 of 125213 compute units",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
      "Program log: Instruction: Transfer",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2643 of 119239 compute units",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
      "Program log: Instruction: MintTo",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2517 of 113371 compute units",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
      "Program SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC consumed 93098 of 200000 compute units",
      "Program SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC success",
      "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]",
      'Program log: Memo (len 32): "e45794d6c5a2750a589f875c84089f81"',
      "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 12724 of 200000 compute units",
      "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
    ],
    postBalances: [
      421477531, 0, 2039280, 2039280, 2039280, 2039280, 2039280, 5087760,
      2039280, 2039280, 2039280, 1461600, 2039280, 2039280, 2039280, 2039280,
      2039280, 1, 0, 521498880, 1141440, 953185920,
    ],
    postTokenBalances: [
      {
        accountIndex: 2,
        mint: "Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "1983220306",
          decimals: 6,
          uiAmount: 1983.220306,
          uiAmountString: "1983.220306",
        },
      },
      {
        accountIndex: 3,
        mint: "8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "3000012",
          decimals: 8,
          uiAmount: 0.03000012,
          uiAmountString: "0.03000012",
        },
      },
      {
        accountIndex: 4,
        mint: "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "1852456725",
          decimals: 6,
          uiAmount: 1852.456725,
          uiAmountString: "1852.456725",
        },
      },
      {
        accountIndex: 5,
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "1796953927",
          decimals: 6,
          uiAmount: 1796.953927,
          uiAmountString: "1796.953927",
        },
      },
      {
        accountIndex: 6,
        mint: "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "0",
          decimals: 6,
          uiAmount: null,
          uiAmountString: "0",
        },
      },
      {
        accountIndex: 8,
        mint: "8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "179758945987",
          decimals: 8,
          uiAmount: 1797.58945987,
          uiAmountString: "1797.58945987",
        },
      },
      {
        accountIndex: 9,
        mint: "BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1",
        owner: "ExWoeFoyYwCFx2cp9PZzj4eYL5fsDEFQEpC8REsksNpb",
        uiTokenAmount: {
          amount: "402442839",
          decimals: 8,
          uiAmount: 4.02442839,
          uiAmountString: "4.02442839",
        },
      },
      {
        accountIndex: 10,
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "5537982",
          decimals: 6,
          uiAmount: 5.537982,
          uiAmountString: "5.537982",
        },
      },
      {
        accountIndex: 12,
        mint: "Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "101620",
          decimals: 6,
          uiAmount: 0.10162,
          uiAmountString: "0.10162",
        },
      },
      {
        accountIndex: 13,
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "229268",
          decimals: 6,
          uiAmount: 0.229268,
          uiAmountString: "0.229268",
        },
      },
      {
        accountIndex: 14,
        mint: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "79972867294",
          decimals: 8,
          uiAmount: 799.72867294,
          uiAmountString: "799.72867294",
        },
      },
      {
        accountIndex: 15,
        mint: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "10922200",
          decimals: 8,
          uiAmount: 0.109222,
          uiAmountString: "0.109222",
        },
      },
      {
        accountIndex: 16,
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "3936943202",
          decimals: 6,
          uiAmount: 3936.943202,
          uiAmountString: "3936.943202",
        },
      },
    ],
    preBalances: [
      421487531, 0, 2039280, 2039280, 2039280, 2039280, 2039280, 5087760,
      2039280, 2039280, 2039280, 1461600, 2039280, 2039280, 2039280, 2039280,
      2039280, 1, 0, 521498880, 1141440, 953185920,
    ],
    preTokenBalances: [
      {
        accountIndex: 2,
        mint: "Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "1983321926",
          decimals: 6,
          uiAmount: 1983.321926,
          uiAmountString: "1983.321926",
        },
      },
      {
        accountIndex: 3,
        mint: "8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "3000012",
          decimals: 8,
          uiAmount: 0.03000012,
          uiAmountString: "0.03000012",
        },
      },
      {
        accountIndex: 4,
        mint: "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "1852456725",
          decimals: 6,
          uiAmount: 1852.456725,
          uiAmountString: "1852.456725",
        },
      },
      {
        accountIndex: 5,
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "1796953927",
          decimals: 6,
          uiAmount: 1796.953927,
          uiAmountString: "1796.953927",
        },
      },
      {
        accountIndex: 6,
        mint: "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "0",
          decimals: 6,
          uiAmount: null,
          uiAmountString: "0",
        },
      },
      {
        accountIndex: 8,
        mint: "8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "179758945987",
          decimals: 8,
          uiAmount: 1797.58945987,
          uiAmountString: "1797.58945987",
        },
      },
      {
        accountIndex: 9,
        mint: "BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1",
        owner: "ExWoeFoyYwCFx2cp9PZzj4eYL5fsDEFQEpC8REsksNpb",
        uiTokenAmount: {
          amount: "402441825",
          decimals: 8,
          uiAmount: 4.02441825,
          uiAmountString: "4.02441825",
        },
      },
      {
        accountIndex: 10,
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "5537982",
          decimals: 6,
          uiAmount: 5.537982,
          uiAmountString: "5.537982",
        },
      },
      {
        accountIndex: 12,
        mint: "Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "0",
          decimals: 6,
          uiAmount: null,
          uiAmountString: "0",
        },
      },
      {
        accountIndex: 13,
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "229268",
          decimals: 6,
          uiAmount: 0.229268,
          uiAmountString: "0.229268",
        },
      },
      {
        accountIndex: 14,
        mint: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "79962867294",
          decimals: 8,
          uiAmount: 799.62867294,
          uiAmountString: "799.62867294",
        },
      },
      {
        accountIndex: 15,
        mint: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
        owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
        uiTokenAmount: {
          amount: "20922200",
          decimals: 8,
          uiAmount: 0.209222,
          uiAmountString: "0.209222",
        },
      },
      {
        accountIndex: 16,
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        owner: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
        uiTokenAmount: {
          amount: "3936943202",
          decimals: 6,
          uiAmount: 3936.943202,
          uiAmountString: "3936.943202",
        },
      },
    ],
    // NOTE: These exist on the fetched object but not on the type
    // rewards: [],
    // status: {
    //   Ok: null,
    // },
  },
  slot: 120834588,
  transaction: {
    message: {
      accountKeys: [
        {
          pubkey: new PublicKey("HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL"),
          signer: true,
          writable: true,
        },
        {
          pubkey: new PublicKey("8nomJAFd9YDYwrqRPyb4E983U9QmAk2R63v9BemRree4"),
          signer: true,
          writable: true,
        },
        {
          pubkey: new PublicKey("2DMUL42YEb4g1HAKXhUxL3Yjfgoj4VvRqKwheorfFcPV"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("4DtAWLSHCWpKynkby6M4xX7fMMQecm8rmb55r9EXdpyN"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("4R6b4aibi46JzAnuA8ZWXrHAsR1oZBTZ8dqkuer3LsbS"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("5uBU2zUG8xTLA6XwwcTFWib1p7EjCBzWbiy44eVASTfV"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("6jjqDih2VD8wwzsX2b6ARgSW8jZoq88bxhQpDzY7HQwJ"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("8cUvGTFvSWx9WPebYYfDxwiJPdGx2EJUtpve6jP9SBma"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("9KMH3p8cUocvQRbJfKRAStKG52xCCWNmEPsJm5gc8fzw"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("9Yau6DnqYasBUKcyxQJQZqThvUnqZ32ZQuUCcC2AdT9P"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("A6NP1HbBMx1zkx9eoeSsULcaheGeQQ4gB6DUNaU5u5R7"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("D8Mh5U2pCPdCsPcccXaQCfXS1MpuiXBVDbg6Rekecfe7"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("dqdrkiA5bjbWA5HQwnM2pJ1UCnkM1pz4Fz5YDVPDBJs"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("DukQAFyxR41nbbq2FBUDMyrtF2CRmWBREjZaTVj4u9As"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("Hv7yPYnGs6fpN3o1NZvkima9mKDrRDJtNxf23oKLCjau"),
          signer: false,
          writable: true,
        },
        {
          pubkey: new PublicKey("11111111111111111111111111111111"),
          signer: false,
          writable: false,
        },
        {
          pubkey: new PublicKey("AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb"),
          signer: false,
          writable: false,
        },
        {
          pubkey: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
          signer: false,
          writable: false,
        },
        {
          pubkey: new PublicKey("SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC"),
          signer: false,
          writable: false,
        },
        {
          pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          signer: false,
          writable: false,
        },
      ],
      instructions: [
        {
          parsed: {
            info: {
              lamports: 0,
              newAccount: "8nomJAFd9YDYwrqRPyb4E983U9QmAk2R63v9BemRree4",
              owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              source: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
              space: 165,
            },
            type: "createAccount",
          },
          program: "system",
          programId: new PublicKey("11111111111111111111111111111111"),
        },
        {
          parsed: {
            info: {
              amount: "10000000",
              delegate: "8nomJAFd9YDYwrqRPyb4E983U9QmAk2R63v9BemRree4",
              owner: "HWfw4T5YevZkyXUUXAW1L6HLknW48nbLtYWkQbtsyqeL",
              source: "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e",
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
            new PublicKey("8cUvGTFvSWx9WPebYYfDxwiJPdGx2EJUtpve6jP9SBma"),
            new PublicKey("AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb"),
            new PublicKey("5uBU2zUG8xTLA6XwwcTFWib1p7EjCBzWbiy44eVASTfV"),
            new PublicKey("Hv7yPYnGs6fpN3o1NZvkima9mKDrRDJtNxf23oKLCjau"),
            new PublicKey("4R6b4aibi46JzAnuA8ZWXrHAsR1oZBTZ8dqkuer3LsbS"),
            new PublicKey("2DMUL42YEb4g1HAKXhUxL3Yjfgoj4VvRqKwheorfFcPV"),
            new PublicKey("DukQAFyxR41nbbq2FBUDMyrtF2CRmWBREjZaTVj4u9As"),
            new PublicKey("9KMH3p8cUocvQRbJfKRAStKG52xCCWNmEPsJm5gc8fzw"),
            new PublicKey("BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1"),
            new PublicKey("9Yau6DnqYasBUKcyxQJQZqThvUnqZ32ZQuUCcC2AdT9P"),
            new PublicKey("8nomJAFd9YDYwrqRPyb4E983U9QmAk2R63v9BemRree4"),
            new PublicKey("dqdrkiA5bjbWA5HQwnM2pJ1UCnkM1pz4Fz5YDVPDBJs"),
            new PublicKey("A6NP1HbBMx1zkx9eoeSsULcaheGeQQ4gB6DUNaU5u5R7"),
            new PublicKey("6jjqDih2VD8wwzsX2b6ARgSW8jZoq88bxhQpDzY7HQwJ"),
            new PublicKey("D8Mh5U2pCPdCsPcccXaQCfXS1MpuiXBVDbg6Rekecfe7"),
            new PublicKey("Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e"),
            new PublicKey("4DtAWLSHCWpKynkby6M4xX7fMMQecm8rmb55r9EXdpyN"),
            new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          ],
          data: "3LbDkKMJLnVYL3JombCdBAWKytLbdi21JPnJXjXRkraxdKw3hSSxRhwmoGBZ5iDXE9b4hAfzsHbdzRAo",
          programId: new PublicKey(
            "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC",
          ),
        },
        {
          parsed: "e45794d6c5a2750a589f875c84089f81",
          program: "spl-memo",
          programId: new PublicKey(
            "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
          ),
        },
      ],
      recentBlockhash: "5uiXc34qK5yk7HnYSf11DkPiEpqCKrbhHeX3Mu1srAnn",
    },
    signatures: [
      "28npAWtoohdTHvX2TbaSzcwDCoYDoMrnHDh9HxQL36BwEpB1yvEgUTf2pngg8aEA3uKDNaetwjZCb8vg699xo4oF",
      "3iFT1Atrb5HQ1DGMZepL3qeM9qGGe4k6DiQnxcafbbybWEFwfguhujbDJNg18WQ8rSmcWkCcNGGpksszzYsuDdiC",
    ],
  },
};

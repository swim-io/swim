import { programs } from "@metaplex/js";
import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import type { RpcResponseAndContext, SignatureResult } from "@solana/web3.js";
import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { useSolanaConnection, useSolanaWallet } from "../../contexts";
import type { NftData } from "../solana";
import { useCreateSplTokenAccountsMutation } from "../solana";

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

const redeemProgramID = new anchor.web3.PublicKey(
  "7frYsb48TdaenQpmVxRHgMnNL861aK1aeq6aTkVrUkDt",
);

export const xswimMintAccountKey = new anchor.web3.PublicKey(
  "HDiJt8KK7qHZhkkyRyv6TTWzbEppCrpGZQ4YE5igarYu",
);

const REDEEMER_PREFIX = "redeemer";
const utf8 = anchor.utils.bytes.utf8;

const {
  metadata: { Metadata, MasterEdition },
} = programs;

const getRedeemerPDA = async (
  collection: anchor.web3.PublicKey,
  redeemerMint: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey,
): Promise<readonly [anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      utf8.encode(REDEEMER_PREFIX),
      collection.toBuffer(),
      redeemerMint.toBuffer(),
    ],
    programId,
  );
};

// Extremely ugly, I just want to redeem an nft.
export const useRedeemMutation = (
  nft: NftData | null,
): UseMutationResult<RpcResponseAndContext<SignatureResult>> => {
  const solanaConnection = useSolanaConnection();
  const solanaWallet = useSolanaWallet();
  const createATA = useCreateSplTokenAccountsMutation();

  return useMutation(
    async (): Promise<RpcResponseAndContext<SignatureResult>> => {
      if (!nft || !nft.metadata.collection) {
        console.log("empty nft");
        // TODO: Unsure how to do an early return.. Calling an empty
        // "confirmTransaction" to match return type.
        return await solanaConnection.rawConnection.confirmTransaction("");
      }

      const wallet = solanaWallet.wallet;
      if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet not connected, can't create an anchor wallet");
      }
      const anchorWallet = {
        signTransaction: wallet.signTransaction, // TODO: Is this being updated?
        signAllTransactions: wallet.signAllTransactions,
        publicKey: wallet.publicKey,
      };

      const { mint: nftMint, collection: nftCollection } = nft.metadata;

      const [ownerRedeemTokenAccount] = await createATA.mutateAsync([
        xswimMintAccountKey.toBase58(),
      ]);
      const provider = new anchor.AnchorProvider(
        solanaConnection.rawConnection,
        anchorWallet,
        anchor.AnchorProvider.defaultOptions(),
      );
      anchor.setProvider(provider);
      const idl = JSON.parse(idlString);
      const program = new anchor.Program(idl, redeemProgramID, provider);

      const nftPublicKey = new anchor.web3.PublicKey(nftMint);
      const collectionPublicKey = new anchor.web3.PublicKey(nftCollection.key);

      const collectionMetadata = await Metadata.getPDA(collectionPublicKey);
      const redeemerMint = xswimMintAccountKey;

      const metadataPDA = await Metadata.getPDA(nftPublicKey);
      const editionPDA = await MasterEdition.getPDA(nftPublicKey);
      const ownerNftAta = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        nftPublicKey,
        anchorWallet.publicKey,
      );
      const [redeemerPDA] = await getRedeemerPDA(
        collectionPublicKey,
        redeemerMint,
        redeemProgramID,
      );
      const redeemerVault = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        redeemerMint,
        redeemerPDA,
        true,
      );

      const redeemTxSig = await program.methods
        .redeem()
        .accounts({
          nftMetadata: metadataPDA,
          nft: collectionPublicKey,
          nftEdition: editionPDA,
          ownerNftAta: ownerNftAta,
          owner: provider.wallet.publicKey,
          ownerRedeemTokenAccount: ownerRedeemTokenAccount.address,
          mplRedeemer: redeemerPDA,
          redeemerVault,
          redeemerCollection: collectionPublicKey,
          redeemerCollectionMasterEdition: collectionPublicKey,
          redeemerCollectionMetadata: collectionMetadata,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      return await solanaConnection.confirmTx(redeemTxSig);
    },
  );
};

const idlString = `{
  "version": "0.1.0",
  "name": "nft",
  "instructions": [
    {
      "name": "newMplRedeemer",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mplRedeemer",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "mpl_collection"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "redeemer_mint"
              }
            ]
          }
        },
        {
          "name": "redeemerVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "redeemerMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mplCollection",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mplCollectionMetadata",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "metadata"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "token_metadata_program"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "mpl_collection"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_metadata_program"
            }
          }
        },
        {
          "name": "mplCollectionMasterEdition",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "metadata"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "token_metadata_program"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "mpl_collection"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "edition"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_metadata_program"
            }
          }
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
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
        }
      ],
      "args": [
        {
          "name": "redeemAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "redeem",
      "accounts": [
        {
          "name": "nftMetadata",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "metadata"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "token_metadata_program"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "nft"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_metadata_program"
            }
          }
        },
        {
          "name": "nft",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftEdition",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "metadata"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "token_metadata_program"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "nft"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "edition"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_metadata_program"
            }
          }
        },
        {
          "name": "ownerNftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "ownerRedeemTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mplRedeemer",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "redeemer"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "redeemer_collection"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "MplRedeemer",
                "path": "mpl_redeemer.redeem_mint"
              }
            ]
          }
        },
        {
          "name": "redeemerVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "redeemerCollection",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "redeemerCollectionMasterEdition",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "metadata"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "token_metadata_program"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "redeemer_collection"
              },
              {
                "kind": "const",
                "type": "string",
                "value": "edition"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_metadata_program"
            }
          }
        },
        {
          "name": "redeemerCollectionMetadata",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "metadata"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "token_metadata_program"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "redeemer_collection"
              }
            ],
            "programId": {
              "kind": "account",
              "type": "publicKey",
              "path": "token_metadata_program"
            }
          }
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "MplRedeemer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "redeemMint",
            "type": "publicKey"
          },
          {
            "name": "redeemVault",
            "type": "publicKey"
          },
          {
            "name": "redeemAmount",
            "type": "u64"
          },
          {
            "name": "redeemCount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "RedeemEvent",
      "fields": [
        {
          "name": "redeemer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "redeemCount",
          "type": "u64",
          "index": false
        },
        {
          "name": "nftOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "nftMint",
          "type": "publicKey",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "BumpNotInContext",
      "msg": "The bump was not found for the account name in this context"
    },
    {
      "code": 6001,
      "name": "InvalidBump",
      "msg": "Invalid bump"
    },
    {
      "code": 6002,
      "name": "InvalidMetadataProgramOwner",
      "msg": "The owner of the metadata is not the expected Metadata program"
    },
    {
      "code": 6003,
      "name": "InvalidMasterEditionData",
      "msg": "Invalid data provided for MasterEdition type"
    },
    {
      "code": 6004,
      "name": "NoCollectionCreators",
      "msg": "No creators set for collection"
    },
    {
      "code": 6005,
      "name": "CollectionCreatorsNotVerified",
      "msg": "Creators not verified for collection"
    },
    {
      "code": 6006,
      "name": "WrongRedeemerCollection",
      "msg": "Wrong Redeemer Collection provided"
    },
    {
      "code": 6007,
      "name": "WrongRedeemerVault",
      "msg": "Wrong Redeemer vault provided"
    },
    {
      "code": 6008,
      "name": "WrongRedeemerMint",
      "msg": "Wrong Redeemer mint provided"
    },
    {
      "code": 6009,
      "name": "WrongMintForNftTokenAccount",
      "msg": "Wrong mint for nft token account"
    },
    {
      "code": 6010,
      "name": "CollectionNotSet",
      "msg": "Collection field is not set in metadata"
    },
    {
      "code": 6011,
      "name": "CollectionNotVerified",
      "msg": "Collection field is not verified in metadata"
    },
    {
      "code": 6012,
      "name": "InvalidMintSupply",
      "msg": "Supply of provided mint account is invalid"
    },
    {
      "code": 6013,
      "name": "NftMintDecimalsNonZero",
      "msg": "Decimals for NFT mint was not zero"
    },
    {
      "code": 6014,
      "name": "InvalidRedeemTokenAccount",
      "msg": "Invalid token account for receiving redeem"
    },
    {
      "code": 6015,
      "name": "InvalidTokenAccountAmount",
      "msg": "Invalid amount detected for token account holding NFT"
    },
    {
      "code": 6016,
      "name": "NotEnoughRedeemTokens",
      "msg": "Not enough tokens in redeemer vault"
    }
  ]
}`;

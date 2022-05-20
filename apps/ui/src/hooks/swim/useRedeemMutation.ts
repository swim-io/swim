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

import * as redeemIdl from "../../../idl/redeem.json";
import { useConfig, useEnvironment } from "../../contexts";
import type { NftData } from "../solana";
import {
  useAnchorProvider,
  useCreateSplTokenAccountsMutation,
} from "../solana";

// Note, this address should be somewhere more general if it ever has a usecase beyond the redeemer.
export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

const {
  metadata: { Metadata, MasterEdition },
} = programs;

const REDEEMER_PREFIX = "redeemer";
const utf8 = anchor.utils.bytes.utf8;

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

export const useRedeemMutation = (
  nft: NftData | null,
): UseMutationResult<RpcResponseAndContext<SignatureResult>> => {
  const { env } = useEnvironment();
  const createATA = useCreateSplTokenAccountsMutation();
  const anchorProvider = useAnchorProvider();
  const { redeemers } = useConfig();
  const anchorWallet = anchorProvider.wallet;

  // get the right redeemer from the nftcollection
  // then you should have
  return useMutation(
    async (): Promise<RpcResponseAndContext<SignatureResult>> => {
      if (!nft || !nft.metadata.collection || !anchorProvider) {
        return null;
      }
      const { mint: nftMint, collection: nftCollection } = nft.metadata;

      const [ownerRedeemTokenAccount] = await createATA.mutateAsync([
        redeemerMint.toBase58(),
      ]);
      const program = new anchor.Program(redeemIdl, redeemProgramID, anchorProvider);

      const nftPublicKey = new anchor.web3.PublicKey(nftMint);
      const collectionPublicKey = new anchor.web3.PublicKey(nftCollection.key);

      const collectionMetadata = await Metadata.getPDA(collectionPublicKey);


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
          nft: nftPublicKey,
          nftEdition: editionPDA,
          ownerNftAta: ownerNftAta,
          owner: anchorWallet.publicKey,
          ownerRedeemTokenAccount: ownerRedeemTokenAccount.address,
          mplRedeemer: redeemerPDA,
          redeemerVault,
          redeemerCollection: collectionPublicKey,
          // redeemerCollectionMasterEdition: collectionPublicKey,
          redeemerCollectionMetadata: collectionMetadata,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      const tx = await anchorProvider.connection.confirmTransaction(
        redeemTxSig,
      );
      return lookUpThatBadBoy(tx);
    },
  );
};

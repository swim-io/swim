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
import { useSolanaConnection, useSolanaWallet } from "../../contexts";
import type { NftData } from "../solana";
import { useCreateSplTokenAccountsMutation } from "../solana";

const GetAnchorProvider = (connection, wallet) => {
  const anchorWallet = {
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions.bind(wallet),
    publicKey: wallet.publicKey,
  };

  return new anchor.AnchorProvider(
    connection,
    anchorWallet,
    anchor.AnchorProvider.defaultOptions(),
  );
}

const {
  metadata: { Metadata, MasterEdition },
} = programs;

// Extremely ugly, I just want to redeem an nft.
export const useRedeemMutation = (
  nft: NftData | null,
): UseMutationResult<RpcResponseAndContext<SignatureResult>> => {

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

      const { mint: nftMint, collection: nftCollection } = nft.metadata;

      const [ownerRedeemTokenAccount] = await createATA.mutateAsync([
        redeemerMint.toBase58(),
      ]);
      const provider = GetAnchorProvider();
      anchor.setProvider(provider);
      const idl = redeemIdl;
      const program = new anchor.Program(idl, redeemProgramID, provider);

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
          owner: provider.wallet.publicKey,
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
      return await solanaConnection.confirmTx(redeemTxSig);
    },
  );
};



// so what we have:
// nft page
// some kind of modal managing nft state
// -> gets nfts


// depending on nft state
// show carousel => this can modify nft state!
// -> gets nfts? // i guess i just need to trigger a requery

// show box

import fs from "fs";
import path from "path";

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

import { useAnchorWallet, useSolanaConnection } from "../../contexts";
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
  nftMint: string,
  nftCollection: string,
): UseMutationResult<RpcResponseAndContext<SignatureResult>> => {
  const solanaConnection = useSolanaConnection().rawConnection;
  const wally = useAnchorWallet();
  const createATA = useCreateSplTokenAccountsMutation();

  return useMutation(
    async (): Promise<RpcResponseAndContext<SignatureResult>> => {
      const [ownerRedeemTokenAccount] = await createATA.mutateAsync([
        xswimMintAccountKey.toBase58(),
      ]);
      const provider = new anchor.AnchorProvider(
        solanaConnection,
        wally,
        anchor.AnchorProvider.defaultOptions(),
      );
      anchor.setProvider(provider);
      const idl = JSON.parse(
        fs.readFileSync(path.resolve("../../config/idl.json"), "utf8"),
      );
      const program = new anchor.Program(idl, redeemProgramID, provider);

      const nftPublicKey = new anchor.web3.PublicKey(nftMint);
      const collectionPublicKey = new anchor.web3.PublicKey(nftCollection);

      const collectionMetadata = await Metadata.getPDA(collectionPublicKey);
      const redeemerMint = xswimMintAccountKey;

      const metadataPDA = await Metadata.getPDA(nftPublicKey);
      const editionPDA = await MasterEdition.getPDA(nftPublicKey);
      const ownerNftAta = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        nftPublicKey,
        wally.publicKey,
      ); // TODO signer?
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
          nft: collectionPublicKey,
          nftMetadata: metadataPDA,
          nftEdition: editionPDA,
          ownerNftAta: ownerNftAta,
          redeemer: redeemerPDA,
          redeemerVault,
          redeemerCollection: collectionPublicKey,
          redeemerCollectionMetadata: collectionMetadata,
          owner: provider.wallet.publicKey,
          ownerRedeemTokenAccount: ownerRedeemTokenAccount.address,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .rpc();
      return await solanaConnection.confirmTransaction(redeemTxSig);
    },
  );
};
